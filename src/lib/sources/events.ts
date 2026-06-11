import * as cheerio from "cheerio";
import type { EventItem } from "@/lib/types";
import { absoluteUrl, stripHtml, uniqBy } from "@/lib/utils";
import { AGENDA_URL } from "@/lib/sources/constants";
import { nowIso, sourceError, sourceOk, tagLocality } from "@/lib/sources/helpers";

const MONTHS: Record<string, number> = {
  gen: 1,
  gener: 1,
  febr: 2,
  febrer: 2,
  marc: 3,
  març: 3,
  abril: 4,
  maig: 5,
  juny: 6,
  jul: 7,
  "jul.": 7,
  juliol: 7,
  agost: 8,
  set: 9,
  "set.": 9,
  setembre: 9,
  oct: 10,
  "oct.": 10,
  octubre: 10,
  nov: 11,
  "nov.": 11,
  novembre: 11,
  des: 12,
  "des.": 12,
  desembre: 12
};

const GENERIC_LABELS = new Set(["agenda", "actualitat"]);

const EVENT_TYPE_RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: "Cultura", pattern: /\b(festival|cultura|cultural|teatre|dansa|artistic|artística)\b/i },
  { label: "Concert", pattern: /\b(concert|musica|música|coral|cantada)\b/i },
  { label: "Exposició", pattern: /\b(exposicio|exposició|mostra|visita guiada)\b/i },
  { label: "Xerrada", pattern: /\b(xerrada|conferencia|conferència|col-loqui|col·loqui|debat)\b/i },
  { label: "Taller", pattern: /\b(taller|curs|formacio|formació)\b/i },
  { label: "Lectura", pattern: /\b(llibre|lectura|biblioteca|conte|contes|literari|literaria|literària)\b/i },
  { label: "Oci", pattern: /\b(oci|nocturn|vacances alternatives|raves|gaudir)\b/i },
  { label: "Festa", pattern: /\b(festa|festes|revetlla|celebracio|celebració)\b/i },
  { label: "Família", pattern: /\b(infantil|infants|familia|família|petits|nascuts)\b/i },
  { label: "Medi ambient", pattern: /\b(residus|mar|platja|medi ambient|climatic|climàtic|sostenibilitat)\b/i },
  { label: "Salut", pattern: /\b(salut|primers auxilis|desfibril-lador|desfibril·lador|emocional)\b/i },
  { label: "Esport", pattern: /\b(esport|cursa|torneig|ioga|ball)\b/i }
];

function parseDateLabel(label: string, year: number) {
  const normalizedLabel = label.toLocaleLowerCase("ca");
  const textDate = normalizedLabel.match(/(\d{1,2})\s+d[ei]\s+([a-zç.]+)/);
  const numericDate = normalizedLabel.match(/\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b/);

  if (!textDate && !numericDate) {
    return null;
  }

  const day = Number.parseInt(textDate?.[1] ?? numericDate?.[1] ?? "", 10);
  const month = textDate
    ? MONTHS[textDate[2] ?? ""]
    : Number.parseInt(numericDate?.[2] ?? "", 10);
  const parsedYear = numericDate?.[3]
    ? Number.parseInt(numericDate[3].length === 2 ? `20${numericDate[3]}` : numericDate[3], 10)
    : year;

  if (!day || !month) {
    return null;
  }
  return new Date(Date.UTC(parsedYear, month - 1, day, 10, 0, 0)).toISOString();
}

function cleanDateLabel(label: string) {
  const normalized = stripHtml(label);
  if (!normalized || GENERIC_LABELS.has(normalized.toLocaleLowerCase("ca"))) {
    return "";
  }
  return normalized;
}

function inferEventType(title: string, description: string | null, place: string | null) {
  const text = `${title} ${description ?? ""} ${place ?? ""}`;
  return EVENT_TYPE_RULES.find((rule) => rule.pattern.test(text))?.label ?? "Activitat";
}

function looksLikePlace(line: string) {
  return /\b(biblioteca|centre civic|centre cívic|casal|museu|teatre|auditori|parc|plaça|placa|platja|escola|institut|mercat|carrer|avinguda|rambla|sala|pavello|pavelló)\b/i.test(
    line
  );
}

function getTextLines(container: { text(): string }) {
  return container
    .text()
    .split("\n")
    .map((line) => stripHtml(line))
    .filter(Boolean);
}

export function parseAgendaPage(html: string, year = new Date().getFullYear()) {
  const $ = cheerio.load(html);
  const items: EventItem[] = [];

  $("h3 a[href]").each((_, element) => {
    const link = $(element);
    const title = stripHtml(link.text());
    const href = link.attr("href");
    if (!href || title.length < 6) {
      return;
    }

    const semanticContainer = link.closest("li, article");
    const container = semanticContainer.length ? semanticContainer : link.closest("div");
    const text = stripHtml(container.text());
    const dateLabel = cleanDateLabel(
      text.match(/\d{1,2}\s+d[ei]\s+[a-zç.]+/i)?.[0] ??
      text.match(/\d{1,2}\s+de\s+[a-zç.]+/i)?.[0] ??
      text.match(/\b\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?\b/)?.[0] ??
      ""
    );
    const description =
      container.find("p").first().text() &&
      stripHtml(container.find("p").first().text());
    const place =
      getTextLines(container).find((line) => {
        const normalizedLine = line.toLocaleLowerCase("ca");
        return (
          line.length > 3 &&
          !line.includes(title) &&
          !line.includes(dateLabel) &&
          !GENERIC_LABELS.has(normalizedLine) &&
          looksLikePlace(line)
        );
      }) ?? null;
    const normalizedDescription = description && description !== place ? description : null;

    items.push({
      id: href,
      title,
      url: absoluteUrl(href, AGENDA_URL),
      description: normalizedDescription,
      typeLabel: inferEventType(title, normalizedDescription, place),
      dateLabel,
      startsAt: parseDateLabel(dateLabel, year),
      place,
      neighborhoodTags: tagLocality(`${title} ${place ?? ""} ${description ?? ""}`)
    });
  });

  return uniqBy(items, (item) => item.id);
}

function isInMonth(item: EventItem, month: string) {
  if (!item.startsAt) {
    return true;
  }
  return item.startsAt.slice(0, 7) === month;
}

export async function getEvents(month = new Date().toISOString().slice(0, 7)) {
  try {
    const urls = [AGENDA_URL, `${AGENDA_URL}?b_start:int=30`];
    const pages = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url, {
          next: { revalidate: 60 * 60 },
          headers: { accept: "text/html" }
        });
        if (!response.ok) {
          throw new Error(`Agenda returned ${response.status}`);
        }
        return response.text();
      })
    );

    const year = Number.parseInt(month.slice(0, 4), 10);
    const items = uniqBy(
      pages.flatMap((page) => parseAgendaPage(page, year)),
      (item) => item.id
    )
      .filter((item) => isInMonth(item, month))
      .slice(0, 12);

    return sourceOk(
      { items, sourceUrl: AGENDA_URL },
      AGENDA_URL,
      nowIso(),
      items.length ? "fresh" : "empty"
    );
  } catch (error) {
    return sourceError(
      { items: [] as EventItem[], sourceUrl: AGENDA_URL },
      AGENDA_URL,
      error instanceof Error ? error.message : "No s'ha pogut carregar l'agenda"
    );
  }
}
