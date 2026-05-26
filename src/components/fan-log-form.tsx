"use client";

import { useState } from "react";

type FanLogFormProps = {
  localityName: string;
};

type FormState = {
  pseudo: string;
  anecdote: string;
  remark: string;
};

const initialState: FormState = {
  pseudo: "",
  anecdote: "",
  remark: "",
};

export function FanLogForm({ localityName }: FanLogFormProps) {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function updateField(field: keyof FormState, value: string) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPseudo = formState.pseudo.trim();

    if (!trimmedPseudo) {
      setStatusMessage("Enter a pseudo before testing the placeholder submit flow.");
      return;
    }

    setStatusMessage(
      `Placeholder only: ${trimmedPseudo} would be recorded for ${localityName} once the API is wired.`,
    );
    setFormState(initialState);
  }

  return (
    <section className="flex h-full flex-col rounded-[1.75rem] border border-border bg-white/72 p-4 sm:p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">fan log</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">
          Add yourself to {localityName}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This form is UI-only for now. Submission is mocked and nothing is stored yet.
        </p>
      </div>

      <form className="mt-5 flex flex-1 flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Pseudo</span>
          <input
            value={formState.pseudo}
            onChange={(event) => updateField("pseudo", event.target.value)}
            placeholder="DragonRouge90"
            required
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Anecdote</span>
          <textarea
            value={formState.anecdote}
            onChange={(event) => updateField("anecdote", event.target.value)}
            placeholder="First game, away trip, family tradition..."
            rows={4}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Remark</span>
          <textarea
            value={formState.remark}
            onChange={(event) => updateField("remark", event.target.value)}
            placeholder="Any extra note for the future moderation flow."
            rows={3}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
          />
        </label>

        <div className="mt-auto flex flex-col gap-3 pt-2">
          <button
            type="submit"
            className="rounded-2xl bg-[linear-gradient(135deg,#b91c1c,#172554)] px-4 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(23,37,84,0.24)] transition hover:brightness-105"
          >
            Submit Placeholder Fan Log
          </button>

          <p className="min-h-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {statusMessage ??
              "Cloudflare Turnstile, server validation, and database writes will plug in here next."}
          </p>
        </div>
      </form>
    </section>
  );
}