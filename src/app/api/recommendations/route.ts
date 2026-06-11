import { NextResponse } from "next/server";
import { recommendations } from "@/lib/recommendations";

export function GET() {
  return NextResponse.json(recommendations);
}
