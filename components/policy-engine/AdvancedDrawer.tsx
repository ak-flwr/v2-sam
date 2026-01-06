import React from "react";

type LogisticsLimits = {
  reschedule_cutoff_minutes: number;
  max_geo_move_meters: number;
  max_content_multiplier: number;
};

export function AdvancedDrawer({
  open,
  onClose,
  limits,
  onLimitsChange,
}: {
  open: boolean;
  onClose: () => void;
  limits?: LogisticsLimits;
  onLimitsChange?: (limits: LogisticsLimits) => void;
}) {
  const currentLimits = limits ?? {
    reschedule_cutoff_minutes: 120,
    max_geo_move_meters: 250,
    max_content_multiplier: 0,
  };

  function updateLimit<K extends keyof LogisticsLimits>(key: K, value: LogisticsLimits[K]) {
    if (onLimitsChange) {
      onLimitsChange({ ...currentLimits, [key]: value });
    }
  }

  return (
    <div className={["fixed inset-0 z-50 transition", open ? "pointer-events-auto" : "pointer-events-none"].join(" ")}>
      <div onClick={onClose} className={["absolute inset-0 bg-black/40 transition", open ? "opacity-100" : "opacity-0"].join(" ")} />

      <div
        className={[
          "absolute right-0 top-0 h-full w-[520px] max-w-[92vw] border-l border-white/10 bg-slate-950/60 backdrop-blur-xl transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-sm font-semibold text-white/85">Advanced Limits & Thresholds</div>
            <div className="text-xs text-white/45">Operational constraints (rarely changed)</div>
          </div>
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10">
            Close
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-sm font-medium text-white/85">Reschedule Cutoff</div>
            <div className="mt-1 text-xs text-white/45">Minutes before ETA. Customers cannot reschedule within this window.</div>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={240}
                value={currentLimits.reschedule_cutoff_minutes}
                onChange={(e) => updateLimit("reschedule_cutoff_minutes", Number(e.target.value))}
                className="w-full accent-emerald-300"
              />
              <div className="w-20 text-right text-sm text-white/70">{currentLimits.reschedule_cutoff_minutes} min</div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-sm font-medium text-white/85">Max Location Move Radius</div>
            <div className="mt-1 text-xs text-white/45">Meters. Location updates beyond this radius will be denied.</div>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={1000}
                value={currentLimits.max_geo_move_meters}
                onChange={(e) => updateLimit("max_geo_move_meters", Number(e.target.value))}
                className="w-full accent-emerald-300"
              />
              <div className="w-20 text-right text-sm text-white/70">{currentLimits.max_geo_move_meters} m</div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-sm font-medium text-white/85">Content Modification Multiplier</div>
            <div className="mt-1 text-xs text-white/45">Controls if and how customer-provided note content can be modified.</div>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={currentLimits.max_content_multiplier}
                onChange={(e) => updateLimit("max_content_multiplier", Number(e.target.value))}
                className="w-full accent-emerald-300"
              />
              <div className="w-20 text-right text-sm text-white/70">{currentLimits.max_content_multiplier}x</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
