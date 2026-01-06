// app/api/kpi/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/kpi?env=prod&bucket=hour&limit=48
 * Returns aggregated KPI rows for the specified environment and bucket type.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "prod") as "dev" | "staging" | "prod";
  const bucket = (url.searchParams.get("bucket") || "hour") as "hour" | "day";
  const limit = Math.min(Number(url.searchParams.get("limit") || 24), 500);

  try {
    const rows = await prisma.kpiAggregate.findMany({
      where: { environment: env, bucket },
      orderBy: { bucket_start: "desc" },
      take: limit,
    });

    return NextResponse.json({ ok: true, rows }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: "Failed to fetch KPI data", detail: message }, { status: 500 });
  }
}
