(() => {
  const $ = selector => document.querySelector(selector);
  const trace = $('#traceLog');
  if (!trace) return;

  const regions = {
    kernel: ['KERNEL TEXT', 'Privileged instruction space. Readable by the model, sealed against writes.'],
    device: ['DEVICE MMIO', 'A simulated memory-mapped control surface for DEVICE_01. State changes stay inside this page.'],
    user: ['USER SPACE', 'Isolated memory available to a simulated user process. It cannot address privileged regions.'],
    bus: ['VIRTUAL I/O BUS', 'A fictional bus endpoint. No physical hardware or host device is connected.']
  };
  const start = performance.now();
  let online = false;
  let traceEvents = trace.children.length;

  const stamp = () => {
    const seconds = Math.floor((performance.now() - start) / 1000);
    const value = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
      .map(part => String(part).padStart(2, '0')).join(':');
    $('#simClock').textContent = value;
    return value;
  };

  const event = (kind, message, tone = 'trace-system') => {
    const row = document.createElement('div');
    row.className = `trace-entry ${tone}`;
    const time = document.createElement('time'); time.textContent = stamp();
    const tag = document.createElement('span'); tag.textContent = `[${kind}]`;
    const text = document.createElement('p'); text.textContent = message;
    row.append(time, tag, text); trace.append(row);
    traceEvents += 1;
    $('#eventCount').textContent = String(traceEvents).padStart(3, '0');
    while (trace.children.length > 80) trace.firstElementChild.remove();
    trace.scrollTop = trace.scrollHeight;
  };

  const paintDevice = () => {
    document.body.classList.toggle('device-online', online);
    $('#deviceStage').classList.toggle('device-online', online);
    $('#coreState').textContent = online ? 'ACTIVE' : 'DORMANT';
    $('#deviceState').textContent = online ? 'ONLINE' : 'SLEEPING';
    $('#deviceSubstate').textContent = online ? 'Interrupt relay responding' : 'Awaiting simulated syscall';
    $('#deviceScreenState').textContent = online ? 'ONLINE' : 'SLEEP';
    $('#deviceGlyph').textContent = online ? '1' : 'Z';
    $('#devicePower').textContent = online ? '2.4 W' : '0.0 W';
    $('#memoryDeviceState').textContent = online ? 'ONLINE' : 'SLEEPING';
    $('#coreLight').title = online ? 'Simulation active' : 'Simulation dormant';
  };

  const syscall = operation => {
    event('syscall', `${operation}(DEVICE_01) entered kernel space.`, 'trace-call');
    if (operation === 'WAKE') {
      if (online) event('device', 'DEVICE_01 is already online; state unchanged.', 'trace-warn');
      else { online = true; paintDevice(); event('device', 'Wake relay acknowledged. DEVICE_01 is now online.', 'trace-return'); }
    } else if (operation === 'SLEEP') {
      if (!online) event('device', 'DEVICE_01 is already sleeping; state unchanged.', 'trace-warn');
      else { online = false; paintDevice(); event('device', 'Sleep request acknowledged. DEVICE_01 entered standby.', 'trace-return'); }
    } else {
      event('device', `QUERY returned state=${online ? 'ONLINE' : 'SLEEPING'}, irq=04.`, 'trace-return');
    }
    event('return', 'status = 0 · simulation complete.', 'trace-ready');
  };

  document.querySelectorAll('.memory-region').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.memory-region').forEach(region => region.classList.toggle('selected', region === button));
    const [title, description] = regions[button.dataset.region];
    $('#regionTitle').textContent = title;
    $('#regionDescription').textContent = description;
    event('mmu', `${title} selected in region inspector.`, 'trace-map');
  }));

  $('#executeSyscall').addEventListener('click', () => syscall($('#syscallSelect').value));
  $('#wakeDevice').addEventListener('click', () => syscall('WAKE'));
  $('#sleepDevice').addEventListener('click', () => syscall('SLEEP'));
  $('#resetSimulation').addEventListener('click', () => {
    online = false; traceEvents = 0; paintDevice(); $('#eventCount').textContent = '000';
    trace.replaceChildren();
    event('reset', 'Simulation reset. Virtual memory and device state restored.', 'trace-warn');
  });
  $('#clearTrace').addEventListener('click', () => {
    trace.replaceChildren(); event('clear', 'Trace cleared. Simulation state was not changed.', 'trace-system');
  });

  paintDevice(); stamp(); setInterval(stamp, 1000);
})();
