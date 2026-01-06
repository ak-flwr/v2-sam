// scripts/cron/kpi_aggregate.ts
/**
 * KPI Aggregator (hourly/daily)
 *
 * Inserts rows into KpiAggregate for each (policy_id, policy_version) within the bucket time window.
 *
 * Usage:
 *   npx ts-node scripts/cron/kpi_aggregate.ts --bucket hour --env prod
 *   npx ts-node scripts/cron/kpi_aggregate.ts --bucket day --env prod
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type Bucket = "hour" | "day";
type Env = "dev" | "staging" | "prod";

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function getBucketWindow(bucket: Bucket): { start: Date; end: Date } {
  const now = new Date();

  if (bucket === "hour") {
    const end = new Date(now);
    end.setMinutes(0, 0, 0);
    const start = new Date(end);
    start.setHours(end.getHours() - 1);
    return { start, end };
  }

  // day: previous day midnight->midnight
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 1);
  return { start, end };
}

function loadSql(): string {
  const p = path.join(process.cwd(), "scripts", "sql", "kpi_aggregate.sql");
  return fs.readFileSync(p, "utf-8");
}

interface AggRow {
  policy_id: string;
  policy_version: string;
  total_conversations: number;
  aht_mean: number;
  aht_p50: number;
  aht_p90: number;
  contained_count: number;
  escalated_count: number;
  rework_count: number;
  resolved_count: number;
  turns_mean: number | null;
  clarifiers_mean: number | null;
  confirm_turns_mean: number | null;
  actions_mean: number | null;
}

async function main() {
  const bucket = (arg("bucket") ?? "hour") as Bucket;
  const env = (arg("env") ?? "prod") as Env;

  if (!["hour", "day"].includes(bucket)) throw new Error("Invalid --bucket. Use hour|day");
  if (!["dev", "staging", "prod"].includes(env)) throw new Error("Invalid --env. Use dev|staging|prod");

  const { start, end } = getBucketWindow(bucket);
  const sql = loadSql();

  // Rework window hours is currently set to 24 by default
  const reworkWindowHours = 24;

  // Get aggregates from SQL
  const rows = await prisma.$queryRawUnsafe<AggRow[]>(
    sql,
    start.toISOString(),
    end.toISOString(),
    env,
    reworkWindowHours
  );

  if (!rows || rows.length === 0) {
    console.log(`[kpi] No rows for ${bucket} ${start.toISOString()}..${end.toISOString()} env=${env}`);
    return;
  }

  // Upsert aggregates
  for (const r of rows) {
    const totals = {
      total_conversations: Number(r.total_conversations ?? 0),
      contained_count: Number(r.contained_count ?? 0),
      escalated_count: Number(r.escalated_count ?? 0),
      resolved_count: Number(r.resolved_count ?? 0),
      rework_count: Number(r.rework_count ?? 0),
    };

    const containment_rate =
      totals.total_conversations > 0 ? totals.contained_count / totals.total_conversations : 0;
    const escalation_rate =
      totals.total_conversations > 0 ? totals.escalated_count / totals.total_conversations : 0;
    const rework_rate =
      totals.resolved_count > 0 ? totals.rework_count / totals.resolved_count : 0;

    const metrics = {
      aht_mean: Number(r.aht_mean ?? 0),
      aht_p50: Number(r.aht_p50 ?? 0),
      aht_p90: Number(r.aht_p90 ?? 0),
      containment_rate,
      escalation_rate,
      rework_rate,
      turns_mean: r.turns_mean == null ? null : Number(r.turns_mean),
      clarifiers_mean: r.clarifiers_mean == null ? null : Number(r.clarifiers_mean),
      confirm_turns_mean: r.confirm_turns_mean == null ? null : Number(r.confirm_turns_mean),
      actions_mean: r.actions_mean == null ? null : Number(r.actions_mean),
    };

    await prisma.kpiAggregate.upsert({
      where: {
        kpi_bucket_unique: {
          bucket,
          bucket_start: start,
          environment: env,
          policy_id: r.policy_id,
          policy_version: r.policy_version,
        },
      },
      update: {
        bucket_end: end,
        totals: totals as Prisma.InputJsonValue,
        metrics: metrics as Prisma.InputJsonValue,
      },
      create: {
        bucket,
        bucket_start: start,
        bucket_end: end,
        environment: env,
        policy_id: r.policy_id,
        policy_version: r.policy_version,
        totals: totals as Prisma.InputJsonValue,
        metrics: metrics as Prisma.InputJsonValue,
      },
    });
  }

  console.log(`[kpi] Upserted ${rows.length} rows for ${bucket} ${start.toISOString()}..${end.toISOString()} env=${env}`);
}

main()
  .catch((e) => {
    console.error("[kpi] Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
