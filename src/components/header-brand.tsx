export function HeaderBrand() {
  return (
    <header className="rounded-[2rem] border border-border bg-panel px-5 py-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6 sm:py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-4xl uppercase leading-none tracking-[0.18em] text-accent sm:text-5xl">
            gotteron.fan
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
            A public supporter map for Fribourg-Gotteron. The MVP keeps the map as
            the main interface and shows only aggregated, locality-level fan counts.
          </p>
        </div>

        <div className="flex gap-3 text-xs uppercase tracking-[0.22em] text-slate-600">
          <span className="rounded-full border border-border bg-white/60 px-3 py-2">
            locality totals only
          </span>
          <span className="rounded-full border border-border bg-white/60 px-3 py-2">
            no individual markers
          </span>
        </div>
      </div>
    </header>
  );
}