"use client";

import { signOut } from "next-auth/react";

export function AccountButton() {
  return (
    <button className="btn secondary" onClick={() => signOut({ callbackUrl: "/" })}>
      Sair
    </button>
  );
}
