"use strict";

const ITEM_HEIGHT = 48;
const VIEWPORT_HEIGHT = 400;
const OVERSCAN = 5;
const DEBOUNCE_MS = 16;
const CONTENT_SNIPPET_LEN = 120;
const CONTENT_EXTRACT_BATCH = 8;

const searchInput = document.getElementById("search-input");
const resultsList = document.getElementById("results-list");
const emptyState = document.getElementById("empty-state");
const scrollViewport = document.getElementById("scroll-viewport");
const scrollSpacer = document.getElementById("scroll-spacer");
const resultCount = document.getElementById("result-count");

let tabCache = [];
let filteredTabs = [];
let selectedIndex = 0;
let windowCount = 0;
let debounceTimer = 0;
let settings = {};
let contentLoaded = false;

const isFloating = new URLSearchParams(window.location.search).has("float");
const isIframe = isFloating && window.parent !== window;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  // If floating layout is set and we're NOT already inside the overlay iframe,
  // tell the background to inject the overlay and close this popup
  if (!isFloating) {
    const s = await loadSettings();
    if (s.layout === "floating") {
      chrome.runtime.sendMessage({ type: "open-float" });
      window.close();
      return;
    }
  }

  if (isFloating) document.body.classList.add("float-mode");
  searchInput.focus();
  settings = await loadSettings();
  applyTheme();
  applySearchBoxStyle();
  applyAccentColor();
  if (!isFloating) applyPopupWidth();
  applyFontSize();

  if (settings.contentSearch) {
    searchInput.placeholder = "Search tabs by title, URL, or content...";
  }

  const rawTabs = await chrome.tabs.query({});
  const windowIds = new Set();

  tabCache = rawTabs.map((tab) => {
    windowIds.add(tab.windowId);
    return {
      id: tab.id,
      windowId: tab.windowId,
      title: tab.title || "Untitled",
      url: tab.url || "",
      favIconUrl: tab.favIconUrl || "",
      titleLower: (tab.title || "").toLowerCase(),
      urlLower: (tab.url || "").toLowerCase(),
      urlDisplay: stripUrl(tab.url || ""),
      content: "",
      contentLower: "",
    };
  });

  windowCount = windowIds.size;
  applySortOrder(tabCache);
  filteredTabs = tabCache;
  updateResultCount();
  renderVirtual();

  searchInput.addEventListener("input", onSearchInput);
  document.addEventListener("keydown", onKeyDown);
  scrollViewport.addEventListener("scroll", onScroll);
  resultsList.addEventListener("click", onListClick);
  resultsList.addEventListener("mouseover", onListMouseOver);

  if (settings.contentSearch) {
    extractContentProgressively();
  }
}

// --- Theme & Style ---

function applyTheme() {
  document.body.classList.remove("theme-light", "theme-dark");
  if (settings.theme === "light") {
    document.body.classList.add("theme-light");
  } else if (settings.theme === "dark") {
    document.body.classList.add("theme-dark");
  }
}

function applySearchBoxStyle() {
  const styleObj = SEARCH_BOX_STYLES.find((s) => s.value === settings.searchBoxStyle);
  if (styleObj) {
    document.documentElement.style.setProperty("--search-radius", styleObj.radius);
  }
}

function applyAccentColor() {
  const accent = settings.accentColor;
  if (accent && accent !== DEFAULTS.accentColor) {
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--text-url", accent);
    document.documentElement.style.setProperty("--input-border-focus", accent);
    document.documentElement.style.setProperty("--bg-selected", accent + "22");
  }
}

function applyPopupWidth() {
  const widthObj = POPUP_WIDTHS.find((w) => w.value === settings.popupWidth);
  if (widthObj) {
    document.documentElement.style.setProperty("--popup-width", widthObj.width);
  }
}

function applyFontSize() {
  const sizeObj = FONT_SIZES.find((f) => f.value === settings.fontSize);
  if (sizeObj) {
    document.documentElement.style.setProperty("--font-size", sizeObj.size);
  }
}

function applySortOrder(tabs) {
  if (settings.defaultSort === "alpha") {
    tabs.sort((a, b) => a.title.localeCompare(b.title));
  } else if (settings.defaultSort === "window") {
    tabs.sort((a, b) => a.windowId - b.windowId || a.id - b.id);
  }
  // "recent" keeps Chrome's default order
}

const SETTINGS_ENTRY = {
  id: "__settings__",
  windowId: 0,
  title: "Where Is My Tab \u2014 Settings",
  url: "",
  favIconUrl: "",
  titleLower: "where is my tab \u2014 settings preferences options configure",
  urlLower: "",
  urlDisplay: "Extension settings",
  content: "",
  contentLower: "",
  isSettings: true,
};

// --- Content extraction ---

async function extractContentProgressively() {
  const injectable = tabCache.filter((t) => canInject(t.url));
  const batches = [];
  for (let i = 0; i < injectable.length; i += CONTENT_EXTRACT_BATCH) {
    batches.push(injectable.slice(i, i + CONTENT_EXTRACT_BATCH));
  }

  for (const batch of batches) {
    const promises = batch.map((tab) => extractTabContent(tab));
    await Promise.allSettled(promises);
  }

  contentLoaded = true;
  if (searchInput.value.trim()) {
    executeSearch();
  }
}

function canInject(url) {
  if (!url) return false;
  if (url.startsWith("chrome://")) return false;
  if (url.startsWith("chrome-extension://")) return false;
  if (url.startsWith("edge://")) return false;
  if (url.startsWith("about:")) return false;
  if (url.startsWith("chrome-search://")) return false;
  if (url.includes("chromewebstore.google.com")) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://");
}

async function extractTabContent(tab) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const text = document.body ? document.body.innerText : "";
        return text.substring(0, 5000);
      },
    });

    if (results && results[0] && results[0].result) {
      tab.content = results[0].result;
      tab.contentLower = tab.content.toLowerCase();
    }
  } catch {
    // Tab can't be injected (discarded, crashed, restricted)
  }
}

// --- Event delegation ---

function onListClick(e) {
  // Close button click
  const closeBtn = e.target.closest(".tab-close");
  if (closeBtn) {
    e.stopPropagation();
    const item = closeBtn.closest(".tab-item");
    if (!item) return;
    const idx = parseInt(item.dataset.index, 10);
    if (filteredTabs[idx]) closeTab(filteredTabs[idx]);
    return;
  }

  const item = e.target.closest(".tab-item");
  if (!item) return;
  const idx = parseInt(item.dataset.index, 10);
  if (filteredTabs[idx]) switchToTab(filteredTabs[idx]);
}

function onListMouseOver(e) {
  const item = e.target.closest(".tab-item");
  if (!item) return;
  const idx = parseInt(item.dataset.index, 10);
  if (idx !== selectedIndex) {
    selectedIndex = idx;
    updateSelection();
  }
}

// --- Debounced search ---

function onSearchInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(executeSearch, DEBOUNCE_MS);
}

function executeSearch() {
  const query = searchInput.value.trim().toLowerCase();
  const maxResults = settings.maxResults || 100;

  if (!query) {
    filteredTabs = tabCache;
  } else {
    const terms = query.split(/\s+/);
    const scored = [];

    for (let i = 0; i < tabCache.length; i++) {
      const tab = tabCache[i];
      const score = scoreTab(tab, terms);
      if (score > 0) scored.push({ tab, score });
    }

    // Check if settings entry matches
    const settingsScore = scoreTab(SETTINGS_ENTRY, terms);
    if (settingsScore > 0) scored.push({ tab: SETTINGS_ENTRY, score: settingsScore });

    scored.sort((a, b) => b.score - a.score);
    if (scored.length > maxResults) scored.length = maxResults;
    filteredTabs = scored.map((s) => s.tab);
  }

  selectedIndex = 0;
  scrollViewport.scrollTop = 0;
  updateResultCount();
  renderVirtual();
}

function scoreTab(tab, terms) {
  let score = 0;

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    const titleIdx = tab.titleLower.indexOf(term);
    const urlIdx = tab.urlLower.indexOf(term);
    const contentIdx = tab.contentLower ? tab.contentLower.indexOf(term) : -1;

    if (titleIdx === -1 && urlIdx === -1 && contentIdx === -1) return 0;

    if (titleIdx !== -1) {
      score += 10;
      if (titleIdx === 0) score += 5;
    }
    if (urlIdx !== -1) {
      score += 5;
      if (urlIdx === 0) score += 2;
    }
    if (contentIdx !== -1) {
      score += 2;
    }
  }

  return score;
}

// --- Virtual scrolling ---

function onScroll() {
  renderVirtual();
}

function renderVirtual() {
  const total = filteredTabs.length;

  if (total === 0) {
    emptyState.hidden = !searchInput.value.trim();
    scrollSpacer.style.height = "0";
    resultsList.innerHTML = "";
    return;
  }

  emptyState.hidden = true;
  const totalHeight = total * ITEM_HEIGHT;
  scrollSpacer.style.height = totalHeight + "px";

  const scrollTop = scrollViewport.scrollTop;
  const startRaw = Math.floor(scrollTop / ITEM_HEIGHT);
  const start = Math.max(0, startRaw - OVERSCAN);
  const endRaw = Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ITEM_HEIGHT);
  const end = Math.min(total, endRaw + OVERSCAN);

  const query = searchInput.value.trim().toLowerCase();
  const fragment = document.createDocumentFragment();

  for (let i = start; i < end; i++) {
    fragment.appendChild(createTabItem(filteredTabs[i], i, query));
  }

  resultsList.style.top = start * ITEM_HEIGHT + "px";
  resultsList.innerHTML = "";
  resultsList.appendChild(fragment);
}

function createTabItem(tab, index, query) {
  const li = document.createElement("li");
  li.className = "tab-item" + (index === selectedIndex ? " selected" : "");
  li.dataset.index = index;
  li.style.height = ITEM_HEIGHT + "px";

  const favicon = document.createElement("img");
  favicon.className = "tab-favicon";
  favicon.src = tab.isSettings ? SETTINGS_ICON : (tab.favIconUrl || FALLBACK_ICON);
  favicon.alt = "";
  favicon.loading = "lazy";
  if (!tab.isSettings) favicon.onerror = faviconError;

  const info = document.createElement("div");
  info.className = "tab-info";

  const titleEl = document.createElement("div");
  titleEl.className = "tab-title";
  titleEl.innerHTML = highlightMatch(tab.title, query);

  info.appendChild(titleEl);

  if (settings.showUrls) {
    const urlEl = document.createElement("div");
    urlEl.className = "tab-url";
    urlEl.innerHTML = highlightMatch(tab.urlDisplay, query);
    info.appendChild(urlEl);
  }

  // Show content snippet if matched by content but not title/url
  if (query && tab.contentLower) {
    const terms = query.split(/\s+/);
    const titleHit = terms.every((t) => tab.titleLower.includes(t));
    const urlHit = terms.every((t) => tab.urlLower.includes(t));
    if (!titleHit && !urlHit) {
      const snippet = getContentSnippet(tab.content, tab.contentLower, terms);
      if (snippet) {
        const contentEl = document.createElement("div");
        contentEl.className = "tab-content-match";
        contentEl.innerHTML = "..." + highlightMatch(snippet, query) + "...";
        info.appendChild(contentEl);
      }
    }
  }

  li.appendChild(favicon);
  li.appendChild(info);

  if (windowCount > 1) {
    const badge = document.createElement("span");
    badge.className = "tab-window-badge";
    badge.textContent = "W" + getWindowNumber(tab.windowId);
    li.appendChild(badge);
  }

  if (settings.showCloseButton && !tab.isSettings) {
    const closeBtn = document.createElement("button");
    closeBtn.className = "tab-close";
    closeBtn.title = "Close tab";
    closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    li.appendChild(closeBtn);
  }

  return li;
}

function getContentSnippet(content, contentLower, terms) {
  let earliest = contentLower.length;
  for (const term of terms) {
    const idx = contentLower.indexOf(term);
    if (idx !== -1 && idx < earliest) earliest = idx;
  }

  if (earliest >= contentLower.length) return "";

  const snippetStart = Math.max(0, earliest - 20);
  const snippetEnd = Math.min(content.length, snippetStart + CONTENT_SNIPPET_LEN);
  return content.substring(snippetStart, snippetEnd).replace(/\s+/g, " ").trim();
}

function faviconError() {
  this.src = FALLBACK_ICON;
  this.onerror = null;
}

// --- Keyboard navigation ---

function onKeyDown(e) {
  const len = filteredTabs.length;
  if (!len && e.key !== "Escape") return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % len;
      updateSelection();
      scrollToSelected();
      break;

    case "ArrowUp":
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + len) % len;
      updateSelection();
      scrollToSelected();
      break;

    case "Enter":
      e.preventDefault();
      if (filteredTabs[selectedIndex]) switchToTab(filteredTabs[selectedIndex]);
      break;

    case "Escape":
      closePopup();
      break;
  }
}

function updateSelection() {
  const items = resultsList.querySelectorAll(".tab-item");
  for (let i = 0; i < items.length; i++) {
    const idx = parseInt(items[i].dataset.index, 10);
    items[i].classList.toggle("selected", idx === selectedIndex);
  }
}

function scrollToSelected() {
  const itemTop = selectedIndex * ITEM_HEIGHT;
  const itemBottom = itemTop + ITEM_HEIGHT;
  const viewTop = scrollViewport.scrollTop;
  const viewBottom = viewTop + VIEWPORT_HEIGHT;

  if (itemTop < viewTop) {
    scrollViewport.scrollTop = itemTop;
  } else if (itemBottom > viewBottom) {
    scrollViewport.scrollTop = itemBottom - VIEWPORT_HEIGHT;
  }
}

// --- Tab actions ---

async function switchToTab(tab) {
  if (tab.isSettings) {
    chrome.runtime.openOptionsPage();
    closePopup();
    return;
  }
  await chrome.tabs.update(tab.id, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
  closePopup();
}

function closePopup() {
  if (isIframe) {
    // Tell parent page to remove the overlay
    window.parent.postMessage({ type: "__wimt_close__" }, "*");
  } else {
    window.close();
  }
}

async function closeTab(tab) {
  await chrome.tabs.remove(tab.id);
  tabCache = tabCache.filter((t) => t.id !== tab.id);
  executeSearch();
}

// --- Result count ---

function updateResultCount() {
  const total = filteredTabs.length;
  const query = searchInput.value.trim();
  if (!query) {
    resultCount.textContent = total + " open tab" + (total !== 1 ? "s" : "");
  } else {
    resultCount.textContent = total + " result" + (total !== 1 ? "s" : "");
  }
}

// --- Highlight matching ---

const HTML_ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const HTML_ESC_RE = /[&<>"]/g;

function escapeHtml(str) {
  return str.replace(HTML_ESC_RE, (ch) => HTML_ESC[ch]);
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);

  const terms = query.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return escapeHtml(text);

  const lower = text.toLowerCase();
  const marks = new Uint8Array(text.length);

  for (let t = 0; t < terms.length; t++) {
    const term = terms[t];
    let start = 0;
    while (start < lower.length) {
      const idx = lower.indexOf(term, start);
      if (idx === -1) break;
      const end = idx + term.length;
      for (let i = idx; i < end; i++) marks[i] = 1;
      start = idx + 1;
    }
  }

  let result = "";
  let inMark = false;
  for (let i = 0; i < text.length; i++) {
    if (marks[i] && !inMark) {
      result += "<mark>";
      inMark = true;
    } else if (!marks[i] && inMark) {
      result += "</mark>";
      inMark = false;
    }
    result += escapeHtml(text[i]);
  }
  if (inMark) result += "</mark>";

  return result;
}

// --- Utilities ---

function stripUrl(url) {
  try {
    const u = new URL(url);
    return u.host + u.pathname + u.search;
  } catch {
    return url;
  }
}

const FALLBACK_ICON = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="%2345475a"/><text x="8" y="12" text-anchor="middle" font-size="11" fill="%23cdd6f4">?</text></svg>'
);

const SETTINGS_ICON = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="%23475569"/><path d="M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM8 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="%23cdd6f4"/><path d="M13 7.5h-.7a4.5 4.5 0 00-.5-1.2l.5-.5a.5.5 0 000-.7l-.4-.4a.5.5 0 00-.7 0l-.5.5a4.5 4.5 0 00-1.2-.5V4a.5.5 0 00-.5-.5h-.5a.5.5 0 00-.5.5v.7a4.5 4.5 0 00-1.2.5l-.5-.5a.5.5 0 00-.7 0l-.4.4a.5.5 0 000 .7l.5.5a4.5 4.5 0 00-.5 1.2H3a.5.5 0 00-.5.5v.5a.5.5 0 00.5.5h.7a4.5 4.5 0 00.5 1.2l-.5.5a.5.5 0 000 .7l.4.4a.5.5 0 00.7 0l.5-.5a4.5 4.5 0 001.2.5v.7a.5.5 0 00.5.5h.5a.5.5 0 00.5-.5v-.7a4.5 4.5 0 001.2-.5l.5.5a.5.5 0 00.7 0l.4-.4a.5.5 0 000-.7l-.5-.5a4.5 4.5 0 00.5-1.2h.7a.5.5 0 00.5-.5V8a.5.5 0 00-.5-.5z" fill="%23cdd6f4"/></svg>'
);

const windowNumberMap = new Map();
let nextWindowNumber = 1;

function getWindowNumber(windowId) {
  if (!windowNumberMap.has(windowId)) {
    windowNumberMap.set(windowId, nextWindowNumber++);
  }
  return windowNumberMap.get(windowId);
}
