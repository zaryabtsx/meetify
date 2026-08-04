"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,

      setAuth: (token, user) => set({ token, user }),

      logout: () => set({ token: null, user: null }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "meetify-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

/** Read the current token outside of React (for the API client). */
export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}
