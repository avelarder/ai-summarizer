/**
 * Background service worker.
 * Receives { text, mode } from the popup and calls the OpenAI Chat Completions API.
 * Returns { summary } or { error } back to the popup.
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o";
const MAX_SUMMARY_TOKENS = 500;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== "summarize") return;

  handleSummarize(message.text, message.mode)
    .then((result) => sendResponse(result))
    .catch((err) => sendResponse({ error: err.message ?? "Unknown error" }));

  return true; // keep message channel open for async
});

async function handleSummarize(text, mode) {
  const { apiKey, model } = await chrome.storage.sync.get(["apiKey", "model"]);

  if (!apiKey) {
    return {
      error:
        "No OpenAI API key found. Please add your key in the extension settings.",
    };
  }

  const activeModel = model || DEFAULT_MODEL;

  const systemPrompt =
    "You are a helpful assistant that summarizes web content concisely. " +
    "Provide a clear, structured summary with the main points. " +
    "Use bullet points where appropriate. Keep the summary under 300 words.";

  const userPrompt =
    mode === "selection"
      ? `Please summarize the following selected text from a webpage:\n\n${text}`
      : `Please summarize the following webpage content:\n\n${text}`;

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: activeModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: MAX_SUMMARY_TOKENS,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const msg =
      errBody?.error?.message ?? `OpenAI API error (status ${response.status})`;
    return { error: msg };
  }

  const data = await response.json();
  const summary = data?.choices?.[0]?.message?.content?.trim();

  if (!summary) {
    return { error: "Received an empty response from OpenAI." };
  }

  return { summary };
}
