import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/sources/recommendations";

export async function GET() {
  return NextResponse.json(await getRecommendations());
}
