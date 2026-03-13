"use strict";

const DEFAULTS = {
  theme: "system",
  accentColor: "#1a73e8",
  searchBoxStyle: "pill",
  contentSearch: false,
  maxResults: 100,
};

const ACCENT_PRESETS = [
  { name: "Chrome Blue", value: "#1a73e8" },
  { name: "Teal", value: "#009688" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Rose", value: "#e11d48" },
  { name: "Orange", value: "#ea580c" },
  { name: "Green", value: "#16a34a" },
  { name: "Slate", value: "#475569" },
  { name: "Indigo", value: "#4f46e5" },
];

const SEARCH_BOX_STYLES = [
  { name: "Pill", value: "pill", radius: "24px" },
  { name: "Rounded", value: "rounded", radius: "8px" },
  { name: "Square", value: "square", radius: "2px" },
];

async function loadSettings() {
  const result = await chrome.storage.sync.get(DEFAULTS);
  return result;
}

async function saveSettings(settings) {
  await chrome.storage.sync.set(settings);
}
