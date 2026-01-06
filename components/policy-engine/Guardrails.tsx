import React from "react";

function Item({ label, theme = "dark" }: { label: string; theme?: "dark" | "bright" }) {
  const brandGreen = "#1e3d1a";
  return (
    <div className={theme === "dark" ? "flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3" : "flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"}>
      <div className="flex items-center gap-3">
        <div className={theme === "dark" ? "grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60" : "grid h-8 w-8 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600"}>🔒</div>
        <div className={theme === "dark" ? "text-sm text-white/75" : "text-sm text-gray-800"}>{label}</div>
      </div>
      <span
        className={theme === "dark" ? "rounded-full border border-emerald-200/15 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200" : "rounded-full border border-green-700/20 bg-green-50 px-3 py-1 text-xs text-green-800"}
        style={theme === "bright" ? {
          borderColor: `${brandGreen}33`,
          backgroundColor: `${brandGreen}0d`,
          color: brandGreen
        } : {}}
      >
        Active
      </span>
    </div>
  );
}

export function Guardrails({ theme = "dark" }: { theme?: "dark" | "bright" }) {
  return (
    <div className={theme === "dark" ? "rounded-2xl border border-white/10 bg-white/[0.03] p-5" : "rounded-2xl border border-gray-200 bg-white p-5"}>
      <div className={theme === "dark" ? "text-sm font-medium text-white/85" : "text-sm font-medium text-gray-900"}>Active Guardrails</div>
      <div className="mt-4 grid gap-3">
        <Item label="OTP Required" theme={theme} />
        <Item label="PII Redaction" theme={theme} />
        <Item label="Audit Logging" theme={theme} />
        <Item label="Compliance Block" theme={theme} />
      </div>
    </div>
  );
}
