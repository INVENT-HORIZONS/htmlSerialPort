# CLAUDE.md

Guidance for working on the htmlSerialPort project.

## What this is

A minimal serial terminal that talks to one specific controller over USB serial, in two forms:

1. **Standalone page** (`serial-terminal.html`): opened directly from disk (`file://`) in Chrome or Edge.
2. **Chrome extension** (`extension/`): the same terminal in the browser's side panel, so the
   connection stays open while the user browses other sites.

In both, the user clicks **Connect**, picks the port in the browser's dialog, and exchanges
text commands with the controller.

The UI is intentionally minimal. The owner explicitly asked for this, so do not add
features back without being asked.

## Tech stack

- **Plain HTML5 + CSS + vanilla JavaScript** in one file. No framework, no build step,
  no package manager, no external scripts, fonts or CDN assets.
- **Web Serial API** (`navigator.serial`): Chromium desktop browsers only (Chrome, Edge).
  Firefox and Safari are unsupported; the page shows a red banner when `navigator.serial`
  is missing.
- Chrome extension: **Manifest V3**, `chrome.sidePanel` API. Web Serial runs in the side panel
  page (an extension page), not in the service worker. A popup is deliberately not used,
  because it closes when focus leaves it and would drop the connection.
- Uses `TextEncoder` / `TextDecoder` (streaming decode) for UTF-8 text I/O.
- Version control: Git, hosted at `github.com/INVENT-HORIZONS/htmlSerialPort`, branch `main`.

## Files

| File | Purpose |
|---|---|
| `serial-terminal.html` | The whole application: markup, `<style>`, and `<script>` in one file. |
| `README.md` | Short user-facing instructions and the fixed port settings. |
| `CLAUDE.md` | This file. |
| `extension/manifest.json` | Manifest V3: `sidePanel` permission, side panel `sidepanel.html`, Chrome 116+. |
| `extension/background.js` | Service worker; only sets `openPanelOnActionClick` so the toolbar icon opens the panel. |
| `extension/sidepanel.html` | Same markup and CSS as the standalone page, loading `sidepanel.js`. |
| `extension/sidepanel.js` | Same script as the standalone page's inline `<script>`. |
| `extension/icons/` | `icon16/32/48/128.png`: white DB-9 connector on the accent blue. |

Conventions:
- Keep the standalone page as one file. Do not split out `.css` or `.js` files.
  The page must work by double-clicking it, with no server.
- The extension must keep its script in a separate `.js` file: Manifest V3's content security
  policy blocks inline `<script>`. No remote code or CDN scripts in the extension either.
- The two copies are kept identical by hand. **Any change to the page's script or styles must be
  made in both** `serial-terminal.html` and `extension/sidepanel.html` / `sidepanel.js`.
  The only intended differences: the extension's body padding is 10px and the output
  height is `calc(100vh - 120px)` to suit the narrow side panel.
- Bump `version` in `manifest.json` when the extension changes.
- File names are lowercase-hyphenated (`serial-terminal.html`).
- Keep `README.md` in sync when user-visible behavior or the fixed settings change.

## Fixed requirements (do not change unless the owner asks)

- Port settings are hard-coded: **115200 baud, 8 data bits, no parity, 1 stop bit, no flow control**.
  They live in the `SERIAL_OPTIONS` constant at the top of the script.
- **No settings UI.** Do not show baud rate, parity, data bits, stop bits or flow control controls.
- **Never use DTR/RTS.** No `port.setSignals()` calls and no signal controls or indicators.
- **One Connect button** that opens the browser's port picker (`navigator.serial.requestPort()`)
  on every press, then opens the port. While connected the same button reads **Disconnect**.
  No port list box, no "Add port" or "Forget port" buttons.
- Every command sent gets the `LINE_ENDING` constant appended (currently `'\r\n'`).

## UI layout

Top to bottom:
1. Bar: Connect/Disconnect button, status dot + text, spacer, Clear button.
2. `<pre id="output">` terminal pane, sized to fill the window height.
3. Send row: text input (Enter sends) + Send button, disabled while disconnected.

## Code patterns

- `const $ = id => document.getElementById(id);` for element lookup; elements have short IDs
  (`btnConnect`, `btnSend`, `btnClear`, `txText`, `output`, `dot`, `statusText`, `noSerial`).
- Configuration constants are UPPER_SNAKE_CASE at the top of the script; state is
  module-level `let` variables (`port`, `reader`, `writer`, `readLoopPromise`, `keepReading`, `atLineStart`).
- `updateUI()` is the single place that derives button text, enabled/disabled state and the
  status indicator from whether `port` is set. Call it after any connection state change.
- Output goes through `append(text, cls)`; system messages through `sys(msg, cls)`, which
  prefixes `*** ` and starts on a fresh line. CSS classes in the terminal:
  `.sys` (blue info), `.err` (red errors), `.tx` (green echoed commands, prefixed `> `).
  Received data is appended as plain text nodes, never as HTML.
- The output pane is trimmed to about 500,000 characters and always auto-scrolls.
- **Read loop**: an outer `while (port.readable && keepReading)` loop wraps an inner
  `reader.read()` loop so non-fatal errors (framing, overrun) recover with a new readable
  stream. The reader lock is always released in `finally`.
- **Disconnect order** matters: set `keepReading = false` → `reader.cancel()` → await the
  read loop → release the writer lock → `port.close()`. Errors in each step are swallowed.
- A `NotFoundError` from `requestPort()` means the user cancelled the dialog; ignore it silently.
- `navigator.serial` `disconnect` events trigger `disconnect(true)` for an unplugged controller;
  `beforeunload` closes the port.
- Error handling style: `try/catch` around each async serial call, reporting with
  `sys(message, 'err')` rather than throwing or using `alert()`.

## Styling

- Colors are CSS custom properties on `:root`, with a `prefers-color-scheme: dark` override.
- System UI font (`"Segoe UI", system-ui`) for controls; Consolas / Cascadia Mono for the
  terminal and input.
- Keep the look plain and Windows-like; no icons or extra decoration.

## Testing

There is no automated test suite. Before committing, check the script parses
(e.g. extract the `<script>` body and run `node --check`; `node --check extension/*.js`),
validate `manifest.json` as JSON, then test by hand in Chrome with the controller connected.
For the extension, Playwright's Chromium can load it unpacked (`launchPersistentContext` with
`--load-extension`, `channel: 'chromium'`) to confirm it loads and `navigator.serial` exists in
`chrome-extension://<id>/sidepanel.html`. Real port I/O can only be tested on the user's PC.

## Git

- Commit each change with a short imperative summary line.
- Push to `origin main` on GitHub after committing.
