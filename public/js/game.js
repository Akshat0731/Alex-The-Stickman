const $ = s => document.querySelector(s);
const stage = $('#stage'), story = $('#story'), scoreEl = $('#score'), stEl = $('#stn');
const livesEl = $('#lives'), bubble = $('#bubble'), wrap = $('#alexwrap'), scene = $('#scene');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const STICK = `
  <svg class="stick" viewBox="0 0 60 100">
    <g class="rig">
      <path class="legL" d="M30 62L16 92"/>
      <path class="legR" d="M30 62L44 92"/>
      <path d="M30 26V62"/>
      <path class="armL" d="M30 36L12 52"/>
      <path class="armR" d="M30 36L48 52"/>
      <circle cx="30" cy="15" r="11"/>
      <rect class="mask" x="19" y="10" width="22" height="7" rx="2"/>
      <path class="beanie" d="M19 9Q30 -5 41 9Z"/>
      <g class="bag">
        <rect x="38" y="38" width="16" height="18" rx="3"/>
        <text x="46" y="51" font-size="11" text-anchor="middle">$</text>
      </g>
    </g>
  </svg>`;
$('#alexsvg').innerHTML = STICK;
const alexEl = $('#alexsvg .stick');

const PLACES = ['Street corner', 'Museum lobby', 'Keypad hall', 'Guard corridor', 'Trap floor', 'Bomb room', 'Laser vault', 'Diamond room'];
let total = 0, lives = 3, t0 = 0;

/* ---------- Alex and scene helpers ---------- */
const mood = m => alexEl.setAttribute('class', 'stick ' + (m || ''));
const drawHud = () => {
  scoreEl.textContent = total;
  livesEl.textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
  $('#code').textContent = codeText();
  $('#nb').innerHTML = clues.map(c => `<li>${c || '???'}</li>`).join('');
};
const setPlace = i => {
  scene.dataset.s = i;
  $('#place').textContent = PLACES[i];
};
async function walkTo(p) {
  wrap.style.left = p + '%';
  mood('walk');
  await sleep(1600);
  mood('');
}
const shake = () => {
  document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 500);
};
const explode = () => {
  mood('boom');
  shake();
  beep(80, .6);
  scene.classList.add('boom');
  setTimeout(() => scene.classList.remove('boom'), 800);
};

/* ---------- secret code notes + guard entrance ---------- */
let code = [], found = [null, null, null, null], clues = [null, null, null, null], noteStages = [];
const codeText = () => found.filter(d => d !== null).length + '/4 clues';
const DECOY = [
  'Just a grocery list: eggs, milk, regret.',
  'A guard\'s love letter. Awkward.',
  'An old pizza receipt. No numbers that matter.',
  'A doodle of a cat in a hat.'
];
const FACTS = {
  0: ['Alex\'s bank balance.', 'Your motivation on a Monday morning.'],
  1: ['Diamonds Alex needs.', 'Brain cells left after this plan.'],
  2: ['Legs on a stickman.', 'Eyes on a guard, if he is awake.'],
  3: ['Sides of a triangle.', 'Wheels on an auto-rickshaw.'],
  4: ['Legs on a chair.', 'Tyres on a car, not counting the spare.'],
  5: ['Fingers on one hand.', 'Stars the guard gave his coffee.'],
  6: ['Legs on an ant.', 'Faces on a dice.'],
  7: ['Days in a week.', 'Days Monday feels like.'],
  8: ['Legs on a spider.', 'Slices in a pizza.'],
  9: ['Lives of a cat.', 'Planets, back when Pluto still counted.']
};

// a riddle whose answer is the digit d (never says the digit directly)
function makeClue(d) {
  if (Math.random() < .5) {
    const m = rnd(0, 2);
    let expr;
    if (m === 0) {
      const a = rnd(0, d);
      expr = `${a} + ${d - a}`;
    } else if (m === 1) {
      const k = rnd(1, 9);
      expr = `${d + k} - ${k}`;
    } else if (d === 0) {
      expr = `0 x ${rnd(2, 9)}`;
    } else {
      const f = pick([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => d % x === 0));
      expr = `${f} x ${d / f}`;
    }
    return `Lock hint, solve it: ${expr} = ?`;
  }
  return 'Lock hint, count it: ' + pick(FACTS[d]);
}

function jingle(notes) {
  notes.forEach((f, i) => setTimeout(() => beep(f, .15), i * 120));
}

function clearNote() {
  document.querySelectorAll('.note').forEach(n => n.remove());
}

function spawnNote(i) {
  clearNote();
  const n = document.createElement('button');
  n.className = 'note';
  n.textContent = '📄';
  n.title = 'A paper on the floor';
  n.style.left = rnd(12, 52) + '%';
  n.style.bottom = rnd(42, 110) + 'px';
  n.onclick = () => {
    const k = noteStages.indexOf(i);
    let msg;
    if (k >= 0) {
      found[k] = code[k];
      clues[k] = makeClue(code[k]);
      msg = `"${clues[k]}"`;
      jingle([880, 1100, 1320]);
    } else {
      msg = pick(DECOY);
      jingle([300, 260]);
    }
    n.remove();
    drawHud();
    bubble.textContent = msg;
    bubble.classList.remove('hidden');
    setTimeout(() => bubble.classList.add('hidden'), 4200);
  };
  scene.append(n);
}

// a guard walks in from the right, stops, and challenges Alex
async function guardEnter(text) {
  const sg = document.createElement('div');
  sg.className = 'sg walking';
  sg.style.left = '108%';
  sg.innerHTML = '👮<div class="bubble hidden"></div>';
  scene.append(sg);
  await sleep(60);
  sg.style.left = (parseFloat(wrap.style.left) + 20) + '%';
  await sleep(2100);
  sg.classList.remove('walking');
  const b = sg.querySelector('.bubble');
  b.textContent = text;
  b.classList.remove('hidden');
  mood('scared');
  await sleep(2600);
  b.classList.add('hidden');
  mood('sneak');
  return sg;
}

/* ---------- music (generated, no files needed) ---------- */
let ac, mt, musicOn = false;
function beep(f, d = .15) {
  if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'square';
  o.frequency.value = f;
  g.gain.value = .05;
  g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d);
  o.connect(g);
  g.connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + d);
}
function toggleMusic(force) {
  ac = ac || new (window.AudioContext || window.webkitAudioContext)();
  musicOn = force !== undefined ? force : !musicOn;
  clearInterval(mt);
  if (musicOn) {
    const n = [262, 330, 392, 330, 294, 349, 440, 349];
    let i = 0;
    mt = setInterval(() => beep(n[i++ % 8], .3), 320);
  }
  $('#mus').textContent = 'Music: ' + (musicOn ? 'on' : 'off');
}
$('#mus').onclick = () => toggleMusic();

/* ---------- shared input: keyboard + on-screen buttons ---------- */
function pad(r, cb) {
  const m = { ArrowLeft: 'L', a: 'L', ArrowRight: 'R', d: 'R', ArrowUp: 'U', w: 'U', ArrowDown: 'D', s: 'D' };
  const kd = e => {
    const d = m[e.key];
    if (d) {
      e.preventDefault();
      cb(d);
    }
  };
  document.addEventListener('keydown', kd);
  const w = document.createElement('div');
  w.className = 'dpad';
  w.innerHTML = ['L', 'U', 'D', 'R']
    .map(d => `<button data-d="${d}">${{ U: '▲', L: '◀', D: '▼', R: '▶' }[d]}</button>`)
    .join('');
  w.onclick = e => e.target.dataset.d && cb(e.target.dataset.d);
  r.append(w);
  return () => document.removeEventListener('keydown', kd);
}

/* ---------- the 7 stages (every run uses random settings) ---------- */
const stages = [
  { // 1. Tic-tac-toe vs the guard (you must WIN; a draw means a rematch)
    story: () => 'Footsteps... a guard is coming from the right!',
    play: r => new Promise(async res => {
      const sg = await guardEnter('Play tic-tac-toe with me! Win and I let you pass.');
      const bub = sg.querySelector('.bubble');
      const say = async (t, ms = 1300) => {
        bub.textContent = t;
        bub.classList.remove('hidden');
        await sleep(ms);
        bub.classList.add('hidden');
      };
      story.textContent = 'You are X. You must WIN. A draw means a rematch!';
      const b = Array(9).fill(''), busy = { v: false };
      const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
      r.innerHTML = '<div class="ttt">' + b.map((_, i) => `<div data-i="${i}"></div>`).join('') + '</div>';
      const cells = r.firstChild.children;
      const win = p => L.some(l => l.every(i => b[i] === p));
      const full = () => b.every(v => v);
      const put = (i, p) => {
        b[i] = p;
        cells[i].textContent = p;
        cells[i].style.color = p === 'X' ? '#ff5a5f' : '#4cc9f0';
        beep(p === 'X' ? 440 : 330);
      };
      const find = p => {
        for (const l of L) {
          const e = l.filter(i => !b[i]);
          if (e.length === 1 && l.filter(i => b[i] === p).length === 2) return e[0];
        }
        return -1;
      };
      // the guard is clever only some of the time, so Alex can beat him
      const aiMove = () => {
        let m = -1;
        if (Math.random() < .85) m = find('O');
        if (m < 0 && Math.random() < .65) m = find('X');
        if (m < 0) m = pick(b.map((v, k) => v ? -1 : k).filter(k => k >= 0));
        put(m, 'O');
      };
      const reset = async () => {
        b.fill('');
        [...cells].forEach(c => { c.textContent = ''; });
        if (Math.random() < .5) {
          await sleep(300);
          aiMove();
        }
        busy.v = false;
      };
      const fin = async (ok, msg) => {
        r.onclick = null;
        await say(ok ? 'Argh! Fine, you win. Go on!' : 'Hahaha! I win!');
        if (ok) {
          sg.style.left = '110%';
          await sleep(1800);
        }
        sg.remove();
        res(ok ? { ok, pts: 100 } : { ok, msg });
      };
      r.onclick = async e => {
        const i = e.target.dataset.i;
        if (i === undefined || b[i] || busy.v) return;
        busy.v = true;
        put(+i, 'X');
        if (win('X')) return fin(true);
        if (full()) { await say('A draw?! Again!'); return reset(); }
        await sleep(450);
        aiMove();
        if (win('O')) return fin(false, 'The guard beat Alex at tic-tac-toe.');
        if (full()) { await say('A draw?! Again!'); return reset(); }
        busy.v = false;
      };
      if (Math.random() < .5) aiMove();
    })
  },

  { // 2. Simon says (random length)
    story: () => 'Security keypad! Copy the pattern.',
    play: async r => {
      const rounds = rnd(4, 7), seq = [];
      r.innerHTML = '<div class="simon">' + [0, 1, 2, 3].map(i => `<div class="pad p${i}" data-i="${i}"></div>`).join('') + '</div>';
      const pads = [...r.querySelectorAll('.pad')];
      const flash = async i => {
        pads[i].classList.add('on');
        beep(300 + i * 100);
        await sleep(350);
        pads[i].classList.remove('on');
        await sleep(150);
      };
      for (let n = 1; n <= rounds; n++) {
        seq.push(rnd(0, 3));
        story.textContent = `Watch the pattern (round ${n}/${rounds})`;
        await sleep(500);
        for (const s of seq) await flash(s);
        story.textContent = 'Your turn!';
        for (let k = 0; k < seq.length; k++) {
          const i = await new Promise(rs => {
            r.onclick = e => {
              const d = e.target.closest('.pad');
              if (d) { r.onclick = null; rs(+d.dataset.i); }
            };
          });
          flash(i);
          if (i !== seq[k]) return { ok: false, msg: 'Wrong pattern! The alarm rings.' };
        }
      }
      return { ok: true, pts: 40 + rounds * 20 };
    }
  },

  { // 3. 2048 with a random goal (a tile OR a score)
    story: () => 'The vault dial is a sliding puzzle.',
    play: r => new Promise(res => {
      const g = Array(16).fill(0);
      const mode = Math.random() < .5 ? 'tile' : 'score';
      const goal = mode === 'tile' ? pick([32, 32, 64, 64, 128, 256]) : rnd(3, 10) * 50;
      const pts = mode === 'tile' ? 40 + goal / 2 : 60 + goal / 4;
      let score = 0, off;
      story.textContent = mode === 'tile' ? `Merge tiles until you make a ${goal}.` : `Earn ${goal} points by merging tiles.`;
      r.innerHTML = '<p id="goal"></p><div class="g2048"></div>';
      const board = r.querySelector('.g2048');
      const add = () => {
        const e = g.map((v, i) => v ? -1 : i).filter(i => i >= 0);
        g[pick(e)] = Math.random() < .8 ? 2 : 4;
      };
      const draw = () => {
        board.innerHTML = g.map(v => `<div class="t t${v}">${v || ''}</div>`).join('');
        $('#goal').textContent = mode === 'tile' ? `Goal: ${goal}` : `Score: ${score} / ${goal}`;
      };
      const line = a => {
        a = a.filter(v => v);
        for (let i = 0; i < a.length - 1; i++) {
          if (a[i] === a[i + 1]) {
            a[i] *= 2;
            score += a[i];
            a.splice(i + 1, 1);
          }
        }
        while (a.length < 4) a.push(0);
        return a;
      };
      const stuck = () => g.every((v, i) => v && (i % 4 > 2 || v !== g[i + 1]) && (i > 11 || v !== g[i + 4]));
      const move = d => {
        const o = g.join();
        for (let k = 0; k < 4; k++) {
          const ix = [0, 1, 2, 3].map(j =>
            d === 'L' ? k * 4 + j : d === 'R' ? k * 4 + 3 - j : d === 'U' ? j * 4 + k : (3 - j) * 4 + k);
          const l = line(ix.map(i => g[i]));
          ix.forEach((i, j) => g[i] = l[j]);
        }
        if (g.join() === o) return;
        add();
        draw();
        beep(520, .08);
        const won = mode === 'tile' ? Math.max(...g) >= goal : score >= goal;
        if (won) { off(); res({ ok: true, pts }); }
        else if (stuck()) { off(); res({ ok: false, msg: 'The vault dial jammed.' }); }
      };
      add(); add(); draw();
      off = pad(r, move);
    })
  },

  { // 4. NEW: sneak past the sleepy guard (red light / green light)
    story: () => 'Hold the button to sneak while his back is turned. FREEZE when he looks!',
    play: r => new Promise(res => {
      r.innerHTML = `
        <div class="guard">
          <div id="gd" class="away">👮</div>
          <p id="gs">Back turned. Go go go!</p>
          <div class="bar"><i id="gp"></i></div>
          <button id="hold">Hold to sneak (or hold Space)</button>
        </div>`;
      let prog = 0, hold = false, phase = 'away', left = rnd(15, 25) / 10, last = performance.now();
      const rate = rnd(18, 28);
      const startX = parseFloat(wrap.style.left) || 30, endX = startX + 7;
      const sg = document.createElement('div');
      sg.className = 'sg away';
      sg.textContent = '👮';
      sg.style.left = (startX + 20) + '%';
      scene.append(sg);
      wrap.style.transition = 'left .15s linear';
      let cur = '';
      const set = (p, text, d) => {
        phase = p;
        left = d;
        $('#gs').textContent = text;
        $('#gd').className = p;
        sg.className = 'sg ' + p;
      };
      const kd = e => { if (e.code === 'Space') { e.preventDefault(); hold = true; } };
      const ku = e => { if (e.code === 'Space') hold = false; };
      document.addEventListener('keydown', kd);
      document.addEventListener('keyup', ku);
      const btn = $('#hold');
      btn.onpointerdown = () => hold = true;
      btn.onpointerup = btn.onpointerleave = () => hold = false;
      const finish = o => {
        clearInterval(iv);
        sg.remove();
        wrap.style.transition = '';
        document.removeEventListener('keydown', kd);
        document.removeEventListener('keyup', ku);
        res(o);
      };
      const iv = setInterval(() => {
        const now = performance.now(), dt = (now - last) / 1000;
        last = now;
        left -= dt;
        if (left <= 0) {
          if (phase === 'away') set('warn', 'He is turning...', .7);
          else if (phase === 'warn') set('look', 'FREEZE! He is looking!', rnd(10, 22) / 10);
          else set('away', 'Back turned. Go go go!', rnd(14, 28) / 10);
        }
        if (hold && phase === 'look') return finish({ ok: false, msg: 'The guard saw Alex moving!' });
        if (hold) {
          prog += rate * dt;
          $('#gp').style.width = Math.min(100, prog) + '%';
        }
        wrap.style.left = (startX + Math.min(100, prog) / 100 * (endX - startX)) + '%';
        const m = hold ? 'walk' : 'sneak';
        if (m !== cur) {
          cur = m;
          mood(m);
        }
        if (prog >= 100) finish({ ok: true, pts: 120 });
      }, 40);
    })
  },

  { // 5. Top-down memory path (random grid size)
    story: () => 'Floor tiles are trapped! Memorize the safe path (green), then walk it from top-left to bottom-right.',
    play: r => new Promise(async res => {
      const N = rnd(4, 6);
      let x = 0, y = 0;
      const path = new Set(['0,0']);
      while (x < N - 1 || y < N - 1) {
        if (x === N - 1) y++;
        else if (y === N - 1) x++;
        else Math.random() < .5 ? x++ : y++;
        path.add(x + ',' + y);
      }
      let h = '';
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) h += `<div data-k="${i},${j}" class="${path.has(i + ',' + j) ? 'lit' : ''}"></div>`;
      }
      r.innerHTML = `<div class="maze" style="grid-template-columns:repeat(${N},52px)">${h}</div>`;
      const cell = (a, b) => r.querySelector(`[data-k="${a},${b}"]`);
      await sleep(2000 + N * 400);
      r.querySelectorAll('.lit').forEach(c => c.classList.remove('lit'));
      x = 0;
      y = 0;
      cell(0, 0).classList.add('me');
      story.textContent = 'Now walk it from memory!';
      const mv = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };
      const off = pad(r, d => {
        const nx = x + mv[d][0], ny = y + mv[d][1];
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;
        cell(x, y).classList.remove('me');
        x = nx; y = ny;
        cell(x, y).classList.add('me');
        beep(260, .06);
        if (!path.has(x + ',' + y)) {
          cell(x, y).classList.add('bad');
          off();
          res({ ok: false, msg: 'Trap tile! Alex fell through the floor.' });
        } else if (x === N - 1 && y === N - 1) {
          off();
          res({ ok: true, pts: 60 + N * 20 });
        }
      });
    })
  },

  { // 6. Defuse the bomb (random target and hide time)
    story: () => 'A bomb! Stop the timer as close to the target as you can.',
    play: r => new Promise(res => {
      const T = rnd(5, 10), hideAt = rnd(2, 3), s = Date.now();
      story.textContent = `A bomb! The display vanishes after ${hideAt}s. Stop at ${T}s.`;
      r.innerHTML = `
        <div class="bomb">💣
          <h2 id="bt">0.0</h2>
          <p>Stop at exactly <b>${T}s</b></p>
          <button id="bs">DEFUSE</button>
        </div>`;
      const bt = $('#bt');
      const iv = setInterval(() => {
        const e = (Date.now() - s) / 1000;
        bt.textContent = e < hideAt ? e.toFixed(1) : '??';
        if (e > T + 2) { clearInterval(iv); res({ ok: false, msg: 'Too slow. KABOOM.' }); }
      }, 100);
      $('#bs').onclick = () => {
        clearInterval(iv);
        const e = (Date.now() - s) / 1000, d = Math.abs(e - T);
        bt.textContent = e.toFixed(2) + 's';
        if (d <= 1) res({ ok: true, pts: Math.round(200 - d * 150) });
        else res({ ok: false, msg: `Stopped at ${e.toFixed(1)}s instead of ${T}s. KABOOM.` });
      };
    })
  },

  { // 7. Laser escape (random laser count, speed, gaps)
    story: () => 'Final room! Slip through the gaps in the laser beams and reach the green exit at the top.',
    play: r => new Promise(res => {
      const W = 420, H = 400, GAP = 130, count = rnd(3, 4);
      r.innerHTML = `<canvas id="cv" width="${W}" height="${H}"></canvas>`;
      const c = $('#cv').getContext('2d');
      const lasers = Array.from({ length: count }, (_, i) => ({
        y: 80 + i * (270 / count),
        sp: rnd(5, 11) / 10,
        ph: rnd(0, 6)
      }));
      const p = { x: W / 2, y: H - 20 };
      const start = performance.now();
      let raf, done = false;
      const off = pad(r, d => {
        if (d === 'L') p.x -= 18;
        if (d === 'R') p.x += 18;
        if (d === 'U') p.y -= 18;
        if (d === 'D') p.y += 18;
        p.x = Math.max(10, Math.min(W - 10, p.x));
        p.y = Math.min(H - 12, p.y);
      });
      const finish = o => {
        if (done) return;
        done = true;
        cancelAnimationFrame(raf);
        off();
        res(o);
      };
      const loop = now => {
        const t = (now - start) / 1000;
        c.clearRect(0, 0, W, H);
        c.fillStyle = '#5be584';
        c.fillRect(0, 0, W, 28);
        c.fillStyle = '#0b0a1f';
        c.font = 'bold 14px sans-serif';
        c.fillText('EXIT', W / 2 - 16, 19);
        for (const l of lasers) {
          const gx = (Math.sin(t * l.sp + l.ph) + 1) / 2 * (W - GAP);
          c.fillStyle = '#ff3b3b';
          c.fillRect(0, l.y - 8, 8, 16);
          c.fillRect(W - 8, l.y - 8, 8, 16);
          c.strokeStyle = 'rgba(91,229,132,.5)';
          c.setLineDash([4, 4]);
          c.beginPath();
          c.moveTo(gx, l.y);
          c.lineTo(gx + GAP, l.y);
          c.stroke();
          c.setLineDash([]);
          c.strokeStyle = '#ff3b3b';
          c.lineWidth = 3 + Math.random();
          c.shadowColor = '#ff3b3b';
          c.shadowBlur = 14;
          c.beginPath();
          c.moveTo(8, l.y); c.lineTo(gx, l.y);
          c.moveTo(gx + GAP, l.y); c.lineTo(W - 8, l.y);
          c.stroke();
          c.shadowBlur = 0;
          if (Math.abs(p.y - l.y) < 12 && (p.x - 6 < gx || p.x + 6 > gx + GAP)) {
            return finish({ ok: false, msg: 'Zap! Alex touched a laser.' });
          }
        }
        c.fillStyle = '#ffcc33';
        c.strokeStyle = '#fff';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(p.x, p.y, 9, 0, 7);
        c.fill();
        c.stroke();
        if (p.y < 32) return finish({ ok: true, pts: 100 + count * 30 });
        if (t > 60) return finish({ ok: false, msg: 'Too slow. The alarm went off.' });
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })
  }
];

/* ---------- doors between stages: each hides something, with a clue ---------- */
const DOORS = {
  treasure: {
    w: () => 3,
    hints: ['Coins clink softly behind this door.', 'A golden glow leaks from under it.'],
    msg: 'A hidden stash of cash! +80', pts: 80, icon: '💰'
  },
  medkit: {
    w: () => lives < 3 ? 3 : 1,
    hints: ['It smells like a first-aid kit.', 'Someone scratched a tiny red cross on it.'],
    msg: 'A medkit! +1 life (+20)', pts: 20, life: 1, icon: '🩹'
  },
  guard: {
    w: () => 2,
    hints: ['You hear snoring and heavy boots.', 'Strong coffee smell. A guard is on break.'],
    msg: 'A guard woke up and took Alex\'s lunch money. -50', pts: -50, icon: '👮'
  },
  trap: {
    w: () => 3,
    hints: ['Something is ticking behind it.', 'Burnt smell, loose wires poking out.', 'A red light blinks through the keyhole.'],
    msg: 'BOOM! A booby trap!', trap: true, icon: '💣'
  }
};

function pickDoors() {
  const bag = [];
  Object.keys(DOORS).forEach(k => {
    for (let n = 0; n < DOORS[k].w(); n++) bag.push(k);
  });
  const a = pick(bag);
  return [a, pick(bag.filter(k => k !== a))];
}

// the doors stand inside the scene; returns true if Alex died at this door
async function doorChoice() {
  const ks = pickDoors(), xs = [62, 82];
  story.textContent = 'Two doors ahead. Read the clues, then click a door.' +
    (document.querySelector('.note') ? ' A paper 📄 lies in the room: grab it first!' : '');
  const els = ks.map((k, n) => {
    const d = document.createElement('button');
    d.className = 'sdoor';
    d.style.cssText = `left:${xs[n]}%;--h:${rnd(0, 360)}`;
    d.dataset.n = n;
    d.innerHTML = `<b>${n ? 'B' : 'A'}</b><i></i>`;
    scene.append(d);
    return d;
  });
  stage.innerHTML = '<div class="doors">' + ks.map((k, n) => `
    <div class="doorbox" data-n="${n}">
      <b>Door ${n ? 'B' : 'A'}</b>
      <p class="clue">"${pick(DOORS[k].hints)}"</p>
    </div>`).join('') + '</div>';
  const n = await new Promise(res => {
    const h = e => {
      const t = e.target.closest('[data-n]');
      if (t) {
        scene.onclick = stage.onclick = null;
        res(+t.dataset.n);
      }
    };
    scene.onclick = stage.onclick = h;
  });
  const d = DOORS[ks[n]];
  els.forEach(e => { e.disabled = true; });
  stage.innerHTML = '';
  await walkTo(xs[n] - 9);
  els[n].classList.add('open');
  els[n].querySelector('i').textContent = d.icon;
  jingle([330, 440]);
  stage.innerHTML = `<div class="msg"><h3>${d.icon}</h3><p>${d.msg}</p></div>`;
  if (d.trap) {
    explode();
    await sleep(1800);
    if (await lose('Alex opened a booby-trapped door.')) return true;
  } else {
    total = Math.max(0, total + (d.pts || 0));
    lives = Math.min(3, lives + (d.life || 0));
    drawHud();
    mood(d.pts < 0 ? 'scared' : 'cheer');
    await sleep(1800);
    mood('');
  }
  // walk through the door into the next room
  wrap.style.left = (xs[n] + 2) + '%';
  mood('walk');
  await sleep(1600);
  mood('');
  scene.classList.add('dark');
  await sleep(600);
  return false;
}

// removes a life; returns true if the game ended
async function lose(msg) {
  jingle([220, 165]);
  lives--;
  drawHud();
  if (lives <= 0) {
    end(false, msg);
    return true;
  }
  mood('scared');
  shake();
  stage.innerHTML = `<div class="msg"><h3>Ouch!</h3><p>${msg}</p><p>Lives left: ${lives}. Try again!</p></div>`;
  await sleep(2200);
  mood('');
  return false;
}

/* ---------- intro cutscene ---------- */
async function enterRoom(i, x) {
  scene.querySelectorAll('.sdoor').forEach(d => d.remove());
  clearNote();
  setPlace(i);
  wrap.style.transition = 'none';
  wrap.style.left = '6%';
  await sleep(80);
  wrap.style.transition = '';
  scene.classList.remove('dark');
  await walkTo(x);
}

async function intro() {
  let skip = false;
  const skipBtn = document.createElement('button');
  skipBtn.textContent = 'Skip intro';
  skipBtn.className = 'skip';
  skipBtn.onclick = () => { skip = true; };
  document.body.append(skipBtn);
  skipBtn.style.position = 'fixed';
  const w = ms => skip ? 0 : sleep(ms);
  const say = async (t, ms = 2200) => {
    if (skip) return;
    bubble.textContent = t;
    bubble.classList.remove('hidden');
    await sleep(ms);
    bubble.classList.add('hidden');
  };
  const prop = (cls, html, style) => {
    const e = document.createElement('div');
    e.className = cls;
    e.innerHTML = html;
    Object.assign(e.style, style);
    scene.append(e);
    return e;
  };
  stage.innerHTML = '';
  scene.classList.remove('dark');
  wrap.classList.remove('masked');
  $('#diamond').classList.remove('show', 'grab');
  wrap.style.transition = 'none';
  wrap.style.left = '30%';
  setTimeout(() => { wrap.style.transition = ''; }, 50);
  setPlace(0);
  mood('sneak');
  prop('prop', '🥣', { left: '38%' });
  prop('prop sign', 'PLEASE HELP', { left: '14%' });
  story.textContent = 'Meet Alex. No job, no money. He begs on the street all day.';
  await say('Please... spare some change?');
  if (!skip) {
    const walker = prop('prop walker', '🚶', { left: '105%' });
    await sleep(60);
    walker.style.left = '-10%';
    await sleep(2800);
    walker.remove();
  }
  await say('Nobody even looked at me...', 1800);
  story.textContent = 'Suddenly, a newspaper flies right into his face...';
  if (!skip) {
    const paper = prop('prop flynews', '📰', { left: '105%', bottom: '150px' });
    await sleep(60);
    paper.style.left = '31%';
    paper.style.bottom = '60px';
    paper.style.transform = 'rotate(540deg)';
    await sleep(1300);
    mood('scared');
    paper.remove();
  }
  const news = prop('news', '📰 MUSEUM HIRING NIGHT GUARDS!<br><small>The Blue Star Diamond goes on display tonight. Security is short-staffed. Apply now.</small>', {});
  story.textContent = 'He reads it: a priceless diamond arrives tonight, and the museum is short of guards.';
  await w(4200);
  news.remove();
  scene.querySelectorAll('.prop').forEach(e => e.remove());
  mood('');
  await say('A diamond... and hardly any guards...', 2200);
  mood('cheer');
  await say('Why beg for coins when I can STEAL it!', 2400);
  story.textContent = 'Mask on. Bag packed. Terrible plan, fully committed.';
  wrap.classList.add('masked');
  mood('sneak');
  await w(1800);
  mood('');
  story.textContent = 'Rumor: the diamond sits in a glass box. Guards leave lock hints on papers all over the museum. Find them!';
  await w(3200);
  skipBtn.remove();
  scene.querySelectorAll('.prop, .news').forEach(e => e.remove());
  wrap.classList.add('masked');
  bubble.classList.add('hidden');
  scene.classList.add('dark');
  await sleep(600);
}

/* ---------- game flow ---------- */
const TITLES = ['Guard Duel', 'Keypad Hall', 'Vault Dial', 'Sleepy Guard', 'Trap Floor', 'Bomb Room', 'Laser Vault'];

// final puzzle: open the glass box with the code from the notes
function glassBox() {
  return new Promise(res => {
    story.textContent = 'The diamond is in a glass box. Solve your notebook clues, in order, to get the 4-digit code!';
    let tries = 3, entry = '';
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, 'OK'];
    stage.innerHTML = `
      <div class="glass">
        <div id="gbox" class="gbox">💎</div>
        <div id="disp" class="disp">----</div>
        <p id="fb">Clues found: ${codeText()} &middot; Attempts left: ${tries}</p>
        <ol class="nbf">${clues.map(c => `<li>${c || '???'}</li>`).join('')}</ol>
        <div class="keys">${keys.map(k => `<button data-k="${k}">${k}</button>`).join('')}</div>
      </div>`;
    const disp = $('#disp'), fb = $('#fb');
    const show = () => { disp.textContent = entry.padEnd(4, '-'); };
    const done = o => {
      document.removeEventListener('keydown', kd);
      stage.onclick = null;
      res(o);
    };
    const submit = async () => {
      if (entry.length < 4) return;
      const c = entry.split('').filter((d, i) => +d === code[i]).length;
      if (c === 4) {
        $('#gbox').classList.add('open');
        jingle([523, 659, 784, 1047]);
        stage.onclick = null;
        document.removeEventListener('keydown', kd);
        await sleep(1500);
        return done({ ok: true });
      }
      tries--;
      beep(150, .3);
      if (tries <= 0) return done({ ok: false, msg: 'Wrong code three times. The glass box locked down!' });
      fb.textContent = `${c} digit(s) in the right place. Attempts left: ${tries}`;
      entry = '';
      show();
    };
    const press = k => {
      if (k === '⌫') entry = entry.slice(0, -1);
      else if (k === 'OK') return submit();
      else if (entry.length < 4) entry += k;
      beep(500, .05);
      show();
      if (entry.length === 4) submit();
    };
    const kd = e => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('⌫');
      else if (e.key === 'Enter') press('OK');
    };
    document.addEventListener('keydown', kd);
    stage.onclick = e => {
      const b = e.target.closest('button');
      if (b) press(b.dataset.k);
    };
  });
}

async function run() {
  total = 0;
  lives = 3;
  t0 = Date.now();
  code = Array.from({ length: 4 }, () => rnd(0, 9));
  noteStages = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - .5).slice(0, 4).sort((a, b) => a - b);
  found = [null, null, null, null];
  clues = [null, null, null, null];
  $('#diamond').classList.remove('show', 'grab');
  drawHud();
  for (let i = 0; i < stages.length; i++) {
    stEl.textContent = `${i + 1}/${stages.length}`;
    stage.innerHTML = '';
    await enterRoom(i + 1, 30);
    stage.innerHTML = `<div class="title"><small>STAGE ${i + 1}</small><h2>${TITLES[i]}</h2></div>`;
    jingle([392, 523]);
    await sleep(1300);
    for (;;) {
      stage.innerHTML = '';
      story.textContent = stages[i].story();
      mood('sneak');
      const r = await stages[i].play(stage);
      mood('');
      if (r.ok) {
        total += r.pts;
        drawHud();
        mood('cheer');
        jingle([523, 659, 784]);
        spawnNote(i);
        stage.innerHTML = `<div class="msg"><h3>✅</h3><p>Stage cleared! +${r.pts}</p><p>Something dropped in the room above. Find the 📄!</p></div>`;
        await sleep(2000);
        mood('');
        break;
      }
      if (await lose(r.msg)) return;
    }
    if (i < stages.length - 1 && await doorChoice()) return;
  }
  stEl.textContent = 'Final';
  stage.innerHTML = '';
  $('#diamond').classList.add('show');
  await enterRoom(7, 70);
  for (;;) {
    const r = await glassBox();
    if (r.ok) break;
    if (await lose(r.msg)) return;
  }
  $('#diamond').classList.add('grab');
  mood('cheer');
  await sleep(1200);
  end(true);
}

async function end(won, msg) {
  const secs = Math.round((Date.now() - t0) / 1000);
  if (won) total += Math.max(0, 900 - secs);   // speed bonus
  drawHud();
  if (!won) explode();
  const box = $('#end');
  box.className = won ? 'win' : 'lose';
  box.innerHTML = `
    <div class="card">
      ${STICK}
      <h2>${won ? 'Heist complete!' : 'Game over'}</h2>
      <p>${won ? 'Alex escaped with the diamond.' : msg}</p>
      <p>Score: <b>${total}</b> &middot; Time: ${secs}s</p>
      <p id="sv"></p>
      <button id="again">Play again</button>
    </div>`;
  box.querySelector('.stick').style.width = '90px';
  if (won) {
    for (let i = 0; i < 40; i++) {
      const d = document.createElement('i');
      d.className = 'confetti';
      d.style.cssText = `left:${Math.random() * 100}vw;background:hsl(${Math.random() * 360},90%,60%);animation-duration:${2 + Math.random() * 2}s`;
      box.append(d);
    }
  }
  jingle(won ? [523, 659, 784, 1047] : [300, 220, 150, 110]);
  $('#diamond').classList.remove('grab');
  $('#again').onclick = async () => {
    box.className = 'hidden';
    await intro();
    run();
  };
  try {
    const r = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total, timeMs: Date.now() - t0, completed: won, route: '' })
    }).then(x => x.json());
    $('#sv').textContent = r.saved ? 'Score saved to the leaderboard.' : 'Log in to save your score.';
    refreshBoard();
  } catch (e) { }
}

async function refreshBoard() {
  try {
    const l = await fetch('/api/leaderboard').then(r => r.json());
    $('#lb').innerHTML = l.length
      ? l.map(x => `<li><span>${x._id.replace(/</g, '&lt;')}</span><b>${x.best}</b></li>`).join('')
      : '<li>No scores yet</li>';
  } catch (e) { }
}
setInterval(refreshBoard, 15000);

drawHud();
$('#start').onclick = async () => {
  toggleMusic(true);
  await intro();
  run();
};
