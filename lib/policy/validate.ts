// lib/policy/validate.ts
import type { PolicyDocument } from "./types";

/**
 * Validates a PolicyDocument against required fields and constraints.
 * Uses TypeScript types for compile-time safety; this provides runtime checks.
 */
export function validatePolicy(policy: PolicyDocument): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  // Required top-level fields
  if (!policy.policy_id || typeof policy.policy_id !== "string" || policy.policy_id.length < 3) {
    errors.push("policy_id must be a string with at least 3 characters");
  }
  if (!policy.policy_version || typeof policy.policy_version !== "string") {
    errors.push("policy_version must be a non-empty string");
  }
  if (!["dev", "staging", "prod"].includes(policy.environment)) {
    errors.push("environment must be one of: dev, staging, prod");
  }
  if (typeof policy.active !== "boolean") {
    errors.push("active must be a boolean");
  }
  if (!policy.effective_at) {
    errors.push("effective_at is required");
  }

  // Dials validation
  if (!policy.dials) {
    errors.push("dials object is required");
  } else {
    const dialKeys = ["speech_pace", "conversational_mode", "clarification_budget", "confirmation_rigor", "autonomy_scope"];
    for (const key of dialKeys) {
      const dial = policy.dials[key as keyof typeof policy.dials];
      if (!dial || typeof dial.ui_value !== "number") {
        errors.push(`dials.${key}.ui_value must be a number`);
      } else if (dial.ui_value < 0 || dial.ui_value > 100) {
        errors.push(`dials.${key}.ui_value must be between 0 and 100`);
      }
    }
  }

  // Guardrails validation
  if (!policy.guardrails) {
    errors.push("guardrails object is required");
  } else {
    if (typeof policy.guardrails.pii_redaction_enabled !== "boolean") {
      errors.push("guardrails.pii_redaction_enabled must be a boolean");
    }
  }

  // Observability validation
  if (!policy.observability) {
    errors.push("observability object is required");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}
