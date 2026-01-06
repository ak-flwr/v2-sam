import React from "react";
import type { PresetName } from "@/lib/policy-engine/presets";

export function PresetStrip({
  value,
  onChange,
  theme = "dark",
}: {
  value: PresetName;
  onChange: (v: PresetName) => void;
  theme?: "dark" | "bright";
}) {
  const items: PresetName[] = ["Peak", "Standard", "Premium"];
  const brandGreen = "#1e3d1a";

  return (
    <div className="flex items-center justify-center gap-2">
      {items.map((it) => {
        const active = it === value;
        return (
          <button
            key={it}
            onClick={() => onChange(it)}
            className={[
              "rounded-xl px-4 py-2 text-sm transition border",
              theme === "dark"
                ? active
                  ? "bg-emerald-400/15 text-emerald-200 border-emerald-300/20"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                : active
                  ? "bg-green-50 text-green-900 border-green-700/30"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
            ].join(" ")}
            style={theme === "bright" && active ? {
              backgroundColor: `${brandGreen}0d`,
              color: brandGreen,
              borderColor: `${brandGreen}33`
            } : {}}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}
