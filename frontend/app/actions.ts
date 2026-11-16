"use server";

import { cookies } from "next/headers";

export async function setUserLocale(locale: "bn" | "en") {
  const store = cookies();
  store.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });
}
