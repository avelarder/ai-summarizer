# AI Page Summarizer

AI Page Summarizer is a Manifest V3 browser extension that creates concise summaries of a webpage, text you select on that page, or text from your clipboard. It extracts the text in your browser and sends it to the OpenAI Chat Completions API. Summaries appear in the extension popup and can be copied to the clipboard.

## Features

- Summarize a page or only the text currently selected.
- Summarize text copied to the clipboard, including content from pages the extension cannot access directly.
- Choose between GPT-4o, GPT-4o mini, and GPT-3.5 Turbo in settings.
- Copy the generated summary to the clipboard.
- Extracts up to 15,000 characters per request. Full-page extraction omits script, style, navigation, footer, and header elements.
- Prompts the model to keep summaries under 300 words.

## Requirements

- Google Chrome or another Chromium-based browser that supports Manifest V3 extensions.
- An OpenAI API key with access to the selected model. OpenAI API usage may incur charges.
- An internet connection to reach `api.openai.com`.

This extension is a static browser extension; it does not require Node.js, a package manager, or a build step.

## Installation

### Load the source in Chrome

1. Download or clone this repository and keep the project files together.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Select **Load unpacked**.
5. Choose the repository folder containing `manifest.json`.
6. Pin **AI Page Summarizer** from the Extensions menu for convenient access.

For another Chromium-based browser, use its extensions page and follow its equivalent steps for loading an unpacked extension.

## Configure OpenAI

1. Open the extension popup and select the settings (gear) link, or open the extension's **Details** page from `chrome://extensions` and select **Extension options**.
2. Enter your OpenAI API key. Create one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys) if needed.
3. Choose a model:
   - **GPT-4o** - default and recommended.
   - **GPT-4o mini** - faster and lower cost.
   - **GPT-3.5 Turbo** - legacy option.
4. Select **Save Settings**.

The extension saves the key and model using `chrome.storage.sync`. The key is used to authenticate requests to OpenAI; page text submitted for summarization is also sent to OpenAI. Do not summarize sensitive content unless you are comfortable sending it to that service.

## Use the extension

### Summarize a full page

1. Navigate to the webpage you want to summarize.
2. Open the extension popup.
3. Select **Full Page**.
4. Select **Summarize**.
5. Read the summary in the popup. Select **Copy** to copy it to your clipboard.

The extension extracts readable page text after removing script, style, navigation, header, and footer elements. It truncates the extracted text to 15,000 characters before sending it for summarization.

### Summarize selected text

1. Select text on a webpage.
2. Open the extension popup.
3. Select **Selection**.
4. Select **Summarize**.
5. Read or copy the result.

Selected text is also limited to 15,000 characters. If no text is selected, the popup displays an error.

### Summarize clipboard text

1. Copy text from any source.
2. Open the extension popup and select **Clipboard**.
3. Select **Summarize**.
4. Read or copy the result.

Clipboard text is limited to 15,000 characters, matching page and selection text.

## Troubleshooting

- **No API key found:** Open settings, enter an OpenAI API key, and save it.
- **Cannot access this page:** Browser-internal pages such as `chrome://extensions` do not allow content scripts. Try a regular website.
- **No text could be extracted:** The page may not expose readable body text to the extension.
- **OpenAI API error:** Check your internet connection, API key, account billing, and whether your account can use the selected model. The API error message is displayed in the popup.
- **Selection is empty:** Select text on the page before choosing **Selection** and **Summarize**.

## Permissions and data flow

- The manifest declares `activeTab` and `scripting` permissions; the extension requests the optional `clipboardRead` permission when you use Clipboard mode. Page text is extracted by the content script registered in the manifest.
- `storage` saves the API key and selected model in Chrome Sync storage.
- The extension's host permission is limited to `https://api.openai.com/*` for the summarization request.
- The content script is registered for webpages (`<all_urls>`), but the browser restricts it on internal and other protected pages.
- Extracted page, selection, or clipboard text and the API key are sent to OpenAI when you request a summary. The extension does not define a separate application server.

## Project layout

| Path | Purpose |
| --- | --- |
| `manifest.json` | Extension metadata, permissions, popup, options, and service worker configuration |
| `popup/` | Popup interface and page/selection summarization flow |
| `content/content.js` | Extracts webpage text or the current selection |
| `background/service-worker.js` | Calls the OpenAI Chat Completions API |
| `options/` | API key and model settings |
| `icons/` | Extension icons |
