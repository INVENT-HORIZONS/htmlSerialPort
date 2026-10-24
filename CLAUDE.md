# CLAUDE.md

Guidance for working on the htmlSerialPort project.

## What this is

A minimal, single-page serial terminal that runs locally in Chrome or Edge and talks to
one specific controller over USB serial. The user opens the HTML file directly from disk
(`file://`), clicks **Connect**, picks the port in the browser's dialog, and exchanges text
commands with the controller.

The UI is intentionally minimal. The owner explicitly asked for this, so do not add
features back without being asked.

## Tech stack

- **Plain HTML5 + CSS + vanilla JavaScript** in one file. No framework, no build step,
  no package manager, no external scripts, fonts or CDN assets.
- **Web Serial API** (`navigator.serial`): Chromium desktop browsers only (Chrome, Edge).
  Firefox and Safari are unsupported; the page shows a red banner when `navigator.serial`
  is missing.
- Uses `TextEncoder` / `TextDecoder` (streaming decode) for UTF-8 text I/O.
- Version control: Git, hosted at `github.com/INVENT-HORIZONS/htmlSerialPort`, branch `main`.

## Files

| File | Purpose |
|---|---|
| `serial-terminal.html` | The whole application: markup, `<style>`, and `<script>` in one file. |
| `README.md` | Short user-facing instructions and the fixed port settings. |
| `CLAUDE.md` | This file. |

Conventions:
- Keep everything in `serial-terminal.html`. Do not split out `.css` or `.js` files.
  The page must work by double-clicking it, with no server.
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
(e.g. extract the `<script>` body and run `node --check`), then test by hand in Chrome
with the controller connected.

## Git

- Commit each change with a short imperative summary line.
- Push to `origin main` on GitHub after committing.
