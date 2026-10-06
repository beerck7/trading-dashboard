import { ApiError } from "./http";
import type { DataMode } from "@/types/market";

export function resolveDataMode(value: string | undefined): DataMode {
  const mode = value ?? "live";
  if (mode !== "demo" && mode !== "live") throw new ApiError("Unsupported data mode. Configure DATA_MODE as demo or live.", 503);
  return mode;
}
