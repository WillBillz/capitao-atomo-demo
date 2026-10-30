import {RUN_SPEED} from './pace.mjs';
import {calculationCenter} from './calculation-screen.mjs';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);},schedules=new WeakMap();
export function lumiDiscoverySchedule(cues){
  if(schedules.has(cues))return schedules.get(cues);
  const targets=cues.flatMap(c=>c.kind==='gate'?[{id:c.payload.requires,at:c.at,kind:'weakpoint',appearance:c.payload.appearance??'prism'}]:c.payload?.obstacle==='gap'?[{id:c.id,at:c.at,kind:'gap'}]:c.id==='sealed-bulkhead'?[{id:c.id,at:41.5,kind:'armor'}]:[]).sort((a,b)=>a.at-b.at);
  const result=targets.map((target,i)=>({...target,start:Math.max(target.at-2.35,i?targets[i-1].at+.35:0),revealAt:target.at-1.15,end:target.at+.3}));
  schedules.set(cues,result);return result;
}
export function lumiTargetSolved(stage,target){return target.id==='prism'?stage.prismHit:stage.hitPrisms?.has(target.id)||stage.clearedGates?.has(target.id);}
export function sampleLumiDiscovery(stage,time,base={x:530,y:350}){
  const targets=lumiDiscoverySchedule(stage.cues??[]),target=targets.find(t=>time>=t.start&&time<t.end);
  if(!target)return {active:false,weight:0,root:base};
  const hitAt=stage.prismImpactTimes?.get(target.id)??(target.id==='prism'?stage.prismHitAt:-1)??-1;
  const solved=lumiTargetSolved(stage,target),release=hitAt>=0?1-smooth((time-hitAt)/.3):solved?0:1;
  const weight=smooth((time-target.start)/.5)*(1-smooth((time-(target.at+.05))/.25))*release;
  const object=stage.objects?.get(target.id),raw=(object?.worldX??410+target.at*RUN_SPEED)-time*RUN_SPEED;
  const x=target.appearance==='calculation'?calculationCenter(raw):raw,y=target.kind==='gap'?558:target.kind==='armor'?248:460;
  const aim={x,y},destination={x:Math.max(475,Math.min(1060,x-125)),y:target.kind==='armor'?196:target.kind==='gap'?350:325};
  const root={x:base.x+(destination.x-base.x)*weight,y:base.y+(destination.y-base.y)*weight-Math.sin(Math.PI*weight)*25};
  const discovered=stage.lumi?.discoveries?.has(target.id)??false,scan=smooth((time-target.start)/Math.max(.01,target.revealAt-target.start));
  return {active:weight>0,weight,root,target,aim,scan,discovered,mark:discovered?weight*release:0,solved,pointing:weight*smooth((time-target.start-.25)/.35),celebrate:hitAt>=0?Math.max(0,1-(time-hitAt)/.45):0};
}
export function drawLumiDiscovery(c,p,time,{effects=true,front=false}={}){
  if(!p.active||p.aim.x< -120||p.aim.x>1350)return;
  const {x,y}=p.aim;c.save();
  if(!front&&effects){
    c.globalAlpha=p.weight*.45;c.globalCompositeOperation='screen';const hand=p.emitter??{x:p.root.x+27,y:p.root.y+10},g=c.createLinearGradient(hand.x,hand.y,x,y);g.addColorStop(0,'#fff1b280');g.addColorStop(1,'#ffc94b0a');
    c.fillStyle=g;c.beginPath();c.moveTo(hand.x,hand.y);c.lineTo(x-35,y+43);c.lineTo(x+35,y+43);c.closePath();c.fill();
    c.strokeStyle='#ffe6a1';c.lineWidth=1.4;c.beginPath();c.moveTo(hand.x,hand.y);c.quadraticCurveTo((hand.x+x)/2,hand.y+20,x,y);c.stroke();
    if(!p.discovered){c.globalAlpha=p.weight*.8;c.strokeStyle='#fff2bf';c.beginPath();c.ellipse(x,y,18+p.scan*28,8+p.scan*38,0,0,TAU*p.scan);c.stroke();}
  }
  if(front&&!p.solved){
    const label=p.discovered?{weakpoint:'PONTO FRACO!',gap:'ABERTURA À FRENTE!',armor:'BLINDAGEM TOTAL!'}[p.target.kind]:'INVESTIGANDO…';
    c.globalAlpha=p.weight;c.textAlign='center';c.font='bold 16px system-ui';c.lineWidth=4;c.lineJoin='round';c.strokeStyle='#14253a';c.fillStyle='#ffe8b7';
    c.strokeText('LUMI',p.root.x,p.root.y-79);c.fillText('LUMI',p.root.x,p.root.y-79);c.font='bold 20px system-ui';c.strokeText(label,p.root.x,p.root.y-56);c.fillText(label,p.root.x,p.root.y-56);
  }
  if(front&&p.mark>0){
    c.globalAlpha=p.mark;c.strokeStyle='#ffe3a0';c.fillStyle='#fff0bc';c.lineWidth=3;
    if(p.target.kind==='gap'){
      c.setLineDash([7,6]);c.beginPath();c.moveTo(x-125,551);c.quadraticCurveTo(x,342,x+125,551);c.stroke();c.setLineDash([]);
      for(const side of [-1,1]){c.beginPath();c.moveTo(x+side*44,550);c.lineTo(x+side*44,564);c.lineTo(x+side*67,564);c.stroke();}
      c.beginPath();c.moveTo(x+109,539);c.lineTo(x+125,551);c.lineTo(x+125,532);c.stroke();
    }else{
      const radius=p.target.kind==='armor'?51:31;
      for(const side of [-1,1])for(const vertical of [-1,1]){const px=x+side*radius,py=y+vertical*radius;c.beginPath();c.moveTo(px-side*13,py);c.lineTo(px,py);c.lineTo(px,py-vertical*13);c.stroke();}
      if(p.target.kind==='weakpoint'){
        c.beginPath();c.moveTo(x-7,y-15);c.lineTo(x+5,y-4);c.lineTo(x-4,y+6);c.lineTo(x+9,y+17);c.stroke();
        c.beginPath();c.arc(x,y,7,0,TAU);c.stroke();
      }else{
        c.beginPath();c.moveTo(x,y-20);c.lineTo(x+17,y-12);c.lineTo(x+14,y+9);c.quadraticCurveTo(x+7,y+20,x,y+25);c.quadraticCurveTo(x-7,y+20,x-14,y+9);c.lineTo(x-17,y-12);c.closePath();c.stroke();
      }
      if(effects){c.globalAlpha=p.mark*.35;c.beginPath();c.ellipse(x,y,radius+10+Math.sin(time*3)*2,radius+10+Math.sin(time*3)*2,0,0,TAU);c.stroke();}
    }
  }
  c.restore();
}
