import * as cheerio from "cheerio";
import type { NewsItem } from "@/lib/types";
import { absoluteUrl, stripHtml, uniqBy } from "@/lib/utils";
import { BDNCOM_URL } from "@/lib/sources/constants";
import { sourceError, sourceOk, tagLocality } from "@/lib/sources/helpers";

type CheerioSelection = ReturnType<cheerio.CheerioAPI>;

function imageFromAnchor($: cheerio.CheerioAPI, anchor: CheerioSelection) {
  const img = anchor.find("img").first();
  return img.attr("src") || img.attr("data-src") || null;
}

function titleFromAnchor($: cheerio.CheerioAPI, anchor: CheerioSelection) {
  const title =
    anchor.find("h2,h3,h4,h5,h6").first().text() ||
    anchor.find("img").first().attr("alt") ||
    anchor.text();
  return stripHtml(title);
}

export function parseBdncomNews(html: string): NewsItem[] {
  const $ = cheerio.load(html);
  const items: NewsItem[] = [];

  $("a[href^='/ca/']").each((_, element) => {
    const anchor = $(element);
    const href = anchor.attr("href");
    if (!href || href.includes("/collections/") || href.includes("/search")) {
      return;
    }

    const title = titleFromAnchor($, anchor);
    if (title.length < 16) {
      return;
    }

    const time = anchor.find("time").first();
    const publishedAt = time.attr("datetime") ?? null;
    const locationText = anchor.text().match(/\b(Badalona|Montgat|Barcelona)\b/i)?.[0] ?? null;
    const url = absoluteUrl(href, BDNCOM_URL);

    items.push({
      id: href.replace(/^\/ca\//, ""),
      title,
      url,
      image: imageFromAnchor($, anchor),
      publishedAt,
      location: locationText,
      neighborhoodTags: tagLocality(`${title} ${locationText ?? ""}`)
    });
  });

  return uniqBy(items, (item) => item.id).slice(0, 8);
}

export async function getNews() {
  try {
    const response = await fetch(BDNCOM_URL, {
      next: { revalidate: 60 * 15 },
      headers: { accept: "text/html" }
    });
    if (!response.ok) {
      throw new Error(`BDNCom returned ${response.status}`);
    }
    const items = parseBdncomNews(await response.text());
    return sourceOk(
      { items, source: "bdncom" as const, sourceUrl: BDNCOM_URL },
      BDNCOM_URL,
      undefined,
      items.length ? "fresh" : "empty"
    );
  } catch (error) {
    return sourceError(
      { items: [] as NewsItem[], source: "bdncom" as const, sourceUrl: BDNCOM_URL },
      BDNCOM_URL,
      error instanceof Error ? error.message : "No s'han pogut carregar les noticies"
    );
  }
}
