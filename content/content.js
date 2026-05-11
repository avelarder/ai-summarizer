/**
 * Content script — runs in the context of every page.
 * Responds to messages from the popup requesting page text or selection.
 */

const MAX_PAGE_CHARS = 15000;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== "getPageText") return;

  const mode = message.mode; // "page" | "selection"

  if (mode === "selection") {
    const selected = window.getSelection()?.toString().trim() ?? "";
    if (selected.length === 0) {
      sendResponse({ error: "No text is currently selected on this page." });
    } else {
      sendResponse({ text: selected.slice(0, MAX_PAGE_CHARS) });
    }
    return true;
  }

  // Full page mode — extract visible text
  const clone = document.body.cloneNode(true);

  // Remove script/style/noscript tags from clone
  clone.querySelectorAll("script, style, noscript, nav, footer, header").forEach((el) => el.remove());

  const rawText = (clone.innerText || clone.textContent || "")
    .replace(/\s{3,}/g, "\n\n") // collapse excessive whitespace
    .trim();

  if (rawText.length === 0) {
    sendResponse({ error: "Could not extract any readable text from this page." });
  } else {
    sendResponse({ text: rawText.slice(0, MAX_PAGE_CHARS) });
  }

  return true; // keep the message channel open for async response
});
