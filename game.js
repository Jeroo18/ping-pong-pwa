(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const title = document.getElementById('overlayTitle');
  const text = document.getElementById('overlayText');
  const icon = document.getElementById('overlayIcon');
  const startButton = document.getElementById('startButton');
  const playerScoreEl = document.getElementById('playerScore');
  const cpuScoreEl = document.getElementById('cpuScore');
  const W = 560, H = 330, paddle = {w:11,h:76}, ball = {r:8};
  let playerY=H/2, cpuY=H/2, bx=W/2, by=H/2, vx=0, vy=0, playerScore=0, cpuScore=0, active=false, raf=0, last=0;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
  function roundedRect(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
  function draw(){
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#0b372f';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#ffffff20';ctx.lineWidth=2;ctx.setLineDash([8,9]);ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(W/2,H/2,48,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#ffffff55';ctx.beginPath();ctx.arc(W/2,H/2,3,0,Math.PI*2);ctx.fill();
    roundedRect(18,playerY-paddle.h/2,paddle.w,paddle.h,5,'#a3e635');
    roundedRect(W-18-paddle.w,cpuY-paddle.h/2,paddle.w,paddle.h,5,'#38bdf8');
    ctx.fillStyle='#d8f99a';ctx.shadowColor='#a3e635';ctx.shadowBlur=16;ctx.beginPath();ctx.arc(bx,by,ball.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  }
  function resetBall(direction){bx=W/2;by=H/2;const angle=(Math.random()*0.7-0.35);vx=direction*4.1;vy=angle*4.1+ (Math.random()-.5)*1.5}
  function update(dt){if(!active)return;
    const factor=Math.min(dt/16.67,2.3);const cpuTarget=by+(vx>0?vy*Math.min((W-40-bx)/Math.max(vx,.1),12):0);cpuY+=(clamp(cpuTarget,cpuY-4.2*factor,cpuY+4.2*factor)-cpuY)*Math.min(.12*factor,1);
    bx+=vx*factor;by+=vy*factor;
    if(by<ball.r||by>H-ball.r){vy=-vy;by=clamp(by,ball.r,H-ball.r)}
    const px=30, cx=W-30;
    if(vx<0&&bx-ball.r<=px+paddle.w&&bx>px&&Math.abs(by-playerY)<paddle.h/2+ball.r){bx=px+paddle.w+ball.r;const offset=(by-playerY)/(paddle.h/2);vx=Math.abs(vx)*1.045;vy=offset*4.4+(playerYVel*.25)}
    if(vx>0&&bx+ball.r>=cx-paddle.w&&bx<cx&&Math.abs(by-cpuY)<paddle.h/2+ball.r){bx=cx-paddle.w-ball.r;const offset=(by-cpuY)/(paddle.h/2);vx=-Math.abs(vx)*1.035;vy=offset*4.1}
    if(bx<-10){cpuScore++;cpuScoreEl.textContent=cpuScore;point(1)}else if(bx>W+10){playerScore++;playerScoreEl.textContent=playerScore;point(-1)}
    draw();
  }
  let playerYVel=0, prevPlayerY=playerY;
  function point(direction){if(playerScore>=7||cpuScore>=7){active=false;cancelAnimationFrame(raf);overlay.classList.remove('hidden');const win=playerScore>=7;icon.textContent=win?'🏆':'💪';title.textContent=win?'¡Campeón!':'¡Buen intento!';text.textContent=win?'Ganaste la partida. ¿Otra ronda?':'La CPU se llevó esta ronda. ¡Inténtalo otra vez!';startButton.innerHTML='Jugar otra vez <span>→</span>';return}active=false;resetBall(direction);setTimeout(()=>{if(active===false&&playerScore<7&&cpuScore<7){active=true;last=performance.now();raf=requestAnimationFrame(loop)}},700)}
  function loop(now){const dt=now-last;last=now;playerYVel=playerY-prevPlayerY;prevPlayerY=playerY;update(dt);if(active)raf=requestAnimationFrame(loop)}
  function start(){if(playerScore>=7||cpuScore>=7){playerScore=cpuScore=0;playerScoreEl.textContent=cpuScoreEl.textContent='0'}overlay.classList.add('hidden');playerY=cpuY=H/2;resetBall(Math.random()>.5?1:-1);active=true;last=performance.now();raf=requestAnimationFrame(loop)}
  function movePointer(e){const rect=canvas.getBoundingClientRect();const y=(e.clientY-rect.top)*H/rect.height;prevPlayerY=playerY;playerY=clamp(y,paddle.h/2,H-paddle.h/2);if(!active)draw()}
  let dragging=false;canvas.addEventListener('pointerdown',e=>{dragging=true;canvas.setPointerCapture(e.pointerId);movePointer(e)});canvas.addEventListener('pointermove',e=>{if(dragging)movePointer(e)});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
  window.addEventListener('keydown',e=>{let delta=0;if(e.key==='ArrowUp'||e.key==='w')delta=-23;if(e.key==='ArrowDown'||e.key==='s')delta=23;if(delta){e.preventDefault();playerY=clamp(playerY+delta,paddle.h/2,H-paddle.h/2);if(!active)draw()}});
  startButton.addEventListener('click',start);overlay.addEventListener('click',e=>{if(e.target===overlay)start()});document.getElementById('resetButton').addEventListener('click',()=>{active=false;cancelAnimationFrame(raf);playerScore=cpuScore=0;playerScoreEl.textContent=cpuScoreEl.textContent='0';playerY=cpuY=H/2;resetBall(1);draw();overlay.classList.remove('hidden');icon.textContent='🏓';title.textContent='¿Listo para jugar?';text.innerHTML='Toca la pantalla para mover tu paleta.<br>El primero en llegar a 7 puntos gana.';startButton.innerHTML='Jugar ahora <span>→</span>'});
  let installPrompt;const installButton=document.getElementById('installButton');window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;installButton.hidden=false});installButton.addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;installButton.hidden=true});window.addEventListener('appinstalled',()=>{installButton.hidden=true});
  if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  window.addEventListener('resize',resize);resize();
})();
