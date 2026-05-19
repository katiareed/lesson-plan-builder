import { useSyncExternalStore, useCallback } from "react";

interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastState extends ToastProps {
  id: number;
}

let toasts: ToastState[] = [];
let listeners: Array<() => void> = [];
let nextId = 0;

function notify() {
  listeners.forEach((fn) => fn());
}

export function toast(props: ToastProps) {
  const t: ToastState = { ...props, id: ++nextId };
  toasts = [...toasts, t];
  notify();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    notify();
  }, 4000);
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((fn) => fn !== cb);
  };
}

function getSnapshot() {
  return toasts;
}

export function useToast() {
  const current = useSyncExternalStore(subscribe, getSnapshot);
  return { toasts: current, toast };
}
