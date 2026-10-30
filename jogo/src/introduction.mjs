import {drawRig} from './rig.mjs';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
export const INTRO_DURATION=21.5;
export const INTRO_LINES=[
  // Revision 32: timed to the ElevenLabs recording (voice "Dr. Certeza"), which starts at 0.7 s.
  {start:.7,end:3.3,text:'Eu sou o Dr. Certeza.'},
  {start:3.3,end:6.2,text:'Apaguei as possibilidades deste mundo.'},
  {start:6.2,end:9.15,text:'Agora, cada passo segue meus cálculos.'},
  {start:9.15,end:12.6,text:'Sem desvios. Sem escolhas.'},
  {start:12.6,end:16.8,text:'E você, Capitão Átomo, jamais vai me deter!'},
  {start:16.8,end:20.1,text:'Ha! Ha! Ha!',laugh:true}
];
export function sampleIntroduction(time,{voiceLevel=0}={}){
  const line=INTRO_LINES.find(l=>time>=l.start&&time<l.end),laugh=line?.laugh?Math.sin((time-line.start)*8)**2:0;
  return {time,line,opening:smooth(time/.7)*(1-smooth((time-20.1)/1.4)),headRotation:Math.sin(time*1.15)*.045-laugh*.13,headY:Math.sin(time*1.7)*4-laugh*7,mouth:clamp(voiceLevel),laugh};
}
// A real voice recording can drive this envelope without changing song timing.
export function speechEnvelope(buffer,time){
  if(!buffer||time<0||time>=buffer.duration)return 0;const samples=buffer.getChannelData(0),start=Math.floor(time*buffer.sampleRate),count=Math.min(1024,samples.length-start);let energy=0;
  for(let i=0;i<count;i++)energy+=samples[start+i]**2;return clamp(Math.sqrt(energy/Math.max(1,count))*5);
}
export function createIntroductionClock({now=()=>performance.now()/1000,onEnd=()=>{},duration=INTRO_DURATION}={}){
  let offset=0,started=0,mode='idle';const time=()=>Math.min(duration,offset+(mode==='playing'?Math.max(0,now()-started):0));
  function finish(){if(mode==='ended')return;offset=duration;mode='ended';onEnd();}
  return {get time(){return time();},get mode(){return mode;},duration,play(){if(mode==='ended')offset=0;started=now();mode='playing';},pause(){offset=time();if(mode!=='ended')mode='paused';},reset(){offset=0;mode='idle';},skip:finish,tick(){if(mode==='playing'&&time()>=duration)finish();return time();}};
}
const portraits=new WeakMap();
function portraitCanvas(c){if(portraits.has(c.canvas))return portraits.get(c.canvas);const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(1280,720):typeof document!=='undefined'?Object.assign(document.createElement('canvas'),{width:1280,height:720}):new c.canvas.constructor(1280,720);portraits.set(c.canvas,canvas);return canvas;}
export function renderIntroduction(c,{time,assets,effects=true,voiceLevel=0}){
  const p=sampleIntroduction(time,{voiceLevel}),image=assets.images['lab-certeza-v07']??assets.images['lab-atomo-v07'];c.save();
  c.fillStyle='#0a1426';c.fillRect(0,0,1280,720);
  if(image){c.save();c.globalAlpha=.38;c.drawImage(image,0,0,image.width,image.height,-12-time*.2,-6,1304,734);c.restore();}
  const shade=c.createRadialGradient(640,270,50,640,300,690);shade.addColorStop(0,'#162b3b66');shade.addColorStop(1,'#050b19ee');c.fillStyle=shade;c.fillRect(0,0,1280,720);
  // Alternative routes close into a single rigid, calculated corridor.
  c.save();c.globalAlpha=p.opening*.45;c.strokeStyle='#7fb9cb';c.lineWidth=2;
  for(let i=0;i<7;i++){const y=120+i*62,collapse=smooth((time-3-i*.3)/4);c.beginPath();c.moveTo(70,y);c.bezierCurveTo(260,y,360,300+(y-300)*(1-collapse),475,300);c.stroke();c.beginPath();c.moveTo(805,300);c.bezierCurveTo(930,300,1000,y,1210,y);c.stroke();
    if(effects){const u=(time*.23+i*.17)%1;c.fillStyle='#beeaff';c.beginPath();c.arc(80+u*350,y+(300-y)*u*collapse,2.4,0,TAU);c.fill();}}
  c.restore();
  c.save();c.translate(640,279);c.scale(Math.max(.01,p.opening),1);const glow=c.createRadialGradient(0,0,10,0,0,240);glow.addColorStop(0,'#58dafa22');glow.addColorStop(.75,'#7467cb33');glow.addColorStop(1,'#6abfff00');c.fillStyle=glow;c.fillRect(-260,-260,520,520);
  c.strokeStyle='#9deaff';c.lineWidth=3;c.beginPath();c.ellipse(0,0,183,198,0,0,TAU);c.stroke();
  if(effects)for(let i=0;i<3;i++){c.strokeStyle=i%2?'#efd099aa':'#b2eaff88';c.lineWidth=1.4;c.beginPath();c.ellipse(0,0,193+i*7,208+i*7,0,time*(i%2?-.25:.3)+i,time*(i%2?-.25:.3)+i+1.25);c.stroke();}
  c.restore();
  const canvas=portraitCanvas(c),b=canvas.getContext('2d'),rig=assets.data.rigs.doctor;b.clearRect(0,0,1280,720);
  const nodes=rig.bones.map(n=>({id:n.id,frameId:['head','mouth','brows'].includes(n.id)?n.frameId:null,alpha:n.id==='mouth'?p.mouth:n.id==='brows'?.75:1,...(n.id==='head'?{rotation:p.headRotation}:n.id==='mouth'?{scaleY:.3+.7*p.mouth}:{})}));
  drawRig(b,rig,nodes,assets.images,{x:622,y:650+p.headY,scale:3.6,alpha:1});
  b.save();b.globalCompositeOperation='source-atop';b.globalAlpha=.32;b.fillStyle='#76e7ff';b.fillRect(0,0,1280,720);b.restore();
  c.save();c.globalAlpha=p.opening;c.beginPath();c.ellipse(640,279,180,195,0,0,TAU);c.clip();
  if(effects){for(let y=60;y<510;y+=7){const shift=Math.sin(time*3+y*.19)*1.4;c.drawImage(canvas,0,y,1280,5,shift,y,1280,5);c.globalAlpha=p.opening*.46;c.drawImage(canvas,0,y+5,1280,2,shift,y+5,1280,2);c.globalAlpha=p.opening;}}else c.drawImage(canvas,0,0);c.restore();
  c.save();c.globalAlpha=p.opening;c.strokeStyle='#d6c394';c.fillStyle='#1d3446';c.lineWidth=3;c.beginPath();c.ellipse(640,545,122,19,0,0,TAU);c.fill();c.stroke();c.strokeStyle='#a7f3ff';c.lineWidth=2;c.beginPath();c.ellipse(640,539,92,10,0,0,TAU);c.stroke();
  if(effects){const beam=c.createLinearGradient(0,370,0,540);beam.addColorStop(0,'#8de7ff00');beam.addColorStop(1,'#8de7ff35');c.fillStyle=beam;c.beginPath();c.moveTo(548,536);c.lineTo(480,350);c.lineTo(800,350);c.lineTo(732,536);c.closePath();c.fill();}c.restore();
  c.textAlign='center';c.fillStyle='#efcf91';c.font='bold 20px system-ui';c.fillText('TRANSMISSÃO DO DR. CERTEZA',640,43);
  if(p.line){c.font='bold 30px system-ui';c.fillStyle='#fff2d2';c.shadowColor='#060d1c';c.shadowBlur=6;const words=p.line.text.split(' '),lines=[''];for(const word of words){const last=lines.length-1,next=lines[last]?lines[last]+' '+word:word;if(c.measureText(next).width>970)lines.push(word);else lines[last]=next;}lines.forEach((line,i)=>c.fillText(line,640,607+i*40));}
  c.restore();return p;
}
