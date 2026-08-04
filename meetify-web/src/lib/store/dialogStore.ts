"use client";

import { create } from "zustand";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface DialogState {
  open: boolean;
  options: ConfirmOptions | null;
  resolver: ((value: boolean) => void) | null;
}

interface DialogStore extends DialogState {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  resolve: (value: boolean) => void;
}

export const useDialogStore = create<DialogStore>((set, get) => ({
  open: false,
  options: null,
  resolver: null,

  confirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({ open: true, options, resolver: resolve });
    });
  },

  resolve: (value) => {
    const { resolver } = get();
    resolver?.(value);
    set({ open: false, options: null, resolver: null });
  },
}));

/** Imperative helper: await confirmDialog({...}) -> boolean */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return useDialogStore.getState().confirm(options);
}
