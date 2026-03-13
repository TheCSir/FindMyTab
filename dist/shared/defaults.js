"use strict";

const DEFAULTS = {
  theme: "system",
  accentColor: "#1a73e8",
  searchBoxStyle: "pill",
  contentSearch: false,
  maxResults: 100,
  popupWidth: "default",
  showUrls: true,
  defaultSort: "recent",
  showCloseButton: false,
  fontSize: "default",
  layout: "popup",
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

const POPUP_WIDTHS = [
  { name: "Compact", value: "compact", width: "320px" },
  { name: "Default", value: "default", width: "400px" },
  { name: "Wide", value: "wide", width: "500px" },
];

const FONT_SIZES = [
  { name: "Small", value: "small", size: "12px" },
  { name: "Default", value: "default", size: "13px" },
  { name: "Large", value: "large", size: "14px" },
];

const SORT_OPTIONS = [
  { name: "Recent", value: "recent" },
  { name: "Alphabetical", value: "alpha" },
  { name: "Window", value: "window" },
];

async function loadSettings() {
  const result = await chrome.storage.sync.get(DEFAULTS);
  return result;
}

async function saveSettings(settings) {
  await chrome.storage.sync.set(settings);
}
