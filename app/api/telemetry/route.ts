// app/api/telemetry/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const TelemetryEventSchema = z.object({
  event: z.string().min(1),
  ts: z.string().datetime().optional(), // if omitted, server will stamp now
  environment: z.enum(["dev", "staging", "prod"]).default("prod"),
  conversation_id: z.string().optional(),
  case_key: z.string().optional(),
  policy_id: z.string().optional(),
  policy_version: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

/**
 * POST /api/telemetry
 * Minimal ingestion endpoint for KPI aggregation.
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = TelemetryEventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid telemetry payload", issues: parsed.error.issues }, { status: 422 });
  }

  const data = parsed.data;

  try {
    const saved = await prisma.telemetryEvent.create({
      data: {
        event: data.event,
        ts: data.ts ? new Date(data.ts) : new Date(),
        environment: data.environment,
        conversation_id: data.conversation_id ?? null,
        case_key: data.case_key ?? null,
        policy_id: data.policy_id ?? null,
        policy_version: data.policy_version ?? null,
        payload: data.payload as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ ok: true, id: saved.id }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: "DB error saving telemetry", detail: message }, { status: 500 });
  }
}
