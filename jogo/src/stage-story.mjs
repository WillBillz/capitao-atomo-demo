import {drawLabDoor} from './lab-door.mjs';
import {RUN_SPEED} from './pace.mjs';
import {sampleCalculationScreen,drawCalculationScreen} from './calculation-screen.mjs';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
export const CAPTION_SAFE_RECT={x:220,y:613,w:840,h:78};
export function validateStory(data,duration=103.2){
  if(!Array.isArray(data?.captions))throw Error('Legendas ausentes.');let end=0;const ids=new Set();
  for(const l of data.captions){if(!l.id||ids.has(l.id)||!['doctor','choir','hero'].includes(l.actor)||typeof l.text!=='string'||!l.text.trim()||!Number.isFinite(l.start)||!Number.isFinite(l.end)||l.start<end||l.end<=l.start||l.end>duration)throw Error('Legenda inválida: '+l.id);ids.add(l.id);end=l.end;}return true;
}
export function sampleOpening(time){
  const emerge=smooth((time-.25)/.85),runWeight=smooth((time-2.05)/1.1),thumbs=smooth((time-1.28)/.18)*(1-smooth((time-1.85)/.25));
  const arrivalAir=smooth(emerge/.15)*(1-smooth((emerge-.8)/.2)),arrivalLand=smooth((time-1.1)/.055)*(1-smooth((time-1.155)/.22)),greeting=thumbs*Math.sin(Math.PI*clamp((time-1.28)/.8));
  const u=clamp((time-2.05)/1.1),distance=RUN_SPEED*(time>=3.15?time-2.6:1.1*(u**3-.5*u**4));
  return {active:time<3.2,distance,speed:RUN_SPEED*runWeight,portal:{x:245,y:474,open:smooth(time/.22)*(1-smooth((time-1.35)/.55))},hero:{x:180+230*emerge,y:560-54*Math.sin(Math.PI*emerge),alpha:time>=.25?1:0,clip:time<1.1?{x:245}:null,thumbs,greeting,arrivalAir,arrivalFlight:emerge,arrivalLand,runWeight,gaitOrigin:2.05}};
}
export function sampleCaption(data,time){const line=data?.captions?.find(l=>time>=l.start&&time<l.end);return line?{...line,progress:clamp((time-line.start)/(line.end-line.start))}:null;}
export function sampleVocalPerformance(data,time){
  const line=sampleCaption(data,time),amount=line?Math.min(1,(time-line.start)/.06,(line.end-time)/.06):0;
  return {speaking:{doctor:line?.actor==='doctor'?amount:0,hero:line?.actor==='hero'?amount:0},choir:line?.actor==='choir'?amount:0};
}
export function drawArrival(c,{x,y,open},time,color='#9af3ff',{effects=true}={}){
  if(open<=0)return;c.save();c.translate(x,y);c.scale(Math.max(.01,open),1);
  if(effects){c.save();c.scale(1,1.65);const halo=c.createRadialGradient(0,0,18,0,0,100);halo.addColorStop(0,'#bafaff99');halo.addColorStop(.45,'#62ddff66');halo.addColorStop(1,'#4ca4ff00');c.fillStyle=halo;c.fillRect(-100,-100,200,200);c.restore();}
  const core=c.createRadialGradient(0,0,4,0,0,95);core.addColorStop(0,'#efffff');core.addColorStop(.25,'#c5ffff');core.addColorStop(.6,'#45b8f2');core.addColorStop(1,'#253d9a');c.fillStyle=core;c.strokeStyle='#e3ffff';c.lineWidth=6;
  c.beginPath();c.ellipse(0,0,42,92,0,0,TAU);c.fill();c.stroke();
  c.lineWidth=2;c.globalAlpha=.75;c.beginPath();c.ellipse(0,0,35,84,0,0,TAU);c.stroke();
  if(effects){c.save();c.beginPath();c.ellipse(0,0,36,85,0,0,TAU);c.clip();for(let i=0;i<6;i++){const p=((time*.5+i/6)%1+1)%1;c.globalAlpha=(1-p)*.6;c.strokeStyle=i%2?'#c6f9ff':'#b6a9ff';c.beginPath();c.ellipse(Math.sin(time+i)*8,0,5+p*38,15+p*86,Math.sin(time*.7+i)*.2,0,TAU);c.stroke();}c.restore();}
  if(effects){c.save();c.globalCompositeOperation='screen';for(let i=0;i<28;i++){const p=((time*.75+i/28)%1+1)%1,a=i*2.399+time*1.2,r=20+75*p;c.globalAlpha=Math.sin(Math.PI*p)*.85;c.strokeStyle=i%3?color:'#ffe6a1';c.lineWidth=1.5;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r*1.75);c.lineTo(Math.cos(a+.06)*(r+8),Math.sin(a+.06)*(r+8)*1.75);c.stroke();}c.restore();}
  c.restore();
}
function panel(c,x,y,w,h,fill,stroke,r=12){c.fillStyle=fill;c.strokeStyle=stroke;c.lineWidth=2;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();c.stroke();}
export function drawStoryObject(c,o,b,time,hitAt,{effects=true,opened=false,image}={}){
  if(o.appearance==='calculation'){drawCalculationScreen(c,sampleCalculationScreen(o,b,time,hitAt),{effects});return;}
  if(o.appearance==='door')drawLabDoor(c,o,b,time,hitAt,{effects,opened,image});
}
export function drawStoryEnvironment(c,{stage,runner:r,time},effects=true){
  // Footfall and punch energy travel along the actual walkway.
  if(effects&&r.grounded&&time>2.8){for(let i=0;i<5;i++){const x=r.x-30-i*38,energy=(1-i/5)*(.25+.2*Math.sin(time*16-i)**2);c.fillStyle=`rgba(147,242,255,${energy})`;c.fillRect(x,563,26,3);}}
  // The command closes a bulkhead behind the escaping hero, never across a safe landing.
  if(time>=49.38&&time<51.2){const p=smooth((time-49.38)/.45),x=r.x-220-(time-49.38)*70;c.save();c.globalAlpha=1-smooth((time-50.8)/.4);panel(c,x-30,260,60,300*p,'#263b52','#82c9d7',5);c.fillStyle='#ffc988';for(let i=0;i<5;i++)c.fillRect(x-24,275+i*48*p,48,5);c.restore();}
}
function lyricWords(line,time){
  const words=line.text.split(/\s+/),wordTime=line.progress*words.length;
  let wordIndex=Math.min(words.length-1,Math.floor(wordTime)),wordProgress=wordTime-wordIndex;
  if(line.wordTimes?.length===words.length){
    wordIndex=line.wordTimes.findIndex((w,i)=>time<(line.wordTimes[i+1]?.start??line.end));
    if(wordIndex<0)wordIndex=words.length-1;
    const word=line.wordTimes[wordIndex];wordProgress=clamp((time-word.start)/(word.end-word.start));
  }
  return {...line,words,wordIndex,wordProgress};
}
export function sampleFilmSubtitle(data,time){
  const line=sampleCaption(data,time);
  return line&&['choir','hero'].includes(line.actor)?{...lyricWords(line,time),...CAPTION_SAFE_RECT,anchor:null}:null;
}
export function sampleLyricBubble(data,time,doctor={x:110,y:340}){
  const line=sampleCaption(data,time);if(line?.actor!=='doctor')return null;
  if((doctor.alpha??1)<=0||doctor.x<20)return null;
  return {...lyricWords(line,time),x:Math.max(24,Math.min(700,doctor.x+30)),y:Math.max(28,doctor.y-305)-5*(1-smooth((time-line.start)/.18)),w:440,h:102,anchor:{x:doctor.x+6,y:doctor.y-120}};
}
export function drawStoryOverlay(c,{time},data,{subtitles=true,doctor}={}){
  if(!subtitles)return;
  const film=sampleFilmSubtitle(data,time);
  if(film){
    const {x,y,w,h}=film;
    c.save();const shade=c.createLinearGradient(0,y-8,0,y+h+10);shade.addColorStop(0,'#07112300');shade.addColorStop(.35,'#071123c9');shade.addColorStop(1,'#071123bb');c.fillStyle=shade;c.fillRect(x-30,y-8,w+60,h+18);
    c.textAlign='center';c.font='bold 14px system-ui';c.fillStyle=film.actor==='choir'?'#9bf4ff':'#ffe3a6';c.fillText(film.actor==='choir'?'CORO DAS MÁQUINAS':'CAPITÃO ÁTOMO',x+w/2,y+18);
    c.font='600 30px system-ui';c.lineJoin='round';c.lineWidth=5;c.strokeStyle='#071123';c.strokeText(film.text,x+w/2,y+56,w-20);c.fillStyle='#fffaf1';c.fillText(film.text,x+w/2,y+56,w-20);c.restore();
    return;
  }
  const b=sampleLyricBubble(data,time,doctor);if(!b)return;
  const {x,y,w,h}=b;
  c.fillStyle='#10283ef5';c.strokeStyle='#ffd38e';c.lineWidth=2;c.beginPath();c.moveTo(x+35,y+h-1);c.quadraticCurveTo(x+12,y+h+18,b.anchor.x,b.anchor.y-12);c.lineTo(x+65,y+h-1);c.closePath();c.fill();c.stroke();
  panel(c,x,y,w,h,'#10283ef5','#ffd38e',17);
  c.textAlign='left';c.font='bold 16px system-ui';c.fillStyle='#ffdb9f';c.fillText('DR. CERTEZA',x+18,y+25);
  for(let i=0;i<5;i++){const height=3+Math.abs(Math.sin(time*8-i*.6))*8;c.fillStyle='#ffdb9f';c.fillRect(x+w-45+i*5,y+23-height,3,height);}
  c.font='bold 27px system-ui';const widths=b.words.map(word=>c.measureText(word+' ').width),total=widths.reduce((a,n)=>a+n,0),scale=Math.min(1,(w-35)/total);let cursor=x+(w-total*scale)/2;
  for(const [i,word] of b.words.entries()){
    const current=i===b.wordIndex,bounce=current?Math.sin(Math.PI*b.wordProgress):0;c.save();c.translate(cursor,y+68-bounce*4);c.scale(scale,1);c.fillStyle=current?'#ffe098':i<b.wordIndex?'#fff7e6':'#c3d6e0';if(current){c.shadowColor='#ffc870';c.shadowBlur=5;}c.fillText(word,0,0);c.restore();cursor+=widths[i]*scale;
  }
}
