# htmlSerialPort

Minimal single-page serial terminal for Chrome or Edge, using the Web Serial API.

## Use
1. Open `serial-terminal.html` in Chrome or Edge (desktop).
2. Click **Connect** and choose the controller's port in the browser's dialog.
3. Type commands in the box at the bottom and press Enter.

## Fixed settings
115200 baud, 8 data bits, no parity, 1 stop bit, no flow control. DTR/RTS are not used.
Each command is sent with a CR+LF line ending. Both are set at the top of the script
(`SERIAL_OPTIONS` and `LINE_ENDING`).

## Chrome extension (side panel)

The `extension/` folder is the same terminal packaged as a Chrome/Edge extension. It opens in the
browser's side panel, so the serial connection stays open while you browse other sites.

Install (one time):
1. Go to `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
2. Click **Load unpacked** and choose the `extension` folder.
3. Pin **Serial Terminal** from the puzzle-piece menu so its icon stays on the toolbar.

Use: click the toolbar icon to open the panel, then **Connect** as above. Closing the side panel
closes the port. After editing the extension's files, click the reload icon on its card in
`chrome://extensions`.
