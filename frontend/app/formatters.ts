export function formatPrice(value: string | number, locale: string = "bn") {
  const num = Number(value) || 0;
  return locale === "en" ? `৳${num.toLocaleString("en-US")}` : `৳${num.toLocaleString("bn-BD")}`;
}

export function formatNumber(value: number | string, locale: string = "bn") {
  const str = String(value);
  return locale === "en" ? str : str.replace(/\d/g, digit => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}
