# Where Is My Tab

A Chromium extension to instantly search and switch between open tabs. Press **Ctrl+Shift+F**, type a query, and jump to the matching tab.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Chromium](https://img.shields.io/badge/Chrome%20%7C%20Edge-Chromium-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Instant tab search** — search by title, URL, or page content
- **Keyboard-first** — Arrow keys to navigate, Enter to switch, Escape to close
- **Multi-window support** — finds tabs across all browser windows with window badges
- **Content search** — optionally search inside page text (toggle in settings)
- **Virtual scrolling** — handles hundreds of tabs without lag
- **Two layout modes** — standard popup or floating overlay (centered launcher)
- **Customizable appearance** — theme, accent colors, background color, hover/selection effects, font size, search box style
- **Settings page** — live preview of all visual changes
- **Close tabs inline** — optional close button on each tab result
- **Settings shortcut** — type "settings" in the search to open the options page

## Install

1. Clone or download this repo
2. Build the extension:
   ```bash
   npm run build
   ```
3. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge)
4. Enable **Developer mode**
5. Click **Load unpacked** and select the `dist/` folder

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+F` | Open tab search |
| `Arrow Up / Down` | Navigate results |
| `Enter` | Switch to selected tab |
| `Escape` | Close popup |

The activation shortcut can be changed at `chrome://extensions/shortcuts`.

## Settings

Right-click the extension icon and select **Options**, or type "settings" in the search popup.

### Theme
- **Light**, **Dark**, or **System** (follows OS preference)

### Search Box Style
- **Pill**, **Rounded**, or **Square**

### Layout
- **Popup** — standard browser popup attached to the toolbar icon
- **Floating** — centered overlay injected into the active page (like a launcher)
- **Popup Width** — Compact (320px), Default (400px), or Wide (500px) — popup mode only
- **Font Size** — Small, Default, or Large
- **Show URLs** — toggle URL display below each tab title

### Appearance

**Animation:**
- **Tab Hover Effect** — Highlight, Glow, Slide, or None
- **Tab Selection Effect** — Highlight, Border Left, Scale, or None

**Colors:**
- **Accent Color** — 8 presets + custom color picker + Default reset
- **Background Color** — 8 presets + custom color picker + Default reset
- **Background Opacity** — 20%–100% slider (popup mode only; disabled in floating mode since iframe isolation prevents transparency)

### Search
- **Content Search** — search inside page text, not just title & URL
- **Max Results** — 50, 100, 200, or 500
- **Default Sort** — Recent, Alphabetical, or by Window

### Tab Management
- **Close Button** — show an X button on hover to close tabs from the popup

## Project Structure

```
WhereIsMyTab/
├── src/                        # Extension source
│   ├── manifest.json
│   ├── background.js           # Service worker (floating overlay injection)
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── options/
│   │   ├── options.html
│   │   ├── options.css
│   │   └── options.js
│   ├── shared/
│   │   └── defaults.js         # Settings defaults, presets, load/save
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── dist/                       # Build output (load this in browser)
├── tests/
│   └── test.js                 # Unit tests for search scoring, highlighting, etc.
├── scripts/
│   ├── build.js                # Copies src/ → dist/
│   ├── validate.js             # Validates manifest and file references
│   └── generate-icons.js       # Renders icons programmatically (SDF-based)
├── package.json
├── LICENSE
└── README.md
```

## Development

```bash
npm test              # Run unit tests
npm run validate      # Validate manifest and file references
npm run build         # Bundle src/ into dist/ for Chrome/Edge
npm run icons         # Regenerate icons from code
```

After making changes, run `npm run build` and reload the extension in the browser.

## Permissions

| Permission | Why |
|---|---|
| `tabs` | Query open tabs (title, URL, favicon) |
| `scripting` | Extract page text for content search; inject floating overlay |
| `storage` | Persist user settings |
| `<all_urls>` (host) | Required by `scripting` for content extraction and overlay injection |

## Browser Compatibility

Built for Chromium-based browsers:
- Google Chrome
- Microsoft Edge
- Brave, Vivaldi, Opera, Arc, etc.

Firefox is not supported (uses WebExtensions APIs specific to Chromium).

## Known Limitations

- Floating overlay cannot be opened on browser-internal pages (`chrome://`, `edge://`, `about:`, Chrome Web Store)
- Background opacity has no visible effect in floating mode (iframe isolation)
- Discarded/sleeping tabs have title and URL but no live page content for content search
- The popup closes when it loses focus (browser limitation) — by design

## License

MIT
