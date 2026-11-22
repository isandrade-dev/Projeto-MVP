const R={gorila:{e:'🦍',n:'Gorila Rei'},ninja:{e:'🐒',n:'Macaco Ninja'},capitao:{e:'🐵',n:'Macaco Capitão'},embaixador:{e:'🦧',n:'Orangotango Embaixador'},condessa:{e:'🙈',n:'Mico Condessa'}};
const A={renda:{l:'Renda (+1 🍌)',c:0},ajuda:{l:'Ajuda externa (+2 🍌)',c:0,b:['gorila']},golpe:{l:'Golpe (7 🍌)',c:7,t:1},taxar:{l:'Taxar (+3 🍌)',c:0,r:'gorila'},assassinar:{l:'Assassinar (3 🍌)',c:3,t:1,r:'ninja',b:['condessa']},extorquir:{l:'Extorquir (rouba 2 🍌)',c:0,t:1,r:'capitao',b:['capitao','embaixador']},trocar:{l:'Trocar cartas',c:0,r:'embaixador'}};
const $=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms));
let P,deck;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const live=p=>p.cards.filter(c=>!c.dead),alive=()=>P.filter(p=>live(p).length),others=p=>alive().filter(q=>q!==p),rd=a=>a[Math.floor(Math.random()*a.length)];
function log(t){const d=document.createElement('div');d.textContent=t;$('log').prepend(d)}
function render(){$('players').innerHTML=P.map(p=>`<div class="pl"><b>${p.name}</b> · ${p.b} 🍌${live(p).length?'':' · eliminado'}<div class="cards">${p.cards.map(c=>{const r=R[c.role];return c.dead?`<div class="c dead"><b>${r.e}</b>${r.n}</div>`:p.human?`<div class="c"><b>${r.e}</b>${r.n}</div>`:`<div class="c hid"><b>❓</b>oculta</div>`}).join('')}</div></div>`).join('')}
function ask(msg,opts){return new Promise(res=>{$('msg').textContent=msg;const b=$('btns');b.innerHTML='';opts.forEach(([v,l])=>{const x=document.createElement('button');x.textContent=l;x.onclick=()=>{b.innerHTML='';$('msg').textContent='';res(v)};b.append(x)})})}
async function lose(p){const al=live(p);if(!al.length)return;let c;
 if(p.human&&al.length>1){c=await ask('Escolha a carta que você perde:',al.map(x=>[x,R[x.role].e+' '+R[x.role].n]))}else c=rd(al);
 c.dead=true;log(`${p.name} perdeu ${R[c.role].e} ${R[c.role].n}.`);render();await sleep(500)}
async function challengeRound(c,role,what){
 for(const q of others(c)){
  const yes=q.human?await ask(`${c.name} diz ser ${R[role].e} ${R[role].n} (${what}). Desafiar?`,[[1,'Desafiar!'],[0,'Deixar passar']]):Math.random()<.18;
  if(!yes)continue;
  log(`${q.name} desafia ${c.name}!`);
  const k=live(c).find(x=>x.role===role);
  if(k){log(`${c.name} mostra ${R[role].e} ${R[role].n}. O desafio falhou!`);deck.push(k.role);shuffle(deck);k.role=deck.pop();await lose(q);return'proved'}
  log(`${c.name} não tinha ${R[role].n}. Blefe descoberto!`);await lose(c);return'failed'}
 return'none'}
async function trocar(p){const al=live(p),pool=[...al.map(c=>c.role),deck.pop(),deck.pop()],keep=[];
 for(let i=0;i<al.length;i++){const k=p.human?await ask(`Trocar: escolha a carta ${i+1} de ${al.length} para ficar:`,pool.map((r,j)=>[j,R[r].e+' '+R[r].n])):Math.floor(Math.random()*pool.length);keep.push(pool.splice(k,1)[0])}
 deck.push(...pool);shuffle(deck);al.forEach((c,i)=>c.role=keep[i])}
async function turn(p){
 render();let a,t;const ok=Object.keys(A).filter(k=>p.b>=A[k].c);
 if(p.human)a=await ask('Sua vez! Escolha uma ação:',(p.b>=10?['golpe']:ok).map(k=>[k,A[k].l]));
 else{await sleep(800);const mine=ok.filter(k=>A[k].r&&live(p).some(c=>c.role===A[k].r));a=p.b>=10||(p.b>=7&&Math.random()<.7)?'golpe':(mine.length&&Math.random()<.6?rd(mine):rd(ok))}
 if(A[a].t)t=p.human?await ask('Escolha o alvo:',others(p).map(q=>[q,q.name])):rd(others(p));
 p.b-=A[a].c;log(`${p.name}: ${A[a].l}${t?' → '+t.name:''}`);render();
 if(A[a].r){const res=await challengeRound(p,A[a].r,A[a].l);if(res==='failed'){p.b+=A[a].c;log('Ação cancelada.');return}if(!live(p).length||(t&&!live(t).length))return}
 const bl=A[a].b;
 if(bl)for(const b of(a==='ajuda'?others(p):live(t).length?[t]:[])){
  let role=null;
  if(b.human){const r=await ask(`Bloquear ${A[a].l} de ${p.name}?`,[...bl.map(x=>[x,`Bloquear como ${R[x].e} ${R[x].n}`]),['n','Não bloquear']]);if(r!=='n')role=r}
  else{const h=live(b).find(c=>bl.includes(c.role));if(Math.random()<(h?.7:.12))role=h?h.role:rd(bl)}
  if(role){log(`${b.name} bloqueia como ${R[role].n}!`);const res=await challengeRound(b,role,'bloqueio');if(res!=='failed'){log('Ação bloqueada.');return}}}
 if(a==='renda')p.b++;if(a==='ajuda')p.b+=2;if(a==='taxar')p.b+=3;
 if((a==='golpe'||a==='assassinar')&&live(t).length)await lose(t);
 if(a==='extorquir'){const n=Math.min(2,t.b);t.b-=n;p.b+=n}
 if(a==='trocar')await trocar(p)}
async function start(){
 $('log').innerHTML='';deck=shuffle(Object.keys(R).flatMap(r=>[r,r,r]));
 P=[{name:'Você',human:1},{name:'Zeca 🐵'},{name:'Mona 🦧'}].map(p=>({...p,b:2,cards:[deck.pop(),deck.pop()].map(role=>({role}))}));
 let i=0;while(alive().length>1&&live(P[0]).length){const p=P[i++%3];if(live(p).length){await turn(p);render();await sleep(400)}}
 render();const w=alive()[0];
 const m=live(P[0]).length?'🏆 Você venceu a Macacada!':`Você foi eliminado. Vencedor: ${w.name}.`;
 await ask(m,[[1,'Jogar de novo']]);start()}
document.addEventListener('DOMContentLoaded',start);
