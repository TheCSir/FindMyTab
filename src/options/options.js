"use strict";

let currentSettings = {};

document.addEventListener("DOMContentLoaded", async () => {
  currentSettings = await loadSettings();
  buildColorGrid();
  buildBgColorGrid();
  buildStyleGrid();
  buildSegmentedControls();
  buildSortSelect();
  applySettingsToUI();
  bindEvents();
  bindAppearanceEvents();
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

function buildBgColorGrid() {
  const grid = document.getElementById("bg-color-grid");
  for (const preset of BG_PRESETS) {
    const swatch = document.createElement("button");
    swatch.className = "color-swatch";
    swatch.style.background = preset.value;
    swatch.dataset.color = preset.value;
    swatch.title = preset.name;
    // Add a border for light swatches so they're visible
    if (["#ffffff", "#f8f9fa", "#f5f0eb"].includes(preset.value)) {
      swatch.style.border = "2px solid var(--border)";
    }
    swatch.addEventListener("click", () => selectBgColor(preset.value));
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
  const LAYOUT_OPTIONS = [
    { name: "Popup", value: "popup" },
    { name: "Floating", value: "floating" },
  ];
  buildSegmented("layout-control", LAYOUT_OPTIONS, currentSettings.layout, (val) => {
    currentSettings.layout = val;
    updateLayoutDependentRows();
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

  // Hover effect
  buildSegmented("hover-effect-control", HOVER_EFFECTS, currentSettings.hoverEffect, (val) => {
    currentSettings.hoverEffect = val;
    applyLivePreview();
    save();
  });

  // Selection effect
  buildSegmented("selection-effect-control", SELECTION_EFFECTS, currentSettings.selectionEffect, (val) => {
    currentSettings.selectionEffect = val;
    applyLivePreview();
    save();
  });

  updateLayoutDependentRows();
}

function updateLayoutDependentRows() {
  const isFloating = currentSettings.layout === "floating";
  document.getElementById("width-row").style.display = isFloating ? "none" : "";
  document.getElementById("opacity-row").style.display = isFloating ? "none" : "";
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

  // Background color
  updateBgColorSelection(currentSettings.bgColor);
  document.getElementById("bg-color").value = currentSettings.bgColor;
  document.getElementById("bg-color-hex").textContent = currentSettings.bgColor;

  // Background opacity
  document.getElementById("bg-opacity").value = currentSettings.bgOpacity;
  document.getElementById("bg-opacity-value").textContent = currentSettings.bgOpacity + "%";

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

function bindAppearanceEvents() {
  // Background custom color picker
  const bgColorPicker = document.getElementById("bg-color");
  bgColorPicker.addEventListener("input", (e) => {
    selectBgColor(e.target.value);
  });

  // Background opacity slider
  const bgOpacity = document.getElementById("bg-opacity");
  bgOpacity.addEventListener("input", (e) => {
    currentSettings.bgOpacity = parseInt(e.target.value, 10);
    document.getElementById("bg-opacity-value").textContent = e.target.value + "%";
    applyLivePreview();
    save();
  });

  // Accent default button
  document.getElementById("accent-default-btn").addEventListener("click", () => {
    selectColor(DEFAULTS.accentColor);
  });

  // Background default button
  document.getElementById("bg-default-btn").addEventListener("click", () => {
    selectBgColor(DEFAULTS.bgColor);
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

function selectBgColor(color) {
  currentSettings.bgColor = color;
  updateBgColorSelection(color);
  document.getElementById("bg-color").value = color;
  document.getElementById("bg-color-hex").textContent = color;
  applyLivePreview();
  save();
}

function updateColorSelection(color) {
  document.getElementById("color-grid").querySelectorAll(".color-swatch").forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.color === color);
  });
}

function updateBgColorSelection(color) {
  document.getElementById("bg-color-grid").querySelectorAll(".color-swatch").forEach((swatch) => {
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

  // Background color + opacity on preview
  const bgColor = currentSettings.bgColor;
  const bgOpacity = currentSettings.bgOpacity;
  const opacityHex = Math.round((bgOpacity / 100) * 255).toString(16).padStart(2, "0");
  previewPopup.style.background = bgColor + opacityHex;

  // Hover effect class on preview
  previewPopup.dataset.hoverEffect = currentSettings.hoverEffect;
  previewPopup.dataset.selectionEffect = currentSettings.selectionEffect;

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
