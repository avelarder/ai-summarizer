/**
 * Popup script — orchestrates content extraction and summarization.
 */

// ── DOM refs ────────────────────────────────────────────────────────────────
const btnPage       = document.getElementById("btn-page");
const btnSelection  = document.getElementById("btn-selection");
const summarizeBtn  = document.getElementById("summarize-btn");
const btnLabel      = document.getElementById("btn-label");
const btnSpinner    = document.getElementById("btn-spinner");
const resultArea    = document.getElementById("result-area");
const errorBox      = document.getElementById("error-box");
const errorText     = document.getElementById("error-text");
const summaryBox    = document.getElementById("summary-box");
const summaryText   = document.getElementById("summary-text");
const copyBtn       = document.getElementById("copy-btn");
const settingsLink  = document.getElementById("settings-link");

// ── State ────────────────────────────────────────────────────────────────────
let selectedMode = "page"; // "page" | "selection"

// ── Mode toggle ──────────────────────────────────────────────────────────────
btnPage.addEventListener("click", () => setMode("page"));
btnSelection.addEventListener("click", () => setMode("selection"));

function setMode(mode) {
  selectedMode = mode;
  btnPage.classList.toggle("active", mode === "page");
  btnSelection.classList.toggle("active", mode === "selection");
}

// ── Settings link ────────────────────────────────────────────────────────────
settingsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// ── Summarize ────────────────────────────────────────────────────────────────
summarizeBtn.addEventListener("click", async () => {
  setLoading(true);
  hideResults();

  try {
    // 1. Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      showError("Could not identify the active tab.");
      return;
    }

    // 2. Request text from the content script
    let pageResponse;
    try {
      pageResponse = await chrome.tabs.sendMessage(tab.id, {
        action: "getPageText",
        mode: selectedMode,
      });
    } catch {
      // Content script may not be injected on restricted pages (e.g., chrome:// URLs)
      showError(
        "Cannot access this page. Try a regular website (not browser internal pages)."
      );
      return;
    }

    if (pageResponse?.error) {
      showError(pageResponse.error);
      return;
    }

    const text = pageResponse?.text;
    if (!text) {
      showError("No text could be extracted from this page.");
      return;
    }

    // 3. Send to background service worker for summarization
    const result = await chrome.runtime.sendMessage({
      action: "summarize",
      text,
      mode: selectedMode,
    });

    if (result?.error) {
      showError(result.error);
      return;
    }

    showSummary(result.summary);
  } catch (err) {
    showError(err.message ?? "An unexpected error occurred.");
  } finally {
    setLoading(false);
  }
});

// ── Copy to clipboard ─────────────────────────────────────────────────────────
copyBtn.addEventListener("click", async () => {
  const text = summaryText.textContent;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "✅ Copied!";
    setTimeout(() => (copyBtn.textContent = "📋 Copy"), 1500);
  } catch {
    copyBtn.textContent = "❌ Failed";
    setTimeout(() => (copyBtn.textContent = "📋 Copy"), 1500);
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function setLoading(loading) {
  summarizeBtn.disabled = loading;
  btnLabel.textContent = loading ? "Summarizing…" : "Summarize";
  btnSpinner.classList.toggle("hidden", !loading);
}

function hideResults() {
  resultArea.classList.add("hidden");
  errorBox.classList.add("hidden");
  summaryBox.classList.add("hidden");
  errorText.textContent = "";
  summaryText.textContent = "";
}

function showError(message) {
  resultArea.classList.remove("hidden");
  errorBox.classList.remove("hidden");
  errorText.textContent = message;
}

function showSummary(text) {
  resultArea.classList.remove("hidden");
  summaryBox.classList.remove("hidden");
  summaryText.textContent = text;
}
