"use strict";

let currentSettings = {};

document.addEventListener("DOMContentLoaded", async () => {
  currentSettings = await loadSettings();
  buildColorGrid();
  buildStyleGrid();
  applySettingsToUI();
  bindEvents();
  applyLivePreview();
});

// --- Build dynamic UI ---

function buildColorGrid() {
  const grid = document.getElementById("color-grid");
  for (const preset of ACCENT_PRESETS) {
    const swatch = document.createElement("button");
    swatch.className = "color-swatch";
    swatch.style.background = preset.value;
    swatch.dataset.color = preset.value;
    swatch.title = preset.name;
    swatch.addEventListener("click", () => selectColor(preset.value));
    grid.appendChild(swatch);
  }
}

function buildStyleGrid() {
  const grid = document.getElementById("style-grid");
  for (const style of SEARCH_BOX_STYLES) {
    const btn = document.createElement("button");
    btn.className = "style-option";
    btn.dataset.style = style.value;

    const preview = document.createElement("div");
    preview.className = "style-preview";
    preview.style.borderRadius = style.radius;

    const label = document.createElement("span");
    label.className = "style-option-label";
    label.textContent = style.name;

    btn.appendChild(preview);
    btn.appendChild(label);
    btn.addEventListener("click", () => selectStyle(style.value));
    grid.appendChild(btn);
  }
}

// --- Apply stored settings to UI ---

function applySettingsToUI() {
  // Theme toggle
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === currentSettings.theme);
  });

  // Accent color
  updateColorSelection(currentSettings.accentColor);
  document.getElementById("custom-color").value = currentSettings.accentColor;
  document.getElementById("custom-color-hex").textContent = currentSettings.accentColor;

  // Search box style
  document.querySelectorAll(".style-option").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.style === currentSettings.searchBoxStyle);
  });

  // Content search
  document.getElementById("content-search-toggle").checked = currentSettings.contentSearch;

  // Max results
  document.getElementById("max-results").value = String(currentSettings.maxResults);

  // Theme class on body
  applyThemeClass(currentSettings.theme);
}

// --- Event bindings ---

function bindEvents() {
  // Theme toggle
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSettings.theme = btn.dataset.value;
      document.querySelectorAll(".theme-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyThemeClass(currentSettings.theme);
      save();
    });
  });

  // Custom color picker
  const customColor = document.getElementById("custom-color");
  customColor.addEventListener("input", (e) => {
    selectColor(e.target.value);
  });

  // Content search toggle
  document.getElementById("content-search-toggle").addEventListener("change", (e) => {
    currentSettings.contentSearch = e.target.checked;
    save();
  });

  // Max results
  document.getElementById("max-results").addEventListener("change", (e) => {
    currentSettings.maxResults = parseInt(e.target.value, 10);
    save();
  });

  // Shortcuts link
  document.getElementById("shortcuts-link").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });
}

// --- Selection handlers ---

function selectColor(color) {
  currentSettings.accentColor = color;
  updateColorSelection(color);
  document.getElementById("custom-color").value = color;
  document.getElementById("custom-color-hex").textContent = color;
  applyLivePreview();
  save();
}

function updateColorSelection(color) {
  document.querySelectorAll(".color-swatch").forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.color === color);
  });
}

function selectStyle(style) {
  currentSettings.searchBoxStyle = style;
  document.querySelectorAll(".style-option").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.style === style);
  });
  applyLivePreview();
  save();
}

// --- Live preview ---

function applyLivePreview() {
  const previewInput = document.getElementById("preview-input");
  const previewPopup = document.getElementById("preview-popup");
  const selectedItem = previewPopup.querySelector(".preview-item.selected");

  // Accent color
  const accent = currentSettings.accentColor;
  const accentSoft = accent + "14";
  previewInput.style.borderColor = accent;
  previewPopup.querySelectorAll(".preview-url").forEach((el) => {
    el.style.color = accent;
  });
  if (selectedItem) {
    selectedItem.style.background = accentSoft;
  }

  // Search box style
  const styleObj = SEARCH_BOX_STYLES.find((s) => s.value === currentSettings.searchBoxStyle);
  if (styleObj) {
    previewInput.style.borderRadius = styleObj.radius;
  }

  // Accent CSS variable for options page itself
  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--accent-soft", accent + "14");
  document.documentElement.style.setProperty("--accent-hover", accent + "1f");
}

function applyThemeClass(theme) {
  document.body.classList.remove("theme-light", "theme-dark");
  if (theme === "light") {
    document.body.classList.add("theme-light");
  } else if (theme === "dark") {
    document.body.classList.add("theme-dark");
  }
  applyLivePreview();
}

// --- Save with status flash ---

let saveTimeout = 0;

async function save() {
  await saveSettings(currentSettings);

  const status = document.getElementById("save-status");
  status.textContent = "Settings saved";
  status.classList.add("visible");
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    status.classList.remove("visible");
  }, 1500);
}
