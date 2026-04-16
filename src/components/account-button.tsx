"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function AccountButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="btn secondary"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        signOut({ callbackUrl: "/" });
      }}
    >
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}
