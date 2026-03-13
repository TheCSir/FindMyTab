"use strict";

async function getLayout() {
  const result = await chrome.storage.sync.get({ layout: "popup" });
  return result.layout;
}

async function applyLayout(layout) {
  if (layout === "floating") {
    await chrome.action.setPopup({ popup: "" });
  } else {
    await chrome.action.setPopup({ popup: "popup/popup.html" });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const layout = await getLayout();
  await applyLayout(layout);
});

chrome.runtime.onStartup.addListener(async () => {
  const layout = await getLayout();
  await applyLayout(layout);
});

chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.layout) {
    await applyLayout(changes.layout.newValue);
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  await injectOverlay(tab);
});

async function injectOverlay(tab) {
  if (!tab || !tab.id) return;

  // Check if overlay already exists and toggle it off
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!document.getElementById("__wimt-overlay__"),
    });
    if (results && results[0] && results[0].result) {
      // Overlay exists — remove it
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const el = document.getElementById("__wimt-overlay__");
          if (el) el.remove();
        },
      });
      return;
    }
  } catch {
    // Tab can't be injected (restricted page) — fall back to popup window
    await openFallbackWindow();
    return;
  }

  const popupUrl = chrome.runtime.getURL("popup/popup.html?float=1");

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (url) => {
        // Create backdrop
        const overlay = document.createElement("div");
        overlay.id = "__wimt-overlay__";
        overlay.style.cssText =
          "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.4);" +
          "display:flex;align-items:flex-start;justify-content:center;padding-top:12vh;" +
          "backdrop-filter:blur(2px);opacity:0;transition:opacity .15s ease";

        // Create iframe
        const iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.style.cssText =
          "width:680px;height:520px;border:none;border-radius:12px;" +
          "box-shadow:0 25px 60px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.1);" +
          "transform:scale(0.96) translateY(-8px);transition:transform .15s ease,opacity .15s ease;" +
          "opacity:0;background:#fff";

        overlay.appendChild(iframe);
        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => {
          overlay.style.opacity = "1";
          iframe.style.opacity = "1";
          iframe.style.transform = "scale(1) translateY(0)";
        });

        function closeOverlay() {
          overlay.style.opacity = "0";
          iframe.style.transform = "scale(0.96) translateY(-8px)";
          iframe.style.opacity = "0";
          setTimeout(() => overlay.remove(), 150);
          document.removeEventListener("keydown", onKey);
          window.removeEventListener("message", onMsg);
        }

        // Click backdrop to close
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) closeOverlay();
        });

        // Escape key to close
        const onKey = (e) => {
          if (e.key === "Escape") closeOverlay();
        };
        document.addEventListener("keydown", onKey);

        // Close message from iframe (tab switch, enter, etc.)
        const onMsg = (e) => {
          if (e.data && e.data.type === "__wimt_close__") closeOverlay();
        };
        window.addEventListener("message", onMsg);
      },
      args: [popupUrl],
    });
  } catch {
    await openFallbackWindow();
  }
}

// Fallback for restricted pages (chrome://, edge://, etc.)
async function openFallbackWindow() {
  const currentWindow = await chrome.windows.getCurrent();
  const w = 680, h = 520;
  const left = Math.round(currentWindow.left + (currentWindow.width - w) / 2);
  const top = Math.round(currentWindow.top + currentWindow.height * 0.2);

  await chrome.windows.create({
    url: "popup/popup.html?float=1",
    type: "popup",
    width: w,
    height: h,
    left: Math.max(0, left),
    top: Math.max(0, top),
    focused: true,
  });
}
