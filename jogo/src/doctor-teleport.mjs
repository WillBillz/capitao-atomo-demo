import {passageGeometry} from './portal-passage.mjs';
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
export const DOCTOR_TELEPORT={departAt:42.18,vanishAt:42.4,arriveAt:42.58,formedAt:42.94,endAt:43.9};
// Both endpoints follow the laboratory floor; the destination stays beyond the robot.
export function sampleDoctorTeleport(stage,time,base){
  const p=DOCTOR_TELEPORT;
  if(!stage.objects?.has('sealed-bulkhead')||time<p.departAt||time>=p.endAt)return {active:false,x:0,y:0,alpha:1,hologram:0};
  const b=passageGeometry(time).barrier,from={x:base.x+185,y:base.y+75},destination=Math.max(base.x,b.x+b.w/2+210),to={x:destination+185,y:base.y-75};
  const emerging=time>=p.arriveAt,alpha=emerging?smooth((time-p.arriveAt)/(p.formedAt-p.arriveAt)):1-smooth((time-p.departAt)/(p.vanishAt-p.departAt));
  const lift=emerging?1-smooth((time-43.1)/.7):0,hologram=emerging?1-smooth((time-p.formedAt)/.22):smooth((time-p.departAt)/.08);
  return {active:true,x:emerging?destination-base.x:0,y:-150*lift,alpha,hologram,from,to,emerging,travel:smooth((time-p.vanishAt)/(p.arriveAt-p.vanishAt)),link:time>=p.vanishAt&&time<p.arriveAt};
}
const buffers=new WeakMap();
function layer(c){
  if(buffers.has(c.canvas))return buffers.get(c.canvas);
  const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(1280,720):typeof document!=='undefined'?Object.assign(document.createElement('canvas'),{width:1280,height:720}):new c.canvas.constructor(1280,720);
  buffers.set(c.canvas,canvas);return canvas;
}
export function drawDoctorHologram(c,scene,draw,{effects=true}={}){
  const p=scene.teleport;
  if(!p?.active){draw(c);return;}
  if(effects&&p.link){
    c.save();c.globalCompositeOperation='screen';c.strokeStyle='#91efff';c.lineWidth=2;c.globalAlpha=.6;
    c.beginPath();c.moveTo(p.from.x,p.from.y);c.bezierCurveTo(p.from.x+100,p.from.y-180,p.to.x-100,p.to.y-100,p.to.x,p.to.y);c.stroke();
    for(let i=0;i<9;i++){const u=clamp(p.travel+(i-4)*.025),x=p.from.x+(p.to.x-p.from.x)*u,y=p.from.y+(p.to.y-p.from.y)*u-95*Math.sin(Math.PI*u);c.globalAlpha=(1-Math.abs(i-4)/6)*.75;c.fillStyle='#d9ffff';c.beginPath();c.arc(x,y,2+i%3,0,Math.PI*2);c.fill();}c.restore();
  }
  if(p.alpha<=0)return;
  const canvas=layer(c),b=canvas.getContext('2d');b.clearRect(0,0,1280,720);draw(b);
  if(!effects||p.hologram<.001){c.save();c.globalAlpha=p.alpha;c.drawImage(canvas,0,0);c.restore();return;}
  // Source-atop colours only existing pixels: no rectangular hologram card.
  b.save();b.globalCompositeOperation='source-atop';b.globalAlpha=.58*p.hologram;b.fillStyle='#65e9ff';b.fillRect(0,0,1280,720);b.restore();
  c.save();c.globalAlpha=p.alpha;
  for(let y=0;y<610;y+=8){const shift=Math.sin(y*.73+scene.time*37)*7*p.hologram;c.drawImage(canvas,0,y,1280,6,shift,y,1280,6);c.globalAlpha=p.alpha*(1-p.hologram*.7);c.drawImage(canvas,0,y+6,1280,2,shift,y+6,1280,2);c.globalAlpha=p.alpha;}
  c.globalCompositeOperation='screen';c.globalAlpha=p.alpha*p.hologram*.22;c.drawImage(canvas,12*p.hologram,0);c.drawImage(canvas,-10*p.hologram,0);c.restore();
}
