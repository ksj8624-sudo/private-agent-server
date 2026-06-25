const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("Telegram sendMessage failed:", result);
  }

  return result;
}

async function askOpenAI(question) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

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
        max_output_tokens: 1000,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("OpenAI request failed:", result);
      return "OpenAI 요청 중 오류가 발생했어. 잠시 후 다시 시도해줘.";
    }

    const outputText =
      result.output_text ||
      result.output
        ?.flatMap((item) => item.content || [])
        ?.find((content) => content.type === "output_text")?.text;

    return outputText || "OpenAI 응답을 읽지 못했어.";
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

async function askAndReply(chatId, prompt) {
  const answer = await askOpenAI(prompt);
  await sendTelegramMessage(chatId, answer);
}

async function getBranchDiff(baseBranch, headBranch) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  const url =
    `https://api.github.com/repos/${owner}/${repo}` +
    `/compare/${encodeURIComponent(baseBranch)}...${encodeURIComponent(headBranch)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "private-agent-server",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  const result = await response.json();

  console.log("GitHub compare status:", response.status);

  if (!response.ok) {
    console.error("GitHub compare failed:", result.message);
    throw new Error("GitHub diff 조회 실패");
  }

  const diff = result.files
    ?.filter((file) => file.patch)
    .slice(0, 10)
    .map((file) =>
      [
        `파일: ${file.filename}`,
        `상태: ${file.status}`,
        "```diff",
        file.patch,
        "```",
      ].join("\n"),
    )
    .join("\n\n")
    .slice(0, 12000);

  return diff || "";
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

  if (text.startsWith("/review")) {
    const target = text.replace("/review", "").trim();

    if (!target) {
      await sendTelegramMessage(
        chatId,
        [
          "리뷰할 코드 또는 브랜치를 입력해줘.",
          "예: /review const a = 1;",
          "예: /review feature/test main",
        ].join("\n"),
      );
      return;
    }

    const parts = target.split(/\s+/);

    // /review feature/test main
    if (parts.length === 2 && !target.includes("\n")) {
      const [headBranch, baseBranch] = parts;

      await sendTelegramMessage(
        chatId,
        `GitHub diff 리뷰 시작: ${baseBranch}...${headBranch}`,
      );

      try {
        const diff = await getBranchDiff(baseBranch, headBranch);

        if (!diff) {
          await sendTelegramMessage(chatId, "리뷰할 코드 변경사항이 없어.");
          return;
        }

        await askAndReply(
          chatId,
          [
            "아래 GitHub 브랜치 diff를 코드리뷰해줘.",
            "Critical, Warning, Suggestion으로 나누고 각 항목은 짧게 작성해줘.",
            "변경과 직접 관련 없는 일반론은 제외해줘.",
            "",
            diff,
          ].join("\n"),
        );
      } catch (error) {
        console.error("GitHub review error:", error);
        await sendTelegramMessage(
          chatId,
          "GitHub 브랜치 비교 중 오류가 발생했어. 브랜치명과 권한을 확인해줘.",
        );
      }

      return;
    }

    // 기존 텍스트 리뷰
    await askAndReply(
      chatId,
      [
        "아래 코드 또는 내용을 코드리뷰해줘.",
        "문제점, 개선점, 다음 액션을 짧게 정리해줘.",
        "",
        target,
      ].join("\n"),
    );
    return;
  }

  if (text === "/help") {
    await sendTelegramMessage(
      chatId,
      [
        "🤖 Private Agent 사용법",
        "",
        "/start - 봇 시작",
        "/help - 도움말",
        "/ping - 연결 확인",
        "/status - 에이전트 상태 확인",
        "/ask 질문 - AI에게 질문",
        "/plan 주제 - 개발 계획 3단계 생성",
        "/review 코드내용 - 코드리뷰 요청",
      ].join("\n"),
    );
    return;
  }

  if (text.startsWith("/plan")) {
    const topic = text.replace("/plan", "").trim() || "오늘 개발 작업";

    await askAndReply(
      chatId,
      `${topic}에 대해 실행 가능한 개발 계획을 3단계로 짧게 정리해줘.`,
    );
    return;
  }

  if (text === "/status") {
    await sendTelegramMessage(
      chatId,
      [
        "✅ Private Agent 상태",
        "- Telegram webhook: connected",
        "- Lambda: running",
        "- OpenAI: connected",
        "- Phase: 5 - Local Agent 준비",
      ].join("\n"),
    );
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

    await askAndReply(chatId, question);
    return;
  }

  await sendTelegramMessage(chatId, "알 수 없는 명령어야. /help 를 입력해줘.");
}

export const handler = async (event) => {
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

  try {
    await processTelegramUpdate(update);
  } catch (error) {
    console.error("processTelegramUpdate error:", error);
  }

  return {
    statusCode: 200,
    body: "ok",
  };
};
