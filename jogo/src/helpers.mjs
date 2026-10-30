import {drawRig,resolveRig} from './rig.mjs';
import {objectRect,SPEED} from './stage.mjs';
import {drawArrival} from './stage-story.mjs';
import {barrierGeometry,drawQuantumBarrier} from './laser-barrage.mjs';
import {samplePortalPassage,drawPortalPassage} from './portal-passage.mjs';
import {sampleLumiDiscovery,drawLumiDiscovery} from './lumi-discovery.mjs';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
const progress=(time,at,duration)=>at<0?0:clamp((time-at)/duration);
function arc(a,b,u,height){const e=smooth(u);return{x:a.x+(b.x-a.x)*e,y:a.y+(b.y-a.y)*e-Math.sin(Math.PI*clamp(u))*height};}
function actor(root,time,lumi=false){
  time*=1.22;
  const phase=lumi?0:1.7,breathe=Math.sin(time*2.1+phase);
  return {root,alpha:root.alpha??1,nodes:[{id:'body',rotation:Math.sin(time*1.8+phase)*.13+Math.cos(time*1.4+phase)*.06,scaleX:1+breathe*.025,scaleY:1-breathe*.018},{id:'nearHand',x:24+Math.sin(time*2.1+phase)*3,y:5+Math.sin(time*2.1+phase-.4)*6,rotation:-.35+Math.sin(time*2.1+phase)*.8},{id:'farHand',x:-24-Math.sin(time*2.1+phase-.6)*3,y:5+Math.sin(time*2.1+phase-1)*6,rotation:.35-Math.sin(time*2.1+phase-.6)*.7},...(lumi?[{id:'flame',rotation:Math.sin(time*3.1)*.2,scaleY:1+Math.sin(time*2.1-.6)*.16}]:[])]};
}
export function sampleHelpers(s,r,time){
  const passage=samplePortalPassage(s,time);
  const motionTime=time*1.22;
  const reveal=s.lumi.active?progress(time,s.lumi.revealAt,.85)*(1-smooth((time-s.lumi.revealUntil)/.65)):0;
  const jumpAge=time-(r.jumpedAt??-1),jumpLift=r.jumpedAt>=0&&jumpAge>=0&&jumpAge<.8?Math.sin(Math.PI*jumpAge/.8)*26:0;
  // Overlapping warnings must not reset an already rising anticipation pose.
  const alert=s.sceneEvents.filter(e=>e.kind==='warning'&&e.at<=time&&time<=e.payload.contactAt+.15).reduce((value,e)=>Math.max(value,Math.sin(Math.PI*clamp((time-e.at)/(e.payload.contactAt-e.at+.15)))**2),0);
  const preparation=s.prismHit&&time<58?smooth((time-(s.prismHitAt>=0?s.prismHitAt:52.1)-.4)/1.25)*(1-smooth((time-56.5)/.75)):0;
  const lx=passage.active?410:r.x;
  let lp=arc({x:lx+105+Math.sin(motionTime*1.6)*25+alert*20,y:355+Math.sin(motionTime*2.6)*19-jumpLift-alert*22},{x:lx+190,y:305},reveal,30);
  lp=arc(lp,{x:lx+400,y:300},preparation,25);
  if(s.objects.has('sealed-bulkhead'))lp=arc(lp,{x:850,y:190},smooth((time-40.95)/1.2)*(1-smooth((time-42.8)/.8)),35);
  let lumi=actor({...lp,alpha:1,scale:1.15},time,true);
  let qp={x:r.x-100+Math.sin(motionTime*1.4+1)*20,y:405+Math.sin(motionTime*2.4+1)*21-jumpLift*.5},sx=1,sy=1;
  qp=arc(qp,{x:r.x+310,y:370},preparation,45);
  if(passage.preparation>0)qp=arc(qp,{x:Math.max(285,Math.min(1040,passage.entryX-70)),y:325+Math.sin(time*5)*4},passage.preparation,30);
  const bridgeObject=s.objects.get('bridge'),b=bridgeObject?objectRect(bridgeObject,time):null;
  const bridgeActive=s.quantico.form==='bridge'&&s.prismHit&&!!b;
  const bp=bridgeActive?progress(time,s.quantico.transitionAt,s.quantico.readyAt-s.quantico.transitionAt):0;
  const bridgeReturn=bridgeActive?1-smooth((time-56.5)/.75):0,morph=smooth(bp)*bridgeReturn;
  let shape=null,face=null;
  if(bridgeActive){
    const center=arc(qp,{x:b.x+b.w/2,y:b.y+23},morph,35),width=64+(b.w-64)*morph,depth=58-12*morph;
    shape={x:center.x-width/2,y:center.y-depth/2,w:width,h:depth};face={x:center.x+6,y:center.y+4,count:1,alpha:morph};qp=center;
    const scout=arc(lp,{x:b.x+b.w+50,y:b.y-120},morph*(1-smooth((time-56.2)/.7)),25);
    lumi=actor({...scout,alpha:lumi.root.alpha,scale:1},time,true);
    lumi.nodes.find(n=>n.id==='nearHand').rotation=-.7*morph;
    lumi.nodes.find(n=>n.id==='body').rotation=.12*morph;
  }
  const shieldActive=s.quantico.form==='shield',sp=shieldActive?progress(time,s.quantico.transitionAt,s.quantico.readyAt-s.quantico.transitionAt):0;
  const shieldReturn=shieldActive?1-smooth((time-(s.quantico.shieldReleaseAt??79.4))/.6):0;
  if(shieldActive)qp=arc(qp,{x:r.x-91,y:r.y-105},sp*shieldReturn,65);
  const quantico=actor({...qp,alpha:1,scaleX:sx,scaleY:sy},time);
  if(passage.caster>0)for(const [id,side] of [['nearHand',1],['farHand',-1]]){const n=quantico.nodes.find(n=>n.id===id);n.x+=(side*32-n.x)*passage.caster;n.y+=(-30-n.y)*passage.caster;n.rotation=side*.9*passage.caster;}
  if(shieldActive){const strength=smooth(sp)*shieldReturn;for(const [id,x,y] of [['nearHand',36,-37],['farHand',-17,-29]]){const n=quantico.nodes.find(n=>n.id===id);n.x+=(x-n.x)*strength;n.y+=(y-n.y)*strength;n.rotation=-.65*strength;}quantico.nodes.find(n=>n.id==='body').rotation*=1-strength*.8;}
  quantico.root.alpha*=1-morph;quantico.alpha=quantico.root.alpha;
  if(bridgeActive){quantico.nodes.find(n=>n.id==='nearHand').rotation=-.9*morph;quantico.nodes.find(n=>n.id==='farHand').rotation=.65*morph;}
  // Energy forms the structure while the single facial core retains its volume.
  const pieces=[];
  if(bridgeActive)for(let i=0;i<8;i++){
    const width=b.w/8*clamp(morph*8-i);
    if(width>0)pieces.push({x:b.x+i*b.w/8,y:b.y,width,depth:16+Math.sin((i+.5)/8*Math.PI)*20});
  }
  const landingAge=time-(r.landedAt??-1),onBridge=b&&r.grounded&&Math.abs(r.y-b.y)<1&&r.x>=b.x&&r.x<=b.x+b.w;
  const landing=onBridge&&r.landedAt>=0&&landingAge>=0&&landingAge<.5?Math.sin(Math.PI*landingAge/.5):0;
  const impact=s.quantico.shieldHitAt>=0?Math.max(0,1-(time-s.quantico.shieldHitAt)/.5):0;
  const discovery=sampleLumiDiscovery(s,time,lumi.root);
  if(discovery.active){
    lumi.root.x=discovery.root.x;lumi.root.y=discovery.root.y;
    const hand=lumi.nodes.find(n=>n.id==='nearHand'),angle=Math.atan2(discovery.aim.y-lumi.root.y,discovery.aim.x-lumi.root.x),point=discovery.pointing;
    hand.x+=(Math.cos(angle)*41-hand.x)*point;hand.y+=(Math.sin(angle)*41-hand.y)*point;hand.rotation+=(angle+.5-hand.rotation)*point;
    lumi.nodes.find(n=>n.id==='body').rotation+=Math.sin(angle)*.09*point;
    lumi.nodes.find(n=>n.id==='farHand').rotation-=discovery.celebrate*.6;
  }
  for(const [a,at] of [[lumi,3.1],[quantico,4.4]]){const p=smooth((time-at)/.6);a.entrance={progress:p,active:time>=at&&time<at+.6};if(time<at)a.root.alpha=0;a.root.x-=55*(1-p);a.root.y+=25*(1-p);a.alpha=a.root.alpha;}
  return {lumi,quantico,discovery,reveal:{progress:reveal,active:s.lumi.active&&time<s.lumi.revealUntil},
    bridge:{identity:'quantico',face,shape,progress:bp,solid:bridgeActive&&s.quantico.readyAt<=time,segments:bridgeActive?8:0,rect:b,morph,pieces,landing},
    shield:{progress:smooth(sp)*shieldReturn,solid:shieldActive&&s.quantico.readyAt<=time,impact:Math.max(0,impact),hitAt:s.quantico.shieldHitAt,geometry:barrierGeometry(r),emitters:['nearHand','farHand'].map(id=>{const n=quantico.nodes.find(n=>n.id===id);return {x:quantico.root.x+n.x,y:quantico.root.y+n.y};})},
    portal:passage};
}
function ellipse(c,x,y,rx,ry,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.stroke();}
function companionEnergy(c,name,root,time){
  if(root.alpha<=0)return;
  const lumi=name==='lumi',color=lumi?'#ffda7c':'#9ddfff',phase=lumi?0:1.7;
  c.save();c.globalCompositeOperation='screen';c.globalAlpha=root.alpha;
  const radius=lumi?65:53,g=c.createRadialGradient(root.x,root.y,5,root.x,root.y,radius);
  g.addColorStop(0,color+'38');g.addColorStop(.45,color+'18');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(root.x-radius,root.y-radius,radius*2,radius*2);
  // A continuous trailing ribbon moves independently of the facial drawing.
  c.lineWidth=1.5;
  for(let j=0;j<2;j++){
    c.strokeStyle=color+'66';c.beginPath();c.moveTo(root.x-20,root.y+12+j*4);
    c.bezierCurveTo(root.x-42,root.y+25+Math.sin(time*3+phase+j)*8,root.x-62,root.y+5+Math.sin(time*2+phase+j)*11,root.x-95,root.y+18+j*4);c.stroke();
  }
  for(let i=0;i<5;i++){
    const u=((time*.65+i/5)%1+1)%1;c.globalAlpha=root.alpha*(1-u)*.65;
    const x=root.x-25-u*72,y=root.y+13+Math.sin(time*2+phase-u*3)*12;c.fillStyle=color;c.beginPath();c.arc(x,y,1.4+(1-u)*1.3,0,TAU);c.fill();
  }
  if(lumi)for(let i=0;i<5;i++){
    const a=time*.6+i*TAU/5,r=37+Math.sin(time*2+i)*3;
    c.globalAlpha=root.alpha*.45;c.strokeStyle='#ffe4a1';c.beginPath();c.moveTo(root.x+Math.cos(a)*r,root.y+Math.sin(a)*r);c.lineTo(root.x+Math.cos(a)*(r+5),root.y+Math.sin(a)*(r+5));c.stroke();
  }c.restore();
}
export function drawHelpers(c,h,rigs,images,r,time,{effects=true,finale,pass='back'}={}){
  c.save();
  if(pass==='back'){
    const hand=resolveRig(rigs.lumi,h.lumi.nodes).find(n=>n.id==='nearHand').matrix,scale=h.lumi.root.scale??1;
    drawLumiDiscovery(c,{...h.discovery,emitter:{x:h.lumi.root.x+hand[4]*scale,y:h.lumi.root.y+hand[5]*scale}},time,{effects});
    drawPortalPassage(c,h.portal,time,{effects,caster:h.quantico.root,images});
    if(h.bridge.morph>0&&h.bridge.rect){const b=h.bridge.rect,m=h.bridge.morph,p=h.bridge.shape;
      const body=c.createLinearGradient(0,p.y,0,p.y+p.h);body.addColorStop(0,'#c4fbff');body.addColorStop(.22,'#54d8ef');body.addColorStop(.65,'#516bdf');body.addColorStop(1,'#a875ec');c.fillStyle=body;
      c.beginPath();c.moveTo(p.x+8,p.y);c.quadraticCurveTo(p.x,p.y,p.x,p.y+12);c.bezierCurveTo(p.x,p.y+p.h,p.x+p.w,p.y+p.h,p.x+p.w,p.y+12);c.quadraticCurveTo(p.x+p.w,p.y,p.x+p.w-8,p.y);c.closePath();c.fill();
      c.strokeStyle='#c2f9ff';c.lineWidth=2;c.stroke();
      const f=rigs.quantico.frames.ribbon;c.globalAlpha=.25*m;c.drawImage(images[f.image],f.x,f.y,f.w,f.h,b.x,b.y+5,b.w*m,48);c.globalAlpha=1;
      for(const [i,p] of h.bridge.pieces.entries()){
        const g=c.createLinearGradient(p.x,p.y,p.x,p.y+p.depth);g.addColorStop(0,'#c5f8ff');g.addColorStop(.25,i%2?'#66bcf4':'#71d9eb');g.addColorStop(1,'#6245adcc');c.fillStyle=g;
        c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+p.width,p.y);c.lineTo(p.x+p.width,p.y+p.depth*.65);c.lineTo(p.x+p.width*.45,p.y+p.depth);c.lineTo(p.x,p.y+p.depth*.6);c.closePath();c.globalAlpha=.22*m;c.fill();c.globalAlpha=1;
        c.strokeStyle='#d7e4ff99';c.lineWidth=1;c.stroke();
        c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+p.width*.45,p.y+p.depth);c.lineTo(p.x+p.width,p.y);c.stroke();
      }
      c.strokeStyle='#fff2cb';c.lineWidth=2;c.beginPath();c.moveTo(b.x,b.y+1);c.lineTo(b.x+b.w*m,b.y+1);c.stroke();
      const face=h.bridge.face;c.save();c.globalAlpha=face.alpha;c.beginPath();c.ellipse(face.x,face.y,21,18,0,0,TAU);c.clip();c.drawImage(images['helpers-parts-v03'],165,666,330,290,face.x-21,face.y-18,42,36);c.restore();
      const hand=rigs.quantico.frames.hand;for(const side of [-1,1]){c.save();c.translate(p.x+p.w/2+side*(p.w/2-4),p.y+16);c.scale(side,1);c.rotate(Math.sin(time*3+side)*.14);c.globalAlpha=m;c.drawImage(images[hand.image],hand.x,hand.y,hand.w,hand.h,-5,-8,24,18);c.restore();}
      if(effects){c.save();c.globalCompositeOperation='screen';for(let i=0;i<5;i++){const u=((time*.45+i/5)%1+1)%1;c.globalAlpha=m*Math.sin(u*Math.PI)*.7;c.fillStyle='#e5faff';c.beginPath();c.ellipse(p.x+u*p.w,p.y+7+Math.sin(time*3+i)*2,4,1.5,0,0,TAU);c.fill();}c.restore();}
      if(h.bridge.landing>0){c.globalAlpha=h.bridge.landing;c.strokeStyle='#fff4c9';c.lineWidth=2;c.beginPath();c.ellipse(r.x,b.y+2,20+55*h.bridge.landing,5+4*h.bridge.landing,0,0,TAU);c.stroke();c.globalAlpha=1;}
    }
    for(const [name,a] of [['lumi',h.lumi],['quantico',h.quantico]]){
      const exit=finale?.helpers?.[name],root={...a.root};if(exit){root.x+=exit.x;root.y+=exit.y;root.alpha*=exit.alpha;}
      if(a.entrance.active){c.save();c.translate(root.x,root.y);c.scale(.5,.5);drawArrival(c,{x:0,y:0,open:Math.sin(Math.PI*a.entrance.progress)},time,name==='lumi'?'#ffdf8f':'#a3ddff',{effects});c.restore();}
      if(effects)companionEnergy(c,name,root,time);
      c.save();if(a.entrance.active){c.beginPath();c.rect(root.x-65,root.y+45-110*a.entrance.progress,130,110*a.entrance.progress);c.clip();}
      drawRig(c,rigs[name],a.nodes,images,root);
      c.restore();
    }
  }else{drawQuantumBarrier(c,h.shield,r,time,{effects});drawPortalPassage(c,h.portal,time,{front:true,effects,images});drawLumiDiscovery(c,h.discovery,time,{front:true,effects});}
  c.restore();
}
