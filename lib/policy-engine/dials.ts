export type DialKey =
  | "speechPace"
  | "conversationalMode"
  | "clarificationBudget"
  | "confirmationRigor"
  | "autonomyScope";

export type DialBand = {
  name: string;
  range: [number, number]; // inclusive bounds
  tick: number; // marker position (usually boundary or midpoint)
};

export type DialSpec = {
  key: DialKey;
  label: string;
  arLabel: string;
  minLabel: string;
  midLabel: string;
  maxLabel: string;
  bands: DialBand[];
  boundaries: number[]; // band boundaries for tick marks
};

export const DIAL_SPECS: DialSpec[] = [
  {
    key: "speechPace",
    label: "Speech Pace",
    arLabel: "سرعة الكلام",
    minLabel: "Relaxed",
    midLabel: "Standard",
    maxLabel: "Rush",
    boundaries: [20, 60, 85],
    bands: [
      { name: "Relaxed", range: [0, 20], tick: 10 },
      { name: "Standard", range: [21, 60], tick: 40 },
      { name: "Brisk", range: [61, 85], tick: 73 },
      { name: "Rush", range: [86, 100], tick: 93 },
    ],
  },
  {
    key: "conversationalMode",
    label: "Conversational Mode",
    arLabel: "نمط المحادثة",
    minLabel: "Transactional",
    midLabel: "Balanced",
    maxLabel: "Concierge",
    boundaries: [33, 66],
    bands: [
      { name: "Concierge", range: [0, 33], tick: 17 },
      { name: "Balanced", range: [34, 66], tick: 50 },
      { name: "Transactional", range: [67, 100], tick: 83 },
    ],
  },
  {
    key: "clarificationBudget",
    label: "Clarification Budget",
    arLabel: "ميزانية التوضيح",
    minLabel: "Thorough",
    midLabel: "Normal",
    maxLabel: "Minimal",
    boundaries: [20, 50, 75],
    bands: [
      { name: "Thorough", range: [0, 20], tick: 10 },
      { name: "Normal", range: [21, 50], tick: 36 },
      { name: "Efficient", range: [51, 75], tick: 63 },
      { name: "Minimal", range: [76, 100], tick: 88 },
    ],
  },
  {
    key: "confirmationRigor",
    label: "Confirmation Rigor",
    arLabel: "صرامة التأكيد",
    minLabel: "Strict",
    midLabel: "Risk-based",
    maxLabel: "Minimal",
    boundaries: [33, 79],
    bands: [
      { name: "Strict", range: [0, 33], tick: 17 },
      { name: "Risk-based", range: [34, 79], tick: 56 },
      { name: "Minimal", range: [80, 100], tick: 90 },
    ],
  },
  {
    key: "autonomyScope",
    label: "Autonomy Scope",
    arLabel: "نطاق الاستقلالية",
    minLabel: "Suggest",
    midLabel: "Confirm+Act",
    maxLabel: "Auto-Act",
    boundaries: [33, 66],
    bands: [
      { name: "Suggest Only", range: [0, 33], tick: 17 },
      { name: "Confirm+Act", range: [34, 66], tick: 50 },
      { name: "Auto-Act", range: [67, 100], tick: 83 },
    ],
  },
];

export function clamp100(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function getBand(spec: DialSpec, v: number) {
  const value = clamp100(v);
  return spec.bands.find((b) => value >= b.range[0] && value <= b.range[1]) ?? spec.bands[0];
}

export function snapToBand(spec: DialSpec, v: number) {
  const value = clamp100(v);
  const band = getBand(spec, value);
  return band.tick;
}
