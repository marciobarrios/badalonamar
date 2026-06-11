import type { NeighborhoodTag, SourceHealth, SourceResult } from "@/lib/types";

export function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const normalized = String(value).replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function nowIso() {
  return new Date().toISOString();
}

export function sourceOk<T>(
  data: T,
  sourceUrl: string,
  sourceUpdatedAt = nowIso(),
  status: SourceHealth["status"] = "fresh"
): SourceResult<T> {
  return {
    data,
    health: {
      status,
      sourceUrl,
      sourceUpdatedAt
    }
  };
}

export function sourceError<T>(
  data: T,
  sourceUrl: string,
  message: string
): SourceResult<T> {
  return {
    data,
    health: {
      status: "error",
      sourceUrl,
      message,
      sourceUpdatedAt: nowIso()
    }
  };
}

export function tagLocality(text: string): NeighborhoodTag[] {
  const haystack = text.toLocaleLowerCase("ca");
  const tags = new Set<NeighborhoodTag>();

  if (haystack.includes("canyadó") || haystack.includes("canyado")) {
    tags.add("Canyado");
  }
  if (haystack.includes("casagemes")) {
    tags.add("Casagemes");
  }
  if (
    haystack.includes("centre") ||
    haystack.includes("can casacuberta") ||
    haystack.includes("dalt la vila")
  ) {
    tags.add("Centre");
  }
  if (
    haystack.includes("platja") ||
    haystack.includes("mar") ||
    haystack.includes("passeig") ||
    haystack.includes("pont del petroli") ||
    haystack.includes("botifarreta")
  ) {
    tags.add("Mar");
  }

  tags.add("Badalona");
  return Array.from(tags);
}

export function isSummer(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return month > 6 && month < 9
    ? true
    : (month === 6 && day >= 1) || (month === 9 && day <= 30);
}
