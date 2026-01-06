import React from "react";

export function TopBar({
  environment,
  onEnvironmentChange,
}: {
  environment: "Prod" | "Staging" | "Dev";
  onEnvironmentChange: (v: "Prod" | "Staging" | "Dev") => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
      <div className="text-sm text-white/70">
        <span className="text-white/60">Policy Engine</span>
        <span className="mx-2 text-white/30">›</span>
        <span className="text-white/80">Production Environment</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-xs text-white/50">Environment:</div>
        <select
          value={environment}
          onChange={(e) => onEnvironmentChange(e.target.value as any)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:ring-2 focus:ring-emerald-400/30"
        >
          <option className="bg-slate-900" value="Prod">Prod</option>
          <option className="bg-slate-900" value="Staging">Staging</option>
          <option className="bg-slate-900" value="Dev">Dev</option>
        </select>

        <div className="h-9 w-9 rounded-full border border-white/10 bg-white/5" />
        <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10">
          Logout
        </button>
      </div>
    </div>
  );
}
