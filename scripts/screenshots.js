const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SRC = path.join(__dirname, "..", "src");
const OUT = path.join(__dirname, "..", "docs", "images");

// Mock tabs data for popup screenshots
const MOCK_TABS = [
  { id: 1, windowId: 1, title: "GitHub: Let's build from here", url: "https://github.com", favIconUrl: "https://github.githubassets.com/favicons/favicon-dark.svg" },
  { id: 2, windowId: 1, title: "Pull Requests - GitHub", url: "https://github.com/pulls", favIconUrl: "https://github.githubassets.com/favicons/favicon-dark.svg" },
  { id: 3, windowId: 1, title: "Stack Overflow - Where Developers Learn", url: "https://stackoverflow.com", favIconUrl: "" },
  { id: 4, windowId: 1, title: "YouTube - Home", url: "https://www.youtube.com", favIconUrl: "" },
  { id: 5, windowId: 1, title: "Google Docs - Untitled Document", url: "https://docs.google.com/document/d/1", favIconUrl: "" },
  { id: 6, windowId: 2, title: "Reddit - Pair Programming Tips", url: "https://www.reddit.com/r/programming", favIconUrl: "" },
  { id: 7, windowId: 2, title: "MDN Web Docs - CSS Grid Layout", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout", favIconUrl: "" },
  { id: 8, windowId: 2, title: "ChatGPT - New Conversation", url: "https://chat.openai.com", favIconUrl: "" },
  { id: 9, windowId: 2, title: "VS Code - Visual Studio Code", url: "https://code.visualstudio.com", favIconUrl: "" },
  { id: 10, windowId: 2, title: "Figma - Dashboard", url: "https://www.figma.com/files", favIconUrl: "" },
];

// Chrome API mock script to inject before page loads
function buildChromeMock(settingsOverrides = {}) {
  const defaults = {
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

  const settings = { ...defaults, ...settingsOverrides };

  return `
    window.chrome = {
      storage: {
        sync: {
          get: (defaults) => Promise.resolve({ ...defaults, ...${JSON.stringify(settings)} }),
          set: (data) => Promise.resolve(),
        }
      },
      tabs: {
        query: () => Promise.resolve(${JSON.stringify(MOCK_TABS)}),
        update: () => Promise.resolve(),
        remove: () => Promise.resolve(),
        create: () => Promise.resolve(),
      },
      windows: {
        update: () => Promise.resolve(),
      },
      runtime: {
        sendMessage: () => Promise.resolve(),
        openOptionsPage: () => {},
        getURL: (p) => 'chrome-extension://mock/' + p,
      },
      scripting: {
        executeScript: () => Promise.resolve([{ result: "" }]),
      },
      commands: {
        getAll: () => Promise.resolve([{
          name: "_execute_action",
          shortcut: "Ctrl+Shift+F",
        }]),
      },
    };
  `;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    colorScheme: "dark",
    viewport: { width: 1280, height: 900 },
  });

  // ========== POPUP SCREENSHOTS ==========

  // 1. Popup - Dark theme (default)
  console.log("  popup-dark.png");
  let page = await context.newPage();
  await page.addInitScript(buildChromeMock({ theme: "dark" }));
  await page.goto("file:///" + path.join(SRC, "popup/popup.html").replace(/\\/g, "/"));
  await page.waitForTimeout(500);
  await page.setViewportSize({ width: 400, height: 480 });
  await page.screenshot({ path: path.join(OUT, "popup-dark.png") });
  await page.close();

  // 2. Popup - Light theme
  console.log("  popup-light.png");
  page = await context.newPage();
  await page.addInitScript(buildChromeMock({ theme: "light" }));
  await page.goto("file:///" + path.join(SRC, "popup/popup.html").replace(/\\/g, "/"));
  await page.waitForTimeout(500);
  await page.setViewportSize({ width: 400, height: 480 });
  await page.screenshot({ path: path.join(OUT, "popup-light.png") });
  await page.close();

  // 3. Popup - With search query "git"
  console.log("  popup-search.png");
  page = await context.newPage();
  await page.addInitScript(buildChromeMock({ theme: "dark" }));
  await page.goto("file:///" + path.join(SRC, "popup/popup.html").replace(/\\/g, "/"));
  await page.waitForTimeout(500);
  await page.fill("#search-input", "git");
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 400, height: 480 });
  await page.screenshot({ path: path.join(OUT, "popup-search.png") });
  await page.close();

  // 4. Popup - With close buttons visible
  console.log("  popup-close-btn.png");
  page = await context.newPage();
  await page.addInitScript(buildChromeMock({ theme: "dark", showCloseButton: true }));
  await page.goto("file:///" + path.join(SRC, "popup/popup.html").replace(/\\/g, "/"));
  await page.waitForTimeout(500);
  await page.setViewportSize({ width: 400, height: 480 });
  // Hover over a tab item to show close button
  const tabItems = await page.$$(".tab-item");
  if (tabItems.length > 1) await tabItems[1].hover();
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, "popup-close-btn.png") });
  await page.close();

  // 5. Popup - Purple accent
  console.log("  popup-accent.png");
  page = await context.newPage();
  await page.addInitScript(buildChromeMock({ theme: "dark", accentColor: "#7c3aed" }));
  await page.goto("file:///" + path.join(SRC, "popup/popup.html").replace(/\\/g, "/"));
  await page.waitForTimeout(500);
  await page.click("#search-input");
  await page.setViewportSize({ width: 400, height: 480 });
  await page.screenshot({ path: path.join(OUT, "popup-accent.png") });
  await page.close();

  // 6. Floating mode
  console.log("  popup-floating.png");
  page = await context.newPage();
  await page.addInitScript(buildChromeMock({ theme: "dark", layout: "floating" }));
  await page.setViewportSize({ width: 800, height: 600 });
  // Build a page that embeds the popup in an overlay (simulating floating mode)
  await page.setContent(`
    <html>
    <head><style>
      body { margin: 0; background: #1a1a2e; font-family: system-ui; color: #ccc; }
      .fake-page { padding: 40px; }
      .fake-page h1 { color: #8ab4f8; }
      .fake-page p { max-width: 600px; line-height: 1.6; }
      .overlay {
        position: fixed; inset: 0; z-index: 999;
        background: rgba(0,0,0,0.4);
        display: flex; align-items: flex-start; justify-content: center;
        padding-top: 10vh; backdrop-filter: blur(2px);
      }
      .overlay iframe {
        width: 680px; height: 520px; border: none; border-radius: 12px;
        box-shadow: 0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
      }
    </style></head>
    <body>
      <div class="fake-page">
        <h1>My Web Application</h1>
        <p>This is a sample web page demonstrating the floating overlay mode.
        The tab search appears as a centered overlay on top of the page content,
        similar to a launcher or spotlight search.</p>
      </div>
      <div class="overlay">
        <iframe id="float-frame"></iframe>
      </div>
      <script>
        const frame = document.getElementById('float-frame');
        frame.src = '${("file:///" + path.join(SRC, "popup/popup.html").replace(/\\/g, "/") + "?float=1")}';
      </script>
    </body>
    </html>
  `);
  // Inject chrome mock into the iframe
  const frame = page.frameLocator("#float-frame");
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "popup-floating.png") });
  await page.close();

  // ========== SETTINGS PAGE SCREENSHOTS ==========

  // Create a light context for settings
  const settingsContext = await browser.newContext({
    colorScheme: "dark",
    viewport: { width: 720, height: 900 },
  });

  // 7. Settings - Full page (dark)
  console.log("  settings-dark.png");
  page = await settingsContext.newPage();
  await page.addInitScript(buildChromeMock({ theme: "dark" }));
  await page.goto("file:///" + path.join(SRC, "options/options.html").replace(/\\/g, "/"));
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "settings-dark.png"), fullPage: true });
  await page.close();

  // 8. Settings - Light theme
  console.log("  settings-light.png");
  page = await settingsContext.newPage();
  await page.addInitScript(buildChromeMock({ theme: "light" }));
  const lightCtx = await browser.newContext({
    colorScheme: "light",
    viewport: { width: 720, height: 900 },
  });
  page = await lightCtx.newPage();
  await page.addInitScript(buildChromeMock({ theme: "light" }));
  await page.goto("file:///" + path.join(SRC, "options/options.html").replace(/\\/g, "/"));
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "settings-light.png"), fullPage: true });
  await page.close();
  await lightCtx.close();

  // 9. Settings - Preview & Theme section
  console.log("  settings-preview.png");
  page = await settingsContext.newPage();
  await page.addInitScript(buildChromeMock({ theme: "dark" }));
  await page.goto("file:///" + path.join(SRC, "options/options.html").replace(/\\/g, "/"));
  await page.waitForTimeout(800);
  const previewCard = await page.$(".preview-card");
  if (previewCard) {
    await previewCard.screenshot({ path: path.join(OUT, "settings-preview.png") });
  }
  await page.close();

  // 10. Settings - Appearance section
  console.log("  settings-appearance.png");
  page = await settingsContext.newPage();
  await page.addInitScript(buildChromeMock({ theme: "dark", accentColor: "#7c3aed" }));
  await page.goto("file:///" + path.join(SRC, "options/options.html").replace(/\\/g, "/"));
  await page.waitForTimeout(800);
  // Scroll to appearance and capture that section
  const cards = await page.$$(".card");
  // Appearance is the 4th card (index 3): Preview, Theme, Search Box Style, Layout, Appearance
  if (cards.length >= 5) {
    await cards[4].scrollIntoViewIfNeeded();
    await cards[4].screenshot({ path: path.join(OUT, "settings-appearance.png") });
  }
  await page.close();

  // 11. Settings - Keyboard shortcuts section
  console.log("  settings-shortcuts.png");
  page = await settingsContext.newPage();
  await page.addInitScript(buildChromeMock({ theme: "dark" }));
  await page.goto("file:///" + path.join(SRC, "options/options.html").replace(/\\/g, "/"));
  await page.waitForTimeout(800);
  const allCards = await page.$$(".card");
  // Keyboard shortcuts is the last card before footer
  if (allCards.length >= 7) {
    await allCards[allCards.length - 1].scrollIntoViewIfNeeded();
    await allCards[allCards.length - 1].screenshot({ path: path.join(OUT, "settings-shortcuts.png") });
  }
  await page.close();

  await settingsContext.close();
  await browser.close();

  console.log("\nDone! Screenshots saved to docs/images/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
