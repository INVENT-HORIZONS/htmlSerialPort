// Runs in a small extension window. Chrome's side panel can't show the serial port picker,
// so the side panel opens this window, the user picks the port here, and the result
// (the port's index in navigator.serial.getPorts() plus its USB info) is sent back.
document.getElementById('btnChoose').onclick = async () => {
  let msg;
  try {
    const p = await navigator.serial.requestPort();
    const ports = await navigator.serial.getPorts();
    msg = { type: 'port-chosen', index: ports.indexOf(p), info: p.getInfo() };
  } catch (e) {
    msg = e.name === 'NotFoundError' ? { type: 'port-cancelled' } : { type: 'port-error', message: e.message };
  }
  try { await chrome.runtime.sendMessage(msg); } catch {}
  window.close();
};
