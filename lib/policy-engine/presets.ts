import { DIAL_SPECS, snapToBand } from "./dials";

export type PresetName = "Peak" | "Standard" | "Premium";
export type DialState = Record<string, number>;

function byKey(key: string) {
  const spec = DIAL_SPECS.find((s) => s.key === key);
  if (!spec) throw new Error("Unknown dial key: " + key);
  return spec;
}

export const PRESETS: Record<PresetName, DialState> = {
  Peak: {
    speechPace: snapToBand(byKey("speechPace"), 93),
    conversationalMode: snapToBand(byKey("conversationalMode"), 83),
    clarificationBudget: snapToBand(byKey("clarificationBudget"), 88),
    confirmationRigor: snapToBand(byKey("confirmationRigor"), 90),
    autonomyScope: snapToBand(byKey("autonomyScope"), 83),
  },
  Standard: {
    speechPace: snapToBand(byKey("speechPace"), 40),
    conversationalMode: snapToBand(byKey("conversationalMode"), 50),
    clarificationBudget: snapToBand(byKey("clarificationBudget"), 36),
    confirmationRigor: snapToBand(byKey("confirmationRigor"), 56),
    autonomyScope: snapToBand(byKey("autonomyScope"), 50),
  },
  Premium: {
    speechPace: snapToBand(byKey("speechPace"), 10),
    conversationalMode: snapToBand(byKey("conversationalMode"), 17),
    clarificationBudget: snapToBand(byKey("clarificationBudget"), 10),
    confirmationRigor: snapToBand(byKey("confirmationRigor"), 17),
    autonomyScope: snapToBand(byKey("autonomyScope"), 17),
  },
};
