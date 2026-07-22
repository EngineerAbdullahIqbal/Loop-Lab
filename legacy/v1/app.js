/* The Loop Playground — vanilla-JS implementation.
   Ported faithfully from the Claude Design "Loop Playground" template.
   No backend, no localStorage/sessionStorage — all state lives in-memory. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  function scrollTerm(el) { if (el) el.scrollTop = el.scrollHeight; }
  function clampInt(v, lo, hi) { var n = parseInt(v, 10); if (!(n >= lo)) n = lo; return Math.max(lo, Math.min(hi, n || lo)); }

  function termLine(ts, text, color, weight) {
    var row = document.createElement('div');
    row.className = 'term-line';
    var t = document.createElement('span'); t.className = 'term-ts'; t.textContent = ts || '';
    var x = document.createElement('span'); x.className = 'term-txt';
    x.textContent = text; x.style.color = color || '#dfe4ec'; x.style.fontWeight = String(weight || 400);
    row.appendChild(t); row.appendChild(x);
    return row;
  }
  function idlePlaceholder(text) {
    var d = document.createElement('div');
    d.style.color = '#5f6a7b';
    d.appendChild(document.createTextNode(text));
    var c = document.createElement('span'); c.className = 'lp-cursor'; c.style.marginLeft = '6px';
    d.appendChild(c);
    return d;
  }

  // ========================================================================
  // DATA (verbatim from the design)
  // ========================================================================
  var S1_SCRIPT = [
    { kind: 'attempt',   ts: '',        text: '── attempt 1 ──────────────' },
    { kind: 'reason',    ts: '00:00.2', text: 'REASON   draft a punchy description' },
    { kind: 'act',       ts: '00:00.6', text: 'ACT      "Our revolutionary new blender effortlessly crushes ice and blends silky smoothies in mere seconds for every modern kitchen everywhere."' },
    { kind: 'observe',   ts: '00:00.9', text: 'OBSERVE  word_count=22  hype_hits=["revolutionary"]' },
    { kind: 'checkfail', ts: '00:01.0', text: 'CHECK    ✗ 22 words > 20 limit — retry' },
    { kind: 'attempt',   ts: '',        text: '── attempt 2 ──────────────' },
    { kind: 'reason',    ts: '00:01.3', text: 'REASON   cut the length, keep one strong verb' },
    { kind: 'act',       ts: '00:01.7', text: 'ACT      "Compact blender that crushes ice and blends revolutionary smoothies in seconds."' },
    { kind: 'observe',   ts: '00:02.0', text: 'OBSERVE  word_count=12  hype_hits=["revolutionary"]' },
    { kind: 'checkfail', ts: '00:02.1', text: 'CHECK    ✗ hype word "revolutionary" — retry' },
    { kind: 'attempt',   ts: '',        text: '── attempt 3 ──────────────' },
    { kind: 'reason',    ts: '00:02.4', text: 'REASON   swap the hype word for a plain verb' },
    { kind: 'act',       ts: '00:02.8', text: 'ACT      "Compact blender that crushes ice and blends smoothies in seconds."' },
    { kind: 'observe',   ts: '00:03.1', text: 'OBSERVE  word_count=11  hype_hits=[]' },
    { kind: 'checkpass', ts: '00:03.2', text: 'CHECK    ✓ 11 words, no hype — pass' },
    { kind: 'halt',      ts: '00:03.2', text: '✓ goal verified in 3 cycles — halting.' }
  ];
  var S1_COLOR = { attempt: '#3b4657', reason: '#4d9fff', act: '#f4a52a', observe: '#3ddc97', checkfail: '#ff5d5d', checkpass: '#3ddc97', halt: '#9fe6c4' };
  var KIND_COLOR = { reason: '#4d9fff', act: '#f4a52a', observe: '#3ddc97', pass: '#3ddc97', fail: '#ff5d5d', halt: '#9fe6c4', dim: '#5f6a7b' };

  var BEATS = {
    reason:  { name: 'Reason',  color: '#4d9fff', index: 1, desc: 'The model thinks about the current state and plans its next move — it decides, it does not act yet.', trace: 'REASON   draft a punchy description' },
    act:     { name: 'Act',     color: '#f4a52a', index: 2, desc: 'It does something concrete: writes text, calls a tool, makes a guess. This is the only beat that changes the world.', trace: 'ACT      "Our revolutionary new blender…"' },
    observe: { name: 'Observe', color: '#3ddc97', index: 3, desc: 'It reads back the result of the action — the fresh facts it will reason over next time.', trace: 'OBSERVE  word_count=22  hype_hits=["revolutionary"]' },
    check:   { name: 'Check',   color: '#ff5d5d', index: 4, desc: 'The verifier tests the result against the goal and decides: pass and halt, or loop again.', trace: 'CHECK    ✗ 22 words > 20 limit — retry' }
  };

  var T3 = {
    tests: {
      label: 'fix failing tests',
      init: { failing: '—', patch: '—', status: 'ready' },
      cycles: [
        { reason: 'read the failing test output', act: 'patch null guard in parseUser()', observe: 'suite: 2 failed · 10 passed', check: { pass: false, text: '✗ 2 tests still failing → loop' }, state: { failing: '2', patch: '#1', status: 'red' }, tok: 240, lat: '0.44s' },
        { reason: 'trace the two remaining failures', act: 'fix off-by-one in paginate()', observe: 'suite: 1 failed · 11 passed', check: { pass: false, text: '✗ 1 test still failing → loop' }, state: { failing: '1', patch: '#2', status: 'red' }, tok: 225, lat: '0.39s' },
        { reason: 'handle the empty-array edge case', act: 'guard empty list in render()', observe: 'suite: 0 failed · 12 passed', check: { pass: true, text: '✓ all 12 tests pass' }, state: { failing: '0', patch: '#3', status: 'green' }, tok: 230, lat: '0.41s' }
      ]
    },
    guess: {
      label: 'guess a number 1–100',
      init: { range: '1–100', guess: '—', status: 'ready' },
      cycles: [
        { reason: 'no data yet — halve the range', act: 'guess = 50', observe: 'oracle: too low → go higher', check: { pass: false, text: '✗ 50 ≠ target → loop' }, state: { range: '51–100', guess: '50', status: 'searching' }, tok: 190, lat: '0.31s' },
        { reason: 'target sits above 50', act: 'guess = 75', observe: 'oracle: too high → go lower', check: { pass: false, text: '✗ 75 ≠ target → loop' }, state: { range: '51–74', guess: '75', status: 'searching' }, tok: 205, lat: '0.28s' },
        { reason: 'midpoint of 51–74', act: 'guess = 62', observe: 'oracle: correct', check: { pass: true, text: '✓ 62 == target' }, state: { range: '62', guess: '62', status: 'solved' }, tok: 200, lat: '0.30s' }
      ]
    },
    haiku: {
      label: 'haiku, exactly 17 syllables',
      init: { count: '—', target: '17', status: 'ready' },
      cycles: [
        { reason: 'draft a 5-7-5 about winter', act: '"Morning frost lingers / sunlight rests on the cold pond / a lone crane takes flight"', observe: 'syllables: 5 / 7 / 6 = 18', check: { pass: false, text: '✗ 18 ≠ 17 → loop' }, state: { count: '18', target: '17', status: 'over' }, tok: 260, lat: '0.52s' },
        { reason: 'the last line runs one over — trim it', act: '"… / a crane takes flight" → "… / a crane flies"', observe: 'syllables: 5 / 7 / 5 = 17', check: { pass: true, text: '✓ exactly 17 syllables' }, state: { count: '17', target: '17', status: 'done' }, tok: 245, lat: '0.48s' }
      ]
    }
  };

  // ========================================================================
  // S0 / S7 — scrolling
  // ========================================================================
  function scrollToId(id) {
    var el = $(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 55, behavior: 'smooth' });
  }

  // ========================================================================
  // S1 — split screen
  // ========================================================================
  var S1 = { leftPhase: 'idle', rightPhase: 'idle', rightIdx: 0, rightTimer: null, leftTimer: null };

  function clearRight() { if (S1.rightTimer) { clearTimeout(S1.rightTimer); S1.rightTimer = null; } }

  function renderLeft() {
    var body = $('leftBody');
    body.innerHTML = '';
    if (S1.leftPhase === 'thinking') {
      var t = document.createElement('div');
      t.style.cssText = 'align-self:flex-start; background:#131924; border:1px solid #202836; border-radius:14px 14px 14px 4px; padding:13px 16px; display:flex; gap:5px;';
      for (var i = 0; i < 3; i++) {
        var dot = document.createElement('span');
        dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#5f6a7b;animation:lp-pulse 1s ease-in-out infinite;animation-delay:' + (i * 0.2) + 's;';
        t.appendChild(dot);
      }
      body.appendChild(t);
    } else if (S1.leftPhase === 'done') {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'align-self:flex-start; max-width:92%; position:relative;';
      wrap.innerHTML =
        '<div style="background:#131924; border:1px solid #202836; border-radius:14px 14px 14px 4px; padding:13px 15px; font-size:14px; line-height:1.55; color:#dfe4ec;">Our <span style="color:#ff5d5d; text-decoration:underline wavy #ff5d5d; text-underline-offset:3px;">revolutionary</span> new blender effortlessly crushes ice and blends silky smoothies in mere seconds — the <span style="color:#ff5d5d; text-decoration:underline wavy #ff5d5d; text-underline-offset:3px;">ultimate must-have</span> kitchen upgrade you will <span style="color:#ff5d5d; text-decoration:underline wavy #ff5d5d; text-underline-offset:3px;">absolutely love</span>.</div>' +
        '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:11px;">' +
          '<span style="font-family:\'IBM Plex Mono\',monospace; font-size:11.5px; color:#ff8a8a; background:rgba(255,93,93,0.1); border:1px solid rgba(255,93,93,0.32); border-radius:6px; padding:4px 9px;">✗ 23 words · limit 20</span>' +
          '<span style="font-family:\'IBM Plex Mono\',monospace; font-size:11.5px; color:#ff8a8a; background:rgba(255,93,93,0.1); border:1px solid rgba(255,93,93,0.32); border-radius:6px; padding:4px 9px;">✗ 3 hype phrases</span>' +
        '</div>' +
        '<div style="margin-top:12px; font-size:13px; line-height:1.5; color:#8a93a3; border-left:2px solid #ff5d5d; padding-left:11px;">The model answered once. It just sits there. <strong style="color:#c4ccd8; font-weight:600;">Noticing the mistake is your job.</strong></div>';
      body.appendChild(wrap);
    }
    var checks = $('leftChecks');
    if (S1.leftPhase === 'done') { checks.textContent = '1 (you)'; checks.style.color = '#ff8a8a'; }
    else { checks.textContent = '—'; checks.style.color = '#5f6a7b'; }
    $('runLeftBtn').textContent = S1.leftPhase === 'idle' ? 'Send' : 'Reset';
  }

  function runLeft() {
    if (S1.leftTimer) clearTimeout(S1.leftTimer);
    if (S1.leftPhase !== 'idle') { S1.leftPhase = 'idle'; renderLeft(); return; }
    S1.leftPhase = 'thinking'; renderLeft();
    S1.leftTimer = setTimeout(function () { S1.leftPhase = 'done'; renderLeft(); }, 1000);
  }

  function updateRightBtn() {
    $('runRightBtn').textContent = S1.rightPhase === 'idle' ? 'Run loop' : S1.rightPhase === 'running' ? 'Running…' : 'Reset';
  }
  function resetRight() {
    clearRight();
    S1.rightPhase = 'idle'; S1.rightIdx = 0;
    $('rightBody').innerHTML = '';
    $('rightCaption').style.display = 'none';
    updateRightBtn();
  }
  function runRight() {
    clearRight();
    if (S1.rightPhase !== 'idle') { resetRight(); return; }
    S1.rightIdx = 0; S1.rightPhase = 'running';
    $('rightBody').innerHTML = '';
    $('rightCaption').style.display = 'none';
    updateRightBtn();
    S1.rightTimer = setTimeout(typeNext, 250);
  }
  function typeNext() {
    var item = S1_SCRIPT[S1.rightIdx];
    if (!item) { S1.rightPhase = 'done'; $('rightCaption').style.display = 'block'; updateRightBtn(); return; }
    var body = $('rightBody');
    if (item.kind === 'attempt') {
      body.appendChild(termLine('', item.text, S1_COLOR.attempt, 400));
      S1.rightIdx++;
      scrollTerm($('rightTerm'));
      S1.rightTimer = setTimeout(typeNext, 300);
      return;
    }
    var full = item.text, shown = 0;
    var step = Math.max(1, Math.round(full.length / 44));
    var color = S1_COLOR[item.kind] || '#dfe4ec';
    var weight = (item.kind === 'checkpass' || item.kind === 'halt' || item.kind === 'checkfail') ? 600 : 400;
    var node = termLine(item.ts || '', '', color, weight);
    var txt = node.querySelector('.term-txt');
    var cursor = document.createElement('span'); cursor.className = 'lp-cursor'; cursor.style.background = color;
    txt.appendChild(cursor);
    body.appendChild(node);
    var tick = function () {
      shown += step;
      if (shown >= full.length) {
        txt.textContent = full;
        S1.rightIdx++;
        var pause = item.kind === 'checkfail' ? 520 : (item.kind === 'checkpass' || item.kind === 'halt') ? 480 : 200;
        S1.rightTimer = setTimeout(typeNext, pause);
      } else {
        txt.textContent = full.slice(0, shown);
        txt.appendChild(cursor);
        S1.rightTimer = setTimeout(tick, 11);
      }
      scrollTerm($('rightTerm'));
    };
    tick();
  }
  function runBoth() {
    clearRight(); if (S1.leftTimer) clearTimeout(S1.leftTimer);
    S1.leftPhase = 'idle'; renderLeft();
    resetRight();
    setTimeout(function () { runLeft(); runRight(); }, 40);
  }

  // ========================================================================
  // S2 — anatomy
  // ========================================================================
  var S2 = { beat: 'reason', showHalts: false };
  function renderBeat() {
    var beat = BEATS[S2.beat];
    $('ringArc').setAttribute('stroke', beat.color);
    ['reason', 'act', 'observe', 'check'].forEach(function (k) {
      var span = document.querySelector('.beat-node[data-beat="' + k + '"] span');
      if (!span) return;
      var sel = S2.beat === k;
      var sz = sel ? '42px' : '30px';
      span.style.width = sz; span.style.height = sz;
      var c = BEATS[k].color;
      span.style.boxShadow = sel ? ('0 0 0 4px ' + c + '44, 0 0 22px ' + c) : '0 2px 8px rgba(0,0,0,0.4)';
    });
    $('beatDot').style.background = beat.color;
    $('beatName').textContent = beat.name;
    $('beatIndex').textContent = 'beat ' + beat.index + ' / 4';
    $('beatDesc').textContent = beat.desc;
    $('beatTrace').textContent = beat.trace;
  }
  function renderHalts() {
    $('haltRings').style.display = S2.showHalts ? '' : 'none';
    $('haltCards').style.display = S2.showHalts ? 'grid' : 'none';
    var btn = $('haltBtn');
    btn.textContent = S2.showHalts ? '▼ Two halt conditions' : '▸ Show the two halt conditions';
    btn.style.color = S2.showHalts ? '#e7eaf0' : '#a9b2c1';
    btn.style.background = S2.showHalts ? 'rgba(77,159,255,0.08)' : 'transparent';
    btn.style.borderColor = S2.showHalts ? '#2c3644' : '#212a37';
  }

  // ========================================================================
  // S3 — live terminal engine
  // ========================================================================
  var t3 = { task: 'guess', speed: 6, cycle: 0, phase: 'idle', tokens: 0, cost: 0, latency: '—', stateObj: {}, auto: false, timer: null, clock: 0 };
  t3.stateObj = Object.assign({}, T3.guess.init);

  function t3delays() { var s = t3.speed; return { type: Math.max(4, 24 - s * 2), gap: Math.max(90, 520 - s * 45) }; }
  function t3ClearTimer() { if (t3.timer) { clearTimeout(t3.timer); t3.timer = null; } }
  function t3fmt() { t3.clock += 300 + Math.random() * 200; return (t3.clock / 1000).toFixed(1) + 's'; }

  function t3RenderStatus() {
    var map = { idle: ['ready', '#8a93a3', 'rgba(138,147,163,0.12)'], streaming: ['running', '#4d9fff', 'rgba(77,159,255,0.14)'], paused: ['paused', '#f4a52a', 'rgba(244,165,42,0.14)'], done: ['solved', '#3ddc97', 'rgba(61,220,151,0.14)'] };
    var m = map[t3.phase]; var el = $('t3Status');
    el.textContent = m[0]; el.style.color = m[1]; el.style.background = m[2];
  }
  function t3RenderRunLabel() {
    $('t3Run').textContent = (t3.phase === 'streaming' && t3.auto) ? 'Pause' : t3.phase === 'done' ? 'Run again' : t3.phase === 'paused' ? 'Resume' : 'Run';
  }
  function t3RenderHUD() {
    $('t3Cycles').textContent = t3.cycle;
    $('t3Tokens').textContent = t3.tokens.toLocaleString();
    $('t3Cost').textContent = '$' + t3.cost.toFixed(4);
    $('t3Latency').textContent = t3.latency;
  }
  function t3RenderState() {
    var wrap = $('t3State'); wrap.innerHTML = '';
    Object.keys(t3.stateObj).forEach(function (k) {
      var v = String(t3.stateObj[k]);
      var row = document.createElement('div');
      row.style.cssText = "display:flex; justify-content:space-between; gap:10px; font-family:'IBM Plex Mono',monospace; font-size:12px; border-bottom:1px dashed #1a212c; padding-bottom:8px;";
      var a = document.createElement('span'); a.style.color = '#8a93a3'; a.textContent = k;
      var b = document.createElement('span'); b.style.cssText = 'font-weight:500; text-align:right; overflow-wrap:anywhere;';
      b.style.color = (v === '—') ? '#5f6a7b' : '#4d9fff'; b.textContent = v;
      row.appendChild(a); row.appendChild(b); wrap.appendChild(row);
    });
  }
  function t3ShowIdle() {
    var body = $('t3Body'); body.innerHTML = '';
    var d = idlePlaceholder('▸ ready — press Step or Run');
    d.id = 't3Placeholder';
    body.appendChild(d);
  }
  function t3RemovePlaceholder() { var p = $('t3Placeholder'); if (p) p.remove(); }

  function t3typeLines(lines, i, done) {
    if (i >= lines.length) { done(); return; }
    var ln = lines[i]; var full = ln.text; var ts = t3fmt();
    var shown = 0; var step = Math.max(1, Math.round(full.length / 40)); var d = t3delays().type;
    var color = KIND_COLOR[ln.kind] || '#dfe4ec';
    var weight = (ln.kind === 'pass' || ln.kind === 'fail' || ln.kind === 'halt') ? 600 : 400;
    var node = termLine(ts, '', color, weight);
    var txt = node.querySelector('.term-txt');
    var cursor = document.createElement('span'); cursor.className = 'lp-cursor'; cursor.style.background = color;
    txt.appendChild(cursor);
    $('t3Body').appendChild(node);
    var tick = function () {
      shown += step;
      if (shown >= full.length) {
        txt.textContent = full;
        t3.timer = setTimeout(function () { t3typeLines(lines, i + 1, done); }, 120);
      } else {
        txt.textContent = full.slice(0, shown);
        txt.appendChild(cursor);
        t3.timer = setTimeout(tick, d);
      }
      scrollTerm($('t3Term'));
    };
    tick();
  }
  function t3StreamCycle(auto) {
    var cyc = T3[t3.task].cycles[t3.cycle];
    if (!cyc) { t3.phase = 'done'; t3RenderStatus(); t3RenderRunLabel(); return; }
    t3RemovePlaceholder();
    var lines = [
      { kind: 'reason',  text: 'REASON   ' + cyc.reason },
      { kind: 'act',     text: 'ACT      ' + cyc.act },
      { kind: 'observe', text: 'OBSERVE  ' + cyc.observe },
      { kind: cyc.check.pass ? 'pass' : 'fail', text: 'CHECK    ' + cyc.check.text }
    ];
    if (cyc.check.pass) lines.push({ kind: 'halt', text: '✓ goal verified in ' + (t3.cycle + 1) + ' cycles — halting.' });
    t3.phase = 'streaming'; t3RenderStatus(); t3RenderRunLabel();
    t3typeLines(lines, 0, function () {
      t3.cycle += 1;
      t3.tokens += cyc.tok;
      t3.cost += cyc.tok * 0.0000042;
      t3.latency = cyc.lat;
      t3.stateObj = Object.assign({}, t3.stateObj, cyc.state);
      t3.phase = cyc.check.pass ? 'done' : (auto ? 'streaming' : 'paused');
      t3RenderHUD(); t3RenderState(); t3RenderStatus(); t3RenderRunLabel();
      if (!cyc.check.pass && auto && t3.auto) t3.timer = setTimeout(function () { t3StreamCycle(true); }, t3delays().gap);
    });
  }
  function t3Reset() {
    t3ClearTimer(); t3.clock = 0; t3.auto = false;
    t3.cycle = 0; t3.tokens = 0; t3.cost = 0; t3.latency = '—'; t3.phase = 'idle';
    t3.stateObj = Object.assign({}, T3[t3.task].init);
    t3ShowIdle(); t3RenderHUD(); t3RenderState(); t3RenderStatus(); t3RenderRunLabel();
  }
  function t3SetTask(e) {
    t3.task = e.target.value;
    $('t3TaskName').textContent = 'agent://loop — ' + T3[t3.task].label;
    $('t3Prompt').textContent = '$ agent solve --task="' + t3.task + '" --verify=on';
    t3Reset();
  }
  function t3SetSpeed(e) {
    t3.speed = +e.target.value;
    $('t3SpeedLabel').textContent = t3.speed <= 3 ? 'slow' : t3.speed >= 8 ? 'fast' : 'medium';
  }
  function t3Step() {
    t3.auto = false;
    var p = t3.phase;
    if (p === 'streaming' || p === 'done') return;
    if (p === 'idle') t3.clock = 0;
    t3StreamCycle(false);
  }
  function t3Run() {
    var p = t3.phase;
    if (p === 'done') { t3Reset(); setTimeout(function () { t3.auto = true; t3StreamCycle(true); }, 30); return; }
    if (p === 'streaming' && t3.auto) { t3.auto = false; t3ClearTimer(); t3.phase = 'paused'; t3RenderStatus(); t3RenderRunLabel(); return; }
    if (p === 'idle') t3.clock = 0;
    t3.auto = true; t3StreamCycle(true);
  }

  // ========================================================================
  // S4 — break it
  // ========================================================================
  var t4 = { brk: false, safety: true, phase: 'idle', cycles: 0, cost: 0, showPlug: false, runaway: false, timer: null };
  var T4_GUESS = [50, 75, 62, 44, 81, 19, 67, 33, 90, 12, 58, 71, 26, 83, 47, 5, 99, 38, 64, 21];

  function t4ClearTimer() { if (t4.timer) { clearTimeout(t4.timer); t4.timer = null; } }

  function t4RenderToggles() {
    $('t4BreakLabel').textContent = t4.brk ? 'ON' : 'OFF';
    var bb = $('t4Break');
    bb.style.background = t4.brk ? 'rgba(255,93,93,0.14)' : '#161c27';
    bb.style.borderColor = t4.brk ? '#ff5d5d' : '#2c3644';
    $('t4BreakDot').style.background = t4.brk ? '#ff5d5d' : '#3b4657';
    $('t4SafetyLabel').textContent = t4.safety ? 'ON' : 'OFF';
    var sb = $('t4Safety');
    sb.style.background = t4.safety ? 'rgba(61,220,151,0.12)' : 'rgba(255,93,93,0.1)';
    sb.style.borderColor = t4.safety ? '#3ddc97' : '#ff5d5d';
    var sd = $('t4SafetyDot');
    sd.style.background = t4.safety ? '#3ddc97' : '#ff5d5d';
    sd.style.boxShadow = t4.safety ? '0 0 8px #3ddc97' : 'none';
    $('t4Prompt').textContent = '$ agent solve --task="guess 1-100" --verify=' + (t4.brk ? 'BROKEN' : 'on');
  }
  function t4RenderRunLabel() {
    $('t4Run').textContent = t4.phase === 'running' ? 'Running…' : (t4.phase === 'idle' ? 'Run loop' : 'Run again');
  }
  function t4RenderStatus() {
    var map = {
      idle: ['ready', '#8a93a3', 'rgba(138,147,163,0.12)'],
      running: [t4.runaway ? 'RUNAWAY' : 'running', t4.runaway ? '#ff5d5d' : '#4d9fff', t4.runaway ? 'rgba(255,93,93,0.16)' : 'rgba(77,159,255,0.14)'],
      done: ['solved', '#3ddc97', 'rgba(61,220,151,0.14)'],
      halted: ['safety stop', '#f4a52a', 'rgba(244,165,42,0.14)'],
      dead: ['terminated', '#ff5d5d', 'rgba(255,93,93,0.16)']
    };
    var m = map[t4.phase]; var el = $('t4Status');
    el.textContent = m[0]; el.style.color = m[1]; el.style.background = m[2];
  }
  function t4RenderRunaway() {
    var shake = $('t4Shake');
    shake.style.borderColor = t4.runaway ? '#e0322f' : '#223447';
    shake.style.boxShadow = t4.runaway ? '0 0 0 1px rgba(224,50,47,0.5), 0 0 46px rgba(224,50,47,0.3)' : '0 20px 50px -24px rgba(0,0,0,0.8)';
    shake.style.animation = t4.runaway ? 'lp-shake 0.4s ease-in-out infinite' : '';
    $('t4CostCard').style.borderColor = t4.runaway ? '#e0322f' : '#212a37';
    $('t4PlugWrap').style.display = t4.showPlug ? 'block' : 'none';
  }
  function t4RenderMeter() {
    var cy = $('t4Cycles'); cy.textContent = t4.cycles; cy.style.color = t4.cycles > 10 ? '#ff5d5d' : '#4d9fff';
    var co = $('t4Cost'); co.textContent = '$' + t4.cost.toFixed(4); co.style.color = t4.runaway ? '#ff5d5d' : '#3ddc97';
  }
  function t4ShowIdle() {
    var body = $('t4Body'); body.innerHTML = '';
    body.appendChild(idlePlaceholder('▸ ready — flip a switch, then Run'));
  }
  function t4push(kind, text) {
    var weight = (kind === 'pass' || kind === 'fail' || kind === 'halt') ? 600 : 400;
    $('t4Body').appendChild(termLine('', text, KIND_COLOR[kind] || '#dfe4ec', weight));
    scrollTerm($('t4Term'));
  }

  function t4solveTick(i) {
    var seq = [
      { kind: 'act',  text: 'cycle 1 · guess = 50 · observe: too low' },
      { kind: 'fail', text: 'cycle 1 · CHECK ✗ 50 ≠ target → loop' },
      { kind: 'act',  text: 'cycle 2 · guess = 75 · observe: too high' },
      { kind: 'fail', text: 'cycle 2 · CHECK ✗ 75 ≠ target → loop' },
      { kind: 'act',  text: 'cycle 3 · guess = 62 · observe: correct' },
      { kind: 'pass', text: 'cycle 3 · CHECK ✓ 62 == target' },
      { kind: 'halt', text: '✓ success stop — verified in 3 cycles.' }
    ];
    if (i >= seq.length) { t4.phase = 'done'; t4RenderStatus(); t4RenderRunLabel(); return; }
    t4push(seq[i].kind, seq[i].text);
    if (i % 2 === 1) { t4.cycles = Math.ceil((i + 1) / 2); t4.cost += 0.0008; t4RenderMeter(); }
    t4.timer = setTimeout(function () { t4solveTick(i + 1); }, 420);
  }
  function t4breakTick() {
    var n = t4.cycles + 1;
    var guess = T4_GUESS[(n - 1) % 20];
    t4.cycles = n;
    t4.cost += 0.0007 * (t4.runaway ? (1 + n * 0.12) : 1);
    t4RenderMeter();
    t4push('fail', 'cycle ' + n + ' · guess = ' + guess + ' · CHECK ✗ verifier rejected (broken)');

    if (t4.safety && n >= 10) {
      t4push('halt', '⛔ safety stop — 10 / 10 cycles used, verifier never passed.');
      t4push('dim', '→ handing back to a human for review.');
      t4.phase = 'halted'; t4.runaway = false;
      t4RenderRunaway(); t4RenderStatus(); t4RenderRunLabel();
      return;
    }
    if (!t4.safety) {
      if (!t4.showPlug && n >= 4) { t4.showPlug = true; t4.runaway = true; t4RenderRunaway(); t4RenderStatus(); t4RenderMeter(); }
      var delay = Math.max(55, 240 - n * 14);
      t4.timer = setTimeout(t4breakTick, delay);
      return;
    }
    t4.timer = setTimeout(t4breakTick, 260);
  }
  function t4Run() {
    if (t4.phase === 'running') return;
    t4ClearTimer();
    t4.phase = 'running'; t4.cycles = 0; t4.cost = 0; t4.showPlug = false;
    t4.runaway = (t4.brk && !t4.safety);
    $('t4Body').innerHTML = '';
    t4RenderRunaway(); t4RenderMeter(); t4RenderStatus(); t4RenderRunLabel();
    if (!t4.brk) t4.timer = setTimeout(function () { t4solveTick(0); }, 350);
    else t4.timer = setTimeout(t4breakTick, 350);
  }
  function t4Reset() {
    t4ClearTimer();
    t4.phase = 'idle'; t4.cycles = 0; t4.cost = 0; t4.showPlug = false; t4.runaway = false;
    t4ShowIdle(); t4RenderRunaway(); t4RenderMeter(); t4RenderStatus(); t4RenderRunLabel();
  }
  function t4PullPlug() {
    t4ClearTimer();
    t4push('fail', '⛔ plug pulled by a human at cycle ' + t4.cycles + ' — loop terminated.');
    t4push('dim', '→ that is why a loop needs a safety stop you do not have to trigger yourself.');
    t4.phase = 'dead'; t4.showPlug = false; t4.runaway = false;
    t4RenderRunaway(); t4RenderStatus(); t4RenderRunLabel();
  }
  function t4ToggleBreak() { if (t4.phase === 'running') return; t4.brk = !t4.brk; t4RenderToggles(); }
  function t4ToggleSafety() { if (t4.phase === 'running') return; t4.safety = !t4.safety; t4RenderToggles(); }

  // ========================================================================
  // S5 — blueprint builder
  // ========================================================================
  var bp = { phase: 'idle', copied: false, timer: null };
  var GATE_SHORT = { none: 'stop & report', onstop: 'ask a human', everystep: 'approve each step' };

  function bpVals() {
    return {
      goal: $('bpGoal').value, act: $('bpAct').value, observe: $('bpObserve').value,
      verifier: $('bpVerifier').value, max: $('bpMax').value, gate: $('bpGate').value
    };
  }
  function bpCheckable(goal) {
    if (!goal.trim()) return true;
    return /\d| exactly | equal| == |under |over |below |above |at least |at most |between |match|pass|less than |more than |fewer /i.test(goal);
  }
  function bpClearTimer() { if (bp.timer) { clearTimeout(bp.timer); bp.timer = null; } }

  function bpRenderCard() {
    var v = bpVals();
    $('cardGoal').textContent = v.goal.trim() || '—';
    $('cardAct').textContent = v.act.trim() || '—';
    $('cardObserve').textContent = v.observe.trim() || '—';
    $('cardVerifier').textContent = v.verifier.trim() || '—';
    $('cardMax').textContent = clampInt(v.max, 1, 50);
    $('cardGate').textContent = GATE_SHORT[v.gate];
    var hint = !bpCheckable(v.goal);
    $('bpGoal').style.borderColor = hint ? '#f4a52a' : '#2c3644';
    $('bpGoalHint').style.display = hint ? 'block' : 'none';
  }
  function bpRenderStatus() {
    var map = { idle: ['idle', '#5f6a7b'], running: ['running…', '#4d9fff'], ok: ['verified ✓', '#3ddc97'], stop: ['safety stop', '#f4a52a'] };
    var m = map[bp.phase]; var el = $('bpStatus'); el.textContent = m[0]; el.style.color = m[1];
  }
  function bpShowIdle() {
    var body = $('bpBody'); body.innerHTML = '';
    body.appendChild(idlePlaceholder('▸ fill the fields, then Run my loop'));
  }
  function bpRun() {
    bpClearTimer();
    var v = bpVals();
    var max = clampInt(v.max, 1, 50);
    var goal = v.goal.trim() || 'reach the target';
    var act = v.act.trim() || 'produce a candidate';
    var verifier = v.verifier.trim();
    var hasVerifier = verifier.length > 0;
    var solveAt = 3;
    var passes = hasVerifier && solveAt <= max;
    var stopAt = passes ? solveAt : max;

    var lines = [{ kind: 'dim', text: '$ run your-loop  ·  goal="' + goal + '"  ·  max=' + max }];
    for (var n = 1; n <= stopAt; n++) {
      lines.push({ kind: 'act', text: 'cycle ' + n + ' · ACT   ' + act });
      if (!hasVerifier) lines.push({ kind: 'fail', text: 'cycle ' + n + ' · CHECK ✗ no verifier rule — nothing can pass' });
      else if (passes && n === stopAt) lines.push({ kind: 'pass', text: 'cycle ' + n + ' · CHECK ✓ ' + verifier + ' → PASS' });
      else lines.push({ kind: 'fail', text: 'cycle ' + n + ' · CHECK ✗ ' + verifier + ' → retry' });
    }
    if (passes) {
      lines.push({ kind: 'halt', text: '✓ success stop — goal verified in ' + stopAt + ' cycles.' });
    } else {
      lines.push({ kind: 'fail', text: '⛔ safety stop — ' + max + ' / ' + max + ' cycles, goal not verified.' });
      var gate = v.gate === 'everystep' ? '→ you approved each step; nothing verified — revise the plan.'
        : v.gate === 'onstop' ? '→ human gate: handing back to you for a decision.'
        : '→ no human gate: the loop simply stopped and reported.';
      lines.push({ kind: 'dim', text: gate });
    }

    bp.phase = 'running'; bpRenderStatus();
    $('bpRun').textContent = 'Running…';
    $('bpBody').innerHTML = '';
    var i = 0;
    var reveal = function () {
      if (i >= lines.length) {
        bp.phase = passes ? 'ok' : 'stop'; bpRenderStatus();
        $('bpRun').textContent = 'Run my loop ▸';
        return;
      }
      var ln = lines[i]; i++;
      var weight = (ln.kind === 'pass' || ln.kind === 'fail' || ln.kind === 'halt') ? 600 : 400;
      $('bpBody').appendChild(termLine('', ln.text, KIND_COLOR[ln.kind] || '#dfe4ec', weight));
      scrollTerm($('bpTerm'));
      bp.timer = setTimeout(reveal, 170);
    };
    reveal();
  }
  function bpBuildPrompt() {
    var v = bpVals();
    var goal = v.goal.trim() || '(describe a checkable goal)';
    var act = v.act.trim() || '(what to do each cycle)';
    var observe = v.observe.trim() || '(what to read back)';
    var verifier = v.verifier.trim() || '(pass/fail rule)';
    var max = clampInt(v.max, 1, 50);
    var gate = v.gate === 'everystep' ? 'On every step, pause and ask a human to approve before continuing.'
      : v.gate === 'onstop' ? 'If you hit the safety stop, hand the result back to a human for a decision.'
      : 'Run fully automatically; no human approval required.';
    return 'You are an agent running a verification loop. Do not answer in one shot — iterate.\n\n' +
      'GOAL (must be verifiable): ' + goal + '\n\n' +
      'Each cycle, do all four beats:\n' +
      '  1. REASON about the current state and plan the next move.\n' +
      '  2. ACT: ' + act + '\n' +
      '  3. OBSERVE: ' + observe + '\n' +
      '  4. CHECK with this verifier rule: ' + verifier + '\n\n' +
      'STOP CONDITIONS:\n' +
      '  • Success stop: halt as soon as the verifier passes, and return the verified result.\n' +
      '  • Safety stop: if you reach ' + max + ' steps without passing, stop and report — do not keep going.\n\n' +
      'HUMAN GATE: ' + gate + '\n\n' +
      'Show your work each cycle (Reason / Act / Observe / Check), then output only the final verified result.';
  }
  function bpCopy() {
    var prompt = bpBuildPrompt();
    var flash = function () {
      $('bpCopy').textContent = 'Copied ✓';
      setTimeout(function () { $('bpCopy').textContent = 'Copy as prompt'; }, 1800);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(prompt).then(flash).catch(function () { legacyCopy(prompt); flash(); });
      } else { legacyCopy(prompt); flash(); }
    } catch (e) { legacyCopy(prompt); flash(); }
  }
  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    } catch (e) { /* no-op */ }
  }

  // ========================================================================
  // S6 — go real (in-memory only, never stored)
  // ========================================================================
  function s6RenderStatus() {
    var hasKey = $('s6Key').value.trim().length > 0;
    $('s6StatusDot').style.background = hasKey ? '#3ddc97' : '#5f6a7b';
    $('s6StatusText').textContent = hasKey
      ? 'Key held in memory for this tab only — refresh clears it. Simulation still available.'
      : 'No key set — everything above runs in simulation.';
  }
  var s6Open = false;
  function s6Toggle() {
    s6Open = !s6Open;
    $('s6Panel').style.display = s6Open ? 'block' : 'none';
    $('s6Chevron').style.transform = s6Open ? 'rotate(90deg)' : 'rotate(0deg)';
  }

  // ========================================================================
  // WIRING
  // ========================================================================
  function init() {
    // S0 / S7
    $('startBtn').addEventListener('click', function () { scrollToId('s1'); });
    $('restartBtn').addEventListener('click', function () { scrollToId('s0'); });

    // S1
    $('runLeftBtn').addEventListener('click', runLeft);
    $('runRightBtn').addEventListener('click', runRight);
    $('runBothBtn').addEventListener('click', runBoth);
    renderLeft(); updateRightBtn();

    // S2
    document.querySelectorAll('.beat-node').forEach(function (btn) {
      btn.addEventListener('click', function () { S2.beat = btn.getAttribute('data-beat'); renderBeat(); });
    });
    $('haltBtn').addEventListener('click', function () { S2.showHalts = !S2.showHalts; renderHalts(); });
    renderBeat(); renderHalts();

    // S3
    $('t3Task').addEventListener('change', t3SetTask);
    $('t3Speed').addEventListener('input', t3SetSpeed);
    $('t3Step').addEventListener('click', t3Step);
    $('t3Run').addEventListener('click', t3Run);
    $('t3Reset').addEventListener('click', t3Reset);
    t3ShowIdle(); t3RenderHUD(); t3RenderState(); t3RenderStatus(); t3RenderRunLabel();

    // S4
    $('t4Break').addEventListener('click', t4ToggleBreak);
    $('t4Safety').addEventListener('click', t4ToggleSafety);
    $('t4Run').addEventListener('click', t4Run);
    $('t4Reset').addEventListener('click', t4Reset);
    $('t4PullPlug').addEventListener('click', t4PullPlug);
    t4ShowIdle(); t4RenderToggles(); t4RenderRunaway(); t4RenderMeter(); t4RenderStatus(); t4RenderRunLabel();

    // S5
    ['bpGoal', 'bpAct', 'bpObserve', 'bpVerifier', 'bpMax'].forEach(function (id) {
      $(id).addEventListener('input', bpRenderCard);
    });
    $('bpGate').addEventListener('change', bpRenderCard);
    $('bpRun').addEventListener('click', bpRun);
    $('bpCopy').addEventListener('click', bpCopy);
    bpShowIdle(); bpRenderCard(); bpRenderStatus();

    // S6
    $('s6Toggle').addEventListener('click', s6Toggle);
    $('s6Key').addEventListener('input', s6RenderStatus);
    $('s6Clear').addEventListener('click', function () { $('s6Key').value = ''; s6RenderStatus(); });
    s6RenderStatus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
