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

function parseDateLabel(label: string, year: number) {
  const match = label
    .toLocaleLowerCase("ca")
    .match(/(\d{1,2})\s+d[ei]\s+([a-zç.]+)/);
  if (!match) {
    return null;
  }
  const day = Number.parseInt(match[1] ?? "", 10);
  const month = MONTHS[match[2] ?? ""];
  if (!day || !month) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day, 10, 0, 0)).toISOString();
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

    const container = link.closest("li, article, div");
    const text = stripHtml(container.text());
    const dateLabel =
      text.match(/\d{1,2}\s+d[ei]\s+[a-zç.]+/i)?.[0] ??
      text.match(/\d{1,2}\s+de\s+[a-zç.]+/i)?.[0] ??
      "";
    const place =
      container
        .text()
        .split("\n")
        .map((line) => stripHtml(line))
        .find((line) => line.length > 3 && !line.includes(title) && !line.includes(dateLabel)) ??
      null;
    const description =
      container.find("p").first().text() &&
      stripHtml(container.find("p").first().text());

    items.push({
      id: href,
      title,
      url: absoluteUrl(href, AGENDA_URL),
      description: description || null,
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
