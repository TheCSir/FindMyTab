"use strict";

const FLOAT_WIDTH = 680;
const FLOAT_HEIGHT = 520;

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

// On install or update, configure the action
chrome.runtime.onInstalled.addListener(async () => {
  const layout = await getLayout();
  await applyLayout(layout);
});

// On startup, configure the action
chrome.runtime.onStartup.addListener(async () => {
  const layout = await getLayout();
  await applyLayout(layout);
});

// When settings change, reconfigure
chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.layout) {
    await applyLayout(changes.layout.newValue);
  }
});

// When action is clicked (only fires when popup is empty = floating mode)
chrome.action.onClicked.addListener(async () => {
  await openFloatingWindow();
});

async function openFloatingWindow() {
  const currentWindow = await chrome.windows.getCurrent();
  const left = Math.round(currentWindow.left + (currentWindow.width - FLOAT_WIDTH) / 2);
  const top = Math.round(currentWindow.top + currentWindow.height * 0.2);

  await chrome.windows.create({
    url: "popup/popup.html?float=1",
    type: "popup",
    width: FLOAT_WIDTH,
    height: FLOAT_HEIGHT,
    left: Math.max(0, left),
    top: Math.max(0, top),
    focused: true,
  });
}
