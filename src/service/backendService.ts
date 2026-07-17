import type { AiDevRequest } from "../commands/vo/aiDevRequest";
const BACKEND_API_URL = process.env.BACKEND_API_URL;
const BACKEND_TIMEOUT = 30_000;

if (!BACKEND_API_URL) {
  console.log(process.env.BACKEND_API_URL);
  throw new Error("BACKEND_API_URL is missing");
}

interface BackendResponse {
  answer: string;
}

async function postBackend<TBody>(
  path: string,
  body: TBody,
  timeoutMs = BACKEND_TIMEOUT,
): Promise<string> {
  const url = `${BACKEND_API_URL}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`[backendService] Request timed out: ${path}`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `[backendService] Request failed: ${response.status} ${response.statusText} - ${errorBody}`,
    );
  }

  const data = (await response.json()) as BackendResponse;

  if (typeof data.answer !== "string") {
    throw new Error(
      `[backendService] Invalid response from ${path}: answer is missing`,
    );
  }

  return data.answer;
}

export function askBackend(question: string): Promise<string> {
  return postBackend("/api/ask", { question });
}

export function generatePlanBackend(topic: string): Promise<string> {
  return postBackend("/api/plan", { topic });
}

export function reviewBackend(reviewCode: string): Promise<string> {
  return postBackend("/api/review", { reviewCode });
}

export function requestCursor(request: AiDevRequest): Promise<string> {
  return postBackend("/dev/cursor", request, 5 * 60_000);
}
