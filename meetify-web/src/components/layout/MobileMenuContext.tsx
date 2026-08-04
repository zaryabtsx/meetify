"use client";

import { createContext, useContext } from "react";

export const MobileMenuContext = createContext<{ openMenu: () => void }>({
  openMenu: () => {},
});

export function useMobileMenu() {
  return useContext(MobileMenuContext);
}
