"use strict";

// Listen for message from popup to open floating overlay
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "open-float") {
    injectOverlay();
    sendResponse({ ok: true });
  }
});

async function injectOverlay() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  // Check if overlay already exists and toggle it off
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!document.getElementById("__wimt-overlay__"),
    });
    if (results && results[0] && results[0].result) {
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
    // Can't inject on this page — do nothing, popup already closed
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
        iframe.allow = "clipboard-read; clipboard-write";
        iframe.style.cssText =
          "width:680px;height:520px;border:none;border-radius:12px;" +
          "box-shadow:0 25px 60px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.1);" +
          "transform:scale(0.96) translateY(-8px);transition:transform .15s ease,opacity .15s ease;" +
          "opacity:0;background:transparent";

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
    // Injection failed — nothing to do
  }
}
