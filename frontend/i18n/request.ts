import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = rawLocale === "en" ? "en" : "bn";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
