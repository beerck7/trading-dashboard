import { REQUEST_TIMEOUT_MS } from "@/constants/market";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchJson(
  url: string,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok)
      throw new ApiError(
        response.status === 429
          ? "Too many requests. Please try again shortly."
          : `Data request failed (HTTP ${response.status}).`,
        response.status,
      );
    return await response.json();
  } catch (error) {
    if (controller.signal.aborted)
      throw new ApiError("The data request timed out. Please try again.", 408);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Unable to retrieve data. Check your connection and retry.",
      502,
    );
  } finally {
    clearTimeout(timer);
  }
}
