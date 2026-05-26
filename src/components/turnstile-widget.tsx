"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  siteKey: string | undefined;
  onTokenChange: (token: string) => void;
  disabled?: boolean;
};

export function TurnstileWidget({
  siteKey,
  onTokenChange,
  disabled = false,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const elementId = useId();

  useEffect(() => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => {
        onTokenChange(token);
      },
      "expired-callback": () => {
        onTokenChange("");
      },
      "error-callback": () => {
        onTokenChange("");
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onTokenChange, siteKey]);

  useEffect(() => {
    if (!window.turnstile || !widgetIdRef.current) {
      return;
    }

    if (disabled) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenChange("");
    }
  }, [disabled, onTokenChange]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      {siteKey ? (
        <div id={elementId} ref={containerRef} className="min-h-16" />
      ) : (
        <p className="text-sm leading-6 text-slate-600">
          Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to enable captcha verification in the form.
        </p>
      )}
    </div>
  );
}