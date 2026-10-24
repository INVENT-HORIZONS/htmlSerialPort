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
