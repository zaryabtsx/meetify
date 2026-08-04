"use client";

import { create } from "zustand";

export type ToastKind = "success" | "warning" | "error" | "info";

export interface ToastItem {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    const duration = t.kind === "error" || t.kind === "warning" ? 6000 : 4000;
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, duration);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Imperative helpers — usable from anywhere, not just components. */
export const toast = {
  success: (message: string, title?: string) =>
    useToastStore.getState().push({ kind: "success", message, title }),
  warning: (message: string, title?: string) =>
    useToastStore.getState().push({ kind: "warning", message, title }),
  error: (message: string, title?: string) =>
    useToastStore.getState().push({ kind: "error", message, title }),
  info: (message: string, title?: string) =>
    useToastStore.getState().push({ kind: "info", message, title }),
};
