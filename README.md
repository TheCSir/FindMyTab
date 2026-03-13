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

## Opening the Extension

There are three ways to open Where Is My Tab:

1. **Keyboard shortcut**: Press `Ctrl+Shift+F` (default) to instantly open the tab search.
2. **Toolbar icon**: Click the Where Is My Tab icon in the Chrome toolbar.
3. **Custom shortcut**: Change the activation shortcut at `chrome://extensions/shortcuts`.

Once opened, the search input is automatically focused so you can start typing immediately.

## Install

1. Clone or download this repo
2. Build the extension:
   ```bash
   npm run build
   ```
3. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge)
4. Enable **Developer mode**
5. Click **Load unpacked** and select the `dist/` folder

## Layout Modes

Where Is My Tab supports two layout modes, configurable in Settings.

### Popup Mode (Default)

The standard Chrome extension popup that appears anchored to the toolbar icon. It displays a search bar at the top, a tab count, and a scrollable list of all open tabs.

![Popup - Dark Theme](docs/images/popup-dark.png)

### Floating Mode

A centered overlay window that appears on top of the current page, similar to a launcher or spotlight search. It has a blurred backdrop and a larger display area (680x520px). Click the backdrop or press Escape to dismiss it.

![Floating Mode](docs/images/popup-floating.png)

## Themes

The extension supports three color modes, configurable in Settings under **Theme > Color Mode**.

### Dark Theme

![Dark Theme](docs/images/popup-dark.png)

### Light Theme

![Light Theme](docs/images/popup-light.png)

### System Theme

Automatically follows your operating system's light/dark preference.

## Search

Type in the search bar to filter tabs in real time. The search matches against tab titles and URLs, with results ranked by relevance.

- Title matches are weighted higher than URL matches
- Matches at the beginning of a title or URL score bonus points
- Multiple search terms are supported (all must match)
- Matching text is highlighted in the results

![Search for "git"](docs/images/popup-search.png)

### Content Search

When enabled in Settings, the extension also searches inside page text (not just titles and URLs). Page content is extracted progressively in batches when the popup opens. This requires the `scripting` permission and only works on standard web pages (not `chrome://` or extension pages).

## Tab List

Each tab entry in the list displays:

- **Favicon**: The site icon (or a fallback "?" icon if unavailable)
- **Title**: The tab's page title, with search term highlights
- **URL**: The stripped URL (host + path), shown below the title (can be toggled off)
- **Window badge**: A `W1`, `W2`, etc. badge indicating which window the tab belongs to (only shown when multiple windows are open)
- **Close button**: An X button on hover to close the tab directly (when enabled)

The list uses virtual scrolling for performance, rendering only the visible items. This keeps the popup fast even with hundreds of open tabs.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+F` | Open tab search |
| `Arrow Up / Down` | Navigate results |
| `Enter` | Switch to selected tab |
| `Escape` | Close popup |

The activation shortcut can be changed at `chrome://extensions/shortcuts`.

## Settings

Right-click the extension icon and select **Options**, or type "settings" in the search popup to open the settings page.

![Settings Page](docs/images/settings-dark.png)

### Live Preview

At the top of the settings page is a live preview card that reflects your current configuration in real time. It shows a mock search result list with your chosen accent color, search box style, font size, and URL visibility.

### Theme

| Setting | Options | Description |
|---|---|---|
| Color Mode | Light, Dark, System | Controls the overall color scheme. System follows your OS preference. |

### Search Box Style

Controls the border radius of the search input field.

| Style | Radius | Description |
|---|---|---|
| Pill | 24px | Fully rounded ends (default) |
| Rounded | 8px | Slightly rounded corners |
| Square | 2px | Nearly sharp corners |

### Layout

| Setting | Options | Description |
|---|---|---|
| Mode | Popup, Floating | Popup attaches to the toolbar icon. Floating opens a centered overlay window on the current page. |
| Popup Width | Compact (320px), Default (400px), Wide (500px) | Width of the popup. Only applies in Popup mode. |
| Font Size | Small (12px), Default (13px), Large (14px) | Text size in the tab list. |
| Show URLs | On / Off | Toggle URL display below each tab title. |

### Appearance

#### Animation

| Setting | Options | Description |
|---|---|---|
| Tab Hover Effect | Highlight, Glow, Slide, None | Visual effect when hovering over a tab item. |
| Tab Selection Effect | Highlight, Border Left, Scale, None | Visual effect for the currently selected/active tab item. |

#### Colors

| Setting | Options | Description |
|---|---|---|
| Accent Color | 8 presets + custom picker | Applied to selected items, focus rings, URLs, and links. Presets: Chrome Blue, Teal, Purple, Rose, Orange, Green, Slate, Indigo. |
| Background Color | 8 presets + custom picker | Base background color. Presets: Dark, Charcoal, Navy, Midnight, Graphite, White, Light Gray, Warm Gray. |
| Background Opacity | 20%–100% slider | Transparency level of the popup background. Only applies in Popup mode. |

Each color section has a **Default** button to reset to the original value.

### Search

| Setting | Options | Description |
|---|---|---|
| Content Search | On / Off | Search inside page text, not just title and URL. Extracts text when popup opens. Off by default. |
| Max Results | 50, 100, 200, 500 | Limit the number of search results for faster rendering. Default: 100. |
| Default Sort | Recent, Alphabetical, Window | Tab order when no search query is active. Recent uses Chrome's default order, Alphabetical sorts by title, Window groups by window ID. |

### Tab Management

| Setting | Options | Description |
|---|---|---|
| Close Button | On / Off | Show an X button on hover to close tabs directly from the popup. Off by default. |

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
├── docs/
│   └── images/                 # Screenshots for documentation
├── tests/
│   └── test.js                 # Unit tests for search scoring, highlighting, etc.
├── scripts/
│   ├── build.js                # Copies src/ → dist/
│   ├── validate.js             # Validates manifest and file references
│   ├── screenshots.js          # Generates documentation screenshots (Playwright)
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

| Permission | Reason |
|---|---|
| `tabs` | Read tab titles, URLs, and favicons to populate the search list |
| `storage` | Save user settings (theme, accent color, layout, etc.) |
| `scripting` | Extract page content for Content Search feature; inject floating overlay |
| `<all_urls>` (host) | Required by `scripting` for content extraction and overlay injection on any page |

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
