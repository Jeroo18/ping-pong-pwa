(() => {
const games=[
{id:'pingpong',name:'Ping-pong 3D',emoji:'🏓',cat:'arcade',desc:'Mesa 3D real: devuelve la pelota y vence a la CPU.',guide:['Toca Jugar para empezar.','Arrastra el dedo para mover tu paleta; en computador usa ↑ y ↓.','Devuelve la pelota y llega primero a 7 puntos.'],type:'pong'},
{id:'shipsoccer',name:'Naves de futbolín 3D',emoji:'🚀',cat:'arcade',desc:'Arena espacial 3D con naves en formación.',guide:['Desliza el dedo a izquierda y derecha para mover tu equipo.','Bloquea la pelota y trata de meterla en la portería rival.','Gana quien llegue a 5 goles.'],type:'shipsoccer'},
{id:'tablefootball',name:'Futbolín 3D',emoji:'⚽',cat:'arcade',desc:'Mesa de futbolín en 3D con barras y muñecos.',guide:['Desliza el dedo a izquierda y derecha para mover tus barras.','Los muñecos golpean la pelota automáticamente al cruzar su fila.','Marca 5 goles en la portería rival para ganar.'],type:'tablefootball'},
{id:'starfighter',name:'Starfighter 3D',emoji:'🛸',cat:'arcade',desc:'Pilota, esquiva y dispara en un viaje espacial 3D.',guide:['Desliza para pilotar la nave por el espacio.','Mantén pulsado el botón Disparar para destruir drones.','Esquiva asteroides y atraviesa planetas; aguanta 60 segundos.'],type:'starfighter'},
{id:'airhockey',name:'Air Hockey 3D',emoji:'🥅',cat:'arcade',desc:'Mesa de aire en 3D: golpea el disco y marca.',guide:['Arrastra para mover tu mazo por la mesa.','Golpea el disco hacia la portería rival.','Gana quien llegue a 5 goles.'],type:'airhockey'},
{id:'snake',name:'Serpiente',emoji:'🐍',cat:'arcade',desc:'Come puntos y no choques contigo.',guide:['Desliza en la dirección a la que quieras girar.','Come los puntos brillantes para crecer.','Evita las paredes y tu propio cuerpo.'],type:'snake'},
{id:'breakout',name:'Rompebloques',emoji:'🧱',cat:'arcade',desc:'Despeja la pantalla con la pelota.',guide:['Arrastra para mover la paleta de abajo.','Haz rebotar la pelota contra los bloques.','No dejes que la pelota caiga.'],type:'breakout'},
{id:'dodge',name:'Esquiva',emoji:'☄️',cat:'arcade',desc:'Esquiva meteoritos todo lo que puedas.',guide:['Arrastra tu nave a izquierda y derecha.','No choques con los meteoritos que caen.','Sobrevive para sumar puntos.'],type:'dodge'},
{id:'memory',name:'Memoria',emoji:'🧠',cat:'puzzle',desc:'Encuentra las parejas de dibujos.',guide:['Toca dos cartas para descubrirlas.','Recuerda las figuras y encuentra todas las parejas.','Termina con la menor cantidad de intentos.'],type:'memory'},
{id:'simon',name:'Simón dice',emoji:'🎨',cat:'puzzle',desc:'Repite la secuencia de colores.',guide:['Mira con atención la secuencia iluminada.','Toca los colores en el mismo orden.','Cada ronda añade un color más.'],type:'simon'},
{id:'math',name:'Reto matemático',emoji:'➕',cat:'puzzle',desc:'Resuelve cuentas contra el reloj.',guide:['Lee la operación que aparece.','Toca la respuesta correcta entre las opciones.','Resuelve tantas como puedas antes de que acabe el tiempo.'],type:'math'},
{id:'sequence',name:'Secuencia',emoji:'🔢',cat:'puzzle',desc:'Descubre el número que sigue.',guide:['Mira la serie de números.','Busca qué patrón se repite.','Elige la respuesta correcta.'],type:'sequence'},
{id:'reaction',name:'Reflejos',emoji:'⚡',cat:'arcade',desc:'Toca cuando el círculo se vuelva verde.',guide:['Toca Jugar y espera la señal verde.','No toques antes: eso cuenta como error.','Reacciona lo más rápido que puedas.'],type:'reaction'},
{id:'clicker',name:'Toques rápidos',emoji:'👆',cat:'arcade',desc:'¿Cuántos toques haces en 10 segundos?',guide:['Toca el botón grande tantas veces como puedas.','Tienes 10 segundos.','Intenta superar tu récord.'],type:'clicker'},
{id:'lights',name:'Luces',emoji:'💡',cat:'puzzle',desc:'Apaga todas las luces del tablero.',guide:['Toca una casilla para cambiarla y sus vecinas.','Apaga todas las casillas iluminadas.','Piensa unos pasos adelante.'],type:'lights'}
];
const $=id=>document.getElementById(id),home=$('home'),play=$('playView'),grid=$('gameGrid'),canvas=$('gameCanvas'),ctx=canvas.getContext('2d'),stage=document.querySelector('.game-stage');let selected=games[0],orientation='portrait',running=false,raf=0,last=0,state={},touchStart=null,resizeTimer,tiltBase=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
function renderCards(filter='all'){grid.innerHTML='';games.filter(g=>filter==='all'||g.cat===filter).forEach(g=>{const b=document.createElement('button');b.className='game-card';b.innerHTML=`<div class="card-top"><span class="card-emoji">${g.emoji}</span><span class="tag">${g.cat==='puzzle'?'Ingenio':'Arcade'}</span></div><h3>${g.name}</h3><p>${g.desc}</p>`;b.onclick=()=>openGame(g);grid.appendChild(b)});$('gameCount').textContent=`${games.length} juegos`}
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelector('.filter.active').classList.remove('active');b.classList.add('active');renderCards(b.dataset.filter)});
function openGame(g){ init3D(g.type);selected=g;home.hidden=true;play.hidden=false;document.body.classList.add('no-scroll');$('gameEmoji').textContent=g.emoji;$('gameTitle').textContent=g.name;$('gameSubtitle').textContent=g.desc;$('controlHint').textContent=g.type==='pong'?'Vertical: tu paleta abajo, CPU arriba. Desliza a izquierda/derecha.':g.type==='snake'?'Desliza hacia donde quieres girar.':g.type==='starfighter'?'Desliza para pilotar; toca Disparar para atacar.':g.type==='airhockey'?'Arrastra para mover tu mazo en la mesa 3D.':g.type==='tablefootball'||g.type==='shipsoccer'?'Desliza a izquierda y derecha para mover tu equipo.':'Toca o arrastra en el juego para controlar.';$('gameActionButton').hidden=!['pong','shipsoccer','tablefootball','airhockey'].includes(g.type);$('gameActionButton').textContent=g.type==='pong'?'↕ Inclinación (horizontal)':'↔ Cambiar orientación';$('fireButton').hidden=g.type!=='starfighter';$('overlayEmoji').textContent=g.emoji;$('overlayTitle').textContent=`¿Jugamos ${g.name.toLowerCase()}?`;$('overlayText').textContent=g.guide.join('\n');$('startButton').textContent='Jugar ahora　→';$('gameOverlay').classList.remove('hidden');$('guidePanel').hidden=true;running=false;cancelAnimationFrame(raf);orientation='portrait';applyOrientation();prepareGame();resizeCanvas();history.replaceState(null,'',`#${g.id}`)}
function goHome(){stop();show3D(false);play.hidden=true;home.hidden=false;document.body.classList.remove('no-scroll','landscape-mode');screen.orientation?.unlock?.();history.replaceState(null,'',location.pathname)}$('backButton').onclick=goHome;
function applyOrientation(){stage.classList.toggle('vertical',orientation==='portrait');stage.classList.toggle('horizontal',orientation==='landscape');play.classList.toggle('portrait-mode',orientation==='portrait'&&innerWidth<520);$('orientationLabel').textContent=orientation==='portrait'?'Vertical':'Horizontal';$('orientationButton').textContent=orientation==='portrait'?'↔ Cambiar a horizontal':'↕ Cambiar a vertical';play.classList.toggle('landscape-mode',orientation==='landscape'&&innerWidth<520);if(orientation==='landscape')screen.orientation?.lock?.('landscape').catch(()=>{});else screen.orientation?.unlock?.();setTimeout(resizeCanvas,100)}
$('orientationButton').onclick=()=>{orientation=orientation==='portrait'?'landscape':'portrait';applyOrientation()};$('gameActionButton').onclick=()=>selected.type==='pong'?enableTilt():(orientation=orientation==='portrait'?'landscape':'portrait',applyOrientation());
$('guideButton').onclick=showGuide;$('closeGuide').onclick=()=>$('guidePanel').hidden=true;$('guideStart').onclick=()=>{$('guidePanel').hidden=true;startGame()};function showGuide(){$('guideTitle').textContent=`Cómo jugar: ${selected.name}`;const ol=$('guideSteps');ol.innerHTML='';selected.guide.forEach(s=>{const li=document.createElement('li');li.textContent=s;ol.append(li)});$('guidePanel').hidden=false;stop()}
function prepareGame(){const t=selected.type;state={score:0,time:30,over:false};if(t==='pong')Object.assign(state,{py:.8,cy:.2,x:.5,y:.5,vx:.25,vy:.16,player:0,cpu:0});else if(t==='shipsoccer'||t==='tablefootball'||t==='airhockey')Object.assign(state,{py:.5,cy:.5,x:.5,y:.5,vx:.25,vy:.16,player:0,cpu:0});else if(t==='starfighter')Object.assign(state,{x:.5,shots:[],enemies:[],particles:[],spawn:0,world:0,hits:0});else if(t==='snake')Object.assign(state,{cells:18,snake:[[8,9],[7,9],[6,9]],dir:[1,0],next:[1,0],food:[rand(1,16),rand(1,16)],tick:0,speed:135});else if(t==='breakout')Object.assign(state,{px:.5,bx:.5,by:.75,vx:.24,vy:-.3,bricks:Array.from({length:35},(_,i)=>({x:.08+(i%7)*.12,y:.13+Math.floor(i/7)*.055,on:true}))});else if(t==='dodge')Object.assign(state,{x:.5,obstacles:[],lastSpawn:0,time:0});else if(t==='memory')Object.assign(state,{deck:['🍎','🍋','🍇','🍒','🥝','🍉','🍍','🍑','🍎','🍋','🍇','🍒','🥝','🍉','🍍','🍑'].sort(()=>Math.random()-.5),flipped:[],matched:new Set(),turns:0,lock:false});else if(t==='simon')Object.assign(state,{seq:[],input:[],wait:true,flash:-1,round:0});else if(t==='math'){state.time=30000;newMath()}else if(t==='sequence')newSequence();else if(t==='reaction')Object.assign(state,{phase:'ready',waitAt:0,startAt:0,result:'Toca para empezar'});else if(t==='clicker')Object.assign(state,{time:10,clicks:0,started:false});else if(t==='lights')Object.assign(state,{lights:Array.from({length:25},()=>Math.random()<.42),moves:0})}
function resizeCanvas(){if(play.hidden)return;const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);resize3D();if(is3D(selected.type))render3D(16,state);draw()}
function startGame(){ init3D(selected.type);if(selected.type==='simon'&&state.seq.length===0)addSimon();$('gameOverlay').classList.add('hidden');running=true;last=performance.now();raf=requestAnimationFrame(loop);if(selected.type==='clicker'){state.started=true;state.time=10}if(selected.type==='reaction'){state.phase='wait';state.waitAt=performance.now()+rand(1500,3500);state.result='Espera la señal verde'}}function stop(){running=false;cancelAnimationFrame(raf)}
$('startButton').onclick=startGame;$('restartButton').onclick=()=>{stop();prepareGame();$('gameOverlay').classList.remove('hidden');$('overlayTitle').textContent=`¿Jugamos ${selected.name.toLowerCase()}?`;$('overlayText').textContent=selected.guide.join('\n');$('startButton').textContent='Jugar ahora　→';resizeCanvas()};function loop(now){const dt=Math.min(now-last,40);last=now;if(running){update(dt,now);if(is3D(selected.type))render3D(dt,state);draw();raf=requestAnimationFrame(loop)}}
function win(title,msg){stop();$('gameOverlay').classList.remove('hidden');$('overlayEmoji').textContent=selected.emoji;$('overlayTitle').textContent=title;$('overlayText').textContent=msg;$('startButton').textContent='Jugar otra vez　→'}
function update(dt,now){const t=selected.type,s=state;if(t==='pong'||t==='shipsoccer'||t==='tablefootball'||t==='airhockey'){ s.cy+=((orientation==='portrait'&&t==='pong'?s.x:s.y)-s.cy)*Math.min(.12,dt*.006);s.x+=s.vx*dt/1000;s.y+=s.vy*dt/1000;if(orientation==='portrait'&&t==='pong'){if(s.x<.025)s.vx=Math.abs(s.vx);if(s.x>.975)s.vx=-Math.abs(s.vx)}else{if(s.y<.025)s.vy=Math.abs(s.vy);if(s.y>.975)s.vy=-Math.abs(s.vy)}if(orientation==='portrait'&&t==='pong'){if(s.vy>0&&s.y>.88&&Math.abs(s.x-s.py)<.17){s.vy=-Math.abs(s.vy)*1.04;s.vx+=(s.x-s.py)*.35;s.y=.87}else if(s.vy<0&&s.y<.12&&Math.abs(s.x-s.cy)<.17){s.vy=Math.abs(s.vy)*1.02;s.vx+=(s.x-s.cy)*.25;s.y=.13}}else{if(s.vx<0&&s.x<.09&&Math.abs(s.y-s.py)<(t==='pong'?.15:.13)){s.vx=Math.abs(s.vx)*1.045;s.vy+=(s.y-s.py)*.45;s.x=.1}if(s.vx>0&&s.x>.91&&Math.abs(s.y-s.cy)<(t==='pong'?.15:.13)){s.vx=-Math.abs(s.vx)*1.025;s.vy+=(s.y-s.cy)*.3;s.x=.9}}if((orientation==='portrait'&&t==='pong'&&(s.y<-.03||s.y>1.03))||((orientation!=='portrait'||t!=='pong')&&(s.x<-.03||s.x>1.03))){if(orientation==='portrait'&&t==='pong'){if(s.y<-.03)s.player++;else s.cpu++}else if(s.x<-.03)s.cpu++;else s.player++;s.x=.5;s.y=.5;s.vx=.25*(Math.random()>.5?1:-1);s.vy=.16*(Math.random()>.5?1:-1)}if(s.player>=(t==='pong'?7:5)||s.cpu>=(t==='pong'?7:5))win(s.player>s.cpu?'¡Ganaste!':'¡Buen intento!',`${s.player} — ${s.cpu}.`)}else if(t==='starfighter'){s.time+=dt;if(s.time>=60000)return win('¡Misión cumplida!','Puntuación: '+s.score+'. ¡Sobreviviste a la tormenta espacial!')}else if(t==='snake'){s.tick+=dt;if(s.tick>s.speed){s.tick=0;s.dir=s.next.slice();const head=[s.snake[0][0]+s.dir[0],s.snake[0][1]+s.dir[1]];if(head[0]<0||head[1]<0||head[0]>=s.cells||head[1]>=s.cells||s.snake.some(p=>p[0]===head[0]&&p[1]===head[1]))return win('Fin del juego',`Puntuación: ${s.score}`);s.snake.unshift(head);if(head[0]===s.food[0]&&head[1]===s.food[1]){s.score++;s.food=[rand(0,s.cells-1),rand(0,s.cells-1)]}else s.snake.pop()}}else if(t==='breakout'){s.bx+=s.vx*dt/1000;s.by+=s.vy*dt/1000;if(s.bx<.02||s.bx>.98)s.vx*=-1;if(s.by<.03)s.vy=Math.abs(s.vy);if(s.vy>0&&s.by>.85&&Math.abs(s.bx-s.px)<.15)s.vy=-Math.abs(s.vy);for(const b of s.bricks)if(b.on&&Math.abs(s.bx-b.x)<.065&&Math.abs(s.by-b.y)<.035){b.on=false;s.vy*=-1;s.score++}if(s.bricks.every(b=>!b.on))win('¡Pantalla despejada!',`Bloques: ${s.score}`);if(s.by>.99)win('¡Se escapó!',`Derribaste ${s.score} bloques.`)}else if(t==='dodge'){s.time+=dt;if(now-s.lastSpawn>550){s.obstacles.push({x:Math.random(),y:-.04,r:.025+Math.random()*.018});s.lastSpawn=now}s.obstacles.forEach(o=>o.y+=dt*.00032);s.obstacles=s.obstacles.filter(o=>o.y<1.08);if(s.obstacles.some(o=>Math.hypot(o.x-s.x,o.y-.86)<o.r+.035))return win('¡Te alcanzaron!',`Sobreviviste ${Math.floor(s.time/1000)} segundos.`)}else if(t==='memory'&&s.flipped.length===2&&!s.lock){s.lock=true;setTimeout(()=>{if(s.deck[s.flipped[0]]===s.deck[s.flipped[1]]){s.matched.add(s.flipped[0]);s.matched.add(s.flipped[1])}s.flipped=[];s.lock=false;if(s.matched.size===16)win('¡Memoria increíble!',`Parejas encontradas en ${s.turns} intentos.`);draw()},650)}else if(t==='simon'&&s.flash>=0&&now>s.flashUntil)s.flash=-1;else if(t==='math'){s.time-=dt;if(s.time<=0)win('¡Tiempo!',`Respuestas correctas: ${s.score}`)}else if(t==='reaction'&&s.phase==='wait'&&now>s.waitAt){s.phase='go';s.startAt=now}else if(t==='clicker'&&s.started){s.time-=dt/1000;if(s.time<=0){s.started=false;win('¡Tiempo!',`Hiciste ${s.clicks} toques.`)}}}


/* ============ MOTOR 3D (Three.js) ============ */
const T3={ready:false,failed:false,mode:null,renderer:null,scene:null,camera:null,p:{},items:[],t:0};
const TYPES_3D=['pong','tablefootball','shipsoccer','starfighter','airhockey'];
function is3D(t){return T3.ready&&TYPES_3D.indexOf(t)>=0}
function mat(c,o){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6,metalness:.15},o||{}))}
function box(w,h,d,c,o){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c,o))}
function ensureRenderer(){
  if(T3.ready||T3.failed)return T3.ready;
  try{
    if(typeof THREE==='undefined')throw new Error('three.js no disponible');
    const r=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
    r.setPixelRatio(Math.min(devicePixelRatio||1,2));
    r.domElement.id='webglCanvas';
    Object.assign(r.domElement.style,{position:'absolute',top:'0',left:'0',width:'100%',height:'100%',zIndex:'1'});
    Object.assign(canvas.style,{position:'absolute',top:'0',left:'0',width:'100%',height:'100%',zIndex:'2'});
    stage.insertBefore(r.domElement,canvas);
    T3.renderer=r;T3.ready=true;
  }catch(e){T3.failed=true;console.warn('3D no disponible:',e)}
  return T3.ready;
}
function show3D(on){if(T3.renderer)T3.renderer.domElement.style.display=on?'block':'none'}
function disposeScene(){
  if(!T3.scene)return;
  T3.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){[].concat(o.material).forEach(m=>m.dispose())}});
  T3.scene=null;T3.p={};T3.items=[];
}
function resize3D(){
  if(!T3.ready||!T3.camera)return;
  const r=stage.getBoundingClientRect();
  T3.renderer.setSize(r.width,r.height,false);
  T3.camera.aspect=r.width/Math.max(1,r.height);T3.camera.updateProjectionMatrix();
}
function lights3D(sc,amb,key){
  sc.add(new THREE.AmbientLight(amb,1.1));
  const d=new THREE.DirectionalLight(key,1.5);d.position.set(6,14,8);sc.add(d);
  const d2=new THREE.DirectionalLight(0x88aaff,.5);d2.position.set(-8,6,-10);sc.add(d2);
}
function figure(color){
  const g=new THREE.Group();
  const torso=box(.55,.85,.42,color,{metalness:.1});torso.position.y=.1;g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.26,14,12),mat(0xf2c89c));head.position.y=.76;g.add(head);
  const legs=box(.5,.55,.36,0x1f2937);legs.position.y=-.5;g.add(legs);
  const arms=box(.95,.18,.2,color);arms.position.y=.3;g.add(arms);
  return g;
}
function buildPong(){
  const sc=new THREE.Scene();sc.fog=new THREE.Fog(0x061018,26,52);lights3D(sc,0x30425c,0xfff6e0);
  const top=box(11,.5,18,0x0f5f52,{roughness:.35});top.position.y=-.25;sc.add(top);
  const edge=(x,z,w,d)=>{const m=box(w,.08,d,0xf8fafc,{roughness:.4,metalness:0});m.position.set(x,.03,z);sc.add(m)};
  edge(0,0,10.6,.12);edge(-5.3,0,.12,17.6);edge(5.3,0,.12,17.6);edge(0,-8.8,10.6,.12);edge(0,8.8,10.6,.12);
  const net=box(11.4,1.05,.08,0xe2e8f0,{transparent:true,opacity:.55,roughness:.9});net.position.set(0,.5,0);sc.add(net);
  const post=(x)=>{const m=box(.12,1.2,.12,0x94a3b8,{metalness:.8});m.position.set(x,.6,0);sc.add(m)};post(-5.6);post(5.6);
  [[-4.6,-7.6],[4.6,-7.6],[-4.6,7.6],[4.6,7.6]].forEach(([x,z])=>{
    const l=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,5,10),mat(0x334155,{metalness:.6}));
    l.position.set(x,-2.9,z);sc.add(l);
  });
  const paddle=(c)=>{
    const g=new THREE.Group();
    const blade=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.25,.18,22),mat(c,{roughness:.55}));
    blade.rotation.x=Math.PI/2;blade.position.y=.75;g.add(blade);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(1.25,.09,8,24),mat(0x1f2937));
    rim.position.y=.75;g.add(rim);
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(.17,.2,1.1,10),mat(0x8b5a2b));
    handle.position.set(0,-.1,0);g.add(handle);
    sc.add(g);return g;
  };
  T3.p.player=paddle(0xa3e635);T3.p.cpu=paddle(0x38bdf8);
  T3.p.ball=new THREE.Mesh(new THREE.SphereGeometry(.34,18,14),mat(0xffffff,{emissive:0x6b7280,emissiveIntensity:.35,roughness:.3}));
  sc.add(T3.p.ball);
  T3.p.shadow=new THREE.Mesh(new THREE.CircleGeometry(.36,16),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.3}));
  T3.p.shadow.rotation.x=-Math.PI/2;T3.p.shadow.position.y=.02;sc.add(T3.p.shadow);
  const cam=new THREE.PerspectiveCamera(52,1,.1,120);cam.position.set(0,9.5,17.5);cam.lookAt(0,0,-1.5);
  T3.scene=sc;T3.camera=cam;
}
function buildFoosball(){
  const sc=new THREE.Scene();sc.fog=new THREE.Fog(0x08121c,30,62);lights3D(sc,0x3a4a60,0xfff4de);
  const pitch=box(11,.4,18,0x15803d,{roughness:.85,metalness:0});pitch.position.y=-.2;sc.add(pitch);
  const line=(x,z,w,d)=>{const m=box(w,.06,d,0xeefbe9,{roughness:.9,metalness:0});m.position.set(x,.03,z);sc.add(m)};
  line(0,0,10.4,.14);line(-5.2,0,.14,17.6);line(5.2,0,.14,17.6);
  const circle=new THREE.Mesh(new THREE.TorusGeometry(2.1,.07,8,36),mat(0xeefbe9,{roughness:.9}));
  circle.rotation.x=-Math.PI/2;circle.position.y=.04;sc.add(circle);
  [[0,8.1],[0,-8.1]].forEach(([x,z])=>{line(x,z,5.4,.14)});
  const wood=0x8b5a2b;
  const rail=(x,z,w,d)=>{const m=box(w,1.5,d,wood,{roughness:.65,metalness:.05});m.position.set(x,.55,z);sc.add(m)};
  rail(-5.9,0,.7,19.4);rail(5.9,0,.7,19.4);
  const goal=(z)=>{
    const g=new THREE.Group();
    const back=box(5.2,1.7,.35,0x111827,{metalness:.2});back.position.set(0,.65,z);g.add(back);
    const sideL=box(.35,1.7,1.4,wood);sideL.position.set(-2.6,.65,z+(z>0?-.8:.8));g.add(sideL);
    const sideR=sideL.clone();sideR.position.x=2.6;g.add(sideR);
    const netM=new THREE.MeshStandardMaterial({color:0xdbeafe,transparent:true,opacity:.3,wireframe:true});
    const net=new THREE.Mesh(new THREE.BoxGeometry(5.2,1.7,1.4),netM);
    net.position.set(0,.65,z+(z>0?-.8:.8));g.add(net);
    rail(-4.3,z+(z>0?-.2:.2),2.6,.7);rail(4.3,z+(z>0?-.2:.2),2.6,.7);
    sc.add(g);
  };
  goal(9.4);goal(-9.4);
  const rod=(z,color,isPlayer)=>{
    const g=new THREE.Group();
    const bar=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,14,10),mat(0xcbd5e1,{metalness:.85,roughness:.25}));
    bar.rotation.z=Math.PI/2;bar.position.y=1.35;g.add(bar);
    const men=[];
    [-3.1,0,3.1].forEach(x=>{const f=figure(color);f.position.set(x,.85,0);g.add(f);men.push(f)});
    g.position.z=z;g.userData.men=men;sc.add(g);return g;
  };
  T3.p.playerRods=[rod(6.6,0x2563eb,true),rod(2.6,0x2563eb,true)];
  T3.p.cpuRods=[rod(-6.6,0xef4444,false),rod(-2.6,0xef4444,false)];
  T3.p.ball=new THREE.Mesh(new THREE.SphereGeometry(.32,18,14),mat(0xf8fafc,{roughness:.35}));
  sc.add(T3.p.ball);
  T3.p.shadow=new THREE.Mesh(new THREE.CircleGeometry(.34,16),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35}));
  T3.p.shadow.rotation.x=-Math.PI/2;T3.p.shadow.position.y=.03;sc.add(T3.p.shadow);
  const cam=new THREE.PerspectiveCamera(54,1,.1,140);cam.position.set(0,12.5,17);cam.lookAt(0,0,0);
  T3.scene=sc;T3.camera=cam;
}
function buildShipSoccer(){
  const sc=new THREE.Scene();sc.fog=new THREE.Fog(0x04070f,30,64);lights3D(sc,0x263a5c,0xbfe9ff);
  const pitch=box(11,.3,18,0x0b2f3a,{roughness:.5,metalness:.3});pitch.position.y=-.15;sc.add(pitch);
  const neon=(x,z,w,d)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.05,d),new THREE.MeshBasicMaterial({color:0x5eead4}));m.position.set(x,.03,z);sc.add(m)};
  neon(0,0,10.6,.1);neon(-5.3,0,.1,18);neon(5.3,0,.1,18);neon(0,9,10.6,.1);neon(0,-9,10.6,.1);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.2,.06,8,40),new THREE.MeshBasicMaterial({color:0x5eead4}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.04;sc.add(ring);
  const stars=new THREE.BufferGeometry();const pts=new Float32Array(600);
  for(let i=0;i<600;i++)pts[i]=(Math.random()-.5)*160;
  stars.setAttribute('position',new THREE.BufferAttribute(pts,3));
  T3.p.stars=new THREE.Points(stars,new THREE.PointsMaterial({color:0x9ec5ff,size:.5}));sc.add(T3.p.stars);
  const craft=(c)=>{
    const g=new THREE.Group();
    const hull=new THREE.Mesh(new THREE.ConeGeometry(.45,1.5,4),mat(c,{metalness:.6,roughness:.35}));
    hull.rotation.x=Math.PI/2;g.add(hull);
    const glow=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),new THREE.MeshBasicMaterial({color:0xfff1a8}));
    glow.position.z=-.8;g.add(glow);
    sc.add(g);return g;
  };
  T3.p.playerShips=[craft(0xa3e635),craft(0xa3e635),craft(0xa3e635)];
  T3.p.cpuShips=[craft(0x38bdf8),craft(0x38bdf8),craft(0x38bdf8)];
  T3.p.cpuShips.forEach(s=>s.rotation.y=Math.PI);
  T3.p.ball=new THREE.Mesh(new THREE.SphereGeometry(.36,18,14),new THREE.MeshBasicMaterial({color:0xfef9c3}));
  sc.add(T3.p.ball);
  const cam=new THREE.PerspectiveCamera(54,1,.1,160);cam.position.set(0,11.5,17);cam.lookAt(0,0,0);
  T3.scene=sc;T3.camera=cam;
}
function buildStarfighter(){
  const sc=new THREE.Scene();sc.fog=new THREE.Fog(0x05070f,40,90);lights3D(sc,0x404060,0xffeedd);
  const stars=new THREE.BufferGeometry();const pts=new Float32Array(900);
  for(let i=0;i<900;i++)pts[i]=(Math.random()-.5)*220;
  stars.setAttribute('position',new THREE.BufferAttribute(pts,3));
  T3.p.stars=new THREE.Points(stars,new THREE.PointsMaterial({color:0x99ccff,size:.8}));sc.add(T3.p.stars);
  const ship=new THREE.Group();
  const body=new THREE.Mesh(new THREE.ConeGeometry(.5,2.6,4),mat(0x0a1c3a,{roughness:.4,metalness:.7}));
  body.rotation.x=-Math.PI/2;ship.add(body);
  const wingMat={roughness:.5,metalness:.5};
  const w1=new THREE.Mesh(new THREE.ConeGeometry(1.25,.6,3),mat(0x103a6a,wingMat));
  w1.scale.set(1,.22,1);w1.position.set(-.85,0,-.5);w1.rotation.z=Math.PI/8;ship.add(w1);
  const w2=w1.clone();w2.position.x=.85;w2.rotation.z=-Math.PI/8;ship.add(w2);
  const cockpit=new THREE.Mesh(new THREE.SphereGeometry(.36,14,12),mat(0x44aaff,{roughness:.08,metalness:.9,transparent:true,opacity:.85}));
  cockpit.scale.set(1,.7,1.5);cockpit.position.set(0,.3,.25);ship.add(cockpit);
  const engineMat=new THREE.MeshStandardMaterial({color:0x222222,emissive:0xff6600,emissiveIntensity:2.2});
  const e1=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.55,10),engineMat);
  e1.rotation.x=Math.PI/2;e1.position.set(-.32,0,-1.3);ship.add(e1);
  const e2=e1.clone();e2.position.x=.32;ship.add(e2);
  const flame=new THREE.Mesh(new THREE.ConeGeometry(.22,1.1,8),new THREE.MeshBasicMaterial({color:0x67e8f9,transparent:true,opacity:.75}));
  flame.rotation.x=-Math.PI/2;flame.position.set(0,0,-2);ship.add(flame);
  T3.p.flame=flame;
  const pivot=new THREE.Group();pivot.add(ship);sc.add(pivot);T3.p.ship=pivot;
  const cam=new THREE.PerspectiveCamera(60,1,.1,300);cam.position.set(0,4,9);cam.lookAt(0,.5,-4);
  T3.scene=sc;T3.camera=cam;
}
function buildAirHockey(){
  const sc=new THREE.Scene();sc.fog=new THREE.Fog(0x05121d,30,62);lights3D(sc,0x2b4256,0xeaf6ff);
  const bed=box(11,.5,18,0x0e3350,{roughness:.25,metalness:.35});bed.position.y=-.25;sc.add(bed);
  const paint=(x,z,w,d,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.05,d),new THREE.MeshBasicMaterial({color:c||0x7dd3fc}));m.position.set(x,.03,z);sc.add(m)};
  paint(0,0,10.6,.14);paint(0,8.4,5.6,.14,0xfca5a5);paint(0,-8.4,5.6,.14,0xfca5a5);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.2,.07,8,40),new THREE.MeshBasicMaterial({color:0x7dd3fc}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.04;sc.add(ring);
  const rail=(x,z,w,d)=>{const m=box(w,.9,d,0xe2e8f0,{roughness:.3,metalness:.5});m.position.set(x,.3,z);sc.add(m)};
  rail(-5.7,0,.6,19);rail(5.7,0,.6,19);rail(-4,9.2,3.4,.6);rail(4,9.2,3.4,.6);rail(-4,-9.2,3.4,.6);rail(4,-9.2,3.4,.6);
  const mallet=(c)=>{
    const g=new THREE.Group();
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,.35,24),mat(c,{roughness:.35,metalness:.3}));
    base.position.y=.2;g.add(base);
    const knob=new THREE.Mesh(new THREE.CylinderGeometry(.42,.5,.45,16),mat(0x111827,{roughness:.5}));
    knob.position.y=.58;g.add(knob);
    sc.add(g);return g;
  };
  T3.p.player=mallet(0xa3e635);T3.p.cpu=mallet(0x38bdf8);
  T3.p.ball=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.22,22),mat(0xf8fafc,{roughness:.3}));
  T3.p.ball.position.y=.15;sc.add(T3.p.ball);
  T3.p.shadow=new THREE.Mesh(new THREE.CircleGeometry(.5,18),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35}));
  T3.p.shadow.rotation.x=-Math.PI/2;T3.p.shadow.position.y=.045;sc.add(T3.p.shadow);
  const cam=new THREE.PerspectiveCamera(52,1,.1,140);cam.position.set(0,12,16.5);cam.lookAt(0,0,0);
  T3.scene=sc;T3.camera=cam;
}
function init3D(mode){
  if(TYPES_3D.indexOf(mode)<0){show3D(false);return}
  if(!ensureRenderer())return;
  if(T3.mode!==mode||!T3.scene){
    disposeScene();
    if(mode==='pong')buildPong();
    else if(mode==='tablefootball')buildFoosball();
    else if(mode==='shipsoccer')buildShipSoccer();
    else if(mode==='airhockey')buildAirHockey();
    else buildStarfighter();
    T3.mode=mode;
  }
  T3.items.forEach(o=>T3.scene.remove(o));T3.items=[];
  show3D(true);resize3D();T3.renderer.render(T3.scene,T3.camera);
}
function map3D(s){
  const t=selected.type;
  if(t==='pong'&&orientation==='portrait')return{bx:(s.x-.5)*10,bz:(s.y-.5)*16,p:(s.py-.5)*10,c:(s.cy-.5)*10};
  return{bx:(s.y-.5)*10,bz:(.5-s.x)*16,p:(s.py-.5)*10,c:(s.cy-.5)*10};
}
function render3D(dt,s){
  if(!T3.ready||!T3.scene||!T3.camera)return;
  const d=Math.min(dt,50)/1000,m=T3.mode,P=T3.p;T3.t+=d;
  if(m==='pong'){
    const q=map3D(s);
    P.ball.position.set(q.bx,.45+Math.abs(Math.sin(T3.t*5))*.45,q.bz);
    P.ball.rotation.x+=d*8;P.ball.rotation.y+=d*5;
    P.shadow.position.set(q.bx,.06,q.bz);
    P.player.position.set(q.p,.1,6.4);P.cpu.position.set(q.c,.1,-6.4);
    P.player.rotation.z=clamp((q.bx-q.p)*.06,-.5,.5);
    P.cpu.rotation.z=clamp((q.bx-q.c)*.06,-.5,.5);
    P.player.rotation.x=-.25;P.cpu.rotation.x=.25;
    T3.camera.position.x+=((q.p*.22)-T3.camera.position.x)*2.5*d;
  }else if(m==='tablefootball'){
    const q=map3D(s);
    P.ball.position.set(q.bx,.35,q.bz);P.ball.rotation.x+=d*9;P.ball.rotation.z-=d*6;
    P.shadow.position.set(q.bx,.05,q.bz);
    P.playerRods.forEach((r,i)=>{
      r.position.x=clamp(q.p*(i===0?1:.85),-2.4,2.4);
      const near=Math.abs(q.bz-r.position.z)<1.6&&Math.abs(q.bx-r.position.x)<4;
      const kick=near?Math.sin(T3.t*22)*.75:0;
      r.userData.men.forEach(f=>f.rotation.x=kick);
    });
    P.cpuRods.forEach((r,i)=>{
      r.position.x=clamp(q.c*(i===0?1:.85),-2.4,2.4);
      const near=Math.abs(q.bz-r.position.z)<1.6&&Math.abs(q.bx-r.position.x)<4;
      const kick=near?Math.sin(T3.t*22)*.75:0;
      r.userData.men.forEach(f=>f.rotation.x=kick);
    });
    T3.camera.position.x+=((q.bx*.15)-T3.camera.position.x)*1.8*d;
    T3.camera.lookAt(0,0,0);
  }else if(m==='airhockey'){
    const q=map3D(s);
    P.ball.position.set(q.bx,.15,q.bz);P.ball.rotation.y+=d*4;
    P.shadow.position.set(q.bx,.045,q.bz);
    P.player.position.set(q.p,0,6.8);P.cpu.position.set(q.c,0,-6.8);
    T3.camera.position.x+=((q.bx*.12)-T3.camera.position.x)*2*d;
    T3.camera.lookAt(0,0,0);
  }else if(m==='shipsoccer'){
    const q=map3D(s);
    P.ball.position.set(q.bx,.5+Math.sin(T3.t*4)*.15,q.bz);
    P.stars.rotation.y+=d*.03;
    P.playerShips.forEach((sh,i)=>{
      sh.position.set(clamp(q.p+(i-1)*1.9,-4.6,4.6),.75,6.6);
      sh.rotation.z=Math.sin(T3.t*3+i)*.12;
    });
    P.cpuShips.forEach((sh,i)=>{
      sh.position.set(clamp(q.c+(i-1)*1.9,-4.6,4.6),.75,-6.6);
      sh.rotation.z=Math.sin(T3.t*3+i)*.12;
    });
  }else if(m==='starfighter'){
    P.stars.rotation.x+=.05*d;P.stars.position.z=(P.stars.position.z+d*8)%40;
    const tx=(s.x-.5)*15,ship=P.ship;
    const prev=ship.position.x;
    ship.position.x+=(tx-ship.position.x)*6*d;
    ship.rotation.z+=((-(ship.position.x-prev)*2.2)-ship.rotation.z)*7*d;
    ship.rotation.x=Math.sin(T3.t*2)*.05;
    ship.position.y=Math.sin(T3.t*1.6)*.25;
    P.flame.scale.z=.8+Math.random()*.5;
    if(Math.random()<d*1.9){
      const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.5+Math.random()*.9),mat(0x6b6560,{roughness:.9}));
      r.position.set((Math.random()-.5)*18,(Math.random()-.4)*5,-70);
      r.userData={rock:true,vx:(Math.random()-.5)*2,rx:Math.random()*2,ry:Math.random()*2};
      T3.scene.add(r);T3.items.push(r);
    }
    if(s.shots&&s.shots.length){
      s.shots.forEach(sh=>{
        if(sh.mesh)return;
        const l=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,2.2,6),new THREE.MeshBasicMaterial({color:0x67e8f9}));
        l.rotation.x=Math.PI/2;
        l.position.set(ship.position.x,ship.position.y,-2);
        l.userData={laser:true};
        T3.scene.add(l);T3.items.push(l);sh.mesh=l;
      });
      s.shots=s.shots.filter(sh=>sh.mesh&&!sh.mesh.userData.dead);
    }
    T3.items.forEach(o=>{
      if(o.userData.laser){o.position.z-=70*d;if(o.position.z<-80)o.userData.dead=true}
      else{
        o.position.z+=28*d;o.position.x+=o.userData.vx*d;
        o.rotation.x+=o.userData.rx*d;o.rotation.y+=o.userData.ry*d;
        if(o.position.z>12)o.userData.dead=true;
      }
    });
    const lasers=T3.items.filter(o=>o.userData.laser&&!o.userData.dead);
    const rocks=T3.items.filter(o=>o.userData.rock&&!o.userData.dead);
    lasers.forEach(l=>rocks.forEach(r=>{
      if(!l.userData.dead&&!r.userData.dead&&l.position.distanceTo(r.position)<1.7){
        l.userData.dead=true;r.userData.dead=true;s.score+=15;
      }
    }));
    rocks.forEach(r=>{
      if(!r.userData.dead&&Math.abs(r.position.z-ship.position.z)<1.6&&Math.abs(r.position.x-ship.position.x)<1.5&&Math.abs(r.position.y-ship.position.y)<1.6){
        r.userData.dead=true;s.hits=(s.hits||0)+1;
      }
    });
    for(let i=T3.items.length-1;i>=0;i--){
      if(T3.items[i].userData.dead){
        const o=T3.items[i];T3.scene.remove(o);
        if(o.geometry)o.geometry.dispose();
        T3.items.splice(i,1);
      }
    }
    if(s.hits>=3){win('¡Misión terminada!','Puntuación: '+s.score+'. Esquiva mejor los asteroides.');return}
  }
  T3.renderer.render(T3.scene,T3.camera);
}
function hud3D(w,h,s){
  const t=selected.type;ctx.clearRect(0,0,w,h);
  if(t==='starfighter'){
    label('SCORE '+s.score+'　·　IMPACTOS '+(s.hits||0)+'/3',w/2,24);
    ctx.fillStyle='#8da0b9';ctx.font='10px sans-serif';ctx.textAlign='center';
    ctx.fillText('TIEMPO '+Math.max(0,Math.ceil((60000-s.time)/1000))+' s',w/2,h-12);
  }else{
    label('TÚ '+s.player+'　·　'+s.cpu+' CPU',w/2,24);
  }
}

function ball(x,y,r){ctx.fillStyle='#f8fafc';ctx.shadowColor='#fff';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}function label(v,x,y){ctx.fillStyle='#e7f0fb';ctx.font='bold 15px sans-serif';ctx.textAlign='center';ctx.fillText(v,x,y)}function ship(x,y,size,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size*.75,y+size*.65);ctx.lineTo(x,y+size*.35);ctx.lineTo(x-size*.75,y+size*.65);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,size*.19,0,Math.PI*2);ctx.fill()}
function draw(){const dpr=Math.min(devicePixelRatio||1,2),w=canvas.width/dpr,h=canvas.height/dpr,s=state,t=selected.type;ctx.clearRect(0,0,w,h);if(!is3D(t)){ctx.fillStyle='#091521';ctx.fillRect(0,0,w,h)}if(t==='pong'){ if(is3D(t)){hud3D(w,h,s)}else{ ctx.fillStyle='#0b372f';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#ffffff55';ctx.setLineDash([8,8]);ctx.beginPath();if(orientation==='portrait'&&innerWidth<520){ctx.moveTo(0,h/2);ctx.lineTo(w,h/2)}else{ctx.moveTo(w/2,0);ctx.lineTo(w/2,h)}ctx.stroke();ctx.setLineDash([]);if(orientation==='portrait'&&innerWidth<520){ctx.fillStyle='#38bdf8';ctx.fillRect(w*.18,s.cy*w-7,w*.64,14);ctx.fillStyle='#a3e635';ctx.fillRect(s.py*w-7,h*.89,14,h*.07);ball(s.x*w,s.y*h,8);label(`CPU ${s.cpu}　·　TÚ ${s.player}`,w/2,24)}else{ctx.fillStyle='#a3e635';ctx.fillRect(w*.06,s.py*h-8,w*.18,16);ctx.fillStyle='#38bdf8';ctx.fillRect(w*.76,s.cy*h-8,w*.18,16);ball(s.x*w,s.y*h,8);label(`TÚ ${s.player}  :  ${s.cpu} CPU`,w/2,24)}}}else if(t==='starfighter'){drawStarfighter(w,h,s)}else if(t==='tablefootball'){drawTableFootball(w,h,s)}else if(t==='airhockey'){drawAirHockey(w,h,s)}else if(t==='shipsoccer'){ if(is3D(t)){hud3D(w,h,s)}else{ ctx.fillStyle='#123b32';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#77c9a6aa';ctx.lineWidth=2;ctx.strokeRect(w*.07,h*.035,w*.86,h*.93);ctx.beginPath();ctx.moveTo(w/2,h*.035);ctx.lineTo(w/2,h*.965);ctx.stroke();ctx.beginPath();ctx.arc(w/2,h/2,Math.min(w,h)*.13,0,Math.PI*2);ctx.stroke();ctx.strokeRect(w*.07,h*.34,w*.105,h*.32);ctx.strokeRect(w*.825,h*.34,w*.105,h*.32);for(let i=-1;i<=1;i++){ship(w*.13,s.py*h+i*h*.12,Math.min(13,w*.027),'#a3e635');ship(w*.87,s.cy*h+i*h*.12,Math.min(13,w*.027),'#38bdf8')}ball(s.x*w,s.y*h,Math.max(7,Math.min(w,h)*.018));label(`${s.player}  :  ${s.cpu}`,w/2,24)}}else if(t==='snake'){const c=Math.min(w,h)/s.cells,ox=(w-c*s.cells)/2,oy=(h-c*s.cells)/2;ctx.fillStyle='#0e1d2b';ctx.fillRect(ox,oy,c*s.cells,c*s.cells);ctx.fillStyle='#f87171';ctx.beginPath();ctx.arc(ox+(s.food[0]+.5)*c,oy+(s.food[1]+.5)*c,c*.33,0,7);ctx.fill();s.snake.forEach((p,i)=>{ctx.fillStyle=i?'#65a30d':'#a3e635';ctx.beginPath();ctx.roundRect(ox+p[0]*c+1,oy+p[1]*c+1,c-2,c-2,c*.2);ctx.fill()});label(`Puntos: ${s.score}`,w/2,25)}else if(t==='breakout'){s.bricks.forEach((b,i)=>{if(b.on){ctx.fillStyle=['#f87171','#fb923c','#facc15','#4ade80','#38bdf8'][Math.floor(i/7)];ctx.beginPath();ctx.roundRect(b.x*w-.045*w,b.y*h-.018*h,.09*w,.036*h,5);ctx.fill()}});ctx.fillStyle='#a3e635';ctx.beginPath();ctx.roundRect(s.px*w-.09*w,.88*h,.18*w,.022*h,6);ctx.fill();ball(s.bx*w,s.by*h,8);label(`Bloques: ${s.score}`,w/2,25)}else if(t==='dodge'){for(let i=0;i<45;i++){ctx.fillStyle=`rgba(220,240,255,${.2+(i%4)*.15})`;ctx.fillRect((i*97)%w,(i*67+Date.now()*.008*(i%3+1))%h,2,2)}ship(s.x*w,h*.86,18,'#a3e635');s.obstacles.forEach(o=>{ctx.fillStyle='#fb7185';ctx.beginPath();ctx.arc(o.x*w,o.y*h,o.r*w,0,7);ctx.fill()});label(`Tiempo: ${Math.floor(s.time/1000)} s`,w/2,24)}else if(t==='memory')drawMemory(w,h,s);else if(t==='simon')drawSimon(w,h,s);else if(t==='math')drawMath(w,h,s);else if(t==='sequence')drawSequence(w,h,s);else if(t==='reaction')drawReaction(w,h,s);else if(t==='clicker')drawClicker(w,h,s);else if(t==='lights')drawLights(w,h,s)}
function drawAirHockey(w,h,s){if(is3D('airhockey')){return hud3D(w,h,s)}ctx.fillStyle='#0b2537';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#7dd3fc99';ctx.lineWidth=2;ctx.strokeRect(w*.06,h*.05,w*.88,h*.9);ctx.beginPath();ctx.moveTo(w/2,h*.05);ctx.lineTo(w/2,h*.95);ctx.stroke();ctx.beginPath();ctx.arc(w/2,h/2,Math.min(w,h)*.13,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#a3e635';ctx.beginPath();ctx.arc(w*.13,s.py*h,Math.min(w,h)*.045,0,Math.PI*2);ctx.fill();ctx.fillStyle='#38bdf8';ctx.beginPath();ctx.arc(w*.87,s.cy*h,Math.min(w,h)*.045,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f8fafc';ctx.beginPath();ctx.arc(s.x*w,s.y*h,Math.max(6,Math.min(w,h)*.022),0,Math.PI*2);ctx.fill();label(`${s.player} — ${s.cpu}`,w/2,24)}
function drawTableFootball(w,h,s){if(is3D('tablefootball')){return hud3D(w,h,s)}ctx.fillStyle='#14713e';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#e7f7dfb0';ctx.lineWidth=2;ctx.strokeRect(w*.055,h*.06,w*.89,h*.88);ctx.beginPath();ctx.moveTo(w/2,h*.06);ctx.lineTo(w/2,h*.94);ctx.stroke();ctx.beginPath();ctx.arc(w/2,h/2,Math.min(w,h)*.12,0,Math.PI*2);ctx.stroke();ctx.strokeRect(w*.055,h*.35,w*.1,h*.3);ctx.strokeRect(w*.845,h*.35,w*.1,h*.3);for(let i=0;i<3;i++){const yy=h*(.25+i*.25);ctx.strokeStyle=i===1?'#d8e5ea':'#aab7bd';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(w*.16,yy);ctx.lineTo(w*.84,yy);ctx.stroke();for(let j=0;j<3;j++){const px=w*(.23+j*.23);drawPlayer(px,yy+(i%2?4:-4),Math.min(w,h)*.032,i%2?'#ef4444':'#2563eb')}}drawPlayer(w*.14,s.py*h,Math.min(w,h)*.035,'#2563eb');ctx.fillStyle='#f8fafc';ctx.beginPath();ctx.arc(s.x*w,s.y*h,Math.max(5,Math.min(w,h)*.017),0,Math.PI*2);ctx.fill();label(`${s.player} — ${s.cpu}`,w/2,24)}function drawPlayer(x,y,r,color){ctx.fillStyle='#f5caa0';ctx.beginPath();ctx.arc(x,y-r*.95,r*.53,0,Math.PI*2);ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x-r*.52,y-r*.5,r*1.04,r*1.5,r*.3);ctx.fill();ctx.strokeStyle='#f5caa0';ctx.lineWidth=Math.max(2,r*.25);ctx.beginPath();ctx.moveTo(x-r*.2,y+r*.9);ctx.lineTo(x-r*.35,y+r*1.45);ctx.moveTo(x+r*.2,y+r*.9);ctx.lineTo(x+r*.35,y+r*1.45);ctx.stroke()}function drawStarfighter(w,h,s){hud3D(w,h,s)}
function drawPlanet(x,y,r,c1,c2){const grad=ctx.createRadialGradient(x-r*.35,y-r*.38,r*.05,x,y,r);grad.addColorStop(0,'#fff2c7');grad.addColorStop(.24,c1);grad.addColorStop(1,c2);ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();ctx.fillStyle='#fff2c722';for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(x-r*.1,y-r*.55+i*r*.28,r*.9,r*.08,-.3,0,Math.PI*2);ctx.fill()}ctx.restore()}
function drawMemory(w,h,s){const size=Math.min(w*.82/4,h*.65/4),gap=size*.08,total=size*4+gap*3,x0=(w-total)/2,y0=(h-total)/2;s.cardGeom={size,gap,x0,y0};s.deck.forEach((v,i)=>{const x=x0+i%4*(size+gap),y=y0+Math.floor(i/4)*(size+gap);ctx.fillStyle=s.matched.has(i)?'#2d5038':s.flipped.includes(i)?'#29435d':'#192c42';ctx.beginPath();ctx.roundRect(x,y,size,size,size*.16);ctx.fill();ctx.strokeStyle='#49627b';ctx.stroke();if(s.flipped.includes(i)||s.matched.has(i)){ctx.font=`${size*.48}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(v,x+size/2,y+size/2)}});label(`Intentos: ${s.turns}`,w/2,Math.max(22,y0-12))}function drawSimon(w,h,s){const rad=Math.min(w,h)*.18,cs=[[w/2,h*.31],[w*.32,h*.55],[w*.68,h*.55],[w/2,h*.79]],co=['#ef4444','#3b82f6','#eab308','#22c55e'];cs.forEach((p,i)=>{ctx.fillStyle=s.flash===i?['#fca5a5','#93c5fd','#fde047','#86efac'][i]:co[i];ctx.beginPath();ctx.arc(p[0],p[1],rad,0,7);ctx.fill()});label(`Ronda ${s.round}`,w/2,h*.08)}function drawMath(w,h,s){label(s.question,w/2,h*.35);s.options.forEach((n,i)=>{const x=w*(.25+i*.25);ctx.fillStyle='#1d334b';ctx.beginPath();ctx.roundRect(x-w*.09,h*.52,w*.18,h*.16,12);ctx.fill();ctx.fillStyle='white';ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n,x,h*.60)});label(`Puntos: ${s.score}　${Math.ceil(s.time/1000)}s`,w/2,h*.86)}function drawSequence(w,h,s){label(s.series.join('   ')+'   ?',w/2,h*.36);s.options.forEach((n,i)=>{const x=w*(.25+i*.25);ctx.fillStyle='#1d334b';ctx.beginPath();ctx.roundRect(x-w*.09,h*.52,w*.18,h*.16,12);ctx.fill();ctx.fillStyle='white';ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n,x,h*.60)});label(`Resueltos: ${s.score}`,w/2,h*.84)}function drawReaction(w,h,s){ctx.fillStyle=s.phase==='go'?'#22c55e':s.phase==='early'?'#ef4444':'#334155';ctx.beginPath();ctx.arc(w/2,h*.49,Math.min(w,h)*.22,0,7);ctx.fill();ctx.fillStyle='white';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s.phase==='go'?'¡TOCA!':s.result,w/2,h*.49)}function drawClicker(w,h,s){ctx.fillStyle='#a3e635';ctx.beginPath();ctx.arc(w/2,h*.49,Math.min(w,h)*.25,0,7);ctx.fill();ctx.fillStyle='#17200c';ctx.font='bold 25px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s.started?`${s.clicks} 👆`:'TOCA',w/2,h*.48);label(`${Math.max(0,s.time).toFixed(1)} segundos`,w/2,h*.84)}function drawLights(w,h,s){const size=Math.min(w*.72/5,h*.62/5),gap=size*.08,total=size*5+gap*4,x0=(w-total)/2,y0=(h-total)/2;s.lightGeom={size,gap,x0,y0};s.lights.forEach((on,i)=>{ctx.fillStyle=on?'#facc15':'#20334a';ctx.beginPath();ctx.roundRect(x0+i%5*(size+gap),y0+Math.floor(i/5)*(size+gap),size,size,size*.15);ctx.fill()});label(`Movimientos: ${s.moves}`,w/2,Math.max(22,y0-12))}
function newMath(){const a=rand(2,15),b=rand(2,12),op=Math.random()<.5?'+':'−';state.question=`${a} ${op} ${b} = ?`;state.answer=op==='+'?a+b:a-b;state.options=[state.answer,state.answer+rand(1,5),state.answer-rand(1,4)].sort(()=>Math.random()-.5)}function newSequence(){const a=rand(1,12),d=rand(2,8);state.series=[0,1,2,3].map(i=>a+i*d);state.answer=a+4*d;state.options=[state.answer,state.answer+d,state.answer-1].sort(()=>Math.random()-.5)}function addSimon(){state.seq.push(rand(0,3));state.input=[];state.round=state.seq.length;state.wait=true;let i=0;const flash=()=>{if(i>=state.seq.length){state.wait=false;state.flash=-1;draw();return}state.flash=state.seq[i++];state.flashUntil=performance.now()+450;draw();setTimeout(flash,720)};flash()}
function tap(e){if(!running)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height,s=state,t=selected.type;if(t==='pong'){if(orientation==='portrait'){s.py=clamp(x,.08,.92)}else s.py=clamp(y,.08,.92)}else if(t==='shipsoccer'||t==='tablefootball'||t==='airhockey'){s.py=clamp(is3D(t)?x:y,.12,.88)}else if(t==='breakout')s.px=x;else if(t==='dodge')s.x=x;else if(t==='memory'){const g=s.cardGeom;if(!g)return;const col=Math.floor((x*r.width-g.x0)/(g.size+g.gap)),row=Math.floor((y*r.height-g.y0)/(g.size+g.gap)),i=row*4+col;if(col>=0&&col<4&&row>=0&&row<4&&!s.matched.has(i)&&!s.flipped.includes(i)&&!s.lock){if(!s.flipped.length)s.turns++;s.flipped.push(i)}}else if(t==='simon'&&!s.wait){const cs=[[.5,.31],[.32,.55],[.68,.55],[.5,.79]],i=cs.findIndex(p=>Math.hypot(x-p[0],y-p[1])<.25);if(i>=0){if(i!==s.seq[s.input.length])win('¡Casi!',`Llegaste a la ronda ${s.round}.`);else{s.input.push(i);if(s.input.length===s.seq.length)addSimon()}}}else if(t==='math'||t==='sequence'){const i=Math.floor(x*4)-1;if(i>=0&&i<3){if(s.options[i]===s.answer){s.score++;t==='math'?newMath():newSequence()}else if(t==='math')s.time-=3000;else win('¡Inténtalo otra vez!',`Acertaste ${s.score} secuencias.`)}}else if(t==='reaction'){if(s.phase==='ready'){s.phase='wait';s.result='Espera la señal verde';s.waitAt=performance.now()+rand(1500,3500)}else if(s.phase==='wait'){s.phase='early';s.result='¡Demasiado pronto!'}else if(s.phase==='go')win('¡Buenos reflejos!',`Tu tiempo fue ${Math.round(performance.now()-s.startAt)} milisegundos.`)}else if(t==='clicker'){if(!s.started){s.started=true;s.time=10}s.clicks++}else if(t==='lights'){const g=s.lightGeom;if(g){const col=Math.floor((x*r.width-g.x0)/(g.size+g.gap)),row=Math.floor((y*r.height-g.y0)/(g.size+g.gap));if(col>=0&&col<5&&row>=0&&row<5){[[col,row],[col-1,row],[col+1,row],[col,row-1],[col,row+1]].forEach(([a,b])=>{if(a>=0&&a<5&&b>=0&&b<5){const i=b*5+a;s.lights[i]=!s.lights[i]}});s.moves++;if(s.lights.every(v=>!v))win('¡Lo lograste!',`Todas apagadas en ${s.moves} movimientos.`)}}}draw()}
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);touchStart={x:e.clientX,y:e.clientY};if(selected.type==='starfighter'&&running){state.shots.push({x:state.x,y:.72});tap(e)}else if(selected.type!=='snake')tap(e)});canvas.addEventListener('pointermove',e=>{if(!running||!touchStart)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(selected.type==='pong'){if(orientation==='portrait'){state.py=clamp(x,.08,.92)}else{state.py=clamp(y,.08,.92)}}else if(selected.type==='shipsoccer'||selected.type==='tablefootball'||selected.type==='airhockey'){state.py=clamp(is3D(selected.type)?x:y,.12,.88)}else if(selected.type==='starfighter')state.x=clamp(x,.08,.92);else if(selected.type==='breakout')state.px=x;else if(selected.type==='dodge')state.x=x;draw()});canvas.addEventListener('pointerup',e=>{if(selected.type==='snake'&&touchStart){const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>16)state.next=Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)]}touchStart=null});canvas.addEventListener('pointercancel',()=>touchStart=null);
$('fireButton').addEventListener('pointerdown',e=>{e.preventDefault();if(running&&selected.type==='starfighter')state.shots.push({x:state.x,y:.72})});
window.addEventListener('keydown',e=>{if(play.hidden)return;if(selected.type==='pong'){if(orientation==='portrait'){if(e.key==='ArrowLeft')state.py=clamp(state.py-.05,.08,.92);if(e.key==='ArrowRight')state.py=clamp(state.py+.05,.08,.92)}else{if(e.key==='ArrowUp')state.py=clamp(state.py-.06,.06,.94);if(e.key==='ArrowDown')state.py=clamp(state.py+.06,.06,.94)}}if((selected.type==='tablefootball'||selected.type==='shipsoccer'||selected.type==='airhockey')&&(e.key==='ArrowUp'||e.key==='ArrowLeft'))state.py=clamp(state.py-.05,.12,.88);if((selected.type==='tablefootball'||selected.type==='shipsoccer'||selected.type==='airhockey')&&(e.key==='ArrowDown'||e.key==='ArrowRight'))state.py=clamp(state.py+.05,.12,.88);if(selected.type==='snake'){if(e.key==='ArrowUp')state.next=[0,-1];if(e.key==='ArrowDown')state.next=[0,1];if(e.key==='ArrowLeft')state.next=[-1,0];if(e.key==='ArrowRight')state.next=[1,0]}if(selected.type==='starfighter'&&e.code==='Space'&&running){state.shots.push({x:state.x,y:.72});e.preventDefault()}if(selected.type==='breakout'&&e.key==='ArrowLeft')state.px=clamp(state.px-.05,.1,.9);if(selected.type==='breakout'&&e.key==='ArrowRight')state.px=clamp(state.px+.05,.1,.9);draw()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){const wasRunning=running;stop();state.pausedByVisibility=wasRunning}else if(state.pausedByVisibility&&!play.hidden&&$('gameOverlay').classList.contains('hidden')){state.pausedByVisibility=false;last=performance.now();running=true;raf=requestAnimationFrame(loop)}});
function enableTilt(){if(!('DeviceOrientationEvent'in window)){alert('Este dispositivo no dispone de sensor de inclinación.');return}const activate=()=>{window.addEventListener('deviceorientation',e=>{if(typeof e.gamma==='number'&&selected.type==='pong'){state.py=clamp(.5+e.gamma/90,.08,.92)}});alert('Inclinación activada. Inclina el teléfono para mover la paleta.')};if(typeof DeviceOrientationEvent.requestPermission==='function')DeviceOrientationEvent.requestPermission().then(p=>p==='granted'?activate():alert('No se concedió el permiso.')).catch(()=>alert('No se pudo activar el sensor.'));else activate()}
$('shareButton').onclick=async()=>{const d={title:'Mini Arcade',text:'¡Ven a jugar conmigo! Hay 15 juegos, 5 de ellos en 3D.',url:location.href};try{if(navigator.share)await navigator.share(d);else{await navigator.clipboard.writeText(location.href);alert('Enlace copiado. ¡Compártelo!')}}catch(e){if(e.name!=='AbortError')alert('Copia el enlace del navegador para compartirlo.')}};let installPrompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installButton').hidden=false});$('installButton').onclick=async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installButton').hidden=true}};window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resizeCanvas,100)});screen.orientation?.addEventListener?.('change',()=>setTimeout(resizeCanvas,100));if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));renderCards();
})();
