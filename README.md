# Where Is My Tab

A Chrome extension to quickly search and switch between open tabs. Press **Ctrl+Shift+F**, type a query, and jump to the matching tab instantly.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Chrome](https://img.shields.io/badge/Chrome-Chromium-green)

## Features

- **Instant tab search** — search by title, URL, or page content
- **Keyboard-first** — Arrow keys to navigate, Enter to switch, Escape to close
- **Multi-window support** — finds tabs across all Chrome windows with window badges
- **Content search** — optionally search inside page text (toggle in settings)
- **Virtual scrolling** — handles 200+ tabs without breaking a sweat
- **Customizable** — theme (light/dark/system), accent colors, search box style
- **Settings page** — live preview, 8 accent color presets, custom color picker

## Install

1. Clone or download this repo
2. Run the build:
   ```
   node scripts/build.js
   ```
3. Open `chrome://extensions` in Chrome
4. Enable **Developer mode** (top-right toggle)
5. Click **Load unpacked** and select the `extension/` folder

## Usage

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+F` | Open tab search |
| `Arrow Up/Down` | Navigate results |
| `Enter` | Switch to selected tab |
| `Escape` | Close popup |

The activation shortcut can be changed at `chrome://extensions/shortcuts`.

## Settings

Right-click the extension icon and select **Options**, or go to `chrome://extensions` and click **Details > Extension options**.

- **Theme** — Light, Dark, or System (follows OS preference)
- **Accent Color** — 8 presets or custom color picker
- **Search Box Style** — Pill, Rounded, or Square
- **Content Search** — Toggle page text extraction (requires host permissions)
- **Max Results** — 50, 100, 200, or 500

## Project Structure

```
WhereIsMyTab/
├── manifest.json            # MV3 manifest
├── popup/
│   ├── popup.html           # Search popup
│   ├── popup.css            # Popup styles with theming
│   └── popup.js             # Search, virtual scroll, tab switching
├── options/
│   ├── options.html         # Settings page
│   ├── options.css          # Settings styles
│   └── options.js           # Settings logic with live preview
├── shared/
│   └── defaults.js          # Shared settings defaults and presets
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── scripts/
    ├── build.js             # Bundles extension/ for Chrome
    ├── generate-icons.js    # Renders icons from code (SDF-based)
    ├── test.js              # 30 unit tests
    └── validate.js          # Validates manifest and file references
```

## Development

**Run tests:**
```
node scripts/test.js
```

**Validate extension structure:**
```
node scripts/validate.js
```

**Regenerate icons:**
```
node scripts/generate-icons.js
```

**Build for Chrome:**
```
node scripts/build.js
```

## Permissions

| Permission | Why |
|---|---|
| `tabs` | Query open tabs (title, URL, favicon) |
| `scripting` | Extract page text for content search (optional) |
| `storage` | Persist user settings |
| `<all_urls>` (host) | Required by `scripting` for content extraction |

## License

MIT
