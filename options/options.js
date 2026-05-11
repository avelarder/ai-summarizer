/**
 * Options page script — loads and saves extension settings.
 */

const apiKeyInput = document.getElementById("api-key-input");
const showKeyCheckbox = document.getElementById("show-key");
const modelSelect = document.getElementById("model-select");
const saveBtn = document.getElementById("save-btn");
const toast = document.getElementById("toast");

// Load saved settings on open
chrome.storage.sync.get(["apiKey", "model"], ({ apiKey, model }) => {
  if (apiKey) apiKeyInput.value = apiKey;
  if (model) modelSelect.value = model;
});

// Toggle key visibility
showKeyCheckbox.addEventListener("change", () => {
  apiKeyInput.type = showKeyCheckbox.checked ? "text" : "password";
});

// Save settings
saveBtn.addEventListener("click", () => {
  const apiKey = apiKeyInput.value.trim();
  const model = modelSelect.value;

  chrome.storage.sync.set({ apiKey, model }, () => {
    toast.style.display = "block";
    setTimeout(() => (toast.style.display = "none"), 2500);
  });
});
