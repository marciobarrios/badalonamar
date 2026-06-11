import { NextResponse } from "next/server";
import { getNews } from "@/lib/sources/news";

export async function GET() {
  const result = await getNews();
  return NextResponse.json(result.data, {
    headers: {
      "x-source-health": result.health.status,
      "x-source-url": result.health.sourceUrl
    }
  });
}
