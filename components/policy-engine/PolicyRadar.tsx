import React from "react";
import { DIAL_SPECS } from "@/lib/policy-engine/dials";

type Vec = Record<string, number>;

function polarToXY(cx: number, cy: number, r: number, a: number) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function polygonPoints(values: number[], cx: number, cy: number, radius: number) {
  const n = values.length;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const r = (Math.max(0, Math.min(100, values[i])) / 100) * radius;
    const p = polarToXY(cx, cy, r, angle);
    pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }
  return pts.join(" ");
}

export function PolicyRadar({
  current,
  recommended,
  theme = "dark",
}: {
  current: Vec;
  recommended?: Vec;
  theme?: "dark" | "bright";
}) {
  const labels = DIAL_SPECS.map((s) => s.label);
  const values = DIAL_SPECS.map((s) => current[s.key] ?? 0);
  const recValues = DIAL_SPECS.map((s) => recommended?.[s.key] ?? 0);

  const size = 360;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const radius = 135;

  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
  const brandGreen = "#1e3d1a";

  return (
    <div className={theme === "dark" ? "rounded-2xl border border-white/10 bg-white/[0.03] p-5" : "rounded-2xl border border-gray-200 bg-white p-5"}>
      <div className="flex items-center justify-between">
        <div className={theme === "dark" ? "text-sm font-medium text-white/85" : "text-sm font-medium text-gray-900"}>Policy Trade-off Profile</div>
        <div className={theme === "dark" ? "flex items-center gap-4 text-xs text-white/55" : "flex items-center gap-4 text-xs text-gray-600"}>
          <div className="flex items-center gap-2">
            <span className={theme === "dark" ? "h-2 w-2 rounded-full bg-emerald-300/80" : "h-2 w-2 rounded-full"} style={theme === "bright" ? {backgroundColor: brandGreen} : {}} />
            Current chart
          </div>
          <div className="flex items-center gap-2">
            <span className={theme === "dark" ? "h-2 w-2 rounded-full bg-white/30" : "h-2 w-2 rounded-full bg-gray-300"} />
            Recommended Balanced
          </div>
        </div>
      </div>

      <div className="mt-4 grid place-items-center">
        <svg width={size} height={size} className="overflow-visible">
          {rings.map((k, idx) => {
            const pts = polygonPoints(new Array(labels.length).fill(k * 100), cx, cy, radius);
            return (
              <polygon
                key={idx}
                points={pts}
                fill="none"
                stroke={theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)"}
                strokeWidth={1}
              />
            );
          })}

          {labels.map((_, i) => {
            const angle = -Math.PI / 2 + (2 * Math.PI * i) / labels.length;
            const p = polarToXY(cx, cy, radius, angle);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke={theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)"}
                strokeWidth={1}
              />
            );
          })}

          {recommended ? (
            <polygon
              points={polygonPoints(recValues, cx, cy, radius)}
              fill={theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"}
              stroke={theme === "dark" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.20)"}
              strokeWidth={1.5}
              strokeDasharray="5 6"
            />
          ) : null}

          <polygon
            points={polygonPoints(values, cx, cy, radius)}
            fill={theme === "dark" ? "rgba(52,211,153,0.10)" : `${brandGreen}1a`}
            stroke={theme === "dark" ? "rgba(52,211,153,0.75)" : brandGreen}
            strokeWidth={2}
          />

          {labels.map((label, i) => {
            const angle = -Math.PI / 2 + (2 * Math.PI * i) / labels.length;
            const p = polarToXY(cx, cy, radius + 22, angle);
            const anchor =
              Math.abs(Math.cos(angle)) < 0.2 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
            return (
              <text
                key={label}
                x={p.x}
                y={p.y}
                textAnchor={anchor as any}
                dominantBaseline="middle"
                fontSize="12"
                fill={theme === "dark" ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.70)"}
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
