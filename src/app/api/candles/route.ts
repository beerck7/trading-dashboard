import { NextResponse } from "next/server";
import { isAssetSymbol, isTimeframe } from "@/constants/market";
import { ApiError } from "@/services/api/http";
import { getCandles } from "@/services/api/provider";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const symbol = query.get("symbol") ?? "BTCUSDT";
  const timeframe = query.get("timeframe") ?? "1d";
  if (!isAssetSymbol(symbol) || !isTimeframe(timeframe)) return NextResponse.json({ error: "Unsupported asset or timeframe." }, { status: 400 });
  try {
    return NextResponse.json(await getCandles(symbol, timeframe), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof ApiError ? error.message : "Chart data is temporarily unavailable." }, { status: error instanceof ApiError && error.status === 503 ? 503 : 502 });
  }
}
