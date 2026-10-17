const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync(__dirname + '/game.js', 'utf8');
class El {
  constructor(id=''){ this.id=id; this.hidden=false; this.textContent=''; this.innerHTML=''; this.dataset={}; this.classList={add(){},remove(){},toggle(){},contains(){return false}}; this.style={}; this.children=[]; this.listeners={}; }
  addEventListener(n,f){this.listeners[n]=f}
  append(el){this.children.push(el)}
  appendChild(el){this.children.push(el);return el}
  setPointerCapture(){}
  getBoundingClientRect(){return {width:360,height:640,left:0,top:0}}
  click(){}
}
const els=new Map();const get=id=>{if(!els.has(id))els.set(id,new El(id));return els.get(id)};
const ctx=new Proxy({createLinearGradient(){return {addColorStop(){}}},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},arc(){},fillRect(){},clearRect(){},setLineDash(){},roundRect(){},save(){},restore(){},translate(){},scale(){},closePath(){},strokeRect(){},ellipse(){},clip(){},fillText(){},measureText(){return {width:20}}},{set(o,k,v){o[k]=v;return true}});
get('gameCanvas').getContext=()=>ctx;
const doc={addEventListener(){},hidden:false,getElementById:get,querySelector:()=>{const el=get('stage');el.getBoundingClientRect=()=>({width:360,height:640,left:0,top:0});return el},querySelectorAll:()=>[{dataset:{filter:'all'},classList:{add(){},remove(){}}},{dataset:{filter:'arcade'},classList:{add(){},remove(){}}},{dataset:{filter:'puzzle'},classList:{add(){},remove(){}}}],createElement:()=>new El(),body:{classList:{add(){},remove(){},toggle(){}}}};
const win={addEventListener(){},innerWidth:390,devicePixelRatio:1,screen:{orientation:{addEventListener(){},unlock(){},lock(){return Promise.resolve()}}},requestAnimationFrame(){return 1},cancelAnimationFrame(){},setTimeout(fn){fn()},clearTimeout(){},location:{pathname:'/',href:'https://test/'},history:{replaceState(){ }},navigator:{},performance:{now:()=>1000},Math,Date,console};
vm.runInNewContext(src,{document:doc,window:win,screen:win.screen,innerWidth:win.innerWidth,devicePixelRatio:1,requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout(){},clearTimeout(){},performance:win.performance,location:win.location,history:win.history,navigator:win.navigator,Math,Date,console,alert(){},prompt(){},DeviceOrientationEvent:undefined});
console.log('Game script initialized with canvas and controls.');
