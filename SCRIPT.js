
const R = {
  gorila:     {e:'🦍', n:'Gorila Rei'},
  ninja:      {e:'🐒', n:'Macaco Ninja'},
  capitao:    {e:'🐵', n:'Macaco Capitão'},
  embaixador: {e:'🦧', n:'Orangotango Embaixador'},
  condessa:   {e:'🙈', n:'Mico Condessa'}
};

const A = {
  renda:      {l:'Renda (+1 🍌)', c:0},
  ajuda:      {l:'Ajuda externa (+2 🍌)', c:0, b:['gorila']},
  golpe:      {l:'Golpe (7 🍌)', c:7, t:1},
  taxar:      {l:'Taxar (+3 🍌)', c:0, r:'gorila'},
  assassinar: {l:'Assassinar (3 🍌)', c:3, t:1, r:'ninja', b:['condessa']},
  extorquir:  {l:'Extorquir (rouba 2 🍌)', c:0, t:1, r:'capitao', b:['capitao','embaixador']},
  trocar:     {l:'Trocar cartas', c:0, r:'embaixador'}
};

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let P, deck, cur = null;

const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const live   = p => p.cards.filter(c => !c.dead);
const alive  = () => P.filter(p => live(p).length);
const others = p => alive().filter(q => q !== p);
const rd     = a => a[Math.floor(Math.random() * a.length)];
const rname  = r => `${R[r].e} ${R[r].n}`;

const TAGS = {
  acao: '🎬 Ação',
  desafio: '⚔️ Desafio',
  bloqueio: '🛡️ Bloqueio',
  perda: '💥 Carta perdida',
  sucesso: '✅ Resultado'
};

function log(texto, tipo = 'info', p = null) {
  const box = $('log');
  const m = document.createElement('div');
  m.className = 'msg ' + tipo + (p ? (p.human ? ' me' : ' bot') : ' sys');

  if (p) {
    const av = document.createElement('span');
    av.className = 'av';
    av.textContent = p.av;

    const bub = document.createElement('div');
    bub.className = 'bubble';

    const who = document.createElement('b');
    who.className = 'who';
    who.textContent = p.name + (TAGS[tipo] ? ' · ' + TAGS[tipo] : '');

    const txt = document.createElement('span');
    txt.textContent = texto;

    bub.append(who, txt);
    m.append(av, bub);
  } else {
    m.textContent = texto;
  }

  box.append(m);
  box.scrollTop = box.scrollHeight;
}


function status(t) { $('msg').textContent = t; }

function render() {
  $('players').innerHTML = P.map(p => {
    const vivo = live(p).length > 0;
    const cartas = p.cards.map(c => {
      const r = R[c.role];
      if (c.dead) return `<div class="c dead"><b>${r.e}</b>${r.n}</div>`;
      if (p.human) return `<div class="c"><b>${r.e}</b>${r.n}</div>`;
      return `<div class="c hid"><b>❓</b>oculta</div>`;
    }).join('');
    return `<div class="pl${p === cur ? ' turn' : ''}${vivo ? '' : ' out'}">
      <div class="ph">
        <span class="av">${p.av}</span><b>${p.name}</b>
        ${p === cur ? '<span class="vez">na vez</span>' : ''}
        ${vivo ? '' : '<em>eliminado</em>'}
        <span class="coins">${p.b} 🍌</span>
      </div>
      <div class="cards">${cartas}</div>
    </div>`;
  }).join('');
}

function ask(msg, opts) {
  return new Promise(res => {
    const panel = $('panel'), b = $('btns');
    panel.classList.add('wait');
    status(msg);
    b.innerHTML = '';
    opts.forEach(([v, l]) => {
      const x = document.createElement('button');
      x.textContent = l;
      x.onclick = () => {
        b.innerHTML = '';
        panel.classList.remove('wait');
        status('');
        res(v);
      };
      b.append(x);
    });
  });
}


async function lose(p) {
  const al = live(p);
  if (!al.length) return;
  let c;
  if (p.human && al.length > 1) {
    c = await ask('Escolha a carta que você perde:', al.map(x => [x, rname(x.role)]));
  } else {
    c = rd(al);
  }
  c.dead = true;
  log(`Perdeu a carta ${rname(c.role)}.`, 'perda', p);
  if (!live(p).length) log(`${p.name} foi eliminado da Macacada!`, 'eliminado');
  render();
  await sleep(500);
}

async function challengeRound(c, role, what) {
  for (const q of others(c)) {
    const yes = q.human
      ? await ask(`${c.name} diz ser ${rname(role)} (${what}). Desafiar?`, [[1, 'Desafiar! ⚔️'], [0, 'Deixar passar']])
      : Math.random() < 0.18;
    if (!yes) continue;

    log(`Duvido que você seja ${rname(role)}, ${c.name}!`, 'desafio', q);
    await sleep(600);

    const k = live(c).find(x => x.role === role);
    if (k) {
      log(`Mostrou a carta ${rname(role)}. O desafio de ${q.name} falhou!`, 'sucesso', c);
      deck.push(k.role);
      shuffle(deck);
      k.role = deck.pop();
      await lose(q);
      return 'proved';
    }
    log(`Não tinha ${R[role].n}. Blefe descoberto!`, 'desafio', c);
    await lose(c);
    return 'failed';
  }
  log('Ninguém desafiou.', 'info');
  return 'none';
}

async function trocar(p) {
  const al = live(p);
  const pool = [...al.map(c => c.role), deck.pop(), deck.pop()];
  const keep = [];
  for (let i = 0; i < al.length; i++) {
    const k = p.human
      ? await ask(`Trocar: escolha a carta ${i + 1} de ${al.length} para ficar:`, pool.map((r, j) => [j, rname(r)]))
      : Math.floor(Math.random() * pool.length);
    keep.push(pool.splice(k, 1)[0]);
  }
  deck.push(...pool);
  shuffle(deck);
  al.forEach((c, i) => c.role = keep[i]);
  log('Trocou cartas com o baralho.', 'sucesso', p);
}

async function turn(p) {
  cur = p;
  render();
  log(`Vez de ${p.av} ${p.name}`, 'turno');

  let a, t;
  const ok = Object.keys(A).filter(k => p.b >= A[k].c);

  if (p.human) {
    a = await ask('Sua vez! Escolha uma ação:', (p.b >= 10 ? ['golpe'] : ok).map(k => [k, A[k].l]));
  } else {
    status(`${p.av} ${p.name} está pensando…`);
    await sleep(900);
    const mine = ok.filter(k => A[k].r && live(p).some(c => c.role === A[k].r));
    a = (p.b >= 10 || (p.b >= 7 && Math.random() < 0.7))
      ? 'golpe'
      : (mine.length && Math.random() < 0.6 ? rd(mine) : rd(ok));
  }

  if (A[a].t) {
    t = p.human
      ? await ask('Escolha o alvo:', others(p).map(q => [q, `${q.av} ${q.name}`]))
      : rd(others(p));
  }

  p.b -= A[a].c;
  log(`${A[a].l}${t ? ' em ' + t.name : ''}${A[a].r ? ' — digo que sou ' + rname(A[a].r) : ''}`, 'acao', p);
  render();
  await sleep(400);


  if (A[a].r) {
    const res = await challengeRound(p, A[a].r, A[a].l);
    if (res === 'failed') {
      p.b += A[a].c;
      log(`Ação de ${p.name} cancelada.`, 'info');
      return;
    }
    if (!live(p).length || (t && !live(t).length)) return;
  }


  const bl = A[a].b;
  if (bl) {
    const candidatos = a === 'ajuda' ? others(p) : (t && live(t).length ? [t] : []);
    for (const b of candidatos) {
      if (!live(b).length) continue;
      let role = null;

      if (b.human) {
        const r = await ask(`Bloquear ${A[a].l} de ${p.name}?`,
          [...bl.map(x => [x, `Bloquear como ${rname(x)}`]), ['n', 'Não bloquear']]);
        if (r !== 'n') role = r;
      } else {
        const h = live(b).find(c => bl.includes(c.role));
        if (Math.random() < (h ? 0.7 : 0.12)) role = h ? h.role : rd(bl);
      }

      if (role) {
        log(`Bloqueio! Eu sou ${rname(role)} e bloqueio ${A[a].l} de ${p.name}.`, 'bloqueio', b);
        const res = await challengeRound(b, role, 'bloqueio');
        if (res !== 'failed') {
          log(`Ação de ${p.name} foi bloqueada.`, 'info');
          return;
        }
        log('O bloqueio caiu, a ação continua.', 'info');
      }
    }
  }


  if (a === 'renda')  { p.b += 1; log('Ganhou +1 🍌', 'sucesso', p); }
  if (a === 'ajuda')  { p.b += 2; log('Ganhou +2 🍌', 'sucesso', p); }
  if (a === 'taxar')  { p.b += 3; log('Ganhou +3 🍌', 'sucesso', p); }
  if ((a === 'golpe' || a === 'assassinar') && live(t).length) await lose(t);
  if (a === 'extorquir') {
    const n = Math.min(2, t.b);
    t.b -= n;
    p.b += n;
    log(`Roubou ${n} 🍌 de ${t.name}.`, 'sucesso', p);
  }
  if (a === 'trocar') await trocar(p);
}

async function start() {
  $('log').innerHTML = '';
  cur = null;
  deck = shuffle(Object.keys(R).flatMap(r => [r, r, r]));
  P = [
    {name: 'Você', av: '😎', human: 1},
    {name: 'Zeca', av: '🐵'},
    {name: 'Mona', av: '🦧'}
  ].map(p => ({...p, b: 2, cards: [deck.pop(), deck.pop()].map(role => ({role}))}));

  log('A Macacada começou! Cada macaco tem 2 cartas e 2 🍌.', 'turno');

  let i = 0, avisou = false;
  while (alive().length > 1) {
    
    if (!live(P[0]).length && !avisou) {
      avisou = true;
      log('Você foi eliminado, mas a Macacada continua…', 'eliminado');
    }
    const p = P[i++ % P.length];
    if (live(p).length) {
      await turn(p);
      render();
      await sleep(live(P[0]).length ? 400 : 900);
    }
  }

  cur = null;
  render();
  const w = alive()[0];
  const m = w.human ? '🏆 Você venceu a Macacada!' : `Fim de jogo. Vencedor: ${w.av} ${w.name}.`;
  log(m, 'turno');
  await ask(m, [[1, 'Jogar de novo']]);
  start();
}

start();
