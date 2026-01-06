"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  NotebookPen,
  SlidersHorizontal,
  ReceiptText,
  PackageSearch,
  LogOut,
  RefreshCcw,
  Search,
  Filter,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  Eye,
  Loader2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  MessageSquare,
  Globe,
  Sun,
  Moon,
} from "lucide-react";

// Policy Engine v2.1 imports
import { PresetStrip } from "@/components/policy-engine/PresetStrip";
import { OptimizeToggle } from "@/components/policy-engine/OptimizeToggle";
import { PolicyRadar } from "@/components/policy-engine/PolicyRadar";
import { PolicySliderRow } from "@/components/policy-engine/PolicySliderRow";
import { ImpactCards } from "@/components/policy-engine/ImpactCards";
import { Guardrails } from "@/components/policy-engine/Guardrails";
import { AdvancedDrawer } from "@/components/policy-engine/AdvancedDrawer";
import { SaveBar } from "@/components/policy-engine/SaveBar";
import { DIAL_SPECS, type DialKey, clamp100 } from "@/lib/policy-engine/dials";
import { PRESETS, type PresetName, type DialState } from "@/lib/policy-engine/presets";
import type { PolicyDocument, Environment } from "@/lib/policy/types";

/**
 * AQEL Admin Panel v2 (Tailwind-only, no shadcn)
 * Fully wired to real API endpoints
 */

type Risk = "low" | "medium" | "high";
type ShipmentStatus = "PENDING" | "OUT_FOR_DELIVERY" | "IN_TRANSIT" | "DELIVERED";

type Shipment = {
  id: string;
  status: ShipmentStatus;
  risk: Risk;
  address: string;
  eta: string;
  updatedAt: string;
};

type CustomerNote = {
  id: string;
  shipmentId: string;
  status: "RESOLVED" | "UNRESOLVED";
  title: string;
  body: string;
  createdAt: string;
};

type LedgerEvent = {
  id: string;
  shipmentId: string;
  type: string;
  createdAt: string;
  payload: Record<string, unknown>;
};

type ConversationStatus = "OPEN" | "ACTIVE" | "RESOLVED" | "CLOSED" | "REOPENED";

type Conversation = {
  id: string;
  shipmentId: string;
  status: ConversationStatus;
  actionsTaken: number;
  openedAt: string;
  resolvedAt: string | null;
  address: string;
};

type PolicyConfig = {
  rescheduleCutoffMin: number;
  maxMoveRadiusMeters: number;
  maxContentMultiplier: number;
  otpRequiredForSensitive: boolean;
  piiRedactionEnabled: boolean;
};

type TabKey = "notes" | "ledger" | "shipments" | "analytics" | "policy" | "conversations";

type AnalyticsData = {
  summary: {
    totalInteractions: number;
    totalActions: number;
    successRate: number;
    unresolvedCount: number;
  };
  interactionsOverTime: Array<{ date: string; count: number }>;
  actionsByType: Array<{ type: string; count: number; successCount: number }>;
  notesByType: Array<{ type: string; count: number }>;
  byRiskTier: Array<{ tier: string; interactionCount: number }>;
  topShipments: Array<{ shipment_id: string; noteCount: number }>;
  peakHours: Array<{ hour: number; count: number }>;
  languageBreakdown: { arabic: number; english: number };
  dateRange: { start: string; end: string; range: string };
};

// v2.1 KPI Aggregate types
type KpiTotals = {
  total_conversations: number;
  contained_count: number;
  escalated_count: number;
  resolved_count: number;
  rework_count: number;
};

type KpiMetrics = {
  aht_mean: number;
  aht_p50: number;
  aht_p90: number;
  containment_rate: number;
  escalation_rate: number;
  rework_rate: number;
  turns_mean: number | null;
  clarifiers_mean: number | null;
  confirm_turns_mean: number | null;
  actions_mean: number | null;
};

type KpiAggregateRow = {
  id: string;
  bucket: "hour" | "day";
  bucket_start: string;
  bucket_end: string;
  environment: string;
  policy_id: string;
  policy_version: string;
  totals: KpiTotals;
  metrics: KpiMetrics;
};

type ConversationAnalytics = {
  funnel: {
    open: number;
    active: number;
    resolved: number;
    closed: number;
    reopened: number;
  };
  metrics: {
    avgActionsPerConversation: number;
    avgResolutionTimeMinutes: number;
    reopenRatePercent: number;
    stuckActiveCount: number;
  };
  volume: {
    last24h: number;
  };
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Badge({
  children,
  tone = "neutral",
  theme = "dark",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn";
  theme?: "dark" | "bright";
}) {
  const brandGreen = "#1e3d1a";
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] leading-none";

  if (tone === "ok") {
    return (
      <span className={cx(
        base,
        theme === "dark"
          ? "border-emerald-200/15 bg-emerald-400/10 text-emerald-200"
          : "border-green-700/20 bg-green-50 text-green-800"
      )} style={theme === "bright" ? { borderColor: `${brandGreen}33`, backgroundColor: `${brandGreen}0d` } : {}}>
        <CheckCircle2 className="h-3 w-3" />
        {children}
      </span>
    );
  }
  if (tone === "warn")
    return (
      <span className={cx(
        base,
        theme === "dark"
          ? "border-amber-200/15 bg-amber-400/10 text-amber-200"
          : "border-amber-300/30 bg-amber-50 text-amber-800"
      )}>
        <AlertTriangle className="h-3 w-3" />
        {children}
      </span>
    );
  return (
    <span className={cx(
      base,
      theme === "dark"
        ? "border-white/10 bg-white/5 text-white/70"
        : "border-gray-200 bg-gray-50 text-gray-700"
    )}>
      {children}
    </span>
  );
}

function RiskPill({ risk, theme = "dark" }: { risk: Risk; theme?: "dark" | "bright" }) {
  const mapDark = {
    low: {
      label: "low risk",
      cls: "border-emerald-200/15 bg-emerald-400/10 text-emerald-200",
      icon: <Info className="h-3 w-3" />,
    },
    medium: {
      label: "medium risk",
      cls: "border-amber-200/15 bg-amber-400/10 text-amber-200",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    high: {
      label: "high risk",
      cls: "border-rose-200/15 bg-rose-400/10 text-rose-200",
      icon: <Flame className="h-3 w-3" />,
    },
  } as const;

  const mapBright = {
    low: {
      label: "low risk",
      cls: "border-green-600/30 bg-green-50 text-green-800",
      icon: <Info className="h-3 w-3" />,
    },
    medium: {
      label: "medium risk",
      cls: "border-amber-600/30 bg-amber-50 text-amber-800",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    high: {
      label: "high risk",
      cls: "border-rose-600/30 bg-rose-50 text-rose-800",
      icon: <Flame className="h-3 w-3" />,
    },
  } as const;

  const v = theme === "dark" ? mapDark[risk] : mapBright[risk];
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px]", v.cls)}>
      {v.icon}
      {v.label}
    </span>
  );
}

function StatusPill({ status, theme = "dark" }: { status: ShipmentStatus; theme?: "dark" | "bright" }) {
  const brandGreen = "#1e3d1a";
  const mapDark: Record<ShipmentStatus, { label: string; cls: string }> = {
    PENDING: { label: "PENDING", cls: "border-white/10 bg-white/5 text-white/70" },
    IN_TRANSIT: { label: "IN_TRANSIT", cls: "border-sky-200/15 bg-sky-400/10 text-sky-200" },
    OUT_FOR_DELIVERY: { label: "OUT_FOR_DELIVERY", cls: "border-emerald-200/15 bg-emerald-400/10 text-emerald-200" },
    DELIVERED: { label: "DELIVERED", cls: "border-emerald-200/15 bg-emerald-400/10 text-emerald-200" },
  };

  const mapBright: Record<ShipmentStatus, { label: string; cls: string }> = {
    PENDING: { label: "PENDING", cls: "border-gray-300 bg-gray-100 text-gray-700" },
    IN_TRANSIT: { label: "IN_TRANSIT", cls: "border-sky-600/30 bg-sky-50 text-sky-800" },
    OUT_FOR_DELIVERY: { label: "OUT_FOR_DELIVERY", cls: "border-green-700/30 bg-green-50 text-green-900" },
    DELIVERED: { label: "DELIVERED", cls: "border-green-700/30 bg-green-50 text-green-900" },
  };

  const v = theme === "dark"
    ? (mapDark[status] || { label: status, cls: "border-white/10 bg-white/5 text-white/70" })
    : (mapBright[status] || { label: status, cls: "border-gray-300 bg-gray-100 text-gray-700" });

  return (
    <span
      className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px]", v.cls)}
      style={theme === "bright" && (status === "OUT_FOR_DELIVERY" || status === "DELIVERED") ? {
        borderColor: `${brandGreen}33`,
        backgroundColor: `${brandGreen}0d`,
        color: brandGreen
      } : {}}
    >
      {v.label}
    </span>
  );
}

function Shell({ children, theme }: { children: React.ReactNode; theme: "dark" | "bright" }) {
  const brandGreen = "#1e3d1a";
  return (
    <div
      className={cx(
        "min-h-screen",
        theme === "dark"
          ? "bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white"
          : "text-gray-900"
      )}
      style={theme === "bright" ? {
        background: `linear-gradient(to bottom, #f0f4f0, #f8faf8, #e8f0e8)`
      } : {}}
    >
      {children}
    </div>
  );
}

function Panel({ children, className, theme }: { children: React.ReactNode; className?: string; theme: "dark" | "bright" }) {
  return (
    <div
      className={cx(
        "min-h-0 overflow-hidden rounded-3xl border",
        theme === "dark"
          ? "border-white/10 bg-white/[0.03]"
          : "border-gray-200 bg-white shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

function BrandMark({ theme }: { theme: "dark" | "bright" }) {
  const brandGreen = "#1e3d1a";
  return (
    <div className="flex items-center gap-3">
      <div className={cx(
        "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border shadow-[0_12px_26px_rgba(0,0,0,.35)]",
        theme === "dark"
          ? "border-emerald-300/30 bg-emerald-400/15"
          : `border-[${brandGreen}]/30 bg-[${brandGreen}]/10`
      )}>
        <ShieldCheck className={cx(
          "h-6 w-6",
          theme === "dark" ? "text-emerald-300" : `text-[${brandGreen}]`
        )} style={theme === "bright" ? { color: brandGreen } : {}} />
      </div>

      <div className="min-w-0">
        <div className={cx(
          "truncate text-[14px] font-bold",
          theme === "dark" ? "text-white/90" : "text-gray-900"
        )}>SAM v2 Admin</div>
        <div className={cx(
          "truncate text-[12px]",
          theme === "dark" ? "text-white/60" : "text-gray-600"
        )}>Resolution Engine Operations Dashboard</div>
      </div>
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  loading,
  theme = "dark",
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  loading?: boolean;
  theme?: "dark" | "bright";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cx(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition disabled:opacity-50",
        theme === "dark"
          ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      )}
    >
      <span>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}</span>
      {label}
    </button>
  );
}

function NavItem({
  active,
  icon,
  title,
  subtitle,
  onClick,
  theme = "dark",
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  theme?: "dark" | "bright";
}) {
  const brandGreen = "#1e3d1a";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-2xl border px-3 py-3 text-left transition",
        theme === "dark"
          ? active
            ? "border-emerald-300/20 bg-emerald-400/15"
            : "border-white/10 bg-white/5 hover:bg-white/10"
          : active
            ? `border-green-700/20 bg-green-50`
            : "border-gray-200 bg-white hover:bg-gray-50"
      )}
      style={theme === "bright" && active ? { borderColor: `${brandGreen}33`, backgroundColor: `${brandGreen}0d` } : {}}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cx(
            "mt-0.5 rounded-xl border p-2",
            theme === "dark"
              ? active ? "border-emerald-200/20 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/5 text-white/85"
              : active ? "text-green-800" : "border-gray-200 bg-gray-50 text-gray-700"
          )}
          style={theme === "bright" && active ? { color: brandGreen } : {}}
          >{icon}</div>
          <div className="min-w-0">
            <div className={cx(
              "truncate text-[13px] font-bold",
              theme === "dark"
                ? active ? "text-emerald-200" : "text-white/90"
                : active ? "text-green-800" : "text-gray-900"
            )}
            style={theme === "bright" && active ? { color: brandGreen } : {}}
            >{title}</div>
            <div className={cx(
              "truncate text-[12px]",
              theme === "dark" ? "text-white/60" : "text-gray-600"
            )}>{subtitle}</div>
          </div>
        </div>
        <ChevronRight className={cx(
          "h-4 w-4 transition",
          theme === "dark"
            ? active ? "text-emerald-200 opacity-90" : "opacity-70"
            : active ? "text-green-800 opacity-90" : "opacity-70"
        )}
        style={theme === "bright" && active ? { color: brandGreen } : {}}
        />
      </div>
    </button>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder,
  theme = "dark",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  theme?: "dark" | "bright";
}) {
  return (
    <div className={cx(
      "flex items-center gap-2 rounded-2xl border px-3 py-2",
      theme === "dark"
        ? "border-white/10 bg-white/5"
        : "border-gray-200 bg-white"
    )}>
      <Search className={cx("h-4 w-4", theme === "dark" ? "text-white/50" : "text-gray-400")} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          "w-full bg-transparent text-sm outline-none",
          theme === "dark"
            ? "text-white/80 placeholder:text-white/40"
            : "text-gray-900 placeholder:text-gray-400"
        )}
      />
      <span className={cx(
        "rounded-xl border p-1.5",
        theme === "dark"
          ? "border-white/10 bg-white/5 text-white/70"
          : "border-gray-200 bg-gray-50 text-gray-600"
      )}>
        <Filter className="h-4 w-4" />
      </span>
    </div>
  );
}

function EmptyState({ title, body, theme = "dark" }: { title: string; body: string; theme?: "dark" | "bright" }) {
  return (
    <div className={cx(
      "grid place-items-center rounded-2xl border p-10 text-center",
      theme === "dark" ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
    )}>
      <div className="max-w-sm">
        <div className={cx(
          "text-sm font-medium",
          theme === "dark" ? "text-white/85" : "text-gray-900"
        )}>{title}</div>
        <div className={cx(
          "mt-1 text-xs leading-relaxed",
          theme === "dark" ? "text-white/50" : "text-gray-600"
        )}>{body}</div>
      </div>
    </div>
  );
}

function rangeClamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function Chip({
  active,
  onClick,
  children,
  theme = "dark",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  theme?: "dark" | "bright";
}) {
  const brandGreen = "#1e3d1a";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-xl border px-3 py-1.5 text-sm transition",
        theme === "dark"
          ? active
            ? "border-emerald-300/20 bg-emerald-400/15 text-emerald-200"
            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          : active
            ? "border-green-700/30 bg-green-50 text-green-900"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      )}
      style={theme === "bright" && active ? {
        borderColor: `${brandGreen}33`,
        backgroundColor: `${brandGreen}0d`,
        color: brandGreen
      } : {}}
    >
      {children}
    </button>
  );
}

function RowItem({
  active,
  onClick,
  left,
  right,
  title,
  subtitle,
  meta,
  action,
  theme = "dark",
}: {
  active: boolean;
  onClick: () => void;
  left: React.ReactNode;
  right: React.ReactNode;
  title: string;
  subtitle: string;
  meta: Array<{ icon: React.ReactNode; text: string }>;
  action?: React.ReactNode;
  theme?: "dark" | "bright";
}) {
  const brandGreen = "#1e3d1a";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-2xl border p-4 text-left transition",
        theme === "dark"
          ? active
            ? "border-emerald-300/30 bg-emerald-400/10"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
          : active
            ? "border-green-700/30 bg-green-50"
            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      )}
      style={theme === "bright" && active ? { borderColor: `${brandGreen}33`, backgroundColor: `${brandGreen}0d` } : {}}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {left}
          {right}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={cx(
        "mt-2 text-[13px] font-bold",
        theme === "dark" ? "text-white/92" : "text-gray-900"
      )}>{title}</div>
      <div className={cx(
        "mt-1 line-clamp-2 text-[12px] leading-relaxed",
        theme === "dark" ? "text-white/60" : "text-gray-600"
      )}>{subtitle}</div>

      <div className={cx(
        "mt-3 flex flex-wrap items-center gap-3 text-[12px]",
        theme === "dark" ? "text-white/60" : "text-gray-600"
      )}>
        {meta.map((m, i) => (
          <div key={i} className="inline-flex items-center gap-2">
            <span className="opacity-70">{m.icon}</span>
            <span className="tabular-nums">{m.text}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <div className="text-[12px] font-semibold text-white/85">{label}</div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cx(
          "relative h-7 w-12 rounded-full border transition",
          value ? "border-emerald-300/30 bg-emerald-500/20" : "border-white/10 bg-white/5"
        )}
        aria-pressed={value}
      >
        <span
          className={cx(
            "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border bg-white/10 shadow-[0_8px_16px_rgba(0,0,0,.35)] transition",
            value ? "right-1 border-emerald-300/40 bg-emerald-400/25" : "right-6 border-white/10"
          )}
        />
      </button>
    </div>
  );
}

function DetailsCard({
  tab,
  selected,
  theme = "dark",
}: {
  tab: TabKey;
  selected: unknown;
  theme?: "dark" | "bright";
}) {
  return (
    <div className="space-y-3">
      <div className={cx(
        "rounded-2xl border p-4",
        theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"
      )}>
        <div className={cx(
          "text-[13px] font-bold",
          theme === "dark" ? "" : "text-gray-900"
        )}>Summary</div>

        {tab === "shipments" && isShipment(selected) && (
          <div className={cx(
            "mt-3 space-y-2 text-[12px]",
            theme === "dark" ? "text-white/70" : "text-gray-700"
          )}>
            <Key k="Shipment" v={selected.id} mono theme={theme} />
            <Key k="Status" v={selected.status} mono theme={theme} />
            <Key k="Risk" v={selected.risk} mono theme={theme} />
            <Key k="Address" v={selected.address} theme={theme} />
            <Key k="ETA" v={selected.eta} theme={theme} />
            <Key k="Updated" v={selected.updatedAt} theme={theme} />
          </div>
        )}

        {tab === "notes" && isNote(selected) && (
          <div className={cx(
            "mt-3 space-y-2 text-[12px]",
            theme === "dark" ? "text-white/70" : "text-gray-700"
          )}>
            <Key k="Note ID" v={selected.id} mono theme={theme} />
            <Key k="Shipment" v={selected.shipmentId} mono theme={theme} />
            <Key k="Status" v={selected.status} mono theme={theme} />
            <Key k="Title" v={selected.title} theme={theme} />
            <Key k="Created" v={selected.createdAt} theme={theme} />
          </div>
        )}

        {tab === "ledger" && isLedger(selected) && (
          <div className={cx(
            "mt-3 space-y-2 text-[12px]",
            theme === "dark" ? "text-white/70" : "text-gray-700"
          )}>
            <Key k="Event ID" v={selected.id} mono theme={theme} />
            <Key k="Type" v={selected.type} mono theme={theme} />
            <Key k="Shipment" v={selected.shipmentId} mono theme={theme} />
            <Key k="Created" v={selected.createdAt} theme={theme} />
          </div>
        )}

      </div>

      <div className={cx(
        "rounded-2xl border p-4",
        theme === "dark" ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
      )}>
        <div className="flex items-center justify-between gap-3">
          <div className={cx(
            "text-[13px] font-bold",
            theme === "dark" ? "" : "text-gray-900"
          )}>Raw</div>
          <Badge theme={theme}>JSON</Badge>
        </div>
        <pre className={cx(
          "mt-3 max-h-[420px] overflow-auto rounded-xl border p-3 text-[11px]",
          theme === "dark"
            ? "border-white/10 bg-black/25 text-white/85"
            : "border-gray-200 bg-gray-100 text-gray-800"
        )}>
          <code>{JSON.stringify(selected, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
}

function Key({ k, v, mono, theme = "dark" }: { k: string; v: string; mono?: boolean; theme?: "dark" | "bright" }) {
  return (
    <div className={cx(
      "flex items-center justify-between gap-3 rounded-xl border px-3 py-2",
      theme === "dark" ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
    )}>
      <span className={theme === "dark" ? "text-white/60" : "text-gray-600"}>{k}</span>
      <span className={cx(
        theme === "dark" ? "text-white/90" : "text-gray-900",
        mono && "tabular-nums"
      )}>{v}</span>
    </div>
  );
}

function isShipment(x: unknown): x is Shipment {
  return !!x && typeof x === "object" && "status" in (x as any) && "risk" in (x as any) && "address" in (x as any);
}
function isNote(x: unknown): x is CustomerNote {
  return !!x && typeof x === "object" && "shipmentId" in (x as any) && "title" in (x as any) && "body" in (x as any);
}
function isLedger(x: unknown): x is LedgerEvent {
  return !!x && typeof x === "object" && "payload" in (x as any) && "type" in (x as any) && "shipmentId" in (x as any);
}
function isPolicy(x: unknown): x is PolicyConfig {
  return !!x && typeof x === "object" && "rescheduleCutoffMin" in (x as any) && "maxMoveRadiusMeters" in (x as any);
}

// Analytics Components
function MetricCard({
  label,
  value,
  subtext,
  trend,
  icon,
  theme = "dark",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  theme?: "dark" | "bright";
}) {
  const brandGreen = "#1e3d1a";
  return (
    <div className={cx(
      "rounded-2xl border p-4",
      theme === "dark"
        ? "border-white/10 bg-white/5"
        : "border-gray-200 bg-white"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className={cx(
          "rounded-xl border p-2",
          theme === "dark"
            ? "border-white/10 bg-white/5 text-white/70"
            : "border-gray-200 bg-gray-50 text-gray-600"
        )}>
          {icon}
        </div>
        {trend && (
          <div className={cx(
            "flex items-center gap-1 rounded-full border px-2 py-1 text-[10px]",
            theme === "dark"
              ? trend === "up" && "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
              : trend === "up" && "border-green-600/30 bg-green-50 text-green-800",
            theme === "dark"
              ? trend === "down" && "border-rose-400/30 bg-rose-500/15 text-rose-300"
              : trend === "down" && "border-rose-600/30 bg-rose-50 text-rose-800",
            theme === "dark"
              ? trend === "neutral" && "border-white/10 bg-white/5 text-white/60"
              : trend === "neutral" && "border-gray-200 bg-gray-50 text-gray-600"
          )}
          style={theme === "bright" && trend === "up" ? {
            borderColor: `${brandGreen}33`,
            backgroundColor: `${brandGreen}0d`,
            color: brandGreen
          } : {}}
          >
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {trend === "neutral" && <Activity className="h-3 w-3" />}
          </div>
        )}
      </div>
      <div className={cx(
        "mt-3 text-[24px] font-bold tabular-nums",
        theme === "dark" ? "text-white/95" : "text-gray-900"
      )}>{value}</div>
      <div className={cx("text-[12px]", theme === "dark" ? "text-white/60" : "text-gray-600")}>{label}</div>
      {subtext && <div className={cx("mt-1 text-[11px]", theme === "dark" ? "text-white/45" : "text-gray-500")}>{subtext}</div>}
    </div>
  );
}

function SimpleBarChart({
  data,
  labelKey,
  valueKey,
  maxBars = 5,
  theme = "dark",
}: {
  data: Array<Record<string, any>>;
  labelKey: string;
  valueKey: string;
  maxBars?: number;
  theme?: "dark" | "bright";
}) {
  const sliced = data.slice(0, maxBars);
  const maxValue = Math.max(...sliced.map((d) => d[valueKey] || 0), 1);
  const brandGreen = "#1e3d1a";

  return (
    <div className="space-y-2">
      {sliced.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={cx("w-24 truncate text-[11px]", theme === "dark" ? "text-white/70" : "text-gray-600")}>{item[labelKey]}</div>
          <div className="flex-1">
            <div className={cx("h-6 rounded-lg overflow-hidden", theme === "dark" ? "bg-white/5" : "bg-gray-100")}>
              <div
                className="h-full rounded-lg"
                style={{
                  width: `${(item[valueKey] / maxValue) * 100}%`,
                  background: theme === "dark"
                    ? "linear-gradient(90deg, rgba(35,213,171,.6), rgba(16,185,129,.4))"
                    : `linear-gradient(90deg, ${brandGreen}cc, ${brandGreen}99)`,
                }}
              />
            </div>
          </div>
          <div className={cx("w-10 text-right text-[12px] font-bold tabular-nums", theme === "dark" ? "text-white/85" : "text-gray-900")}>
            {item[valueKey]}
          </div>
        </div>
      ))}
      {data.length === 0 && (
        <div className={cx("text-center text-[12px] py-4", theme === "dark" ? "text-white/50" : "text-gray-500")}>No data available</div>
      )}
    </div>
  );
}

function SimplePieChart({
  data,
  colors = ["rgba(35,213,171,.7)", "rgba(231,115,0,.7)", "rgba(99,102,241,.7)", "rgba(236,72,153,.7)"],
  theme = "dark",
}: {
  data: Array<{ label: string; value: number }>;
  colors?: string[];
  theme?: "dark" | "bright";
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <div className={cx("text-center text-[12px] py-8", theme === "dark" ? "text-white/50" : "text-gray-500")}>No data available</div>;
  }

  let accumulated = 0;
  const segments = data.map((d, i) => {
    const start = accumulated;
    const percent = (d.value / total) * 100;
    accumulated += percent;
    return { ...d, start, percent, color: colors[i % colors.length] };
  });

  const gradientParts = segments.map((s) => `${s.color} ${s.start}% ${s.start + s.percent}%`).join(", ");

  return (
    <div className="flex items-center gap-4">
      <div
        className="h-24 w-24 rounded-full shrink-0"
        style={{ background: `conic-gradient(${gradientParts})` }}
      />
      <div className="space-y-1.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className={theme === "dark" ? "text-white/70" : "text-gray-600"}>{s.label}</span>
            <span className={cx("font-bold tabular-nums", theme === "dark" ? "text-white/90" : "text-gray-900")}>{Math.round(s.percent)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HourlyHeatmap({ data }: { data: Array<{ hour: number; count: number }> }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {data.map((d) => {
          const intensity = d.count / maxCount;
          return (
            <div
              key={d.hour}
              className="flex-1 h-8 rounded-md relative group cursor-pointer"
              style={{
                background: intensity > 0
                  ? `rgba(35,213,171,${0.15 + intensity * 0.6})`
                  : "rgba(255,255,255,0.05)",
              }}
              title={`${d.hour}:00 - ${d.count} interactions`}
            >
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/40 hidden group-hover:block">
                {d.hour}h
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-white/40 px-1">
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>11pm</span>
      </div>
    </div>
  );
}

// Login Screen Component
function LoginScreen({ onLogin, theme }: { onLogin: () => void; theme: "dark" | "bright" }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const brandGreen = "#1e3d1a";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123" || password === "demo") {
      onLogin();
    } else {
      setError("Invalid password. Try: admin123 or demo");
    }
  };

  return (
    <Shell theme={theme}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <Panel theme={theme} className="w-full max-w-md">
          <div className="p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex justify-center">
                <div className={cx(
                  "relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border shadow-[0_12px_26px_rgba(0,0,0,.35)]",
                  theme === "dark"
                    ? "border-emerald-300/30 bg-emerald-400/15"
                    : "border-green-700/30 bg-green-50"
                )}
                style={theme === "bright" ? { borderColor: `${brandGreen}33`, backgroundColor: `${brandGreen}0d` } : {}}
                >
                  <ShieldCheck className={cx(
                    "h-8 w-8",
                    theme === "dark" ? "text-emerald-300" : "text-green-800"
                  )}
                  style={theme === "bright" ? { color: brandGreen } : {}}
                  />
                </div>
              </div>
              <h1 className={cx(
                "text-2xl font-bold",
                theme === "dark" ? "text-white/90" : "text-gray-900"
              )}>SAM v2 Admin</h1>
              <p className={cx(
                "mt-1 text-[13px]",
                theme === "dark" ? "text-white/60" : "text-gray-600"
              )}>Resolution Engine Control Panel</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={cx(
                  "mb-2 block text-[12px] font-semibold",
                  theme === "dark" ? "text-white/85" : "text-gray-700"
                )}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter admin password"
                  className={cx(
                    "w-full rounded-xl border px-4 py-3 text-[13px] outline-none",
                    theme === "dark"
                      ? "border-white/10 bg-white/[0.02] text-white/90 placeholder:text-white/40 focus:border-emerald-300/30"
                      : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-700/30"
                  )}
                  style={theme === "bright" ? { borderColor: `${brandGreen}33` } : {}}
                />
              </div>

              {error && (
                <div className={cx(
                  "rounded-xl border px-4 py-2 text-[12px]",
                  theme === "dark"
                    ? "border-rose-400/30 bg-rose-500/15 text-white/90"
                    : "border-rose-300 bg-rose-50 text-rose-800"
                )}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={cx(
                  "w-full rounded-2xl border px-4 py-3 text-[13px] font-semibold shadow-[0_18px_40px_rgba(0,0,0,.35)] transition hover:-translate-y-[1px]",
                  theme === "dark"
                    ? "border-emerald-300/30 bg-emerald-400/20 text-white/95 hover:border-emerald-200/40 hover:bg-emerald-400/25"
                    : "border-green-700/30 bg-green-50 text-green-900 hover:border-green-700/40 hover:bg-green-100"
                )}
                style={theme === "bright" ? {
                  borderColor: `${brandGreen}33`,
                  backgroundColor: `${brandGreen}0d`,
                  color: brandGreen
                } : {}}
              >
                Login to Dashboard
              </button>

              <p className={cx(
                "text-center text-[11px]",
                theme === "dark" ? "text-white/50" : "text-gray-500"
              )}>
                Demo password: <span className={cx(
                  theme === "dark" ? "text-emerald-300/80" : "text-green-700"
                )}
                style={theme === "bright" ? { color: brandGreen } : {}}
                >admin123</span> or <span className={cx(
                  theme === "dark" ? "text-emerald-300/80" : "text-green-700"
                )}
                style={theme === "bright" ? { color: brandGreen } : {}}
                >demo</span>
              </p>
            </form>
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

export default function AdminPanelV2() {
  const [theme, setTheme] = useState<"dark" | "bright">("dark");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tab, setTab] = useState<TabKey>("shipments");
  const [query, setQuery] = useState("");
  const [notesFilter, setNotesFilter] = useState<"ALL" | "RESOLVED" | "UNRESOLVED">("UNRESOLVED");
  const [shipFilter, setShipFilter] = useState<"ALL" | ShipmentStatus>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Real data from API
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convFilter, setConvFilter] = useState<"ALL" | ConversationStatus>("ALL");
  const [policy, setPolicy] = useState<PolicyConfig>({
    rescheduleCutoffMin: 120,
    maxMoveRadiusMeters: 250,
    maxContentMultiplier: 0,
    otpRequiredForSensitive: true,
    piiRedactionEnabled: true,
  });
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState<"7d" | "30d" | "90d">("7d");
  const [kpiData, setKpiData] = useState<KpiAggregateRow[]>([]);
  const [kpiBucket, setKpiBucket] = useState<"hour" | "day">("hour");
  const [kpiLoading, setKpiLoading] = useState(false);
  const [convAnalytics, setConvAnalytics] = useState<ConversationAnalytics | null>(null);
  const [convAnalyticsLoading, setConvAnalyticsLoading] = useState(false);

  // ====== Policy Engine v2.1 State ======
  type PolicyEnvDisplay = "Prod" | "Staging" | "Dev";
  const [policyEnv, setPolicyEnv] = useState<PolicyEnvDisplay>("Dev");
  const [policyPreset, setPolicyPreset] = useState<PresetName>("Standard");
  const [policySnapEnabled, setPolicySnapEnabled] = useState(true);
  const [policyDials, setPolicyDials] = useState<DialState>({ ...PRESETS.Standard });
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policyDirty, setPolicyDirty] = useState(false);
  const [policyMeta, setPolicyMeta] = useState({ policy_id: "default", policy_version: "1.0.0", name: "", description: "" });
  const [policyLimits, setPolicyLimits] = useState({ reschedule_cutoff_minutes: 120, max_geo_move_meters: 250, max_content_multiplier: 0 });
  const [policyBalanced, setPolicyBalanced] = useState(true);
  const [policyDrawerOpen, setPolicyDrawerOpen] = useState(false);
  const policyHistoryRef = React.useRef<DialState[]>([]);

  function policyEnvToApi(env: PolicyEnvDisplay): Environment {
    return env.toLowerCase() as Environment;
  }

  const policyRecommended = useMemo(() => PRESETS.Standard, []);
  const policyImpact = useMemo(() => {
    const d = policyDials;
    const speed = d.speechPace ?? 50;
    const autonomy = d.autonomyScope ?? 50;
    const clarify = d.clarificationBudget ?? 50;
    const confirm = d.confirmationRigor ?? 50;
    const ahtSeconds = 240 - (speed - 50) * 1.2 - (autonomy - 50) * 0.8 + (clarify - 50) * 0.9 + (confirm - 50) * 0.6;
    const aht = Math.max(110, Math.min(420, ahtSeconds));
    const containment = 0.86 + (autonomy - 50) * 0.001 - (clarify - 50) * 0.0006 - (speed - 50) * 0.0003;
    const rework = 0.015 + (autonomy - 50) * 0.00025 + (speed - 50) * 0.0001 - (confirm - 50) * 0.0002;
    const success = 0.985 - (rework - 0.015) * 0.5;
    const mm = Math.floor(aht / 60);
    const ss = Math.round(aht % 60);
    return {
      aht: `${mm}m ${String(ss).padStart(2, "0")}s`,
      containment: `${Math.round(containment * 100)}%`,
      rework: `${(rework * 100).toFixed(1)}%`,
      success: `${(success * 100).toFixed(1)}%`,
    };
  }, [policyDials]);

  const loadPolicyV2 = useCallback(async (env: PolicyEnvDisplay) => {
    setPolicyLoading(true);
    setPolicyError(null);
    try {
      const res = await fetch(`/api/policy?env=${policyEnvToApi(env)}`);
      const data = await res.json();
      if (data.ok && data.policy) {
        const doc = data.policy as PolicyDocument;
        setPolicyDials({
          speechPace: doc.dials.speech_pace.ui_value,
          conversationalMode: doc.dials.conversational_mode.ui_value,
          clarificationBudget: doc.dials.clarification_budget.ui_value,
          confirmationRigor: doc.dials.confirmation_rigor.ui_value,
          autonomyScope: doc.dials.autonomy_scope.ui_value,
        });
        setPolicyMeta({ policy_id: doc.policy_id, policy_version: doc.policy_version, name: doc.name ?? "", description: doc.description ?? "" });
        if (doc.logistics_limits) {
          const lim = doc.logistics_limits as Record<string, number>;
          setPolicyLimits({
            reschedule_cutoff_minutes: lim.reschedule_cutoff_minutes ?? 120,
            max_geo_move_meters: lim.max_geo_move_meters ?? 250,
            max_content_multiplier: lim.max_content_multiplier ?? 0,
          });
        }
        setPolicyDirty(false);
        policyHistoryRef.current = [];
      } else {
        setPolicyDials({ ...PRESETS.Standard });
        setPolicyMeta({ policy_id: "default", policy_version: "1.0.0", name: "", description: "" });
        setPolicyLimits({ reschedule_cutoff_minutes: 120, max_geo_move_meters: 250, max_content_multiplier: 0 });
        setPolicyDirty(false);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to load policy:", err);
      }
      setPolicyError("Failed to load policy");
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "policy") {
      loadPolicyV2(policyEnv);
    }
  }, [policyEnv, tab, loadPolicyV2]);

  function policyPushHistory(prev: DialState) {
    policyHistoryRef.current = [prev, ...policyHistoryRef.current].slice(0, 30);
  }

  function setPolicyDial(key: DialKey, v: number) {
    const next = clamp100(v);
    setPolicyDials((prev) => {
      policyPushHistory(prev);
      setPolicyDirty(true);
      return { ...prev, [key]: next };
    });
  }

  function applyPolicyPreset(p: PresetName) {
    setPolicyPreset(p);
    setPolicyDials((prev) => {
      policyPushHistory(prev);
      setPolicyDirty(true);
      return { ...PRESETS[p] };
    });
  }

  function policyUndo() {
    const last = policyHistoryRef.current[0];
    if (!last) return;
    policyHistoryRef.current = policyHistoryRef.current.slice(1);
    setPolicyDials(last);
    setPolicyDirty(true);
  }

  function policyReset() {
    loadPolicyV2(policyEnv);
  }

  async function policySave() {
    setPolicySaving(true);
    setPolicyError(null);
    try {
      const doc: PolicyDocument = {
        policy_id: policyMeta.policy_id,
        policy_version: policyMeta.policy_version,
        environment: policyEnvToApi(policyEnv),
        active: true,
        effective_at: new Date().toISOString(),
        name: policyMeta.name,
        description: policyMeta.description,
        dials: {
          speech_pace: { ui_value: policyDials.speechPace ?? 50 },
          conversational_mode: { ui_value: policyDials.conversationalMode ?? 50 },
          clarification_budget: { ui_value: policyDials.clarificationBudget ?? 50 },
          confirmation_rigor: { ui_value: policyDials.confirmationRigor ?? 50 },
          autonomy_scope: { ui_value: policyDials.autonomyScope ?? 50 },
        },
        guardrails: {
          pii_redaction_enabled: true,
          otp: { enabled: true, required_for_action_classes: ["change_address", "cancel_shipment"], risk_score_threshold: 0.7 },
          compliance: { hard_block_if_policy_violation: true, log_all_sensitive_requests: true },
        },
        logistics_limits: policyLimits,
        observability: { kpi_targets: {}, rework_window_hours: 24, emit_events: true, sample_rate: 1.0 },
      };
      const res = await fetch("/api/policy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(doc) });
      const data = await res.json();
      if (data.ok) {
        setPolicyDirty(false);
        policyHistoryRef.current = [];
      } else {
        setPolicyError(data.detail || data.error || "Failed to save policy");
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to save policy:", err);
      }
      setPolicyError("Failed to save policy");
    } finally {
      setPolicySaving(false);
    }
  }

  function handlePolicyEnvChange(env: PolicyEnvDisplay) {
    if (policyDirty) {
      const conf = window.confirm("You have unsaved changes. Switch environment anyway?");
      if (!conf) return;
    }
    setPolicyEnv(env);
  }
  // ====== End Policy Engine v2.1 State ======

  // Fetch shipments from API
  const fetchShipments = useCallback(async () => {
    try {
      const url = shipFilter !== "ALL"
        ? `/api/admin/shipments?status=${shipFilter}`
        : "/api/admin/shipments";
      const res = await fetch(url);
      const data = await res.json();
      const mapped: Shipment[] = (data.shipments || []).map((s: any) => ({
        id: s.shipment_id,
        status: s.status as ShipmentStatus,
        risk: s.risk_tier as Risk,
        address: s.address_text_ar || s.address_text,
        eta: new Date(s.eta_ts).toLocaleString(),
        updatedAt: new Date(s.updated_at).toLocaleString(),
      }));
      setShipments(mapped);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to fetch shipments:", error);
      }
    }
  }, [shipFilter]);

  // Fetch notes from API
  const fetchNotes = useCallback(async () => {
    try {
      const url = notesFilter === "ALL"
        ? "/api/admin/notes"
        : `/api/admin/notes?resolved=${notesFilter === "RESOLVED"}`;
      const res = await fetch(url);
      const data = await res.json();
      const mapped: CustomerNote[] = (data.notes || []).map((n: any) => ({
        id: n.id,
        shipmentId: n.shipment_id,
        status: n.resolved ? "RESOLVED" : "UNRESOLVED",
        title: n.note_type.replace(/_/g, " "),
        body: n.content,
        createdAt: new Date(n.captured_at).toLocaleString(),
      }));
      setNotes(mapped);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to fetch notes:", error);
      }
    }
  }, [notesFilter]);

  // Fetch evidence ledger from API
  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/evidence");
      const data = await res.json();
      const mapped: LedgerEvent[] = (data.evidence || []).map((e: any) => ({
        id: e.evidence_id,
        shipmentId: e.shipment_id,
        type: e.action_type,
        createdAt: new Date(e.created_at).toLocaleString(),
        payload: {
          before: JSON.parse(e.before_state || "{}"),
          after: JSON.parse(e.after_state || "{}"),
          policy: JSON.parse(e.policy_snapshot || "{}"),
        },
      }));
      setLedger(mapped);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to fetch evidence:", error);
      }
    }
  }, []);

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      const url = convFilter !== "ALL"
        ? `/api/admin/conversations?status=${convFilter}`
        : "/api/admin/conversations";
      const res = await fetch(url);
      const data = await res.json();
      const mapped: Conversation[] = (data.conversations || []).map((c: any) => ({
        id: c.id,
        shipmentId: c.shipmentId,
        status: c.status as ConversationStatus,
        actionsTaken: c.actionsTaken,
        openedAt: new Date(c.openedAt).toLocaleString(),
        resolvedAt: c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : null,
        address: c.shipment?.address_text_ar || c.shipment?.address_text || "",
      }));
      setConversations(mapped);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to fetch conversations:", error);
      }
    }
  }, [convFilter]);

  // Fetch policy from API
  const fetchPolicy = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/policy");
      const data = await res.json();
      if (data.config) {
        setPolicy({
          rescheduleCutoffMin: data.config.reschedule_cutoff_minutes,
          maxMoveRadiusMeters: data.config.max_geo_move_meters,
          maxContentMultiplier: data.config.max_content_multiplier ?? 0,
          otpRequiredForSensitive: true,
          piiRedactionEnabled: true,
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to fetch policy:", error);
      }
    }
  }, []);

  // Fetch analytics from API
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics?range=${analyticsRange}`);
      const data = await res.json();
      if (!data.error) {
        setAnalytics(data);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to fetch analytics:", error);
      }
    }
  }, [analyticsRange]);

  // Fetch KPI aggregates from v2.1 Policy Engine API
  const fetchKpiData = useCallback(async () => {
    setKpiLoading(true);
    try {
      const limit = kpiBucket === "hour" ? 48 : 30; // 48 hours or 30 days
      const res = await fetch(`/api/kpi?env=prod&bucket=${kpiBucket}&limit=${limit}`);
      const data = await res.json();
      if (data.ok && data.rows) {
        setKpiData(data.rows);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to fetch KPI data:", error);
      }
    } finally {
      setKpiLoading(false);
    }
  }, [kpiBucket]);

  const fetchConvAnalytics = useCallback(async () => {
    setConvAnalyticsLoading(true);
    try {
      const res = await fetch("/api/admin/analytics/conversations");
      const data = await res.json();
      setConvAnalytics(data);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to fetch conversation analytics:", error);
      }
    } finally {
      setConvAnalyticsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    if (isAuthenticated) {
      fetchShipments();
      fetchNotes();
      fetchLedger();
      fetchPolicy();
      fetchAnalytics();
      fetchKpiData();
    }
  }, [isAuthenticated, fetchShipments, fetchNotes, fetchLedger, fetchPolicy, fetchAnalytics, fetchKpiData]);

  // Refetch when filters change
  useEffect(() => {
    if (isAuthenticated && tab === "shipments") {
      fetchShipments();
    }
  }, [shipFilter, isAuthenticated, tab, fetchShipments]);

  useEffect(() => {
    if (isAuthenticated && tab === "notes") {
      fetchNotes();
    }
  }, [notesFilter, isAuthenticated, tab, fetchNotes]);

  // Refetch analytics when date range changes
  useEffect(() => {
    if (isAuthenticated && tab === "analytics") {
      fetchAnalytics();
    }
  }, [analyticsRange, isAuthenticated, tab, fetchAnalytics]);

  // Refetch KPI data when bucket changes
  useEffect(() => {
    if (isAuthenticated && tab === "analytics") {
      fetchKpiData();
    }
  }, [kpiBucket, isAuthenticated, tab, fetchKpiData]);

  // Fetch conversation analytics when analytics tab is selected
  useEffect(() => {
    if (isAuthenticated && tab === "analytics") {
      fetchConvAnalytics();
    }
  }, [isAuthenticated, tab, fetchConvAnalytics]);

  // Refetch conversations when filter changes
  useEffect(() => {
    if (isAuthenticated && tab === "conversations") {
      fetchConversations();
    }
  }, [convFilter, isAuthenticated, tab, fetchConversations]);

  const filteredShipments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter((s) => (q ? (s.id + " " + s.address).toLowerCase().includes(q) : true));
  }, [shipments, query]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => (q ? (n.id + " " + n.title + " " + n.shipmentId).toLowerCase().includes(q) : true));
  }, [notes, query]);

  const filteredLedger = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ledger.filter((e) => (q ? (e.id + " " + e.type + " " + e.shipmentId).toLowerCase().includes(q) : true));
  }, [ledger, query]);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => (q ? (c.id + " " + c.shipmentId + " " + c.status).toLowerCase().includes(q) : true));
  }, [conversations, query]);

  useEffect(() => {
    if (tab === "shipments") setSelectedId(filteredShipments[0]?.id ?? null);
    if (tab === "notes") setSelectedId(filteredNotes[0]?.id ?? null);
    if (tab === "ledger") setSelectedId(filteredLedger[0]?.id ?? null);
    if (tab === "conversations") setSelectedId(filteredConversations[0]?.id ?? null);
  }, [tab, filteredShipments, filteredNotes, filteredLedger, filteredConversations]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    if (tab === "shipments") return filteredShipments.find((s) => s.id === selectedId) ?? null;
    if (tab === "notes") return filteredNotes.find((n) => n.id === selectedId) ?? null;
    if (tab === "ledger") return filteredLedger.find((e) => e.id === selectedId) ?? null;
    if (tab === "conversations") return filteredConversations.find((c) => c.id === selectedId) ?? null;
    return null;
  }, [selectedId, tab, filteredShipments, filteredNotes, filteredLedger, filteredConversations]);

  const savePolicy = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reschedule_cutoff_minutes: policy.rescheduleCutoffMin,
          max_geo_move_meters: policy.maxMoveRadiusMeters,
          max_content_multiplier: policy.maxContentMultiplier,
        }),
      });
      if (res.ok) {
        alert("Policy saved successfully!");
      } else {
        alert("Failed to save policy");
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to save policy:", error);
      }
      alert("Failed to save policy");
    } finally {
      setLoading(false);
    }
  };

  const toggleNoteResolved = async (noteId: string, currentResolved: boolean) => {
    try {
      await fetch("/api/admin/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: noteId, resolved: !currentResolved }),
      });
      fetchNotes();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to update note:", error);
      }
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const refresh = async () => {
    setLoading(true);
    await Promise.all([fetchShipments(), fetchNotes(), fetchLedger(), fetchPolicy()]);
    setLoading(false);
  };

  const tabMeta: Record<TabKey, { title: string; subtitle: string; icon: React.ReactNode }> = {
    notes: { title: "Customer Notes", subtitle: "Support & annotations", icon: <NotebookPen className="h-5 w-5" /> },
    ledger: { title: "Evidence Ledger", subtitle: "Audit-ready event trail", icon: <ReceiptText className="h-5 w-5" /> },
    shipments: { title: "Shipments", subtitle: "Operational queue", icon: <PackageSearch className="h-5 w-5" /> },
    analytics: { title: "Analytics", subtitle: "Insights & metrics", icon: <BarChart3 className="h-5 w-5" /> },
    policy: { title: "Policy Controls", subtitle: "Guardrails & rules", icon: <SlidersHorizontal className="h-5 w-5" /> },
    conversations: { title: "Conversations", subtitle: "Lifecycle tracking", icon: <MessageSquare className="h-5 w-5" /> },
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} theme={theme} />;
  }

  return (
    <Shell theme={theme}>
      <div className="grid min-h-screen grid-cols-1 gap-4 p-4 lg:grid-cols-[290px_1fr] xl:grid-cols-[290px_1fr_380px] lg:p-6">
        {/* Sidebar */}
        <Panel theme={theme} className="hidden lg:flex lg:flex-col">
          <div className={cx(
            "border-b px-4 py-4",
            theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
          )}>
            <BrandMark theme={theme} />
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
            <NavItem
              active={tab === "shipments"}
              icon={tabMeta.shipments.icon}
              title={tabMeta.shipments.title}
              subtitle={tabMeta.shipments.subtitle}
              onClick={() => setTab("shipments")}
              theme={theme}
            />
            <NavItem
              active={tab === "notes"}
              icon={tabMeta.notes.icon}
              title={tabMeta.notes.title}
              subtitle={tabMeta.notes.subtitle}
              onClick={() => setTab("notes")}
              theme={theme}
            />
            <NavItem
              active={tab === "policy"}
              icon={tabMeta.policy.icon}
              title={tabMeta.policy.title}
              subtitle={tabMeta.policy.subtitle}
              onClick={() => setTab("policy")}
              theme={theme}
            />
            <NavItem
              active={tab === "ledger"}
              icon={tabMeta.ledger.icon}
              title={tabMeta.ledger.title}
              subtitle={tabMeta.ledger.subtitle}
              onClick={() => setTab("ledger")}
              theme={theme}
            />
            <NavItem
              active={tab === "analytics"}
              icon={tabMeta.analytics.icon}
              title={tabMeta.analytics.title}
              subtitle={tabMeta.analytics.subtitle}
              onClick={() => setTab("analytics")}
              theme={theme}
            />
            <NavItem
              active={tab === "conversations"}
              icon={tabMeta.conversations.icon}
              title={tabMeta.conversations.title}
              subtitle={tabMeta.conversations.subtitle}
              onClick={() => setTab("conversations")}
              theme={theme}
            />

            <div className={cx(
              "rounded-2xl border p-4",
              theme === "dark" ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
            )}>
              <div className={cx(
                "text-[13px] font-bold",
                theme === "dark" ? "" : "text-gray-900"
              )}>Quick stats</div>
              <div className={cx(
                "mt-2 grid grid-cols-2 gap-2 text-[12px]",
                theme === "dark" ? "text-white/70" : "text-gray-700"
              )}>
                <div className={cx(
                  "rounded-xl border p-3",
                  theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"
                )}>
                  <div className={theme === "dark" ? "text-white/55" : "text-gray-500"}>Active</div>
                  <div className="mt-1 text-[16px] font-bold tabular-nums">
                    {shipments.filter((s) => s.status !== "DELIVERED").length}
                  </div>
                </div>
                <div className={cx(
                  "rounded-xl border p-3",
                  theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"
                )}>
                  <div className={theme === "dark" ? "text-white/55" : "text-gray-500"}>Unresolved</div>
                  <div className="mt-1 text-[16px] font-bold tabular-nums">
                    {notes.filter((n) => n.status === "UNRESOLVED").length}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge tone="ok" theme={theme}>
                  <ShieldCheck className="h-3 w-3" /> Compliance ON
                </Badge>
                <Badge theme={theme}>PII masked</Badge>
              </div>
            </div>
          </div>

          <div className={cx(
            "border-t p-4",
            theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
          )}>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setTheme(theme === "dark" ? "bright" : "dark")}
                className={cx(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] transition",
                  theme === "dark"
                    ? "border-white/10 bg-white/5 text-white/90 hover:border-white/20 hover:bg-white/10"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Bright" : "Dark"}
              </button>
              <IconButton icon={<RefreshCcw className="h-4 w-4" />} label="Refresh" onClick={refresh} loading={loading} theme={theme} />
              <IconButton icon={<LogOut className="h-4 w-4" />} label="Logout" onClick={logout} theme={theme} />
            </div>
          </div>
        </Panel>

        {/* Main content */}
        <Panel theme={theme} className="flex flex-col">
          <div className={cx(
            "border-b px-4 py-4",
            theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
          )}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className={cx(
                  "rounded-2xl border p-2.5",
                  theme === "dark" ? "border-white/10 bg-white/5 text-white/85" : "border-gray-200 bg-gray-50 text-gray-700"
                )}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className={cx(
                    "truncate text-[14px] font-bold",
                    theme === "dark" ? "" : "text-gray-900"
                  )}>{tabMeta[tab].title}</div>
                  <div className={cx(
                    "truncate text-[12px]",
                    theme === "dark" ? "text-white/60" : "text-gray-600"
                  )}>{tabMeta[tab].subtitle}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <IconButton icon={<RefreshCcw className="h-4 w-4" />} label="Refresh" onClick={refresh} loading={loading} theme={theme} />
                <IconButton icon={<LogOut className="h-4 w-4" />} label="Logout" onClick={logout} theme={theme} />
              </div>
            </div>

            <div className="mt-3">
              <SearchBar value={query} onChange={setQuery} placeholder="Search by shipment ID, event, note..." theme={theme} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {tab === "notes" && (
                <>
                  <Chip active={notesFilter === "RESOLVED"} onClick={() => setNotesFilter("RESOLVED")} theme={theme}>
                    Resolved
                  </Chip>
                  <Chip active={notesFilter === "UNRESOLVED"} onClick={() => setNotesFilter("UNRESOLVED")} theme={theme}>
                    Unresolved
                  </Chip>
                  <Chip active={notesFilter === "ALL"} onClick={() => setNotesFilter("ALL")} theme={theme}>
                    All
                  </Chip>
                </>
              )}

              {tab === "shipments" && (
                <>
                  <Chip active={shipFilter === "ALL"} onClick={() => setShipFilter("ALL")} theme={theme}>
                    All
                  </Chip>
                  <Chip active={shipFilter === "OUT_FOR_DELIVERY"} onClick={() => setShipFilter("OUT_FOR_DELIVERY")} theme={theme}>
                    Out for delivery
                  </Chip>
                  <Chip active={shipFilter === "IN_TRANSIT"} onClick={() => setShipFilter("IN_TRANSIT")} theme={theme}>
                    In transit
                  </Chip>
                  <Chip active={shipFilter === "PENDING"} onClick={() => setShipFilter("PENDING")} theme={theme}>
                    Pending
                  </Chip>
                  <Chip active={shipFilter === "DELIVERED"} onClick={() => setShipFilter("DELIVERED")} theme={theme}>
                    Delivered
                  </Chip>
                </>
              )}

              {tab === "ledger" && <Badge theme={theme}>Audit trail</Badge>}

              {tab === "analytics" && (
                <>
                  <Chip active={analyticsRange === "7d"} onClick={() => setAnalyticsRange("7d")} theme={theme}>
                    7 Days
                  </Chip>
                  <Chip active={analyticsRange === "30d"} onClick={() => setAnalyticsRange("30d")} theme={theme}>
                    30 Days
                  </Chip>
                  <Chip active={analyticsRange === "90d"} onClick={() => setAnalyticsRange("90d")} theme={theme}>
                    90 Days
                  </Chip>
                </>
              )}

              {tab === "conversations" && (
                <>
                  <Chip active={convFilter === "ALL"} onClick={() => setConvFilter("ALL")} theme={theme}>
                    All
                  </Chip>
                  <Chip active={convFilter === "OPEN"} onClick={() => setConvFilter("OPEN")} theme={theme}>
                    Open
                  </Chip>
                  <Chip active={convFilter === "ACTIVE"} onClick={() => setConvFilter("ACTIVE")} theme={theme}>
                    Active
                  </Chip>
                  <Chip active={convFilter === "RESOLVED"} onClick={() => setConvFilter("RESOLVED")} theme={theme}>
                    Resolved
                  </Chip>
                  <Chip active={convFilter === "CLOSED"} onClick={() => setConvFilter("CLOSED")} theme={theme}>
                    Closed
                  </Chip>
                </>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-3"
              >
                {tab === "shipments" && (
                  <>
                    {filteredShipments.length === 0 ? (
                      <EmptyState title="No shipments match your filters" body="Try clearing filters or changing the search query." theme={theme} />
                    ) : (
                      filteredShipments.map((s) => (
                        <RowItem
                          key={s.id}
                          active={selectedId === s.id}
                          onClick={() => setSelectedId(s.id)}
                          left={<RiskPill risk={s.risk} theme={theme} />}
                          right={<StatusPill status={s.status} theme={theme} />}
                          title={s.id}
                          subtitle={s.address}
                          meta={[
                            { icon: <Clock className="h-4 w-4" />, text: `ETA: ${s.eta}` },
                            { icon: <MapPin className="h-4 w-4" />, text: `Updated: ${s.updatedAt}` },
                          ]}
                          theme={theme}
                        />
                      ))
                    )}
                  </>
                )}

                {tab === "notes" && (
                  <>
                    {filteredNotes.length === 0 ? (
                      <EmptyState title="No customer notes found" body="When support notes are created, they will appear here." theme={theme} />
                    ) : (
                      filteredNotes.map((n) => (
                        <RowItem
                          key={n.id}
                          active={selectedId === n.id}
                          onClick={() => setSelectedId(n.id)}
                          left={<Badge tone={n.status === "RESOLVED" ? "ok" : "warn"} theme={theme}>{n.status}</Badge>}
                          right={<Badge theme={theme}>{n.shipmentId}</Badge>}
                          title={n.title}
                          subtitle={n.body}
                          meta={[{ icon: <Clock className="h-4 w-4" />, text: n.createdAt }]}
                          theme={theme}
                          action={
                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                toggleNoteResolved(n.id, n.status === "RESOLVED");
                              }}
                              className={cx(
                                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] transition",
                                n.status === "RESOLVED"
                                  ? "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                                  : "border-emerald-300/30 bg-emerald-500/15 text-white/90 hover:bg-emerald-500/25"
                              )}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {n.status === "RESOLVED" ? "Unresolve" : "Resolve"}
                            </button>
                          }
                        />
                      ))
                    )}
                  </>
                )}

                {tab === "ledger" && (
                  <>
                    {filteredLedger.length === 0 ? (
                      <EmptyState title="No ledger events found" body="Events will stream here as actions occur." theme={theme} />
                    ) : (
                      filteredLedger.map((e) => (
                        <RowItem
                          key={e.id}
                          active={selectedId === e.id}
                          onClick={() => setSelectedId(e.id)}
                          left={<Badge theme={theme}>{e.type}</Badge>}
                          right={<Badge theme={theme}>{e.shipmentId}</Badge>}
                          title={e.id}
                          subtitle={`Shipment: ${e.shipmentId}`}
                          meta={[{ icon: <Clock className="h-4 w-4" />, text: e.createdAt }]}
                          theme={theme}
                          action={
                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setSelectedId(e.id);
                              }}
                              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/90 transition hover:border-white/20 hover:bg-white/10"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                          }
                        />
                      ))
                    )}
                  </>
                )}

                {tab === "conversations" && (
                  <>
                    {filteredConversations.length === 0 ? (
                      <EmptyState title="No conversations found" body="Conversations will appear here when customers interact." theme={theme} />
                    ) : (
                      filteredConversations.map((c) => (
                        <RowItem
                          key={c.id}
                          active={selectedId === c.id}
                          onClick={() => setSelectedId(c.id)}
                          left={
                            <Badge
                              tone={
                                c.status === "RESOLVED" ? "ok" :
                                c.status === "ACTIVE" || c.status === "REOPENED" ? "warn" :
                                undefined
                              }
                              theme={theme}
                            >
                              {c.status}
                            </Badge>
                          }
                          right={<Badge theme={theme}>{c.shipmentId}</Badge>}
                          title={c.shipmentId}
                          subtitle={c.address || "No address"}
                          meta={[
                            { icon: <Clock className="h-4 w-4" />, text: `Opened: ${c.openedAt}` },
                            { icon: <Activity className="h-4 w-4" />, text: `${c.actionsTaken} actions` },
                          ]}
                          theme={theme}
                        />
                      ))
                    )}
                  </>
                )}

                {tab === "analytics" && (
                  <>
                    {!analytics ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                          <MetricCard
                            label="Total Interactions"
                            value={analytics.summary.totalInteractions}
                            icon={<MessageSquare className="h-5 w-5" />}
                            trend="neutral"
                            theme={theme}
                          />
                          <MetricCard
                            label="Total Actions"
                            value={analytics.summary.totalActions}
                            icon={<Activity className="h-5 w-5" />}
                            trend="neutral"
                            theme={theme}
                          />
                          <MetricCard
                            label="Success Rate"
                            value={`${analytics.summary.successRate}%`}
                            icon={<TrendingUp className="h-5 w-5" />}
                            trend={analytics.summary.successRate >= 80 ? "up" : analytics.summary.successRate >= 50 ? "neutral" : "down"}
                            theme={theme}
                          />
                          <MetricCard
                            label="Unresolved"
                            value={analytics.summary.unresolvedCount}
                            icon={<AlertTriangle className="h-5 w-5" />}
                            trend={analytics.summary.unresolvedCount > 10 ? "down" : "neutral"}
                            theme={theme}
                          />
                        </div>

                        {/* Charts Row */}
                        <div className="grid gap-4 lg:grid-cols-2">
                          {/* Action Types */}
                          <div className={cx("rounded-2xl border p-4", theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-white")}>
                            <div className={cx("mb-4 text-[13px] font-bold", theme === "dark" ? "" : "text-gray-900")}>Actions by Type</div>
                            <SimpleBarChart
                              data={analytics.actionsByType}
                              labelKey="type"
                              valueKey="count"
                              maxBars={5}
                              theme={theme}
                            />
                          </div>

                          {/* Note Types */}
                          <div className={cx("rounded-2xl border p-4", theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-white")}>
                            <div className={cx("mb-4 text-[13px] font-bold", theme === "dark" ? "" : "text-gray-900")}>Notes by Type</div>
                            <SimpleBarChart
                              data={analytics.notesByType}
                              labelKey="type"
                              valueKey="count"
                              maxBars={5}
                              theme={theme}
                            />
                          </div>
                        </div>

                        {/* Language & Risk Tier Row */}
                        <div className="grid gap-4 lg:grid-cols-2">
                          {/* Language Breakdown */}
                          <div className={cx("rounded-2xl border p-4", theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-white")}>
                            <div className="mb-4 flex items-center gap-2">
                              <Globe className={cx("h-4 w-4", theme === "dark" ? "text-white/70" : "text-gray-600")} />
                              <span className={cx("text-[13px] font-bold", theme === "dark" ? "" : "text-gray-900")}>Language Distribution</span>
                            </div>
                            <SimplePieChart
                              data={[
                                { label: "Arabic (العربية)", value: analytics.languageBreakdown.arabic },
                                { label: "English", value: analytics.languageBreakdown.english },
                              ]}
                              colors={["rgba(35,213,171,.7)", "rgba(99,102,241,.7)"]}
                              theme={theme}
                            />
                          </div>

                          {/* Risk Tier Distribution */}
                          <div className={cx("rounded-2xl border p-4", theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-white")}>
                            <div className={cx("mb-4 text-[13px] font-bold", theme === "dark" ? "" : "text-gray-900")}>Interactions by Risk Tier</div>
                            <SimpleBarChart
                              data={analytics.byRiskTier}
                              labelKey="tier"
                              valueKey="interactionCount"
                              maxBars={4}
                              theme={theme}
                            />
                          </div>
                        </div>

                        {/* Peak Hours Heatmap */}
                        <div className={cx("rounded-2xl border p-4", theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-white")}>
                          <div className="mb-4 flex items-center gap-2">
                            <Clock className={cx("h-4 w-4", theme === "dark" ? "text-white/70" : "text-gray-600")} />
                            <span className={cx("text-[13px] font-bold", theme === "dark" ? "" : "text-gray-900")}>Peak Hours (24h)</span>
                          </div>
                          <HourlyHeatmap data={analytics.peakHours} />
                        </div>

                        {/* Top Shipments Table */}
                        <div className={cx("rounded-2xl border p-4", theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-white")}>
                          <div className={cx("mb-4 text-[13px] font-bold", theme === "dark" ? "" : "text-gray-900")}>Top Shipments by Interactions</div>
                          {analytics.topShipments.length === 0 ? (
                            <div className={cx("py-4 text-center text-[12px]", theme === "dark" ? "text-white/50" : "text-gray-500")}>No data available</div>
                          ) : (
                            <div className="space-y-2">
                              {analytics.topShipments.slice(0, 5).map((s, i) => (
                                <div
                                  key={s.shipment_id}
                                  className={cx(
                                    "flex items-center justify-between rounded-xl border px-3 py-2",
                                    theme === "dark" ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={cx(
                                      "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                                      theme === "dark" ? "bg-white/10" : "bg-gray-200 text-gray-700"
                                    )}>
                                      {i + 1}
                                    </span>
                                    <span className={cx("font-mono text-[12px]", theme === "dark" ? "text-white/85" : "text-gray-900")}>{s.shipment_id}</span>
                                  </div>
                                  <Badge theme={theme}>{s.noteCount} notes</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Date Range Info */}
                        <div className={cx("text-center text-[11px]", theme === "dark" ? "text-white/45" : "text-gray-500")}>
                          Data from {new Date(analytics.dateRange.start).toLocaleDateString()} to{" "}
                          {new Date(analytics.dateRange.end).toLocaleDateString()}
                        </div>

                        {/* Conversation Funnel Analytics */}
                        <div className={cx(
                          "rounded-2xl border p-4",
                          theme === "dark"
                            ? "border-sky-400/20 bg-sky-400/5"
                            : "border-sky-700/30 bg-sky-50"
                        )}>
                          <div className="flex items-center gap-2 mb-4">
                            <div className={cx(
                              "rounded-xl border p-2",
                              theme === "dark"
                                ? "border-sky-300/30 bg-sky-500/15"
                                : "border-sky-700/30 bg-sky-50"
                            )}>
                              <BarChart3 className={cx("h-5 w-5", theme === "dark" ? "text-sky-300" : "text-sky-800")} />
                            </div>
                            <div>
                              <div className={cx("text-[13px] font-bold", theme === "dark" ? "" : "text-gray-900")}>Conversation Funnel</div>
                              <div className={cx("text-[10px]", theme === "dark" ? "text-white/50" : "text-gray-600")}>Status flow & drop-off analysis</div>
                            </div>
                          </div>

                          {convAnalyticsLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className={cx("h-6 w-6 animate-spin", theme === "dark" ? "text-white/50" : "text-gray-400")} />
                            </div>
                          ) : convAnalytics ? (
                            <div className="space-y-4">
                              {/* Funnel Visualization */}
                              <div className={cx(
                                "rounded-xl border p-4",
                                theme === "dark" ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
                              )}>
                                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                                  {/* OPEN */}
                                  <div className="flex flex-col items-center min-w-[70px]">
                                    <span className={cx(
                                      "inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-bold",
                                      theme === "dark"
                                        ? "border-white/10 bg-white/5 text-white/70"
                                        : "border-gray-300 bg-gray-100 text-gray-700"
                                    )}>
                                      {convAnalytics.funnel.open}
                                    </span>
                                    <span className={cx("mt-1 text-[10px]", theme === "dark" ? "text-white/50" : "text-gray-500")}>OPEN</span>
                                  </div>

                                  {/* Arrow with drop-off */}
                                  <div className="flex flex-col items-center">
                                    <ChevronRight className={cx("h-5 w-5", theme === "dark" ? "text-white/30" : "text-gray-400")} />
                                    {convAnalytics.funnel.open > 0 && (
                                      <span className={cx("text-[9px]", theme === "dark" ? "text-white/40" : "text-gray-400")}>
                                        {Math.round((convAnalytics.funnel.active / Math.max(convAnalytics.funnel.open, 1)) * 100)}%
                                      </span>
                                    )}
                                  </div>

                                  {/* ACTIVE */}
                                  <div className="flex flex-col items-center min-w-[70px]">
                                    <span className={cx(
                                      "inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-bold",
                                      theme === "dark"
                                        ? "border-amber-200/15 bg-amber-400/10 text-amber-200"
                                        : "border-amber-300/30 bg-amber-50 text-amber-800"
                                    )}>
                                      {convAnalytics.funnel.active}
                                    </span>
                                    <span className={cx("mt-1 text-[10px]", theme === "dark" ? "text-white/50" : "text-gray-500")}>ACTIVE</span>
                                  </div>

                                  {/* Arrow with drop-off */}
                                  <div className="flex flex-col items-center">
                                    <ChevronRight className={cx("h-5 w-5", theme === "dark" ? "text-white/30" : "text-gray-400")} />
                                    {convAnalytics.funnel.active > 0 && (
                                      <span className={cx("text-[9px]", theme === "dark" ? "text-white/40" : "text-gray-400")}>
                                        {Math.round((convAnalytics.funnel.resolved / Math.max(convAnalytics.funnel.active, 1)) * 100)}%
                                      </span>
                                    )}
                                  </div>

                                  {/* RESOLVED */}
                                  <div className="flex flex-col items-center min-w-[70px]">
                                    <span className={cx(
                                      "inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-bold",
                                      theme === "dark"
                                        ? "border-emerald-200/15 bg-emerald-400/10 text-emerald-200"
                                        : "border-green-700/30 bg-green-50 text-green-800"
                                    )}>
                                      {convAnalytics.funnel.resolved}
                                    </span>
                                    <span className={cx("mt-1 text-[10px]", theme === "dark" ? "text-white/50" : "text-gray-500")}>RESOLVED</span>
                                  </div>

                                  {/* Arrow with drop-off */}
                                  <div className="flex flex-col items-center">
                                    <ChevronRight className={cx("h-5 w-5", theme === "dark" ? "text-white/30" : "text-gray-400")} />
                                    {convAnalytics.funnel.resolved > 0 && (
                                      <span className={cx("text-[9px]", theme === "dark" ? "text-white/40" : "text-gray-400")}>
                                        {Math.round((convAnalytics.funnel.closed / Math.max(convAnalytics.funnel.resolved, 1)) * 100)}%
                                      </span>
                                    )}
                                  </div>

                                  {/* CLOSED */}
                                  <div className="flex flex-col items-center min-w-[70px]">
                                    <span className={cx(
                                      "inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-bold",
                                      theme === "dark"
                                        ? "border-emerald-200/15 bg-emerald-400/10 text-emerald-200"
                                        : "border-green-700/30 bg-green-50 text-green-800"
                                    )}>
                                      {convAnalytics.funnel.closed}
                                    </span>
                                    <span className={cx("mt-1 text-[10px]", theme === "dark" ? "text-white/50" : "text-gray-500")}>CLOSED</span>
                                  </div>
                                </div>

                                {/* Reopened indicator */}
                                {convAnalytics.funnel.reopened > 0 && (
                                  <div className="mt-3 flex items-center justify-center gap-2">
                                    <RefreshCcw className={cx("h-3 w-3", theme === "dark" ? "text-amber-300" : "text-amber-600")} />
                                    <span className={cx(
                                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px]",
                                      theme === "dark"
                                        ? "border-amber-200/15 bg-amber-400/10 text-amber-200"
                                        : "border-amber-300/30 bg-amber-50 text-amber-800"
                                    )}>
                                      {convAnalytics.funnel.reopened} reopened
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Key Metrics */}
                              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <MetricCard
                                  label="Avg Resolution Time"
                                  value={`${convAnalytics.metrics.avgResolutionTimeMinutes} min`}
                                  icon={<Clock className="h-5 w-5" />}
                                  trend={convAnalytics.metrics.avgResolutionTimeMinutes <= 10 ? "up" : convAnalytics.metrics.avgResolutionTimeMinutes <= 30 ? "neutral" : "down"}
                                  theme={theme}
                                />
                                <MetricCard
                                  label="Avg Actions/Convo"
                                  value={convAnalytics.metrics.avgActionsPerConversation.toFixed(1)}
                                  icon={<Activity className="h-5 w-5" />}
                                  trend="neutral"
                                  theme={theme}
                                />
                                <MetricCard
                                  label="Reopen Rate"
                                  value={`${convAnalytics.metrics.reopenRatePercent}%`}
                                  icon={<RefreshCcw className="h-5 w-5" />}
                                  trend={convAnalytics.metrics.reopenRatePercent <= 5 ? "up" : convAnalytics.metrics.reopenRatePercent <= 20 ? "neutral" : "down"}
                                  theme={theme}
                                />
                                <MetricCard
                                  label="Stuck Conversations"
                                  value={convAnalytics.metrics.stuckActiveCount}
                                  icon={<AlertTriangle className="h-5 w-5" />}
                                  trend={convAnalytics.metrics.stuckActiveCount === 0 ? "up" : convAnalytics.metrics.stuckActiveCount <= 5 ? "neutral" : "down"}
                                  theme={theme}
                                />
                              </div>

                              {/* Volume indicator */}
                              <div className={cx(
                                "flex items-center justify-between rounded-xl border px-3 py-2",
                                theme === "dark" ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
                              )}>
                                <span className={cx("text-[11px]", theme === "dark" ? "text-white/60" : "text-gray-600")}>
                                  Last 24h volume
                                </span>
                                <Badge theme={theme}>{convAnalytics.volume.last24h} conversations</Badge>
                              </div>
                            </div>
                          ) : (
                            <div className={cx("py-8 text-center text-[12px]", theme === "dark" ? "text-white/50" : "text-gray-500")}>
                              No conversation data available
                            </div>
                          )}
                        </div>

                        {/* v2.1 Policy Engine KPI Dashboard */}
                        <div className={cx(
                          "rounded-2xl border p-4",
                          theme === "dark"
                            ? "border-emerald-400/20 bg-emerald-400/5"
                            : "border-green-700/30 bg-green-50"
                        )} style={theme === "bright" ? {
                          borderColor: "#1e3d1a33",
                          backgroundColor: "#1e3d1a0d"
                        } : {}}>
                          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className={cx(
                                "rounded-xl border p-2",
                                theme === "dark"
                                  ? "border-emerald-300/30 bg-emerald-500/15"
                                  : "border-green-700/30 bg-green-50"
                              )} style={theme === "bright" ? {
                                borderColor: "#1e3d1a33",
                                backgroundColor: "#1e3d1a0d"
                              } : {}}>
                                <Activity className={cx("h-5 w-5", theme === "dark" ? "text-emerald-300" : "text-green-800")} style={theme === "bright" ? { color: "#1e3d1a" } : {}} />
                              </div>
                              <div>
                                <div className={cx("text-[13px] font-bold", theme === "dark" ? "" : "text-gray-900")}>Policy KPI Dashboard</div>
                                <div className={cx("text-[10px]", theme === "dark" ? "text-white/50" : "text-gray-600")}>v2.1 Telemetry Aggregates</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Chip active={kpiBucket === "hour"} onClick={() => setKpiBucket("hour")} theme={theme}>
                                Hourly
                              </Chip>
                              <Chip active={kpiBucket === "day"} onClick={() => setKpiBucket("day")} theme={theme}>
                                Daily
                              </Chip>
                              {kpiLoading && <Loader2 className={cx("h-4 w-4 animate-spin", theme === "dark" ? "text-white/50" : "text-gray-400")} />}
                            </div>
                          </div>

                          {kpiData.length === 0 ? (
                            <div className="py-8 text-center">
                              <div className="text-[12px] text-white/50">No KPI data available yet</div>
                              <div className="mt-1 text-[10px] text-white/35">
                                KPI aggregates are generated hourly/daily from telemetry events
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Latest KPI Summary */}
                              {(() => {
                                const latest = kpiData[0];
                                const totals = latest.totals;
                                const metrics = latest.metrics;
                                return (
                                  <>
                                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                      <MetricCard
                                        label="AHT Mean"
                                        value={`${metrics.aht_mean.toFixed(1)}s`}
                                        subtext={`p50: ${metrics.aht_p50.toFixed(1)}s • p90: ${metrics.aht_p90.toFixed(1)}s`}
                                        icon={<Clock className="h-5 w-5" />}
                                        trend={metrics.aht_mean <= 60 ? "up" : metrics.aht_mean <= 90 ? "neutral" : "down"}
                                        theme={theme}
                                      />
                                      <MetricCard
                                        label="Containment"
                                        value={`${(metrics.containment_rate * 100).toFixed(1)}%`}
                                        subtext={`${totals.contained_count} of ${totals.total_conversations}`}
                                        icon={<CheckCircle2 className="h-5 w-5" />}
                                        trend={metrics.containment_rate >= 0.85 ? "up" : metrics.containment_rate >= 0.7 ? "neutral" : "down"}
                                        theme={theme}
                                      />
                                      <MetricCard
                                        label="Escalation"
                                        value={`${(metrics.escalation_rate * 100).toFixed(1)}%`}
                                        subtext={`${totals.escalated_count} escalated`}
                                        icon={<AlertTriangle className="h-5 w-5" />}
                                        trend={metrics.escalation_rate <= 0.1 ? "up" : metrics.escalation_rate <= 0.2 ? "neutral" : "down"}
                                        theme={theme}
                                      />
                                      <MetricCard
                                        label="Rework"
                                        value={`${(metrics.rework_rate * 100).toFixed(1)}%`}
                                        subtext={`${totals.rework_count} repeat contacts`}
                                        icon={<RefreshCcw className="h-5 w-5" />}
                                        trend={metrics.rework_rate <= 0.05 ? "up" : metrics.rework_rate <= 0.1 ? "neutral" : "down"}
                                        theme={theme}
                                      />
                                    </div>

                                    {/* Policy Version Info */}
                                    <div className={cx(
                                      "flex items-center justify-between rounded-xl border px-3 py-2",
                                      theme === "dark" ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
                                    )}>
                                      <div className="flex items-center gap-2">
                                        <Badge tone="ok" theme={theme}>Latest</Badge>
                                        <span className={cx("text-[11px]", theme === "dark" ? "text-white/70" : "text-gray-600")}>
                                          Policy: <span className={cx("font-mono", theme === "dark" ? "text-white/90" : "text-gray-900")}>{latest.policy_id}</span> v{latest.policy_version}
                                        </span>
                                      </div>
                                      <span className={cx("text-[10px]", theme === "dark" ? "text-white/50" : "text-gray-500")}>
                                        {new Date(latest.bucket_start).toLocaleString()} - {new Date(latest.bucket_end).toLocaleString()}
                                      </span>
                                    </div>

                                    {/* Conversation Metrics */}
                                    {(metrics.turns_mean !== null || metrics.clarifiers_mean !== null) && (
                                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                        {metrics.turns_mean !== null && (
                                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                            <div className="text-[10px] text-white/50">Avg Turns</div>
                                            <div className="mt-1 text-[16px] font-bold tabular-nums text-white/90">
                                              {metrics.turns_mean.toFixed(1)}
                                            </div>
                                          </div>
                                        )}
                                        {metrics.clarifiers_mean !== null && (
                                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                            <div className="text-[10px] text-white/50">Avg Clarifiers</div>
                                            <div className="mt-1 text-[16px] font-bold tabular-nums text-white/90">
                                              {metrics.clarifiers_mean.toFixed(1)}
                                            </div>
                                          </div>
                                        )}
                                        {metrics.confirm_turns_mean !== null && (
                                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                            <div className="text-[10px] text-white/50">Avg Confirms</div>
                                            <div className="mt-1 text-[16px] font-bold tabular-nums text-white/90">
                                              {metrics.confirm_turns_mean.toFixed(1)}
                                            </div>
                                          </div>
                                        )}
                                        {metrics.actions_mean !== null && (
                                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                            <div className="text-[10px] text-white/50">Avg Actions</div>
                                            <div className="mt-1 text-[16px] font-bold tabular-nums text-white/90">
                                              {metrics.actions_mean.toFixed(1)}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}

                              {/* Historical KPI Trend */}
                              {kpiData.length > 1 && (
                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                  <div className="mb-3 text-[12px] font-bold">
                                    {kpiBucket === "hour" ? "Hourly" : "Daily"} Trend ({kpiData.length} buckets)
                                  </div>
                                  <div className="space-y-2">
                                    {/* AHT Trend Bar */}
                                    <div>
                                      <div className="mb-1 text-[10px] text-white/50">AHT Mean (seconds)</div>
                                      <div className="flex gap-0.5">
                                        {[...kpiData].reverse().slice(-24).map((row, i) => {
                                          const maxAht = Math.max(...kpiData.map(r => r.metrics.aht_mean), 1);
                                          const height = (row.metrics.aht_mean / maxAht) * 100;
                                          const isGood = row.metrics.aht_mean <= 60;
                                          return (
                                            <div
                                              key={row.id}
                                              className="flex-1 min-w-[4px] rounded-t-sm"
                                              style={{
                                                height: `${Math.max(height, 5)}%`,
                                                minHeight: "4px",
                                                maxHeight: "32px",
                                                background: isGood
                                                  ? "rgba(35,213,171,.6)"
                                                  : row.metrics.aht_mean <= 90
                                                  ? "rgba(251,191,36,.6)"
                                                  : "rgba(239,68,68,.6)",
                                              }}
                                              title={`${new Date(row.bucket_start).toLocaleString()}: ${row.metrics.aht_mean.toFixed(1)}s`}
                                            />
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Containment Trend Bar */}
                                    <div>
                                      <div className="mb-1 text-[10px] text-white/50">Containment Rate</div>
                                      <div className="flex gap-0.5">
                                        {[...kpiData].reverse().slice(-24).map((row) => {
                                          const height = row.metrics.containment_rate * 100;
                                          const isGood = row.metrics.containment_rate >= 0.85;
                                          return (
                                            <div
                                              key={row.id}
                                              className="flex-1 min-w-[4px] rounded-t-sm"
                                              style={{
                                                height: `${Math.max(height, 5)}%`,
                                                minHeight: "4px",
                                                maxHeight: "32px",
                                                background: isGood
                                                  ? "rgba(35,213,171,.6)"
                                                  : row.metrics.containment_rate >= 0.7
                                                  ? "rgba(251,191,36,.6)"
                                                  : "rgba(239,68,68,.6)",
                                              }}
                                              title={`${new Date(row.bucket_start).toLocaleString()}: ${(row.metrics.containment_rate * 100).toFixed(1)}%`}
                                            />
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Policy Version Comparison (if multiple versions exist) */}
                              {(() => {
                                const versions = [...new Set(kpiData.map(r => `${r.policy_id}@${r.policy_version}`))];
                                if (versions.length <= 1) return null;
                                return (
                                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                    <div className="mb-3 text-[12px] font-bold">Policy Version Comparison</div>
                                    <div className="space-y-2">
                                      {versions.slice(0, 3).map((ver) => {
                                        const [policyId, policyVersion] = ver.split("@");
                                        const versionRows = kpiData.filter(
                                          (r) => r.policy_id === policyId && r.policy_version === policyVersion
                                        );
                                        const avgAht = versionRows.reduce((sum, r) => sum + r.metrics.aht_mean, 0) / versionRows.length;
                                        const avgContainment = versionRows.reduce((sum, r) => sum + r.metrics.containment_rate, 0) / versionRows.length;
                                        return (
                                          <div
                                            key={ver}
                                            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className="font-mono text-[11px] text-white/70">{policyId}</span>
                                              <Badge>v{policyVersion}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-[11px]">
                                              <span className="text-white/60">
                                                AHT: <span className="font-bold text-white/90">{avgAht.toFixed(1)}s</span>
                                              </span>
                                              <span className="text-white/60">
                                                Cont: <span className="font-bold text-white/90">{(avgContainment * 100).toFixed(0)}%</span>
                                              </span>
                                              <span className="text-white/50">{versionRows.length} buckets</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ====== Policy Engine v2.1 Tab Content ====== */}
                {tab === "policy" && (
                  <>
                    {policyError && (
                      <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {policyError}
                      </div>
                    )}

                    {policyLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Environment Selector */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            {(["Dev", "Staging", "Prod"] as const).map((env) => (
                              <Chip key={env} active={policyEnv === env} onClick={() => handlePolicyEnvChange(env)} theme={theme}>
                                {env}
                              </Chip>
                            ))}
                          </div>
                        </div>

                        {/* Main Policy Config Grid */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
                          {/* Left: Config Panel */}
                          <div className={cx("rounded-3xl border p-6", theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-white")}>
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className={cx("text-lg font-semibold", theme === "dark" ? "text-white/90" : "text-gray-900")}>Policy Configuration & Balance</div>
                                  <div className={cx("mt-1 text-sm", theme === "dark" ? "text-white/50" : "text-gray-600")}>Tune the 5 dials and review impact before saving to {policyEnv}.</div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                  <PresetStrip value={policyPreset} onChange={applyPolicyPreset} theme={theme} />
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-4">
                                <OptimizeToggle balanced={policyBalanced} onChange={setPolicyBalanced} theme={theme} />
                                <div className="flex items-center gap-3">
                                  <span className={cx("text-xs", theme === "dark" ? "text-white/50" : "text-gray-500")}>Snap to band</span>
                                  <button
                                    onClick={() => setPolicySnapEnabled((s) => !s)}
                                    className={cx(
                                      "relative h-7 w-14 rounded-full border transition",
                                      theme === "dark"
                                        ? policySnapEnabled ? "bg-emerald-400/30 border-emerald-200/30" : "bg-white/10 border-white/10"
                                        : policySnapEnabled ? "bg-green-100 border-green-300" : "bg-gray-100 border-gray-200"
                                    )}
                                    style={theme === "bright" && policySnapEnabled ? {
                                      backgroundColor: "#1e3d1a1a",
                                      borderColor: "#1e3d1a33"
                                    } : {}}
                                    aria-label="Snap to band"
                                  >
                                    <span className={cx("absolute top-1 h-5 w-5 rounded-full transition", theme === "dark" ? "bg-white/80" : "bg-gray-700", policySnapEnabled ? "left-8" : "left-1")} />
                                  </button>
                                </div>
                              </div>

                              <PolicyRadar current={policyDials} recommended={policyRecommended} theme={theme} />

                              <div className="grid gap-3">
                                {DIAL_SPECS.map((s) => (
                                  <PolicySliderRow
                                    key={s.key}
                                    dialKey={s.key as DialKey}
                                    value={policyDials[s.key] ?? 50}
                                    onChange={(v) => setPolicyDial(s.key as DialKey, v)}
                                    snapEnabled={policySnapEnabled}
                                    theme={theme}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right: Impact Panel */}
                          <div className="space-y-4">
                            <div className={cx("rounded-3xl border p-6", theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-white")}>
                              <div className={cx("text-lg font-semibold", theme === "dark" ? "text-white/90" : "text-gray-900")}>Projected Impact & Constraints</div>
                              <div className={cx("mt-1 text-sm", theme === "dark" ? "text-white/50" : "text-gray-600")}>Mock impact now — wire to live KPI aggregates next.</div>

                              <div className="mt-4">
                                <ImpactCards aht={policyImpact.aht} containment={policyImpact.containment} rework={policyImpact.rework} success={policyImpact.success} theme={theme} />
                              </div>

                              <div className="mt-5">
                                <Guardrails theme={theme} />
                              </div>

                              <button onClick={() => setPolicyDrawerOpen(true)} className={cx("mt-4 w-full rounded-2xl border px-4 py-3 text-sm", theme === "dark" ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50")}>
                                Advanced Limits & Thresholds →
                              </button>
                            </div>
                          </div>
                        </div>

                        <SaveBar dirty={policyDirty || policySaving} onUndo={policyUndo} onReset={policyReset} onSave={policySave} theme={theme} />
                      </div>
                    )}

                    <AdvancedDrawer
                      open={policyDrawerOpen}
                      onClose={() => setPolicyDrawerOpen(false)}
                      limits={policyLimits}
                      onLimitsChange={(newLimits) => {
                        setPolicyLimits(newLimits);
                        setPolicyDirty(true);
                      }}
                    />
                  </>
                )}
                {/* ====== End Policy Engine v2.1 Tab Content ====== */}
              </motion.div>
            </AnimatePresence>
          </div>
        </Panel>

        {/* Detail panel */}
        <Panel theme={theme} className="hidden xl:flex xl:flex-col">
          <div className={cx(
            "border-b px-4 py-4",
            theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
          )}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className={cx(
                  "truncate text-[13px] font-bold",
                  theme === "dark" ? "" : "text-gray-900"
                )}>Details</div>
                <div className={cx(
                  "truncate text-[12px]",
                  theme === "dark" ? "text-white/60" : "text-gray-600"
                )}>Context for the selected item</div>
              </div>
              <Badge theme={theme}>Live</Badge>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            {!selected ? <EmptyState title="Nothing selected" body="Pick an item from the list to see details." theme={theme} /> : <DetailsCard tab={tab} selected={selected} theme={theme} />}
          </div>
        </Panel>
      </div>
    </Shell>
  );
}
