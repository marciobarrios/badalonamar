import { NextResponse } from "next/server";
import { getNews } from "@/lib/sources/news";
import { NEWS_REVALIDATE_SECONDS, sourceResponseHeaders } from "@/lib/sources/cache";

export async function GET() {
  const result = await getNews();
  return NextResponse.json(result.data, {
    headers: sourceResponseHeaders(result.health, NEWS_REVALIDATE_SECONDS)
  });
}
