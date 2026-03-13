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
2. Build the extension:
   ```
   npm run build
   ```
3. Open `chrome://extensions` in Chrome
4. Enable **Developer mode** (top-right toggle)
5. Click **Load unpacked** and select the `dist/` folder

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
FindMyTab/
├── src/                        # Extension source
│   ├── manifest.json
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── options/
│   │   ├── options.html
│   │   ├── options.css
│   │   └── options.js
│   ├── shared/
│   │   └── defaults.js
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── dist/                       # Build output (load this in Chrome)
├── tests/
│   └── test.js
├── scripts/
│   ├── build.js                # Copies src/ -> dist/
│   ├── generate-icons.js       # Renders icons from code (SDF-based)
│   └── validate.js             # Validates manifest and file references
├── package.json
├── LICENSE
└── README.md
```

## Development

```bash
npm test              # Run 30 unit tests
npm run validate      # Validate manifest and file references
npm run icons         # Regenerate icons from code
npm run build         # Bundle src/ into dist/ for Chrome
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
