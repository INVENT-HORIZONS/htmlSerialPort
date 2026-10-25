// Fixed controller settings: 115200 baud, 8 data bits, no parity, 1 stop bit, no flow control.
const SERIAL_OPTIONS = { baudRate: 115200, dataBits: 8, parity: 'none', stopBits: 1, flowControl: 'none' };
const LINE_ENDING = '\r\n';   // appended to every command sent

const $ = id => document.getElementById(id);
const out = $('output');
const encoder = new TextEncoder();
let decoder = new TextDecoder();
let port = null, reader = null, writer = null, readLoopPromise = null, keepReading = false;
let atLineStart = true;

function append(text, cls) {
  if (!text) return;
  const node = cls ? Object.assign(document.createElement('span'), { className: cls, textContent: text })
                   : document.createTextNode(text);
  out.appendChild(node);
  atLineStart = text.endsWith('\n');
  while (out.textContent.length > 500000 && out.firstChild) out.removeChild(out.firstChild);
  out.scrollTop = out.scrollHeight;
}
function sys(msg, cls = 'sys') { append(`${atLineStart ? '' : '\n'}*** ${msg}\n`, cls); }

function updateUI() {
  const open = !!port;
  $('btnConnect').textContent = open ? 'Disconnect' : 'Connect';
  $('dot').classList.toggle('on', open);
  $('statusText').textContent = open ? 'Connected' : 'Disconnected';
  $('txText').disabled = $('btnSend').disabled = !open;
}

async function connect() {
  let p;
  try {
    p = await navigator.serial.requestPort();   // browser's port-picker dialog
  } catch (e) {
    if (e.name !== 'NotFoundError') sys('Port selection failed: ' + e.message, 'err');  // NotFoundError = cancelled
    return;
  }
  try {
    await p.open(SERIAL_OPTIONS);
  } catch (e) {
    sys(`Could not open port: ${e.message} (is another program using it?)`, 'err');
    return;
  }
  port = p;
  decoder = new TextDecoder();
  writer = port.writable.getWriter();
  keepReading = true;
  readLoopPromise = readLoop();
  sys('Connected.');
  updateUI();
  $('txText').focus();
}

async function readLoop() {
  // Outer loop recovers from non-fatal errors (framing, overrun): the browser supplies a new readable stream.
  while (port && port.readable && keepReading) {
    reader = port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) append(decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      if (keepReading) sys('Read error: ' + e.message, 'err');
    } finally {
      reader.releaseLock();
      reader = null;
    }
  }
}

async function disconnect(unplugged = false) {
  if (!port) return;
  keepReading = false;
  if (reader) { try { await reader.cancel(); } catch {} }
  if (readLoopPromise) { try { await readLoopPromise; } catch {} }
  if (writer) { try { writer.releaseLock(); } catch {} writer = null; }
  try { await port.close(); } catch {}
  port = null;
  sys(unplugged ? 'Controller unplugged — disconnected.' : 'Disconnected.');
  updateUI();
}

async function send() {
  const text = $('txText').value;
  if (!writer || !text) return;
  try {
    await writer.write(encoder.encode(text + LINE_ENDING));
    append(`${atLineStart ? '' : '\n'}> ${text}\n`, 'tx');
    $('txText').value = '';
  } catch (e) { sys('Write failed: ' + e.message, 'err'); }
}

$('btnConnect').onclick = () => port ? disconnect() : connect();
$('btnSend').onclick = send;
$('txText').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
$('btnClear').onclick = () => { out.textContent = ''; atLineStart = true; };

if (!('serial' in navigator)) {
  $('noSerial').style.display = 'block';
  $('btnConnect').disabled = true;
} else {
  navigator.serial.addEventListener('disconnect', e => { if (e.target === port) disconnect(true); });
  window.addEventListener('beforeunload', () => { if (port) disconnect(); });
}
updateUI();
