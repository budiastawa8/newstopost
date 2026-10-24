"use client";

import { SerwistProvider as Provider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

export function AppSerwistProvider({ children }: { children: ReactNode }) {
  // Di development jangan register SW agar tidak mengganggu HMR
  if (process.env.NODE_ENV !== "production") {
    return children;
  }

  return (
    <Provider swUrl="/serwist/sw.js" disable={false}>
      {children}
    </Provider>
  );
}
