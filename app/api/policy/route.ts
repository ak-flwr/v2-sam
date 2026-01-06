// app/api/policy/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { resolvePolicy, validatePolicy, type PolicyDocument, type Environment } from "@/lib/policy";

function envFromQuery(url: URL): Environment {
  const env = (url.searchParams.get("env") || "prod") as Environment;
  if (env !== "dev" && env !== "staging" && env !== "prod") return "prod";
  return env;
}

/**
 * GET /api/policy?env=prod
 * Returns the latest ACTIVE policy whose effective_at <= now.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const environment = envFromQuery(url);

  const now = new Date();
  const policy = await prisma.policy.findFirst({
    where: { environment, active: true, effective_at: { lte: now } },
    orderBy: [{ effective_at: "desc" }, { created_at: "desc" }],
  });

  if (!policy) {
    return NextResponse.json({ ok: true, policy: null }, { status: 200 });
  }

  return NextResponse.json({ ok: true, policy: policy.document }, { status: 200 });
}

/**
 * POST /api/policy
 * Stores a versioned policy document.
 * - Accepts UI-only dials (resolver fills resolved params).
 * - Validates via JSON Schema (AJV).
 * - Upserts (policy_id, policy_version, environment).
 */
export async function POST(req: Request) {
  let body: PolicyDocument;
  try {
    body = (await req.json()) as PolicyDocument;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  // Resolve (fills missing resolved params)
  const resolved = resolvePolicy(body);

  // Validate
  const validation = validatePolicy(resolved);
  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: "Policy validation failed", errors: validation.errors }, { status: 422 });
  }

  try {
    const saved = await prisma.policy.upsert({
      where: {
        policy_id_policy_version_environment: {
          policy_id: resolved.policy_id,
          policy_version: resolved.policy_version,
          environment: resolved.environment,
        },
      },
      update: {
        active: resolved.active,
        effective_at: new Date(resolved.effective_at),
        name: resolved.name ?? null,
        description: resolved.description ?? null,
        document: resolved as unknown as Prisma.InputJsonValue,
        updated_by: (resolved.audit as Record<string, unknown>)?.updated_by as string ?? null,
        change_reason: (resolved.audit as Record<string, unknown>)?.change_reason as string ?? null,
      },
      create: {
        policy_id: resolved.policy_id,
        policy_version: resolved.policy_version,
        environment: resolved.environment,
        active: resolved.active,
        effective_at: new Date(resolved.effective_at),
        name: resolved.name ?? null,
        description: resolved.description ?? null,
        document: resolved as unknown as Prisma.InputJsonValue,
        updated_by: (resolved.audit as Record<string, unknown>)?.updated_by as string ?? null,
        change_reason: (resolved.audit as Record<string, unknown>)?.change_reason as string ?? null,
      },
    });

    return NextResponse.json({ ok: true, policy: saved.document }, { status: 200 });
  } catch (e: unknown) {
    console.error("Policy save error:", e);
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    return NextResponse.json({ ok: false, error: "DB error saving policy", detail: message, stack }, { status: 500 });
  }
}
