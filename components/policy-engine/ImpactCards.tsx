import React from "react";

function Card({ label, value, theme = "dark" }: { label: string; value: string; theme?: "dark" | "bright" }) {
  const brandGreen = "#1e3d1a";
  return (
    <div className={theme === "dark" ? "rounded-2xl border border-white/10 bg-white/[0.03] p-4" : "rounded-2xl border border-gray-200 bg-white p-4"}>
      <div className={theme === "dark" ? "text-xs text-white/55" : "text-xs text-gray-600"}>{label}</div>
      <div className={theme === "dark" ? "mt-2 text-3xl font-semibold tracking-tight text-emerald-200" : "mt-2 text-3xl font-semibold tracking-tight text-green-800"} style={theme === "bright" ? {color: brandGreen} : {}}>{value}</div>
    </div>
  );
}

export function ImpactCards({
  aht,
  containment,
  rework,
  success,
  theme = "dark",
}: {
  aht: string;
  containment: string;
  rework: string;
  success: string;
  theme?: "dark" | "bright";
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card label="AHT" value={aht} theme={theme} />
      <Card label="Containment" value={containment} theme={theme} />
      <Card label="Rework" value={rework} theme={theme} />
      <Card label="Success" value={success} theme={theme} />
    </div>
  );
}
