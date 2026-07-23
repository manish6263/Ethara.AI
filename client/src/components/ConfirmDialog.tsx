import { AlertTriangle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  tone?: "default" | "danger";
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | undefined>(undefined);

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolver.current?.(result);
    setOptions(null);
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {options && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm animate-fade-in" onClick={() => close(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm animate-pop-in rounded-lg border border-line bg-white p-5 shadow-soft"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-2 ${options.tone === "danger" ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal"}`}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-ink">{options.title}</h3>
                {options.message && <p className="mt-1 text-sm text-slate-500">{options.message}</p>}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => close(false)}
                className="rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => close(true)}
                className={`rounded-md px-3 py-2 text-sm font-semibold text-white ${
                  options.tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-ink hover:bg-slate-800"
                }`}
              >
                {options.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used inside ConfirmProvider");
  return context;
}
