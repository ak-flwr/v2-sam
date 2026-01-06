import React from "react";

export function SaveBar({
  dirty,
  onUndo,
  onReset,
  onSave,
  theme = "dark",
}: {
  dirty: boolean;
  onUndo: () => void;
  onReset: () => void;
  onSave: () => void;
  theme?: "dark" | "bright";
}) {
  const brandGreen = "#1e3d1a";

  return (
    <div className="sticky bottom-4 mt-6">
      <div className={theme === "dark" ? "mx-auto flex max-w-[1200px] items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-5 py-4 backdrop-blur-xl" : "mx-auto flex max-w-[1200px] items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-lg"}>
        <div className={theme === "dark" ? "text-sm text-white/60" : "text-sm text-gray-600"}>
          {dirty ? <span className={theme === "dark" ? "text-amber-200/80" : "text-amber-600"}>Unsaved changes</span> : <span className={theme === "dark" ? "text-white/45" : "text-gray-500"}>All changes saved</span>}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onUndo} className={theme === "dark" ? "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10" : "rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"}>
            Undo
          </button>
          <button onClick={onReset} className={theme === "dark" ? "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10" : "rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"}>
            Reset
          </button>
          <button
            onClick={onSave}
            className={[
              "rounded-xl px-5 py-2 text-sm font-medium transition border",
              theme === "dark"
                ? dirty ? "bg-emerald-400/20 text-emerald-100 border-emerald-300/25 hover:bg-emerald-400/25" : "bg-white/5 text-white/40 border-white/10 cursor-not-allowed"
                : dirty ? "bg-green-50 text-green-900 border-green-700/30 hover:bg-green-100" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed",
            ].join(" ")}
            style={theme === "bright" && dirty ? {
              backgroundColor: `${brandGreen}0d`,
              color: brandGreen,
              borderColor: `${brandGreen}33`
            } : {}}
            disabled={!dirty}
          >
            Save Policy
          </button>
        </div>
      </div>
    </div>
  );
}
