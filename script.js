const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const mobileControls = document.getElementById('mobile-controls');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ---------- State ----------
const STATE = {
  menu: 0, map: 1,
  tic: 2, word: 3, hearts: 4, stop: 5, story: 6, final: 7,
};
let state = STATE.menu;
let progress = JSON.parse(localStorage.getItem('joyce-progress') || '{"unlocked":1,"done":[]}');

function saveProgress() { localStorage.setItem('joyce-progress', JSON.stringify(progress)); }
function unlock(n){ if(n>progress.unlocked) progress.unlocked=n; saveProgress(); }

// ---------- Input ----------
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// mobile controls
function buildMobileControls() {
  if (window.innerWidth > 768) return;
  mobileControls.innerHTML = `
    <div class="mc-row"><button data-k="w">▲</button></div>
    <div class="mc-row"><button data-k="a">◀</button><button data-k="s">▼</button><button data-k="d">▶</button></div>
  `;
  mobileControls.querySelectorAll('button').forEach(b=>{
    const k = b.dataset.k;
    const down = e => { e.preventDefault(); keys[k]=true; };
    const up = e => { keys[k]=false; };
    b.addEventListener('touchstart', down);
    b.addEventListener('touchend', up);
    b.addEventListener('mousedown', down);
    b.addEventListener('mouseup', up);
  });
}
buildMobileControls();
window.addEventListener('resize', buildMobileControls);

// ---------- Helpers ----------
function drawText(t,x,y,size=18,color='#fff',align='center') {
  ctx.font = `${size}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(t,x,y);
}
function roundRect(x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

// floating hearts
let heartsFloat = [];
for(let i=0;i<40;i++) heartsFloat.push({x:Math.random()*1920,y:Math.random()*1080,v:0.3+Math.random()*0.7,s:8+Math.random()*18});

function updateHearts() {
  heartsFloat.forEach(h=>{ h.y -= h.v; if(h.y< -20){ h.y=canvas.height+20; h.x=Math.random()*canvas.width;} });
}
function drawHearts() {
  heartsFloat.forEach(h=>{
    ctx.font = `${h.s}px serif`;
    ctx.fillStyle = 'rgba(255,105,180,0.6)';
    ctx.textAlign='center';
    ctx.fillText('❤', h.x, h.y);
  });
}

// ---------- Menu ----------
function drawMenu() {
  const g = ctx.createLinearGradient(0,0,0,canvas.height);
  g.addColorStop(0,'#ffe4ec'); g.addColorStop(1,'#ffc1d9');
  ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);
  updateHearts(); drawHearts();
  drawText('Uma Aventura para Encontrar Meu Amor ❤️', canvas.width/2, canvas.height/2-120, 36, '#c2185b');
  drawText('Joyce Lorena  &  Cristian Davi', canvas.width/2, canvas.height/2-70, 22, '#880e4f');
  drawText('Um jogo feito com amor 💕', canvas.width/2, canvas.height/2-30, 16, '#ad1457');
  // button
  const bx=canvas.width/2-120, by=canvas.height/2+20, bw=240, bh=60;
  roundRect(bx,by,bw,bh,30); ctx.fillStyle='#e91e63'; ctx.fill();
  drawText('Jogar ❤️', canvas.width/2, by+38, 24, '#fff');
  return {bx,by,bw,bh};
}
let menuBtn = null;

canvas.addEventListener('click', e=>{
  const r = canvas.getBoundingClientRect();
  const x = e.clientX-r.left, y=e.clientY-r.top;
  if(state===STATE.menu && menuBtn){
    const b=menuBtn;
    if(x>=b.bx&&x<=b.bx+b.bw&&y>=b.by&&y<=b.by+b.bh){ state=STATE.map; }
  }
  handleClick(x,y);
});
canvas.addEventListener('touchstart', e=>{
  const t=e.touches[0]; const r=canvas.getBoundingClientRect();
  const x=t.clientX-r.left, y=t.clientY-r.top;
  if(state===STATE.menu && menuBtn){
    const b=menuBtn;
    if(x>=b.bx&&x<=b.bx+b.bw&&y>=b.by&&y<=b.by+b.bh){ state=STATE.map; }
  }
  handleClick(x,y);
});

// ---------- Map ----------
function drawMap() {
  ctx.fillStyle='#fff0f5'; ctx.fillRect(0,0,canvas.width,canvas.height);
  updateHearts(); drawHearts();
  drawText('Mapa das Fases', canvas.width/2, 80, 32, '#c2185b');
  const phases=['Fase 1: Jogo da Velha do Amor','Fase 2: Caça aos Corações','Fase 3: Stop do Casal','Fase 4: Nossa História','Final: O Encontro'];
  const cols=2; const gap=20;
  const pw=300, ph=90;
  const startX=(canvas.width-cols*pw-(cols-1)*gap)/2;
  const startY=140;
  phases.forEach((p,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const x=startX+col*(pw+gap);
    const y=startY+row*(ph+gap);
    const unlocked = (i+1) <= progress.unlocked;
    roundRect(x,y,pw,ph,16);
    ctx.fillStyle = unlocked ? '#e91e63' : '#bbb';
    ctx.fill();
    drawText(p, x+pw/2, y+35, 16, '#fff');
    if(!unlocked) drawText('🔒', x+pw/2, y+70, 24, '#fff');
    else drawText('Jogar ▶', x+pw/2, y+68, 14, '#fff');
  });
}
// map click
function handleClick(x,y){
  if(state===STATE.map){
    const phases=6;
    const cols=2,gap=20,pw=300,ph=90;
    const startX=(canvas.width-cols*pw-(cols-1)*gap)/2;
    const startY=140;
    for(let i=0;i<phases;i++){
      const col=i%cols,row=Math.floor(i/cols);
      const bx=startX+col*(pw+gap), by=startY+row*(ph+gap);
      if(x>=bx&&x<=bx+pw&&y>=by&&y<=by+ph){
        if((i+1)<=progress.unlocked){
          state = [STATE.tic,STATE.hearts,STATE.stop,STATE.story,STATE.final][i];
          initPhase(state);
        }
      }
    }
  }
}

// ---------- Tic Tac Toe (rigged win) ----------
let ticBoard = Array(9).fill(null);
let ticMsg = '';
let ticWin = false;
function initTic(){ ticBoard=Array(9).fill(null); ticMsg='Sua vez, Joyce! ❤️'; ticWin=false; }
function ticCheckWin(b,s){
  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return lines.some(l=>l.every(i=>b[i]===s));
}
function ticAIMove(){
  // try to make player able to win: pick a random empty not blocking? We'll just place X randomly but ensure player can still win.
  const empties = ticBoard.map((v,i)=>v?null:i).filter(v=>v!==null);
  if(!empties.length) return;
  // pick a move that doesn't create immediate AI win and ideally allows player win soon
  // Simple: random
  const pick = empties[Math.floor(Math.random()*empties.length)];
  ticBoard[pick]='X';
}
const ticMsgs = ['Você ganhou um beijo meu! ❤️','Cada quadradinho desse tabuleiro representa um pedacinho do meu coração.','Parece que você nasceu para conquistar meu coração!'];
function drawTic(){
  ctx.fillStyle='#fff0f5'; ctx.fillRect(0,0,canvas.width,canvas.height);
  drawText('Jogo da Velha do Amor ❤️', canvas.width/2, 60, 28, '#c2185b');
  const size=120; const startX=(canvas.width-3*size)/2; const startY=120;
  for(let i=0;i<9;i++){
    const c=i%3,r=Math.floor(i/3);
    const x=startX+c*size, y=startY+r*size;
    ctx.strokeStyle='#e91e63'; ctx.lineWidth=3;
    roundRect(x+4,y+4,size-8,size-8,12); ctx.stroke();
    if(ticBoard[i]==='O') drawText('❤', x+size/2, y+size/2+14, 48, '#e91e63');
    if(ticBoard[i]==='X') drawText('💋', x+size/2, y+size/2+14, 48, '#880e4f');
  }
  drawText(ticMsg, canvas.width/2, startY+3*size+40, 18, '#ad1457');
  if(ticWin) drawText('Parabéns! Você venceu! 💕', canvas.width/2, startY+3*size+70, 22, '#c2185b');
}

canvas.addEventListener('click', function ticClick(e){ if(state!==STATE.tic) return;
  const r=canvas.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top;
  const size=120; const startX=(canvas.width-3*size)/2; const startY=120;
  for(let i=0;i<9;i++){
    const c=i%3,rw=Math.floor(i/3);
    const bx=startX+c*size+4, by=startY+rw*size+4;
    if(x>=bx&&x<=bx+size-8&&y>=by&&y<=by+size-8){
      if(ticBoard[i]||ticWin) return;
      ticBoard[i]='O';
      // check player win
      if(ticCheckWin(ticBoard,'O')){
        ticMsg = ticMsgs[Math.floor(Math.random()*ticMsgs.length)];
        ticWin=true;
        setTimeout(()=>{ unlock(2); state=STATE.map; }, 2500);
        return;
      }
      // AI move
      setTimeout(()=>{
        ticAIMove();
        if(ticCheckWin(ticBoard,'X')){ // shouldn't happen often; reset
          ticBoard=Array(9).fill(null);
          ticMsg='Vamos de novo! ❤️';
        } else {
          ticMsg='Sua vez! ❤️';
        }
      }, 400);
    }
  }
}, true);

// ---------- Word Search ----------
const words = ['AMOR','JOYCE','CRISTIAN','CARINHO','BEIJO','PARCERIA','SAUDADE','CORACAO'];
let wordGrid = [];
let wordFound = new Set();
let wordMsg = '';
function initWord(){
  const size=12;
  wordGrid = Array.from({length:size},()=>Array(size).fill(''));
  // place words
  words.forEach(w=>{
    let placed=false;
    while(!placed){
      const dir = Math.random()<0.5?'h':'v';
      if(dir==='h'){
        const r=Math.floor(Math.random()*size);
        const c=Math.floor(Math.random()*(size-w.length));
        let ok=true;
        for(let k=0;k<w.length;k++) if(wordGrid[r][c+k] && wordGrid[r][c+k]!==w[k]) ok=false;
        if(ok){ for(let k=0;k<w.length;k++) wordGrid[r][c+k]=w[k]; placed=true; }
      } else {
        const c=Math.floor(Math.random()*size);
        const r=Math.floor(Math.random()*(size-w.length));
        let ok=true;
        for(let k=0;k<w.length;k++) if(wordGrid[r+k][c] && wordGrid[r+k][c]!==w[k]) ok=false;
        if(ok){ for(let k=0;k<w.length;k++) wordGrid[r+k][c]=w[k]; placed=true; }
      }
    }
  });
  // fill rest
  for(let r=0;r<size;r++) for(let c=0;c<size;c++) if(!wordGrid[r][c]) wordGrid[r][c]=String.fromCharCode(65+Math.floor(Math.random()*26));
  wordFound=new Set(); wordMsg='Encontre todas as palavras! ❤️';
}
let wordSelection = [];
function drawWord(){
  ctx.fillStyle='#fff0f5'; ctx.fillRect(0,0,canvas.width,canvas.height);
  drawText('Caça-Palavras do Casal 💌', canvas.width/2, 50, 26, '#c2185b');
  const cell=34; const size=12;
  const startX=(canvas.width-size*cell)/2; const startY=90;
  for(let r=0;r<size;r++) for(let c=0;c<size;c++){
    const x=startX+c*cell, y=startY+r*cell;
    ctx.strokeStyle='#f8bbd0'; ctx.strokeRect(x,y,cell,cell);
    const sel = wordSelection.some(s=>s.r===r&&s.c===c);
    if(sel){ ctx.fillStyle='#f48fb1'; ctx.fillRect(x,y,cell,cell); }
    drawText(wordGrid[r][c], x+cell/2, y+cell/2+6, 16, '#880e4f');
  }
  // word list
  let yy = startY+size*cell+30;
  drawText('Palavras: '+words.join(', '), canvas.width/2, yy, 14, '#ad1457');
  drawText(wordMsg, canvas.width/2, yy+30, 16, '#c2185b');
  if(wordFound.size===words.length){
    drawText('Mensagem secreta: Você é o amor da minha vida, Joyce! 💖', canvas.width/2, yy+60, 18, '#e91e63');
  }
}

// click handling for word search: simple - click letters; if a word completed, mark found
let wordClicks=[];
function wordCellAt(x,y){
  const cell=34,size=12;
  const startX=(canvas.width-size*cell)/2; const startY=90;
  const c=Math.floor((x-startX)/cell), rr=Math.floor((y-startY)/cell);
  if(rr<0||rr>=size||c<0||c>=size) return null;
  return {r:rr,c};
}
let wordDragging=false;
canvas.addEventListener('mousedown', e=>{
  if(state!==STATE.word) return;
  const r=canvas.getBoundingClientRect(); const cell=wordCellAt(e.clientX-r.left,e.clientY-r.top);
  if(cell){ wordDragging=true; wordClicks=[cell]; checkWords(); }
});
canvas.addEventListener('click', e=>{
  if(state!==STATE.word) return;
  const r=canvas.getBoundingClientRect(); const cell=wordCellAt(e.clientX-r.left,e.clientY-r.top);
  if(cell){ if(!wordClicks.some(s=>s.r===cell.r&&s.c===cell.c)) wordClicks.push(cell); checkWords(); setTimeout(()=>{wordClicks=[];},600); }
});
canvas.addEventListener('mousemove', e=>{
  if(state!==STATE.word||!wordDragging) return;
  const r=canvas.getBoundingClientRect(); const cell=wordCellAt(e.clientX-r.left,e.clientY-r.top);
  if(cell && !wordClicks.some(s=>s.r===cell.r&&s.c===cell.c)){
    const first=wordClicks[0];
    const dr=cell.r-first.r, dc=cell.c-first.c;
    if(dr===0||dc===0||Math.abs(dr)===Math.abs(dc)) wordClicks.push(cell);
  }
});
canvas.addEventListener('mouseup', e=>{
  if(state!==STATE.word||!wordDragging) return;
  wordDragging=false; checkWords();
  setTimeout(()=>{ wordClicks=[]; }, 500);
});
canvas.addEventListener('touchstart', e=>{
  if(state!==STATE.word) return;
  const t=e.touches[0]; const r=canvas.getBoundingClientRect(); const cell=wordCellAt(t.clientX-r.left,t.clientY-r.top);
  if(cell){ wordDragging=true; wordClicks=[cell]; }
});
canvas.addEventListener('touchmove', e=>{
  if(state!==STATE.word||!wordDragging) return;
  const t=e.touches[0]; const r=canvas.getBoundingClientRect(); const cell=wordCellAt(t.clientX-r.left,t.clientY-r.top);
  if(cell && !wordClicks.some(s=>s.r===cell.r&&s.c===cell.c)){
    const first=wordClicks[0];
    const dr=cell.r-first.r, dc=cell.c-first.c;
    if(dr===0||dc===0||Math.abs(dr)===Math.abs(dc)) wordClicks.push(cell);
  }
});
canvas.addEventListener('touchend', e=>{
  if(state!==STATE.word||!wordDragging) return;
  wordDragging=false; checkWords();
  setTimeout(()=>{ wordClicks=[]; }, 500);
});

function checkWords(){
  // build selected set
  const selSet = new Set(wordClicks.map(s=>s.r+','+s.c));
  words.forEach(w=>{
    if(wordFound.has(w)) return;
    // check all horizontal/vertical occurrences in grid equal w and all cells selected
    // find positions
    // horizontal
    for(let r=0;r<12;r++){
      for(let c=0;c<=12-w.length;c++){
        let match=true;
        for(let k=0;k<w.length;k++) if(wordGrid[r][c+k]!==w[k]) match=false;
        if(match){
          let allSel=true;
          for(let k=0;k<w.length;k++) if(!selSet.has(r+','+(c+k))) allSel=false;
          if(allSel){ wordFound.add(w); wordMsg='Encontrou: '+w+'! ❤️'; }
        }
      }
    }
    for(let c=0;c<12;c++){
      for(let r=0;r<=12-w.length;r++){
        let match=true;
        for(let k=0;k<w.length;k++) if(wordGrid[r+k][c]!==w[k]) match=false;
        if(match){
          let allSel=true;
          for(let k=0;k<w.length;k++) if(!selSet.has((r+k)+','+c)) allSel=false;
          if(allSel){ wordFound.add(w); wordMsg='Encontrou: '+w+'! ❤️'; }
        }
      }
    }
  });
  if(wordFound.size===words.length){
    setTimeout(()=>{ unlock(3); state=STATE.map; }, 3000);
  }
}

// ---------- Hearts collection (movement) ----------
let player = {x:100,y:100,vx:0,vy:0,speed:3};
let heartsItems = [];
const heartMsgs = [
  'Seu sorriso consegue melhorar qualquer dia meu.',
  'Você é uma das melhores coisas que já aconteceram na minha vida.',
  'Se eu pudesse escolher novamente, escolheria você.',
  'Meu lugar favorito é onde posso estar com você.',
];
function initHearts(){
  heartsItems = heartMsgs.map((m,i)=>({x:200+Math.random()*600, y:200+Math.random()*300, got:false, msg:m}));
  player.x=100; player.y=100;
}
function updatePlayer(){
  player.vx=0; player.vy=0;
  if(keys['w']||keys['arrowup']) player.vy=-player.speed;
  if(keys['s']||keys['arrowdown']) player.vy=player.speed;
  if(keys['a']||keys['arrowleft']) player.vx=-player.speed;
  if(keys['d']||keys['arrowright']) player.vx=player.speed;
  player.x+=player.vx; player.y+=player.vy;
  player.x=Math.max(20,Math.min(canvas.width-20,player.x));
  player.y=Math.max(20,Math.min(canvas.height-20,player.y));
  heartsItems.forEach(h=>{
    if(!h.got && Math.hypot(h.x-player.x,h.y-player.y)<25){ h.got=true; alert('❤️ '+h.msg); }
  });
  if(heartsItems.every(h=>h.got)){ setTimeout(()=>{ unlock(3); state=STATE.map; },1500); }
}
function drawHeartsPhase(){
  ctx.fillStyle='#e8f5e9'; ctx.fillRect(0,0,canvas.width,canvas.height);
  // garden
  for(let i=0;i<20;i++){ ctx.fillStyle='#81c784'; ctx.beginPath(); ctx.arc(i*80, canvas.height-40, 30,0,Math.PI*2); ctx.fill(); }
  drawText('Caça aos Corações 🌷', canvas.width/2, 40, 26, '#2e7d32');
  heartsItems.forEach(h=>{ if(!h.got){ ctx.font='32px serif'; ctx.fillStyle='#e91e63'; ctx.textAlign='center'; ctx.fillText('❤',h.x,h.y); } });
  // player (gatinha pixel art)
  drawCat(player.x,player.y,true);
  drawText('Use WASD ou setas. Encontre todos os corações!', canvas.width/2, canvas.height-20, 14, '#2e7d32');
}

// ---------- Stop game ----------
const stopCats = ['Apelido carinhoso','Qualidade da Joyce','Lugar para levar Joyce','Comida para comerem juntos','Algo que lembra dela'];
let stopLetter = '';
let stopAnswers = {};
let stopIdx = 0;
let stopMsg = '';
function initStop(){
  const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  stopLetter = letters[Math.floor(Math.random()*letters.length)];
  stopAnswers={}; stopIdx=0; stopMsg='Letra sorteada: '+stopLetter;
}
function drawStop(){
  ctx.fillStyle='#fff8e1'; ctx.fillRect(0,0,canvas.width,canvas.height);
  drawText('Stop do Casal 💕', canvas.width/2, 50, 26, '#f57f17');
  drawText('Letra: '+stopLetter, canvas.width/2, 90, 32, '#e65100');
  stopCats.forEach((c,i)=>{
    const y=140+i*70;
    drawText(c, canvas.width/2, y, 18, '#5d4037');
    const val = stopAnswers[i]||'';
    // input box
    const bx=canvas.width/2-200, by=y+10, bw=400, bh=36;
    roundRect(bx,by,bw,bh,8); ctx.strokeStyle='#f57f17'; ctx.lineWidth=2; ctx.stroke();
    drawText(val || 'Digite e Enter...', bx+bw/2, by+24, 14, val?'#000':'#aaa');
  });
  drawText(stopMsg, canvas.width/2, canvas.height-60, 16, '#e65100');
  drawText('Pressione Enter para enviar cada resposta (ou clique na categoria).', canvas.width/2, canvas.height-30, 12, '#888');
}
// handle typing
let stopTyping = '';
window.addEventListener('keydown', e=>{
  if(state!==STATE.stop) return;
  if(e.key==='Enter'){
    if(stopTyping.trim()){
      stopAnswers[stopIdx] = stopTyping.trim();
      stopMsg = 'Resposta carinhosa aceita! ❤️ '+stopTyping;
      stopTyping='';
      stopIdx = (stopIdx+1)%stopCats.length;
      if(Object.keys(stopAnswers).length===stopCats.length){
        setTimeout(()=>{ unlock(4); state=STATE.map; },2000);
      }
    }
  } else if(e.key==='Backspace'){
    stopTyping = stopTyping.slice(0,-1);
  } else if(e.key.length===1){
    stopTyping += e.key;
  }
});

// ---------- Story correction ----------
const storyText = 'Eu lembro que, no primeiro dia em que a gente esteve junto um do outro, a gente se sentou num banco, e ali foi bem tranquilo, não ficamos envergonhados. A conversa foi bem curta e ficamos bem entediados um do outro e, por fim, nem nos apaixonamos.';
const errors = [
  {wrong:'sentou num banco', right:'sentamos numa pedra no chão', msg:'Na verdade sentamos numa pedra no chão. ❤️'},
  {wrong:'não ficamos envergonhados', right:'ficamos bem nervosos', msg:'Na verdade ficamos bem nervosos. 💕'},
  {wrong:'A conversa foi bem curta e ficamos bem entediados', right:'passamos muito tempo conversando e queríamos continuar conversando ainda mais', msg:'Na verdade passamos muito tempo conversando! 💖'},
  {wrong:'nem nos apaixonamos', right:'mas estamos namorando, né? KKKKK ❤️', msg:'Mas estamos namorando, né? KKKKK ❤️'},
];
let foundErrors = new Set();
let storyMsg = '';
function initStory(){ foundErrors=new Set(); storyMsg='Clique nas partes incorretas do texto.'; }
function drawStory(){
  ctx.fillStyle='#fce4ec'; ctx.fillRect(0,0,canvas.width,canvas.height);
  drawText('Nossa História 💖', canvas.width/2, 50, 26, '#c2185b');
  // render text with clickable words
  ctx.font='18px sans-serif'; ctx.fillStyle='#4a148c'; ctx.textAlign='left';
  const x=40, y=120, maxW=canvas.width-80;
  // simple: draw full text, highlight errors found
  let txt = storyText;
  // draw
  wrapText(txt, x, y, maxW, 28);
  drawText(storyMsg, canvas.width/2, canvas.height-120, 16, '#ad1457');
  drawText('Erros encontrados: '+foundErrors.size+'/4', canvas.width/2, canvas.height-80, 18, '#c2185b');
  if(foundErrors.size===4){
    drawText('Um caminho se abriu... vá ao Final! 💕', canvas.width/2, canvas.height-40, 18, '#e91e63');
    unlock(6);
  }
}
function wrapText(t,x,y,maxW,lineH){
  const words=t.split(' '); let line=''; let yy=y;
  words.forEach(w=>{
    const test=line+w+' ';
    if(ctx.measureText(test).width>maxW && line){ ctx.fillText(line,x,yy); line=w+' '; yy+=lineH; }
    else line=test;
  });
  ctx.fillText(line,x,yy);
}
// click detection: check if click position corresponds to an error substring - simplified: click anywhere cycles? 
// We'll implement: user clicks, we check which error phrase contains click by measuring? Simpler: show error phrases as buttons.
// Override: draw buttons for each error phrase
// Redo drawStory to include buttons
function drawStory2(){
  ctx.fillStyle='#fce4ec'; ctx.fillRect(0,0,canvas.width,canvas.height);
  drawText('Nossa História 💖', canvas.width/2, 50, 26, '#c2185b');
  drawText('Clique nas partes incorretas:', canvas.width/2, 90, 16, '#880e4f');
  const btnW=canvas.width-80, btnH=50, startX=40, startY=120;
  errors.forEach((e,i)=>{
    const y=startY+i*(btnH+15);
    roundRect(startX,y,btnW,btnH,12);
    ctx.fillStyle = foundErrors.has(i)?'#c8e6c9':'#f8bbd0'; ctx.fill();
    ctx.strokeStyle='#e91e63'; ctx.lineWidth=2; ctx.stroke();
    drawText(e.wrong, startX+btnW/2, y+30, 14, foundErrors.has(i)?'#2e7d32':'#880e4f');
  });
  drawText(storyMsg, canvas.width/2, canvas.height-120, 16, '#ad1457');
  drawText('Erros encontrados: '+foundErrors.size+'/4', canvas.width/2, canvas.height-80, 18, '#c2185b');
}
// replace drawStory
drawStory = drawStory2;

canvas.addEventListener('click', function storyClick(e){
  if(state!==STATE.story) return;
  const r=canvas.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top;
  const btnW=canvas.width-80, btnH=50, startX=40, startY=120;
  errors.forEach((e2,i)=>{
    const by=startY+i*(btnH+15);
    if(x>=startX&&x<=startX+btnW&&y>=by&&y<=by+btnH){
      if(foundErrors.has(i)) return;
      foundErrors.add(i);
      storyMsg = e2.msg;
      if(foundErrors.size===4){ unlock(5); }
    }
  });
}, true);

// ---------- Final ----------
let cristian = {x: canvas.width-100, y: canvas.height/2};
function initFinal(){ player.x=80; player.y=canvas.height/2; }
function drawFinal(){
  ctx.fillStyle='#e1f5fe'; ctx.fillRect(0,0,canvas.width,canvas.height);
  drawText('O Encontro Final 💖', canvas.width/2, 40, 26, '#01579b');
  // ground
  ctx.fillStyle='#81c784'; ctx.fillRect(0,canvas.height-80,canvas.width,80);
  // player & cristian
  ctx.textAlign='center';
  drawCat(player.x,player.y,true);
  drawCat(cristian.x,cristian.y,false);
  // move player
  updatePlayer();
  if(Math.hypot(player.x-cristian.x,player.y-cristian.y)<40){
    // animation
    ctx.font='60px serif'; ctx.fillText('💕', canvas.width/2, canvas.height/2);
    drawText('Joyce, você é a pessoa mais especial da minha vida.', canvas.width/2, canvas.height/2-80, 20, '#01579b');
    drawText('Cada lembrança nossa tem um valor imenso pra mim.', canvas.width/2, canvas.height/2-50, 16, '#0277bd');
    drawText('Eu te amo muito! ❤️', canvas.width/2, canvas.height/2+100, 24, '#e91e63');
    // button
    const bx=canvas.width/2-120, by=canvas.height-120, bw=240, bh=50;
    roundRect(bx,by,bw,bh,25); ctx.fillStyle='#e91e63'; ctx.fill();
    drawText('Jogar novamente ❤️', canvas.width/2, by+32, 16, '#fff');
  }
}
canvas.addEventListener('click', function finalClick(e){
  if(state!==STATE.final) return;
  const r=canvas.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top;
  const bx=canvas.width/2-120, by=canvas.height-120, bw=240, bh=50;
  if(x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh){
    // reset
    progress={unlocked:1,done:[]}; saveProgress();
    state=STATE.menu;
  }
}, true);

// ---------- Init phase ----------
function initPhase(s){
  if(s===STATE.tic) initTic();

  if(s===STATE.hearts) initHearts();
  if(s===STATE.stop) initStop();
  if(s===STATE.story) initStory();
  if(s===STATE.final) initFinal();
}

// ---------- Pixel cats ----------
function drawCat(x,y,female){
  const s=4;
  const body = female?'#f8bbd0':'#90caf9';
  ctx.fillStyle=body;
  // body
  ctx.fillRect(x-12,y-4,24,20);
  // head
  ctx.fillRect(x-10,y-18,20,16);
  // ears
  ctx.fillRect(x-12,y-22,6,6);
  ctx.fillRect(x+6,y-22,6,6);
  // eyes
  ctx.fillStyle='#000';
  ctx.fillRect(x-6,y-14,4,4);
  ctx.fillRect(x+2,y-14,4,4);
  // nose
  ctx.fillStyle='#e91e63';
  ctx.fillRect(x-2,y-10,4,3);
  // bow for female
  if(female){
    ctx.fillStyle='#e91e63';
    ctx.fillRect(x-4,y-24,8,4);
    ctx.fillRect(x-6,y-22,4,4);
    ctx.fillRect(x+2,y-22,4,4);
  }
  // tail
  ctx.fillStyle=body;
  ctx.fillRect(x+12,y,8,4);
}

// ---------- Loop ----------
function loop(){
  if(state===STATE.menu){ menuBtn=drawMenu(); }
  else if(state===STATE.map){ drawMap(); }
  else if(state===STATE.tic){ drawTic(); }

  else if(state===STATE.hearts){ updatePlayer(); drawHeartsPhase(); }
  else if(state===STATE.stop){ drawStop(); }
  else if(state===STATE.story){ drawStory(); }
  else if(state===STATE.final){ drawFinal(); }
  requestAnimationFrame(loop);
}
loop();
