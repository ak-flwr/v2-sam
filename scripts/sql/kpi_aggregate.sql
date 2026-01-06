-- scripts/sql/kpi_aggregate.sql
-- Parameters:
--   $1 = bucket_start (timestamptz)
--   $2 = bucket_end (timestamptz)
--   $3 = environment (text)
--   $4 = rework_window_hours (int)
--
-- Requires telemetry events:
--   - conversation.ended with payload.metrics.aht_seconds (number), payload.outcome (string), payload.escalation_count (int)
--   - conversation.started for repeat-contact rework detection (case_key)

WITH ended AS (
  SELECT
    te.policy_id,
    te.policy_version,
    te.case_key,
    te.ts AS ended_ts,
    (te.payload->'metrics'->>'aht_seconds')::float AS aht_seconds,
    COALESCE((te.payload->'metrics'->>'turns_total')::int, NULL) AS turns_total,
    COALESCE((te.payload->'metrics'->>'clarifiers_used')::int, NULL) AS clarifiers_used,
    COALESCE((te.payload->'metrics'->>'confirm_turns')::int, NULL) AS confirm_turns,
    COALESCE((te.payload->'metrics'->>'actions_executed')::int, NULL) AS actions_executed,
    COALESCE(te.payload->>'outcome', '') AS outcome,
    COALESCE((te.payload->>'escalation_count')::int, 0) AS escalation_count
  FROM "TelemetryEvent" te
  WHERE te.environment = $3
    AND te.event = 'conversation.ended'
    AND te.ts >= $1
    AND te.ts < $2
    AND te.policy_id IS NOT NULL
    AND te.policy_version IS NOT NULL
),
resolved AS (
  SELECT *
  FROM ended
  WHERE outcome = 'resolved'
),
rework_flagged AS (
  SELECT
    r.*,
    EXISTS (
      SELECT 1
      FROM "TelemetryEvent" s
      WHERE s.environment = $3
        AND s.event = 'conversation.started'
        AND s.case_key IS NOT NULL
        AND r.case_key IS NOT NULL
        AND s.case_key = r.case_key
        AND s.ts > r.ended_ts
        AND s.ts <= r.ended_ts + make_interval(hours => $4)
    ) AS is_rework
  FROM resolved r
),
agg AS (
  SELECT
    policy_id,
    policy_version,
    COUNT(*) AS total_conversations,
    AVG(aht_seconds) AS aht_mean,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY aht_seconds) AS aht_p50,
    percentile_cont(0.9) WITHIN GROUP (ORDER BY aht_seconds) AS aht_p90,

    SUM(CASE WHEN outcome = 'resolved' AND escalation_count = 0 THEN 1 ELSE 0 END) AS contained_count,
    SUM(CASE WHEN escalation_count > 0 OR outcome = 'handoff' THEN 1 ELSE 0 END) AS escalated_count,

    -- Rework measured on resolved cases only (repeat contact within window)
    (SELECT COUNT(*) FROM rework_flagged rf WHERE rf.policy_id = ended.policy_id AND rf.policy_version = ended.policy_version AND rf.is_rework = true) AS rework_count,
    (SELECT COUNT(*) FROM resolved rs WHERE rs.policy_id = ended.policy_id AND rs.policy_version = ended.policy_version) AS resolved_count,

    AVG(turns_total) AS turns_mean,
    AVG(clarifiers_used) AS clarifiers_mean,
    AVG(confirm_turns) AS confirm_turns_mean,
    AVG(actions_executed) AS actions_mean
  FROM ended
  GROUP BY policy_id, policy_version
)
SELECT * FROM agg;
