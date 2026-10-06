import { NextResponse } from "next/server";
import { ApiError } from "@/services/api/http";
import { getMarkets } from "@/services/api/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getMarkets(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof ApiError ? error.message : "Market data is temporarily unavailable." }, { status: error instanceof ApiError && error.status === 503 ? 503 : 502 });
  }
}
