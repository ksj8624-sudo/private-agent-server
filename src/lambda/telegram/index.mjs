const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}

async function askOpenAI(question) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: question,
        max_output_tokens: 500,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("OpenAI request failed:", result);
      return "OpenAI 요청 중 오류가 발생했어. 잠시 후 다시 시도해줘.";
    }

    return (
      result.output_text ||
      result.output?.[0]?.content?.[0]?.text ||
      "OpenAI 응답을 읽지 못했어."
    );
  } catch (error) {
    console.error("OpenAI timeout or error:", error);

    if (error.name === "AbortError") {
      return "응답 시간이 너무 오래 걸려서 중단했어. 질문을 짧게 다시 보내줘.";
    }

    return "답변 생성 중 오류가 발생했어.";
  } finally {
    clearTimeout(timeoutId);
  }
}

async function processTelegramUpdate(update) {
  const message = update.message;
  if (!message?.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (text === "/start") {
    await sendTelegramMessage(chatId, "안녕! AI Agent Bot이야.");
    return;
  }

  if (text === "/help") {
    await sendTelegramMessage(chatId, "사용법: /ask 질문내용");
    return;
  }

  if (text === "/ping") {
    await sendTelegramMessage(chatId, "pong");
    return;
  }

  if (text.startsWith("/ask")) {
    const question = text.replace("/ask", "").trim();

    if (!question) {
      await sendTelegramMessage(
        chatId,
        "질문을 같이 입력해줘. 예: /ask 오늘 할 일 정리해줘",
      );
      return;
    }

    await sendTelegramMessage(chatId, "답변 생성중...");

    const answer = await askOpenAI(question);
    await sendTelegramMessage(chatId, answer);
    return;
  }

  await sendTelegramMessage(chatId, "알 수 없는 명령어야. /help 를 입력해줘.");
}

export const handler = async (event) => {
  console.log("EVENT:", JSON.stringify(event));

  let update;

  try {
    update = JSON.parse(event.body || "{}");
  } catch (error) {
    console.error("Invalid JSON:", error);
    return {
      statusCode: 200,
      body: "ok",
    };
  }

  processTelegramUpdate(update).catch((error) => {
    console.error("processTelegramUpdate error:", error);
  });

  return {
    statusCode: 200,
    body: "ok",
  };
};
