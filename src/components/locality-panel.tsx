import type { ReactNode } from "react";
import type { Locality } from "@/lib/placeholder-localities";

type LocalityPanelProps = {
  locality: Locality | null;
  children?: ReactNode;
  className?: string;
  onClose?: () => void;
};

export function LocalityPanel({
  locality,
  children,
  className,
  onClose,
}: LocalityPanelProps) {
  if (!locality) {
    return (
      <aside
        className={`${className ?? "flex"} min-h-[24rem] flex-col rounded-[2rem] border border-border bg-panel-strong p-5 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6`}
      >
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          locality details
        </p>
        <h2 className="mt-3 font-display text-4xl uppercase leading-none tracking-[0.14em] text-accent">
          pick a zone
        </h2>
        <p className="mt-4 rounded-2xl border border-border bg-white/72 px-4 py-4 text-sm leading-6 text-slate-700">
          Click a locality perimeter on the Fribourg map to open the side panel with
          its supporter total and fan log form.
        </p>
        <div className="mt-5 grid gap-3 text-sm text-slate-700">
          <div className="rounded-2xl border border-border bg-white/70 px-4 py-3">
            Aggregation stays at locality level only.
          </div>
          <div className="rounded-2xl border border-border bg-white/70 px-4 py-3">
            Official swisstopo locality geometry is used for the map.
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`${className ?? "flex"} min-h-[24rem] flex-col rounded-[2rem] border border-border bg-panel-strong p-5 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            selected locality
          </p>
          <h2 className="mt-2 font-display text-4xl uppercase leading-none tracking-[0.14em] text-accent">
            {locality.name}
          </h2>
          <p className="mt-2 text-sm text-slate-600">Canton {locality.canton}</p>
        </div>

        <div className="flex items-start gap-2">
          <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#172554,#1d4ed8)] px-4 py-3 text-right text-white shadow-[0_18px_36px_rgba(23,37,84,0.28)]">
            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-white/70">
              supporters
            </p>
            <p className="mt-1 text-3xl font-semibold leading-none">{locality.fanCount}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border bg-white/75 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>

      <p className="mt-5 rounded-2xl border border-red-100 bg-[linear-gradient(135deg,rgba(254,242,242,0.92),rgba(239,246,255,0.92))] px-4 py-4 text-sm leading-6 text-slate-700">
        {locality.blurb}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-border bg-white/70 px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">
            latest pseudo
          </dt>
          <dd className="mt-2 font-semibold text-slate-900">{locality.latestPseudo}</dd>
        </div>

        <div className="rounded-2xl border border-border bg-white/70 px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">
            status
          </dt>
          <dd className="mt-2 font-semibold text-slate-900">official perimeter</dd>
        </div>
      </dl>

      <div className="mt-6 flex-1">{children}</div>
    </aside>
  );
}