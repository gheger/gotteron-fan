"use client";

import { useState } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";

type FanLogFormProps = {
  localityId: string;
  localityName: string;
  onSuccess: (updatedFanCount: number, pseudo: string) => void;
};

type FormState = {
  pseudo: string;
  anecdote: string;
  remark: string;
  captchaToken: string;
};

type FieldName = keyof FormState;

type FieldErrors = Partial<Record<FieldName, string>>;

type ApiErrorResponse = {
  error?: string;
  details?: {
    fieldErrors?: Partial<Record<FieldName | "localityId", string[]>>;
  };
};

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return typeof value === "object" && value !== null && ("error" in value || "details" in value);
}

const initialState: FormState = {
  pseudo: "",
  anecdote: "",
  remark: "",
  captchaToken: "",
};

export function FanLogForm({ localityId, localityName, onSuccess }: FanLogFormProps) {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  function updateField(field: keyof FormState, value: string) {
    setFormState((currentState) => ({
      ...(currentState[field] === value
        ? currentState
        : {
            ...currentState,
            [field]: value,
          }),
    }));

    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        [field]: undefined,
      };
    });
  }

  function validateForm(): FieldErrors {
    const nextErrors: FieldErrors = {};

    if (!formState.pseudo.trim()) {
      nextErrors.pseudo = "Pseudo is required.";
    }

    if (formState.pseudo.trim().length > 80) {
      nextErrors.pseudo = "Pseudo must be 80 characters or fewer.";
    }

    if (formState.anecdote.trim().length > 2000) {
      nextErrors.anecdote = "Anecdote must be 2000 characters or fewer.";
    }

    if (formState.remark.trim().length > 2000) {
      nextErrors.remark = "Remark must be 2000 characters or fewer.";
    }

    if (!turnstileSiteKey) {
      nextErrors.captchaToken = "NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing.";
    } else if (!formState.captchaToken.trim()) {
      nextErrors.captchaToken = "Captcha token is required until the Turnstile widget is wired.";
    }

    return nextErrors;
  }

  function applyServerFieldErrors(details?: ApiErrorResponse["details"]): FieldErrors {
    const nextErrors: FieldErrors = {};
    const fieldErrorMap = details?.fieldErrors;

    if (!fieldErrorMap) {
      return nextErrors;
    }

    if (fieldErrorMap.pseudo?.[0]) {
      nextErrors.pseudo = fieldErrorMap.pseudo[0];
    }

    if (fieldErrorMap.anecdote?.[0]) {
      nextErrors.anecdote = fieldErrorMap.anecdote[0];
    }

    if (fieldErrorMap.remark?.[0]) {
      nextErrors.remark = fieldErrorMap.remark[0];
    }

    if (fieldErrorMap.captchaToken?.[0]) {
      nextErrors.captchaToken = fieldErrorMap.captchaToken[0];
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setStatusMessage("Fix the highlighted fields and submit again.");
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setStatusMessage(null);
    setSubmitStatus("idle");

    const payload = {
      localityId,
      pseudo: formState.pseudo.trim(),
      anecdote: formState.anecdote.trim(),
      remark: formState.remark.trim(),
      captchaToken: formState.captchaToken.trim(),
    };

    try {
      const response = await fetch("/api/fan-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | { fanCount?: number }
        | null;

      if (!response.ok) {
        const serverErrors = applyServerFieldErrors(
          isApiErrorResponse(responseData) ? responseData.details : undefined,
        );

        if (Object.keys(serverErrors).length > 0) {
          setFieldErrors(serverErrors);
        }

        setStatusMessage(
          (isApiErrorResponse(responseData) && responseData.error) ||
            "Unable to submit fan log.",
        );
        setSubmitStatus("error");
        return;
      }

      const fanCount =
        responseData && "fanCount" in responseData && typeof responseData.fanCount === "number"
          ? responseData.fanCount
          : null;

      if (fanCount === null) {
        setStatusMessage("Submission succeeded but the updated fan count was missing.");
        setSubmitStatus("error");
        return;
      }

      onSuccess(fanCount, payload.pseudo);
      setFormState(initialState);
      setStatusMessage(`Fan log submitted for ${localityName}. Updated total: ${fanCount}.`);
      setSubmitStatus("success");
    } catch {
      setStatusMessage("Network error while submitting the fan log. Try again.");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex h-full flex-col rounded-[1.75rem] border border-border bg-white/72 p-4 sm:p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">fan log</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">
          Add yourself to {localityName}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Client checks run first, but the API response remains the source of truth for
          validation and submission outcome.
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
            aria-invalid={Boolean(fieldErrors.pseudo)}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          {fieldErrors.pseudo ? (
            <span className="text-sm text-red-600">{fieldErrors.pseudo}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Anecdote</span>
          <textarea
            value={formState.anecdote}
            onChange={(event) => updateField("anecdote", event.target.value)}
            placeholder="First game, away trip, family tradition..."
            rows={4}
            aria-invalid={Boolean(fieldErrors.anecdote)}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          {fieldErrors.anecdote ? (
            <span className="text-sm text-red-600">{fieldErrors.anecdote}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Remark</span>
          <textarea
            value={formState.remark}
            onChange={(event) => updateField("remark", event.target.value)}
            placeholder="Any extra note for the future moderation flow."
            rows={3}
            aria-invalid={Boolean(fieldErrors.remark)}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          {fieldErrors.remark ? (
            <span className="text-sm text-red-600">{fieldErrors.remark}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Captcha</span>
          <TurnstileWidget
            siteKey={turnstileSiteKey}
            onTokenChange={(token) => updateField("captchaToken", token)}
            disabled={isSubmitting}
          />
          <input type="hidden" value={formState.captchaToken} readOnly />
          {fieldErrors.captchaToken ? (
            <span className="text-sm text-red-600">{fieldErrors.captchaToken}</span>
          ) : null}
        </label>

        <div className="mt-auto flex flex-col gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-[linear-gradient(135deg,#b91c1c,#172554)] px-4 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(23,37,84,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Submitting Fan Log..." : "Submit Fan Log"}
          </button>

          <p
            className={`min-h-12 rounded-2xl border px-4 py-3 text-sm leading-6 ${
              submitStatus === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : submitStatus === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-dashed border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            {statusMessage ??
              "Submission is now wired to the API route. Server-side validation and Turnstile verification still decide the final result."}
          </p>
        </div>
      </form>
    </section>
  );
}