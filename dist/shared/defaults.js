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
  hoverEffect: "highlight",
  selectionEffect: "highlight",
  bgColor: "#292a2d",
  bgOpacity: 100,
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

const BG_PRESETS = [
  { name: "Dark", value: "#292a2d" },
  { name: "Charcoal", value: "#1e1e1e" },
  { name: "Navy", value: "#1a1b2e" },
  { name: "Midnight", value: "#0f172a" },
  { name: "Graphite", value: "#374151" },
  { name: "White", value: "#ffffff" },
  { name: "Light Gray", value: "#f8f9fa" },
  { name: "Warm Gray", value: "#f5f0eb" },
];

const HOVER_EFFECTS = [
  { name: "Highlight", value: "highlight" },
  { name: "Glow", value: "glow" },
  { name: "Slide", value: "slide" },
  { name: "None", value: "none" },
];

const SELECTION_EFFECTS = [
  { name: "Highlight", value: "highlight" },
  { name: "Border Left", value: "border-left" },
  { name: "Scale", value: "scale" },
  { name: "None", value: "none" },
];

const SORT_OPTIONS = [
  { name: "Recent", value: "recent" },
  { name: "Alphabetical", value: "alpha" },
  { name: "Window", value: "window" },
];

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULTS);
    return result;
  } catch {
    return { ...DEFAULTS };
  }
}

async function saveSettings(settings) {
  await chrome.storage.sync.set(settings);
}
