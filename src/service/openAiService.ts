import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is missing");
}

const openai = new OpenAI({
  apiKey,
});

export async function askOpenAi(question: string): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: question,
  });

  return response.output_text;
}