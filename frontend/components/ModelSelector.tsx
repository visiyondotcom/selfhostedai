"use client";

import { useEffect, useRef, useState } from "react";
import { listModels } from "@/lib/api";
import { ChevronDown, Check, Zap } from "lucide-react";

export default function ModelSelector({
  value,
  onChange,
  compact = false,
  dropUp = false,
}: {
  value: string;
  onChange: (model: string) => void;
  compact?: boolean;
  dropUp?: boolean;
}) {
  const [models, setModels] = useState<
    { name: string; parameterSize?: string; family?: string; displayName?: string; description?: string | null }[]
  >([]);
  const [open, setOpen] = useState(false);
  // hydrated = true zodra de modellen geladen zijn → voorkomt "Select model" flash
  const [hydrated, setHydrated] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listModels()
      .then((m) => {
        setModels(m);
        if (!value && m.length) onChange(m[0].name);
      })
      .catch(() => setModels([]))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const selected = models.find((m) => m.name === value);

  // Label dat in de button staat. Zodra we een `value` hebben (ook al zijn
  // de modellen nog niet geladen) tonen we die meteen — anders knippert de
  // naam kort weg bij elke refresh terwijl listModels() nog bezig is.
  // Alleen als er echt nog geen `value` is, houden we een non-breaking
  // space aan om de button-hoogte stabiel te houden.
  const buttonLabel = selected?.displayName || value || (hydrated ? "Select model" : "\u00A0");

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`
          flex items-center gap-1.5 font-medium rounded-lg transition-colors
          ${compact ? "text-[12.5px] px-2.5 py-1.5 text-visiyon-text-2 hover:text-visiyon-text" : "text-sm px-3 py-1.5"}
          ${open
            ? "border border-visiyon-text/20 bg-visiyon-text/[0.05]"
            : "border border-visiyon-text/10 hover:border-visiyon-text/20"
          }
          max-w-[60vw] min-w-0
        `}
      >
        {selected?.family === "pipe" && <Zap size={13} className="text-visiyon-accent shrink-0" />}
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown
          size={compact ? 12 : 14}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`
            menu-popup
            absolute left-0 z-20
            w-max min-w-[var(--ms-min,10rem)] max-w-[min(92vw,22rem)]
            bg-visiyon-panel
            border border-visiyon-text/10
            rounded-xl shadow-lg overflow-hidden
            ${dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"}
          `}
          // min-breedte volgt automatisch de breedte van de trigger-knop
          style={{ "--ms-min": wrapRef.current ? `${wrapRef.current.offsetWidth}px` : "10rem" } as React.CSSProperties}
        >
          {models.length === 0 && hydrated && (
            <div className="px-3.5 py-3 text-[13px] text-visiyon-text-3">
              No models found — run <code>ollama pull glm4:9b</code> on the server.
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto py-1">
            {models.map((m, i) => {
              const isSelected = m.name === value;
              return (
                <button
                  key={m.name}
                  onClick={() => {
                    onChange(m.name);
                    setOpen(false);
                  }}
                  className={`
                    w-full text-left px-3 py-1.5
                    flex items-center justify-between gap-2 min-w-0
                    transition-colors
                    ${i > 0 ? "border-t border-visiyon-text/[0.06]" : ""}
                    ${isSelected ? "bg-visiyon-text/[0.06]" : "hover:bg-visiyon-text/[0.04]"}
                  `}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[13px] font-medium">
                      {m.family === "pipe" && <Zap size={11} className="text-visiyon-accent shrink-0" />}
                      <span className="truncate">{m.displayName || m.name}</span>
                    </span>

                  </span>
                  {isSelected && <Check size={12} className="text-visiyon-accent shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
