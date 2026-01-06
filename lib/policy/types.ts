// lib/policy/types.ts
export type Environment = "dev" | "staging" | "prod";

export type SpeechPaceDial = {
  ui_value: number; // 0..100
  tts_rate_multiplier?: number; // resolved
  pause_trim_ms?: number; // resolved
  max_agent_utterance_seconds?: number; // resolved
};

export type ConversationalModeDial = {
  ui_value: number;
  profile?: "concierge" | "balanced" | "transactional";
  verbosity_budget_tokens?: number;
  greeting_style?: "warm" | "standard" | "brief";
  rapport_lines_allowed?: number;
};

export type ClarificationBudgetDial = {
  ui_value: number;
  max_clarifying_questions?: number;
  max_turns_before_action?: number;
  assume_defaults?: boolean;
  defaults?: Record<string, unknown>;
};

export type ConfirmationRigorDial = {
  ui_value: number;
  mode?: "strict" | "risk_based" | "minimal";
  confirm_fields_low_risk?: string[];
  confirm_fields_medium_risk?: string[];
  confirm_fields_high_risk?: string[];
  readback_style?: "full_readback" | "short_recap" | "none";
};

export type AutonomyScopeDial = {
  ui_value: number;
  mode?: "suggest_only" | "confirm_then_act" | "auto_act";
  min_confidence_to_auto_act?: number;
  allowed_action_classes?: string[];
  disallowed_action_classes?: string[];
};

export type PolicyDials = {
  speech_pace: SpeechPaceDial;
  conversational_mode: ConversationalModeDial;
  clarification_budget: ClarificationBudgetDial;
  confirmation_rigor: ConfirmationRigorDial;
  autonomy_scope: AutonomyScopeDial;
};

export type PolicyGuardrails = {
  pii_redaction_enabled: boolean;
  otp: {
    enabled: boolean;
    required_for_action_classes: string[];
    risk_score_threshold: number; // 0..1
  };
  compliance: {
    hard_block_if_policy_violation: boolean;
    log_all_sensitive_requests: boolean;
  };
};

export type PolicyObservability = {
  kpi_targets: Record<string, number>;
  rework_window_hours: number;
  emit_events: boolean;
  sample_rate: number; // 0..1
};

export type PolicyDocument = {
  policy_id: string;
  policy_version: string;
  environment: Environment;
  active: boolean;
  effective_at: string; // ISO datetime
  name?: string;
  description?: string;

  dials: PolicyDials;
  guardrails: PolicyGuardrails;

  // Keep room for your existing logistics knobs (reschedule cutoff, radius, etc.)
  logistics_limits?: Record<string, unknown>;

  observability: PolicyObservability;
  audit?: Record<string, unknown>;
};
