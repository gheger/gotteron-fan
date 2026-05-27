"use client";

import { useState } from "react";
import { FanLogForm } from "@/components/fan-log-form";
import { HeaderBrand } from "@/components/header-brand";
import { LocalityMap } from "@/components/locality-map";
import { LocalityPanel } from "@/components/locality-panel";
import { type Locality } from "@/lib/placeholder-localities";

type HomeMapShellProps = {
  initialLocalities: Locality[];
};

export function HomeMapShell({ initialLocalities }: HomeMapShellProps) {
  const [localities, setLocalities] = useState(initialLocalities);
  const [selectedLocalityId, setSelectedLocalityId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const selectedLocality =
    localities.find((locality) => locality.id === selectedLocalityId) ?? null;
  const canSubmitFanLog = Boolean(selectedLocality && /^\d+$/.test(selectedLocality.id));

  function handleSelectLocality(localityId: string) {
    setSelectedLocalityId(localityId);
    setIsPanelOpen(true);
  }

  function handleFanLogSubmitted(updatedFanCount: number, pseudo: string) {
    if (!selectedLocalityId) {
      return;
    }

    setLocalities((currentLocalities) =>
      currentLocalities.map((locality) =>
        locality.id === selectedLocalityId
          ? {
              ...locality,
              fanCount: updatedFanCount,
              latestPseudo: pseudo,
            }
          : locality,
      ),
    );
  }

  function handleClosePanel() {
    setIsPanelOpen(false);
    setSelectedLocalityId(null);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.65),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.22),transparent_40%)]" />

      <div className="relative flex min-h-screen flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6 lg:px-8 lg:pb-8">
        <HeaderBrand />

        <section className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
          <div className="relative min-h-[22rem] overflow-hidden rounded-[2rem] border border-border bg-panel shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur md:min-h-[32rem]">
            <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-3 border-b border-white/45 bg-[linear-gradient(180deg,rgba(17,24,39,0.78),rgba(17,24,39,0.18))] px-5 py-4 text-white">
              <div>
                <p className="font-display text-2xl uppercase tracking-[0.24em] sm:text-3xl">
                  fan map
                </p>
                <p className="text-sm text-white/80">
                  Official swisstopo locality perimeters around Fribourg with
                  placeholder supporter counts until the database-backed map is wired.
                </p>
              </div>
              <div className="ml-auto rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/80">
                MVP UI
              </div>
            </div>

            <LocalityMap
              localities={localities}
              selectedLocalityId={selectedLocality?.id ?? null}
              onSelectLocality={handleSelectLocality}
            />
          </div>

          <LocalityPanel
            className={isPanelOpen ? "flex" : "hidden lg:flex"}
            locality={selectedLocality}
            onClose={handleClosePanel}
          >
            {selectedLocality ? (
              canSubmitFanLog ? (
                <FanLogForm
                  key={selectedLocality.id}
                  localityId={selectedLocality.id}
                  localityName={selectedLocality.name}
                  onSuccess={handleFanLogSubmitted}
                />
              ) : (
                <div className="mt-6 rounded-[1.75rem] border border-border bg-white/72 p-5 text-sm leading-6 text-slate-700">
                  Fan log submission is disabled until the official locality import has
                  been loaded into PostGIS for this environment.
                </div>
              )
            ) : null}
          </LocalityPanel>
        </section>
      </div>
    </main>
  );
}