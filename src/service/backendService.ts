const BACKEND_API_URL = process.env.BACKEND_API_URL;

if (!BACKEND_API_URL) {
  console.log(process.env.BACKEND_API_URL);
  throw new Error("BACKEND_API_URL is missing");
}

export async function askBackend(question: string): Promise<string> {
  const response = await fetch(`${BACKEND_API_URL}/api/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(
      ` ${BACKEND_API_URL} Backend request failed with status ${response.status}`,
    );
  }

  const data = await response.json();
  return data.answer;
}
