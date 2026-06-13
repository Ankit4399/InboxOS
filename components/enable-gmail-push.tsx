"use client";

import { useCallback, useEffect, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function EnableGmailPush({ autoRegister = true }: { autoRegister?: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [expiration, setExpiration] = useState("");

  const registerWatch = useCallback(async () => {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/gmail/watch", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setExpiration(data.expiration ?? "");
        sessionStorage.setItem("inboxos-gmail-watch", new Date().toDateString());
      } else {
        setStatus("error");
        setMessage(data.error ?? "Failed to enable live sync");
      }
    } catch {
      setStatus("error");
      setMessage("Network error — could not reach the server");
    }
  }, []);

  useEffect(() => {
    if (!autoRegister) return;
    registerWatch();
  }, [autoRegister, registerWatch]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="rounded-xl border border-terracotta/20 bg-terracotta/5 p-4">
        <p className="text-sm font-medium text-espresso">Enabling live email sync…</p>
        <p className="mt-1 text-xs text-espresso/55">
          Registering Gmail push notifications with your Pub/Sub topic.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-sage/30 bg-sage/5 p-4">
        <p className="text-sm font-semibold text-sage">Live email sync is active</p>
        <p className="mt-1 text-xs text-espresso/60">
          Gmail will push new mail to InboxOS via Pub/Sub.
          {expiration && (
            <> Watch renews before {new Date(expiration).toLocaleDateString()}.</>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rust/30 bg-terracotta/5 p-4">
      <p className="text-sm font-semibold text-rust">Could not enable live sync</p>
      <p className="mt-1 text-xs text-espresso/60">{message}</p>
      <button
        type="button"
        onClick={registerWatch}
        className="mt-3 cursor-pointer rounded-lg bg-terracotta px-4 py-2 text-xs font-semibold text-paper hover:bg-rust transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
