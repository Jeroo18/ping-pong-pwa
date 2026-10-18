/* Prueba de integración: ejecuta game.js con el Three.js real (r128) y un
   renderizador simulado, abre cada juego 3D y simula varios segundos de juego. */
const fs = require('fs');
const vm = require('vm');

const threeSrc = fs.readFileSync(__dirname + '/three.min.js', 'utf8');
const gameSrc = fs.readFileSync(__dirname + '/game.js', 'utf8');

class El {
  constructor(id = '') {
    this.id = id; this.hidden = false; this.textContent = ''; this.innerHTML = '';
    this.dataset = {}; this.style = {}; this.children = []; this.listeners = {};
    this.classList = { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)) }, remove(...c) { c.forEach(x => this._s.delete(x)) }, toggle(c, v) { v ? this._s.add(c) : this._s.delete(c) }, contains(c) { return this._s.has(c) } };
  }
  addEventListener(n, f) { (this.listeners[n] = this.listeners[n] || []).push(f) }
  fire(n, e) { (this.listeners[n] || []).forEach(f => f(e || { preventDefault() {}, clientX: 100, clientY: 200, pointerId: 1 })) }
  append(el) { this.children.push(el) }
  appendChild(el) { this.children.push(el); return el }
  insertBefore(el) { this.children.unshift(el); return el }
  setPointerCapture() {}
  getBoundingClientRect() { return { width: 390, height: 620, left: 0, top: 0 } }
  click() {}
}

const els = new Map();
const get = id => { if (!els.has(id)) els.set(id, new El(id)); return els.get(id) };

const ctxStub = new Proxy({
  createLinearGradient() { return { addColorStop() {} } },
  createRadialGradient() { return { addColorStop() {} } },
  beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {},
  fillRect() {}, clearRect() {}, setLineDash() {}, roundRect() {}, save() {}, restore() {},
  translate() {}, scale() {}, closePath() {}, strokeRect() {}, ellipse() {}, clip() {},
  fillText() {}, setTransform() {}, measureText() { return { width: 20 } }
}, { set(o, k, v) { o[k] = v; return true } });

const canvasEl = get('gameCanvas');
canvasEl.getContext = () => ctxStub;

const stageEl = new El('stage');
stageEl.getBoundingClientRect = () => ({ width: 390, height: 620, left: 0, top: 0 });

const doc = {
  addEventListener() {}, hidden: false, getElementById: get,
  querySelector: () => stageEl,
  querySelectorAll: () => [
    { dataset: { filter: 'all' }, classList: { add() {}, remove() {} } },
    { dataset: { filter: 'arcade' }, classList: { add() {}, remove() {} } },
    { dataset: { filter: 'puzzle' }, classList: { add() {}, remove() {} } }
  ],
  createElement: () => new El(),
  createElementNS: () => { const e = new El(); e.getContext = () => null; return e },
  body: { classList: { add() {}, remove() {}, toggle() {} } }
};

let nowMs = 1000;
const sandbox = {
  document: doc,
  screen: { orientation: { addEventListener() {}, unlock() {}, lock: () => Promise.resolve() } },
  innerWidth: 390,
  devicePixelRatio: 1,
  requestAnimationFrame: fn => { sandbox.__raf = fn; return 1 },
  cancelAnimationFrame() { sandbox.__raf = null },
  setTimeout() {}, clearTimeout() {},
  performance: { now: () => nowMs },
  location: { pathname: '/', href: 'https://test/', protocol: 'file:' },
  history: { replaceState() {} },
  navigator: {},
  Math, Date, console, Float32Array, Uint8Array, Uint16Array, Uint32Array, Int32Array,
  ArrayBuffer, Set, Map, WeakMap, Promise, JSON, Object, Array, Number, String, Boolean, Error, isNaN, parseFloat, parseInt, Infinity, NaN, undefined,
  alert() {}, prompt() {},
  DeviceOrientationEvent: undefined
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
sandbox.window.addEventListener = () => {};

const NO3D = process.env.NO3D === '1';
const ctxVm = vm.createContext(sandbox);
vm.runInContext(threeSrc, ctxVm);
if (!sandbox.THREE) throw new Error('THREE no se cargó');
console.log('Three.js r' + sandbox.THREE.REVISION + ' cargado.');

// Renderizador simulado: ejercita la API real de escenas/cámaras sin GPU.
let renderCalls = 0;
const RealRenderer = sandbox.THREE.WebGLRenderer;
sandbox.THREE.WebGLRenderer = function () {
  const el = new El('webglCanvas');
  return {
    domElement: el,
    setPixelRatio() {}, setSize() {},
    render(scene, camera) {
      if (!scene || !camera) throw new Error('render() sin escena/cámara');
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      renderCalls++;
    }
  };
};
void RealRenderer;

if (NO3D) { vm.runInContext('delete globalThis.THREE; var THREE=undefined;', ctxVm); console.log('MODO RESPALDO: sin Three.js (debe funcionar en 2D).') }

vm.runInContext(gameSrc, ctxVm);
console.log('game.js inicializado.');

// --- Simulación de partidas ---
const grid = get('gameGrid');
const cards = grid.children;
console.log('Tarjetas de juego creadas:', cards.length);
if (cards.length !== 15) throw new Error('Se esperaban 15 juegos, hay ' + cards.length);

const results = [];
for (let i = 0; i < cards.length; i++) {
  const title = get('gameTitle');
  renderCalls = 0;
  cards[i].onclick();                       // openGame
  const name = title.textContent;
  get('startButton').onclick();             // startGame
  let frames = 0;
  // ~4 segundos de juego, guiados por el requestAnimationFrame real del juego
  for (let f = 0; f < 240; f++) {
    const cb = sandbox.__raf;
    if (!cb) break;                         // la partida terminó (win)
    sandbox.__raf = null;
    nowMs += 16;
    cb(nowMs);
    frames++;
    if (name.indexOf('Starfighter') >= 0 && f % 20 === 0) get('fireButton').fire('pointerdown');
  }
  results.push(name.padEnd(22) + ' cuadros: ' + String(frames).padStart(3) + '  render3D: ' + renderCalls);
  get('backButton').onclick();              // goHome
}

console.log('\nResultados por juego:');
results.forEach(r => console.log('  ' + r));

const threeD = results.filter(r => /Ping-pong 3D|Futbolín 3D|Naves de futbolín 3D|Starfighter 3D|Air Hockey 3D/.test(r));
console.log('\nJuegos 3D detectados:', threeD.length);
if (threeD.length !== 5) throw new Error('Se esperaban 5 juegos 3D');
threeD.forEach(r => {
  const n = Number(r.split('render3D: ')[1]);
  if (NO3D) { if (n) throw new Error('No debería renderizar 3D sin Three.js: ' + r) }
  else if (!n) throw new Error('Sin renderizado 3D en: ' + r);
});
console.log('TODAS LAS PRUEBAS PASARON');
