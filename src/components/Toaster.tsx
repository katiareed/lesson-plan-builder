import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg border px-4 py-3 shadow-lg bg-white ${
            t.variant === "destructive" ? "border-destructive bg-destructive/5" : ""
          }`}
        >
          <p className="text-sm font-semibold">{t.title}</p>
          {t.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
