"use strict";

let currentSettings = {};

document.addEventListener("DOMContentLoaded", async () => {
  currentSettings = await loadSettings();
  buildColorGrid();
  buildStyleGrid();
  buildSegmentedControls();
  buildSortSelect();
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

function buildSegmentedControls() {
  // Popup width
  // Layout mode
  const LAYOUT_OPTIONS = [
    { name: "Popup", value: "popup" },
    { name: "Floating", value: "floating" },
  ];
  buildSegmented("layout-control", LAYOUT_OPTIONS, currentSettings.layout, (val) => {
    currentSettings.layout = val;
    updateWidthRowVisibility();
    save();
  });

  // Popup width
  buildSegmented("width-control", POPUP_WIDTHS, currentSettings.popupWidth, (val) => {
    currentSettings.popupWidth = val;
    save();
  });

  // Font size
  buildSegmented("font-size-control", FONT_SIZES, currentSettings.fontSize, (val) => {
    currentSettings.fontSize = val;
    applyLivePreview();
    save();
  });

  updateWidthRowVisibility();
}

function updateWidthRowVisibility() {
  const widthRow = document.getElementById("width-row");
  widthRow.style.display = currentSettings.layout === "floating" ? "none" : "";
}

function buildSegmented(containerId, options, activeValue, onChange) {
  const container = document.getElementById(containerId);
  for (const opt of options) {
    const btn = document.createElement("button");
    btn.className = "seg-btn" + (opt.value === activeValue ? " active" : "");
    btn.textContent = opt.name;
    btn.dataset.value = opt.value;
    btn.addEventListener("click", () => {
      container.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      onChange(opt.value);
    });
    container.appendChild(btn);
  }
}

function buildSortSelect() {
  const select = document.getElementById("default-sort");
  for (const opt of SORT_OPTIONS) {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.name;
    select.appendChild(option);
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

  // Default sort
  document.getElementById("default-sort").value = currentSettings.defaultSort;

  // Show URLs
  document.getElementById("show-urls-toggle").checked = currentSettings.showUrls;

  // Close button
  document.getElementById("close-button-toggle").checked = currentSettings.showCloseButton;

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

  // Default sort
  document.getElementById("default-sort").addEventListener("change", (e) => {
    currentSettings.defaultSort = e.target.value;
    save();
  });

  // Show URLs toggle
  document.getElementById("show-urls-toggle").addEventListener("change", (e) => {
    currentSettings.showUrls = e.target.checked;
    applyLivePreview();
    save();
  });

  // Close button toggle
  document.getElementById("close-button-toggle").addEventListener("change", (e) => {
    currentSettings.showCloseButton = e.target.checked;
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
    el.style.display = currentSettings.showUrls ? "" : "none";
  });
  if (selectedItem) {
    selectedItem.style.background = accentSoft;
  }

  // Search icon color
  const searchIcon = previewPopup.querySelector(".preview-search-icon");
  if (searchIcon) {
    searchIcon.style.color = accent;
  }

  // Search box style
  const styleObj = SEARCH_BOX_STYLES.find((s) => s.value === currentSettings.searchBoxStyle);
  if (styleObj) {
    previewInput.style.borderRadius = styleObj.radius;
  }

  // Font size in preview
  const sizeObj = FONT_SIZES.find((f) => f.value === currentSettings.fontSize);
  if (sizeObj) {
    previewPopup.querySelectorAll(".preview-title").forEach((el) => {
      el.style.fontSize = sizeObj.size;
    });
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
