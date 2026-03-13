# Where Is My Tab - Project Plan

## Overview
A Chrome extension that lets you quickly search and switch between open browser tabs using a keyboard shortcut. Press `Ctrl+Alt+T`, type a query, and jump to the matching tab instantly.

## Tech Stack
- **Platform**: Chrome Extension (Manifest V3, Chromium only)
- **Languages**: HTML, CSS, JavaScript (vanilla, no frameworks)
- **APIs**: `chrome.tabs`, `chrome.commands`, `chrome.windows`

## Permissions
- `tabs` - query all open tabs (title + URL)
- No `<all_urls>`, no content scripts, no host permissions

## Architecture

```
WhereIsMyTab/
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker - listens for hotkey command
├── popup/
│   ├── popup.html         # Search overlay UI
│   ├── popup.css          # Styling for the search box and results list
│   └── popup.js           # Search logic, keyboard navigation, tab switching
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── PLAN.md
└── README.md
```

## Features (MVP)

### F1: Hotkey Trigger
- Register `Ctrl+Alt+T` via `chrome.commands` in manifest
- Opens the extension popup

### F2: Search Popup UI
- Minimal, clean search input at the top
- Results list below showing matching tabs
- Each result shows: favicon, tab title, URL (truncated)
- Indicate which window a tab belongs to (if multiple windows)

### F3: Tab Search
- On popup open: fetch all tabs via `chrome.tabs.query({})`
- Fuzzy match against tab `title` and `url` as user types
- Case-insensitive matching
- Rank results by relevance (title match > URL match)
- Show all tabs when search input is empty (most recent first)

### F4: Keyboard Navigation
- Arrow Up/Down to move through results
- Enter to switch to the selected tab
- Esc to close the popup
- Auto-focus the search input on open

### F5: Tab Switching
- `chrome.tabs.update(tabId, { active: true })` to activate the tab
- `chrome.windows.update(windowId, { focused: true })` to focus the correct window
- Close the popup after switching

## Implementation Phases

### Phase 1 - Base Setup (current)
- [x] Project structure and empty files
- [x] manifest.json with commands and permissions
- [x] This plan document

### Phase 2 - Core UI
- [ ] popup.html layout (search input + results container)
- [ ] popup.css styling (dark theme, compact, keyboard-friendly)
- [ ] Basic popup.js skeleton (DOM references, event listeners)

### Phase 3 - Search Logic
- [ ] Fetch all tabs on popup open
- [ ] Implement fuzzy/substring matching
- [ ] Render results list with favicon, title, URL
- [ ] Filter results as user types (debounced input)

### Phase 4 - Keyboard Navigation & Switching
- [ ] Arrow key navigation with visual highlight
- [ ] Enter to switch tab (activate + focus window)
- [ ] Esc to close popup
- [ ] Handle edge cases (no results, single result auto-select)

### Phase 5 - Polish
- [ ] Icons (simple, recognizable)
- [ ] Handle discarded/unloaded tabs gracefully
- [ ] Empty state messaging
- [ ] Performance: ensure instant feel with 100+ tabs
- [ ] README with install instructions

## Future Ideas (post-MVP)
- Page content search via optional content scripts
- Tab grouping awareness (Chrome tab groups)
- Recently closed tabs search (`chrome.sessions`)
- Pinned tab indicators
- Custom hotkey configuration via options page
- Bookmark search integration
- History search integration

## Known Limitations
- Cannot style or highlight the actual browser tab bar
- Cannot access `chrome://` or `chrome-extension://` page content
- Discarded tabs have title/URL but no live page content
- Popup closes when it loses focus (browser limitation) - this is fine for our UX
- `chrome.commands` only supports a limited set of shortcut key combinations
