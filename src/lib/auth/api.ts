import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function requireApiUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Login obrigatorio." }, { status: 401 })
    };
  }

  return { user, response: null };
}

export async function requireApiAdmin() {
  const { user, response } = await requireApiUser();

  if (response) {
    return { user: null, response };
  }

  if (user.role !== "ADMIN") {
    return {
      user: null,
      response: NextResponse.json({ error: "Acesso admin obrigatorio." }, { status: 403 })
    };
  }

  return { user, response: null };
}
