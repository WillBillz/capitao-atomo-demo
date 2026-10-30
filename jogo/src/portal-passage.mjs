import {RUN_SPEED} from './pace.mjs';
import {drawMadMachine} from './mad-machine.mjs';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
export const PORTAL_PASSAGE={chargeAt:40.95,readyAt:41.65,enterAt:41.8,exitAt:42.02,emergedAt:42.28,barrierAt:42.2,width:200,distance:440,boost:110};
export const passageEnd=()=>PORTAL_PASSAGE.enterAt+(PORTAL_PASSAGE.distance+PORTAL_PASSAGE.boost)/RUN_SPEED;
export function passageGeometry(time){
  const p=PORTAL_PASSAGE,entryX=410+(p.enterAt-time)*RUN_SPEED;
  return {entryX,exitX:entryX+p.distance,barrier:{x:410+(p.barrierAt-time)*RUN_SPEED-p.width/2,y:64,w:p.width,h:496}};
}
export function passageExitPosition(time){const p=PORTAL_PASSAGE,g=passageGeometry(time);return Math.max(410,g.exitX-80+190*smooth((time-p.exitAt)/(p.emergedAt-p.exitAt)));}
export function samplePortalPassage(stage,time){
  const p=PORTAL_PASSAGE,g=passageGeometry(time),exists=stage.objects?.has('sealed-bulkhead')??false;
  const charged=(stage.quantico?.portalOpenedAt??-1)>=0,openedAt=stage.quantico?.portalOpenedAt??p.chargeAt;
  const close=1-smooth((time-42.85)/.45),entryOpening=charged?smooth((time-openedAt-.1)/.5)*close:0,exitOpening=charged?smooth((time-openedAt-.3)/.4)*close:0,opening=Math.min(entryOpening,exitOpening);
  const entered=(stage.portalEnteredAt??-1)>=0&&time>=stage.portalEnteredAt;
  let hero=null,phase=time<p.chargeAt?'approach':time<p.readyAt?'forming':'ready';
  if(charged&&time>=41.55&&time<passageEnd()){
    if(time<41.98){phase='entering';hero={x:410,y:560,alpha:1,clip:{side:'entry',x:g.entryX}};}
    else if(time<p.exitAt){phase='transit';hero={x:passageExitPosition(time),y:560,alpha:0};}
    else if(entered){phase=time<p.emergedAt?'emerging':'cleared';hero={x:passageExitPosition(time),y:560,alpha:1,...(time<p.emergedAt?{clip:{side:'exit',x:g.exitX}}:{})};}
  }
  return {...g,active:exists&&time>=39.8&&time<43.4,opening,entryOpening,exitOpening,charged,entered,phase,hero,preparation:exists?smooth((time-39.2)/1.6)*(1-smooth((time-42.45)/.6)):0,caster:charged?smooth((time-openedAt)/.22)*(1-smooth((time-42.45)/.6)):0,seal:smooth((time-39.6)/.65),pulse:entered?Math.max(0,1-(time-p.enterAt)/.65):0};
}
function portal(c,x,time,opening,{front=false,effects=true,exit=false,pulse=0}={}){
  if(opening<=0||x< -130||x>1410)return;
  c.save();c.translate(x,463);c.scale(Math.max(.01,opening),1);
  const rx=40,ry=99;
  if(!front){
    if(effects){const halo=c.createRadialGradient(0,0,10,0,0,127);halo.addColorStop(0,'#aedbff55');halo.addColorStop(.5,'#a17bff50');halo.addColorStop(1,'#835dff00');c.fillStyle=halo;c.fillRect(-127,-127,254,254);}
    const core=c.createRadialGradient(exit?15:-15,0,3,0,0,110);core.addColorStop(0,'#e5faff');core.addColorStop(.27,'#85ddfa');core.addColorStop(.6,'#4e64bb');core.addColorStop(1,'#221f54');c.fillStyle=core;c.beginPath();c.ellipse(0,0,rx,ry,0,0,TAU);c.fill();
    c.save();c.beginPath();c.ellipse(0,0,rx-4,ry-5,0,0,TAU);c.clip();
    c.strokeStyle='#d6ffff88';c.lineWidth=1.3;
    for(let i=0;i<7;i++){const u=((time*.9+i/7)%1+1)%1;c.globalAlpha=(1-u)*.8;c.beginPath();c.ellipse(0,0,6+u*44,14+u*107,Math.sin(time+i)*.15,0,TAU);c.stroke();}
    c.globalAlpha=.45;c.fillStyle='#182f5d';c.fillRect(-45,77,90,22);c.strokeStyle='#ddfaff';c.beginPath();c.moveTo(-45,77);c.lineTo(45,77);c.stroke();c.restore();
  }
  c.strokeStyle=front?'#f3e9ff':'#9edbff';c.lineWidth=front?4:7;c.beginPath();c.ellipse(0,0,rx,ry,0,front?-Math.PI/2:0,front?Math.PI/2:TAU);c.stroke();
  if(effects){c.globalCompositeOperation='screen';for(let i=0;i<18;i++){const a=i*TAU/18+time*(exit?-1.8:1.8),r=1+Math.sin(time*4+i)*.035;c.globalAlpha=.4+.5*Math.sin(time*3+i)**2;c.strokeStyle=i%3?'#c9f7ff':'#ffdd9f';c.lineWidth=2;c.beginPath();c.moveTo(Math.cos(a)*rx*r,Math.sin(a)*ry*r);c.lineTo(Math.cos(a+.05)*(rx+7+pulse*10),Math.sin(a+.05)*(ry+7+pulse*10));c.stroke();}}
  c.restore();
}
export function drawPortalPassage(c,passage,time,{front=false,effects=true,caster,images}={}){
  if(!passage.active)return;
  if(!front)drawMadMachine(c,images?.['mad-machine-v21'],passage.barrier,time,{effects});
  if(!front&&passage.caster>0&&caster){
    c.save();c.globalCompositeOperation='screen';c.lineWidth=2.3;c.strokeStyle='#b5b5ff';c.globalAlpha=passage.caster*.8;
    for(const [i,x] of [passage.entryX,passage.exitX].entries()){
      c.beginPath();c.moveTo(caster.x+(i?25:-25),caster.y-20);c.bezierCurveTo(caster.x+50,220,x-80,280,x,365);c.stroke();
      if(effects)for(let j=0;j<6;j++){const u=((time*1.8+j/6)%1+1)%1,px=caster.x+(x-caster.x)*u,py=caster.y-20+(365-caster.y+20)*u-70*Math.sin(Math.PI*u);c.fillStyle='#efffff';c.beginPath();c.arc(px,py,2.2,0,TAU);c.fill();}
    }c.restore();
  }
  for(const [i,x] of [passage.entryX,passage.exitX].entries())portal(c,x,time,i?passage.exitOpening:passage.entryOpening,{front,effects,exit:i===1,pulse:passage.pulse});
}
