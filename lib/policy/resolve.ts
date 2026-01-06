// lib/policy/resolve.ts
import type {
  AutonomyScopeDial,
  ClarificationBudgetDial,
  ConfirmationRigorDial,
  ConversationalModeDial,
  PolicyDocument,
  PolicyDials,
  SpeechPaceDial,
} from "./types";

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * IMPORTANT: we deliberately use STEPPED mappings (not purely linear) for safety + predictability.
 * Ops can learn what each band means and your KPI curves become more stable.
 */

export function resolveSpeechPace(dial: SpeechPaceDial): Required<SpeechPaceDial> {
  const ui = clamp01(dial.ui_value);
  // 4 bands - updated to stay within ElevenLabs range (0.7 - 1.2)
  if (ui <= 20) return { ui_value: ui, tts_rate_multiplier: 0.80, pause_trim_ms: 0,   max_agent_utterance_seconds: 22 };
  if (ui <= 60) return { ui_value: ui, tts_rate_multiplier: 1.00, pause_trim_ms: 80,  max_agent_utterance_seconds: 20 };
  if (ui <= 85) return { ui_value: ui, tts_rate_multiplier: 1.15, pause_trim_ms: 140, max_agent_utterance_seconds: 18 };
  return            { ui_value: ui, tts_rate_multiplier: 1.20, pause_trim_ms: 180, max_agent_utterance_seconds: 16 };
}

export function resolveConversationalMode(dial: ConversationalModeDial): Required<ConversationalModeDial> {
  const ui = clamp01(dial.ui_value);

  if (ui <= 33) {
    return {
      ui_value: ui,
      profile: "concierge",
      verbosity_budget_tokens: 220,
      greeting_style: "warm",
      rapport_lines_allowed: 2,
    };
  }

  if (ui <= 66) {
    return {
      ui_value: ui,
      profile: "balanced",
      verbosity_budget_tokens: 170,
      greeting_style: "standard",
      rapport_lines_allowed: 1,
    };
  }

  return {
    ui_value: ui,
    profile: "transactional",
    verbosity_budget_tokens: 120,
    greeting_style: "brief",
    rapport_lines_allowed: 0,
  };
}

export function resolveClarificationBudget(dial: ClarificationBudgetDial): Required<ClarificationBudgetDial> {
  const ui = clamp01(dial.ui_value);

  // Higher ui => fewer questions + fewer turns before action.
  // We still keep a minimum of 1 clarifier unless ui is extreme.
  let maxClarifiers: number;
  if (ui <= 20) maxClarifiers = 5;
  else if (ui <= 50) maxClarifiers = 4;
  else if (ui <= 75) maxClarifiers = 3;
  else if (ui <= 95) maxClarifiers = 2;
  else maxClarifiers = 1;

  let maxTurns: number;
  if (ui <= 20) maxTurns = 12;
  else if (ui <= 50) maxTurns = 10;
  else if (ui <= 75) maxTurns = 8;
  else if (ui <= 95) maxTurns = 6;
  else maxTurns = 5;

  const assumeDefaults = ui >= 60;

  return {
    ui_value: ui,
    max_clarifying_questions: maxClarifiers,
    max_turns_before_action: maxTurns,
    assume_defaults: assumeDefaults,
    defaults: dial.defaults ?? {
      reschedule_window_choice: "nearest_available",
      address_update_scope: "minor_edits_only",
    },
  };
}

export function resolveConfirmationRigor(dial: ConfirmationRigorDial): Required<ConfirmationRigorDial> {
  const ui = clamp01(dial.ui_value);

  if (ui <= 33) {
    return {
      ui_value: ui,
      mode: "strict",
      confirm_fields_low_risk: ["date_time", "delivery_instructions"],
      confirm_fields_medium_risk: ["date_time", "contact_phone"],
      confirm_fields_high_risk: ["address", "identity_fields"],
      readback_style: "full_readback",
    };
  }

  if (ui <= 79) {
    return {
      ui_value: ui,
      mode: "risk_based",
      confirm_fields_low_risk: [],
      confirm_fields_medium_risk: ["date_time"],
      confirm_fields_high_risk: ["address", "contact_phone"],
      readback_style: "short_recap",
    };
  }

  // minimal still must respect HARD FLOORS: OTP + PII redaction, and any "hard_block" policy checks.
  return {
    ui_value: ui,
    mode: "minimal",
    confirm_fields_low_risk: [],
    confirm_fields_medium_risk: [],
    confirm_fields_high_risk: ["address"], // keep at least address confirmation (recommended)
    readback_style: "short_recap",
  };
}

export function resolveAutonomyScope(dial: AutonomyScopeDial): Required<AutonomyScopeDial> {
  const ui = clamp01(dial.ui_value);

  if (ui <= 33) {
    return {
      ui_value: ui,
      mode: "suggest_only",
      min_confidence_to_auto_act: 0.90,
      allowed_action_classes: ["status_lookup", "add_note"],
      disallowed_action_classes: ["cancel_shipment", "refund_payment", "change_identity_fields", "change_address_full"],
    };
  }

  if (ui <= 66) {
    return {
      ui_value: ui,
      mode: "confirm_then_act",
      min_confidence_to_auto_act: 0.82,
      allowed_action_classes: ["status_lookup", "reschedule_within_window", "add_note", "update_delivery_instructions_minor"],
      disallowed_action_classes: ["cancel_shipment", "refund_payment", "change_identity_fields", "change_address_full"],
    };
  }

  return {
    ui_value: ui,
    mode: "auto_act",
    min_confidence_to_auto_act: 0.78,
    allowed_action_classes: ["status_lookup", "reschedule_within_window", "add_note", "update_delivery_instructions_minor"],
    disallowed_action_classes: ["cancel_shipment", "refund_payment", "change_identity_fields", "change_address_full"],
  };
}

export function resolveDials(dials: PolicyDials): PolicyDials {
  return {
    speech_pace: resolveSpeechPace(dials.speech_pace),
    conversational_mode: resolveConversationalMode(dials.conversational_mode),
    clarification_budget: resolveClarificationBudget(dials.clarification_budget),
    confirmation_rigor: resolveConfirmationRigor(dials.confirmation_rigor),
    autonomy_scope: resolveAutonomyScope(dials.autonomy_scope),
  };
}

/**
 * Accepts a policy doc that may be "UI-only" (only ui_value present) and fills in resolved parameters.
 * Returns a fully resolved policy document ready to validate + store.
 */
export function resolvePolicy(policy: PolicyDocument): PolicyDocument {
  return {
    ...policy,
    dials: resolveDials(policy.dials),
  };
}
