import React, { useMemo } from "react";
import { DIAL_SPECS, getBand, snapToBand, clamp100, type DialKey } from "@/lib/policy-engine/dials";

function specFor(key: DialKey) {
  const s = DIAL_SPECS.find((d) => d.key === key);
  if (!s) throw new Error("Unknown dial key: " + key);
  return s;
}

export function PolicySliderRow({
  dialKey,
  value,
  onChange,
  snapEnabled,
  theme = "dark",
}: {
  dialKey: DialKey;
  value: number;
  onChange: (v: number) => void;
  snapEnabled: boolean;
  theme?: "dark" | "bright";
}) {
  const spec = useMemo(() => specFor(dialKey), [dialKey]);
  const v = clamp100(value);
  const band = getBand(spec, v);
  const boundaries = spec.boundaries;
  const brandGreen = "#1e3d1a";

  function setVal(next: number) {
    const raw = clamp100(next);
    onChange(snapEnabled ? snapToBand(spec, raw) : raw);
  }

  return (
    <div className={theme === "dark" ? "rounded-2xl border border-white/10 bg-white/[0.02] p-4" : "rounded-2xl border border-gray-200 bg-white p-4"}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className={theme === "dark" ? "text-sm font-medium text-white/85" : "text-sm font-medium text-gray-900"}>{spec.label}</div>
            <div className={theme === "dark" ? "text-xs text-white/45" : "text-xs text-gray-500"}>{spec.arLabel}</div>
          </div>
          <span
            className={theme === "dark" ? "rounded-full border border-emerald-200/15 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200" : "rounded-full border border-green-700/20 bg-green-50 px-2.5 py-1 text-xs text-green-800"}
            style={theme === "bright" ? {
              borderColor: `${brandGreen}33`,
              backgroundColor: `${brandGreen}0d`,
              color: brandGreen
            } : {}}
          >
            {band.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={v}
            onChange={(e) => setVal(Number(e.target.value))}
            className={theme === "dark" ? "w-20 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:ring-2 focus:ring-emerald-400/25" : "w-20 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-400/50"}
            inputMode="numeric"
          />
          <div className={theme === "dark" ? "text-xs text-white/40" : "text-xs text-gray-500"}>0–100</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="relative">
          {boundaries.map((b) => (
            <div
              key={b}
              className={theme === "dark" ? "absolute top-1/2 h-3 w-[2px] -translate-y-1/2 rounded-full bg-white/10" : "absolute top-1/2 h-3 w-[2px] -translate-y-1/2 rounded-full bg-gray-200"}
              style={{ left: `${b}%` }}
            />
          ))}

          <input
            type="range"
            min={0}
            max={100}
            value={v}
            onChange={(e) => setVal(Number(e.target.value))}
            className={theme === "dark" ? "w-full accent-emerald-300" : "w-full"}
            style={theme === "bright" ? { accentColor: brandGreen } : {}}
          />
        </div>

        <div className={theme === "dark" ? "mt-2 flex justify-between text-[11px] text-white/45" : "mt-2 flex justify-between text-[11px] text-gray-600"}>
          <span>{spec.minLabel}</span>
          <span>{spec.midLabel}</span>
          <span>{spec.maxLabel}</span>
        </div>
      </div>
    </div>
  );
}
