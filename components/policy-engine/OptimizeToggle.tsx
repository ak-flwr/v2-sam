import React from "react";

export function OptimizeToggle({
  balanced,
  onChange,
  theme = "dark",
}: {
  balanced: boolean;
  onChange: (v: boolean) => void;
  theme?: "dark" | "bright";
}) {
  const brandGreen = "#1e3d1a";

  return (
    <div className="flex items-center gap-3">
      <div className={theme === "dark" ? "text-sm text-white/60" : "text-sm text-gray-600"}>Optimize for:</div>
      <div className={theme === "dark" ? "text-sm text-white/80" : "text-sm text-gray-800"}>Throughput ↔ Quality</div>

      <button
        onClick={() => onChange(!balanced)}
        className={[
          "relative h-7 w-14 rounded-full border transition",
          theme === "dark"
            ? balanced ? "bg-emerald-400/30 border-emerald-200/30" : "bg-white/10 border-white/10"
            : balanced ? "bg-green-100 border-green-300" : "bg-gray-100 border-gray-200",
        ].join(" ")}
        style={theme === "bright" && balanced ? {
          backgroundColor: `${brandGreen}1a`,
          borderColor: `${brandGreen}33`
        } : {}}
        aria-label="Optimize toggle"
      >
        <span
          className={[
            "absolute top-1 h-5 w-5 rounded-full transition",
            theme === "dark" ? "bg-white/80" : "bg-gray-700",
            balanced ? "left-8" : "left-1",
          ].join(" ")}
        />
      </button>

      <div className={theme === "dark" ? "text-sm text-emerald-200/90" : "text-sm text-green-800"} style={theme === "bright" ? {color: brandGreen} : {}}>
        {balanced ? "Balanced - 50/50" : "Custom"}
      </div>
    </div>
  );
}
