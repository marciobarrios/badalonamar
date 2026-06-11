import { NextResponse } from "next/server";
import { getBeachStatuses } from "@/lib/sources/beaches";

export async function GET() {
  const result = await getBeachStatuses();
  return NextResponse.json(result.data, {
    headers: {
      "x-source-health": result.health.status,
      "x-source-url": result.health.sourceUrl
    }
  });
}
