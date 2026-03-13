const assert = require("assert");

// === Functions extracted from popup.js ===

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

function stripUrl(url) {
  try {
    const u = new URL(url);
    return u.host + u.pathname + u.search;
  } catch {
    return url;
  }
}

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

function getContentSnippet(content, contentLower, terms) {
  const CONTENT_SNIPPET_LEN = 120;
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

// Helper to create a cached tab
function makeTab(title, url, content) {
  return {
    title,
    url,
    titleLower: title.toLowerCase(),
    urlLower: url.toLowerCase(),
    content: content || "",
    contentLower: (content || "").toLowerCase(),
  };
}

// === Tests ===

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log("  PASS:", name);
    passed++;
  } catch (e) {
    console.log("  FAIL:", name, "-", e.message);
    failed++;
  }
}

console.log("scoreTab:");
test("matches title", () => {
  const tab = makeTab("GitHub - Dashboard", "https://github.com");
  assert(scoreTab(tab, ["github"]) > 0);
});

test("title match scores higher than url-only match", () => {
  const tab1 = makeTab("GitHub Dashboard", "https://example.com");
  const tab2 = makeTab("My Page", "https://github.com");
  assert(scoreTab(tab1, ["github"]) > scoreTab(tab2, ["github"]));
});

test("returns 0 when no match", () => {
  const tab = makeTab("Google", "https://google.com");
  assert.strictEqual(scoreTab(tab, ["facebook"]), 0);
});

test("multi-term requires all terms to match", () => {
  const tab = makeTab("GitHub Dashboard", "https://github.com");
  assert.strictEqual(scoreTab(tab, ["github", "facebook"]), 0);
  assert(scoreTab(tab, ["github", "dash"]) > 0);
});

test("start-of-title bonus", () => {
  const tab1 = makeTab("GitHub Projects", "https://example.com");
  const tab2 = makeTab("My GitHub Page", "https://example.com");
  assert(scoreTab(tab1, ["github"]) > scoreTab(tab2, ["github"]));
});

test("content match scores lower than title match", () => {
  const tab1 = makeTab("Invoice Manager", "https://example.com");
  const tab2 = makeTab("Dashboard", "https://example.com", "Here is your invoice details");
  assert(scoreTab(tab1, ["invoice"]) > scoreTab(tab2, ["invoice"]));
});

test("content-only match still returns > 0", () => {
  const tab = makeTab("Dashboard", "https://example.com", "Order confirmation #12345");
  assert(scoreTab(tab, ["confirmation"]) > 0);
});

test("content match does not match if no content", () => {
  const tab = makeTab("Dashboard", "https://example.com");
  assert.strictEqual(scoreTab(tab, ["confirmation"]), 0);
});

console.log("\ncanInject:");
test("allows https URLs", () => {
  assert(canInject("https://example.com"));
});

test("allows http URLs", () => {
  assert(canInject("http://example.com"));
});

test("blocks chrome:// URLs", () => {
  assert(!canInject("chrome://extensions"));
});

test("blocks chrome-extension:// URLs", () => {
  assert(!canInject("chrome-extension://abc123/popup.html"));
});

test("blocks edge:// URLs", () => {
  assert(!canInject("edge://settings"));
});

test("blocks Chrome Web Store", () => {
  assert(!canInject("https://chromewebstore.google.com/detail/abc"));
});

test("blocks empty URLs", () => {
  assert(!canInject(""));
  assert(!canInject(null));
});

console.log("\nstripUrl:");
test("strips protocol", () => {
  assert.strictEqual(stripUrl("https://www.google.com/search?q=test"), "www.google.com/search?q=test");
});

test("handles invalid URL gracefully", () => {
  assert.strictEqual(stripUrl("not-a-url"), "not-a-url");
});

test("strips hash", () => {
  const result = stripUrl("https://example.com/page#section");
  assert(result.indexOf("#") === -1);
});

console.log("\nhighlightMatch:");
test("no query returns escaped text", () => {
  assert.strictEqual(highlightMatch("Hello <World>", ""), "Hello &lt;World&gt;");
});

test("wraps match in mark tags", () => {
  const result = highlightMatch("GitHub Dashboard", "github");
  assert.strictEqual(result, "<mark>GitHub</mark> Dashboard");
});

test("handles multiple matches", () => {
  const result = highlightMatch("test is a test", "test");
  assert(result.includes("<mark>test</mark>"));
  assert.strictEqual(result.split("<mark>").length - 1, 2);
});

test("multi-term highlighting", () => {
  const result = highlightMatch("GitHub Dashboard Pro", "github pro");
  assert(result.includes("<mark>GitHub</mark>"));
  assert(result.includes("<mark>Pro</mark>"));
});

test("escapes HTML in text", () => {
  const result = highlightMatch("<script>alert(1)</script>", "script");
  assert(result.indexOf("<script>") === -1);
  assert(result.includes("&lt;<mark>script</mark>"));
});

console.log("\ngetContentSnippet:");
test("returns snippet around first match", () => {
  const content = "This is a long page with some important invoice data inside it.";
  const snippet = getContentSnippet(content, content.toLowerCase(), ["invoice"]);
  assert(snippet.includes("invoice"));
});

test("returns empty for no match", () => {
  const content = "Hello world";
  const snippet = getContentSnippet(content, content.toLowerCase(), ["xyz"]);
  assert.strictEqual(snippet, "");
});

test("collapses whitespace in snippet", () => {
  const content = "Line one\n\n\nLine   two   with   invoice";
  const snippet = getContentSnippet(content, content.toLowerCase(), ["invoice"]);
  assert(!snippet.includes("\n"));
  assert(!snippet.includes("   "));
});

console.log("\nescapeHtml:");
test("escapes all dangerous chars", () => {
  assert.strictEqual(escapeHtml('a&b<c>d"e'), "a&amp;b&lt;c&gt;d&quot;e");
});

test("returns plain text unchanged", () => {
  assert.strictEqual(escapeHtml("hello world"), "hello world");
});

console.log("\nPerformance:");
test("scoring 1000 tabs under 5ms", () => {
  const tabs = [];
  for (let i = 0; i < 1000; i++) {
    tabs.push(makeTab(
      "Tab " + i + " - Some Long Title Here",
      "https://example" + i + ".com/path/to/page",
      "This is the body content of tab " + i + " with some random text"
    ));
  }
  const terms = ["example", "title"];
  const start = performance.now();
  for (const tab of tabs) scoreTab(tab, terms);
  const elapsed = performance.now() - start;
  console.log("    1000 tabs scored in " + elapsed.toFixed(2) + "ms");
  assert(elapsed < 5);
});

test("highlighting 1000 strings under 10ms", () => {
  const strings = [];
  for (let i = 0; i < 1000; i++) {
    strings.push("GitHub Dashboard Pro - Repository " + i);
  }
  const start = performance.now();
  for (const s of strings) highlightMatch(s, "github pro");
  const elapsed = performance.now() - start;
  console.log("    1000 highlights in " + elapsed.toFixed(2) + "ms");
  assert(elapsed < 10);
});

console.log("\n" + "=".repeat(40));
console.log("Results:", passed, "passed,", failed, "failed");
if (failed > 0) process.exit(1);
