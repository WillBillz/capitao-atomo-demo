import {drawRig,resolveRig} from './rig.mjs';
import {sampleDoctorArms,drawDoctor} from './doctor-acting.mjs';
import {sampleMachineSlot,drawMachine} from './escort-machines.mjs';
import {sampleDoctorTeleport,drawDoctorHologram} from './doctor-teleport.mjs';
import {drawShipCrash} from './ship-crash.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
const settle=x=>{const u=clamp(x);return u*u*(3-2*u);};
export const PURSUER_DISTANCE=40;
function acting(time){
  // Broad, linked acting beats continue through musical gaps as well as verses.
  const poses=[[-.18,.1,2,.35,-.6,.4,-1.1],[.08,-.1,-4,-1.3,-1.2,.65,-1],[.19,-.18,-7,-2.15,-.4,-1.4,-.85],[-.08,.1,0,-1.45,.05,.3,-1.2],[.16,-.1,3,-.35,-.6,-.6,-.5],[-.13,.15,-3,-1.2,-1.1,-2,-.3]];
  const p=((time/.62)%poses.length+poses.length)%poses.length,i=Math.floor(p),u=p-i;
  // Periodic Catmull-Rom retains velocity while passing a gesture's key pose.
  return poses[i].map((_,j)=>{const a=poses[(i+poses.length-1)%poses.length][j],b=poses[i][j],d=poses[(i+1)%poses.length][j],e=poses[(i+2)%poses.length][j];return .5*(2*b+(-a+d)*u+(2*a-5*b+4*d-e)*u*u+(-a+3*b-3*d+e)*u*u*u);});
}
export function toolMuzzle(tool,rig){const p=resolveRig(rig,tool.nodes).find(n=>n.id==='tip').matrix,s=tool.root.scale??1;return {x:tool.root.x+(p[4]+p[0]*62)*s,y:tool.root.y+(p[5]+p[1]*62)*s};}
export function sampleEnsemble(stage,time,performance={}){
  let command=0,recoil=0;
  for(const e of stage.sceneEvents)if((e.kind==='warning'||e.kind==='projectionStart')&&time>=e.at){
    const fire=e.payload.fireAt,age=time-fire;
    command=Math.max(command,clamp((time-e.at)/.35)*(1-clamp(age/.38)));
    if(age>=0&&age<.48)recoil=Math.max(recoil,Math.sin(Math.PI*age/.48)*(1-age/.48));
  }
  const hoverTime=stage.victory&&time>=98.11?98.11:time;
  const visible=time>=2,arrival=clamp((time-2)/1.2),approach=arrival*arrival*(3-2*arrival),baseX=-490+approach*(385-PURSUER_DISTANCE+Math.sin(hoverTime*1.15)*10)-recoil*12,baseY=258+Math.sin(hoverTime*2)*6+Math.sin(hoverTime*.9)*3-recoil*3;
  const teleport=sampleDoctorTeleport(stage,time,{x:baseX,y:baseY}),x=baseX+teleport.x,y=baseY+teleport.y;
  const annoyed=['indignant','flustered'].includes(stage.ship.expression),gesture=performance.gesture??0,choir=performance.choir??0;
  const speaking=performance.speaking?.doctor??0,root={x,y,alpha:visible?1:0,scale:1};
  let reaction=0;
  for(const e of stage.sceneEvents)if(e.kind==='prismHit'||e.kind==='shieldHit'){
    const age=time-e.at;if(age>=0&&age<.9)reaction=Math.max(reaction,settle(age/.14)*(1-settle((age-.2)/.7)));
  }
  const ship={root,recoil,nodes:[{id:'engineBack',y:143+Math.sin(hoverTime*5)*2,scaleY:1+Math.sin(hoverTime*7)*.04+recoil*.14},{id:'engineFront',y:155+Math.sin(hoverTime*5+1)*2,scaleY:1+Math.sin(hoverTime*7+1)*.04+recoil*.14}]};
  const boast=(.5+.5*Math.sin(time*2.4))*(speaking>.1?.6:.12);
  const flourish=Math.sin(time*3.2)*speaking*(1-command);
  const act=acting(time),lean=act[0]*(1-command*.6);
  const syllable=clamp((Math.sin(time*Math.PI*2*3.8+Math.sin(time*4.4)*.35)+.2)/1.2),mouthOpen=Math.max(reaction*.85,speaking*syllable),mouthAlpha=clamp(mouthOpen/.35);
  const arms=sampleDoctorArms(time,{command,reaction,speaking,gesture});
  const angles=name=>{const a=arms[name],upper=Math.atan2(-(a.elbow.x-a.shoulder.x),a.elbow.y-a.shoulder.y),fore=Math.atan2(-(a.wrist.x-a.elbow.x),a.wrist.y-a.elbow.y);return[upper,fore-upper];},near=angles('near'),far=angles('far');
  const doctor={time,reaction,command,arms,root:{x:x+210-reaction*9+Math.sin(time*2.4-.4)*speaking*2,y:y+79+act[2]-Math.sin(time*2.4)*speaking*3+Math.sin(time*4.8-.5)*speaking*1.5,scale:1,alpha:root.alpha},nodes:[
    {id:'torso',rotation:lean+(annoyed?-.08:0)-reaction*.3+command*.16+boast*.05},
    {id:'head',rotation:act[1]-lean*.6+(annoyed?.1:0)+reaction*.28-command*.12+flourish*.06+Math.sin(time*5.2-.45)*speaking*.025},
    {id:'nearUpperArm',rotation:near[0]},
    {id:'nearForearm',rotation:near[1]},
    {id:'farUpperArm',rotation:far[0]},
    {id:'farForearm',rotation:far[1]},{id:'pointHand',frameId:command>.4?'pointHand':'openHand',rotation:command>.4?Math.PI/2:Math.PI,alpha:1},
    {id:'mouth',alpha:mouthAlpha*mouthAlpha*(3-2*mouthAlpha),scaleY:.25+.75*mouthOpen},
    {id:'brows',frameId:reaction>.1||stage.ship.expression==='perplexed'?'browsRaised':'browsFrown',alpha:Math.max(reaction,annoyed||stage.ship.expression==='perplexed'?.85:0)}
  ]};
  const tools=stage.sceneEvents.filter(e=>e.kind==='warning'&&['wave','beam','arm'].includes(e.payload.tool)&&e.payload.contactAt>=time-.25&&e.at<=time).map((e,i)=>{
    const age=time-e.at,fire=e.payload.fireAt,recoil=Math.max(0,1-Math.abs(time-fire)/.22),aim=e.payload.tool==='wave'?.9:.35;
    return {id:e.id,tool:e.payload.tool,contactAt:e.payload.contactAt,fireAt:fire,charge:clamp(age/.65),recoil,
      root:{x:x+302,y:y+74+i*24,scale:.8,alpha:root.alpha},
      nodes:[{id:'base',rotation:aim-command*.1},{id:'arm',rotation:-.6-recoil*.3},{id:'tip',rotation:-aim+.6+recoil*.25}]
    };
  }).slice(-2);
  const projection=stage.sceneEvents.find(e=>e.kind==='projectionStart'&&time>=e.at&&time<e.payload.contactAt+.85);
  if(projection){const p=clamp((time-projection.at)/.65),u=p*p*(3-2*p),v=clamp((time-projection.payload.contactAt-.2)/.4),aim=u*(1-v*v*(3-2*v));tools.push({id:projection.id,tool:'projector',charge:aim,root:{x:x+302,y:y+74,scale:.8,alpha:root.alpha},nodes:[{id:'base',rotation:-.2},{id:'arm',rotation:-.8},{id:'tip',rotation:1-.85*aim}]});}
  if(tools.length===0)tools.push({id:'idle-tool',tool:'idle',charge:0,root:{x:x+302,y:y+74,scale:.8,alpha:root.alpha},nodes:[{id:'base',rotation:-.2},{id:'arm',rotation:-.8},{id:'tip',rotation:1}]});
  return {time,teleport,ship,doctor,tools,choir:[0,1].map(i=>sampleMachineSlot({x:x+200+i*125+Math.sin(time*1.7+i)*10,y:y-60+Math.sin(time*3.4+i)*13,open:choir*(.5+.5*Math.sin(time*10+i)**2),rotation:Math.sin(time*3+i)*.07},stage,time,i))};
}
function drawPropulsion(c,scene,effects){
  const t=scene.time,root=scene.ship.root;
  c.save();c.globalCompositeOperation='screen';
  for(const [i,dx] of [74,263].entries()){
    const x=root.x+dx,y=root.y+(i?173:161),length=32+Math.sin(t*8+i)*5+scene.ship.recoil*18;
    const jet=c.createLinearGradient(0,y,0,y+length);jet.addColorStop(0,'#d5fdffb0');jet.addColorStop(.3,'#65dffb80');jet.addColorStop(1,'#68d8ff00');c.fillStyle=jet;
    c.beginPath();c.moveTo(x-13,y);c.quadraticCurveTo(x-12,y+length*.65,x-4,y+length);c.quadraticCurveTo(x+13,y+length*.65,x+13,y);c.closePath();c.fill();
    if(effects){
      for(let j=0;j<5;j++){
        const u=((t*1.3+j/5+i*.13)%1+1)%1;c.globalAlpha=(1-u)*.45;c.fillStyle='#baf6ff';
        c.beginPath();c.ellipse(x+Math.sin(j*2+t)*8-u*18,y+u*70,1.4,3-u,0,0,Math.PI*2);c.fill();
      }c.globalAlpha=1;
    }
  }c.restore();
}
export function drawEnsemble(c,scene,rigs,images,{effects=true,finale}={}){
  drawShipCrash(c,scene,finale,{effects});
  drawDoctorHologram(c,scene,target=>drawEnsembleBody(target,scene,rigs,images,{effects,finale}),{effects});
  drawShipCrash(c,scene,finale,{effects,front:true});
}
function drawEnsembleBody(c,scene,rigs,images,{effects=true,finale}={}){
  if(scene.ship.root.alpha===0)return;
  const offset=finale?.ship??{x:0,y:0,rotation:0};
  c.save();c.translate(offset.x??0,offset.y??0);
  const pivot=scene.ship.root;c.translate(pivot.x+170,pivot.y+90);c.rotate(offset.rotation??0);c.translate(-pivot.x-170,-pivot.y-90);
  if(!(finale?.ship.crash>0))drawPropulsion(c,scene,effects);
  const shake=finale?.ship.crash??0,engineSwing=shake*(Math.sin(scene.time*15)*.12-.25);
  drawRig(c,rigs.ship,scene.ship.nodes.map(n=>n.id==='engineBack'?{...n,x:74-shake*5,y:n.y+shake*8,rotation:engineSwing}:n),images,scene.ship.root);
  const crash=finale?.ship.crash??0;
  drawDoctor(c,scene.doctor,rigs.doctor,images,{crash});
  drawRig(c,rigs.ship,[{id:'hull',alpha:0},{id:'engineBack',alpha:0},{id:'engineFront',alpha:0},{id:'rim',alpha:1}],images,scene.ship.root);
  for(const tool of scene.tools){
    const nodes=finale?.active?tool.nodes.map(n=>n.id==='arm'?{...n,rotation:n.rotation-finale.ship.toolFold*1.2}:n.id==='tip'?{...n,rotation:n.rotation+finale.ship.toolFold*2}:n):tool.nodes;
    drawRig(c,rigs.tool,nodes,images,tool.root);
    const p=tool.tool==='projector'?toolMuzzle(tool,rigs.tool):{x:tool.root.x+55,y:tool.root.y+48};c.fillStyle=tool.tool==='wave'?'#ffb877':'#9aefff';c.globalAlpha=.4+.5*tool.charge;c.beginPath();c.arc(p.x,p.y,5+tool.charge*6,0,Math.PI*2);c.fill();c.globalAlpha=1;
  }
  for(const bot of scene.choir)drawMachine(c,bot,rigs.ship,images,scene.time,{effects});
  if(finale?.active){
    c.fillStyle='#131d38';c.beginPath();c.roundRect(scene.ship.root.x+127,scene.ship.root.y+107,132,27,8);c.fill();
    c.fillStyle='#ffd38b';c.font='bold 12px system-ui';c.textAlign='center';c.fillText(finale.progress<.18?'OPA!':finale.progress<.6?'RECALCULANDO!':'…',scene.ship.root.x+193,scene.ship.root.y+125);c.textAlign='left';
  }
  if(crash>0){
    c.globalAlpha=crash;c.fillStyle='#ffe19a';c.font='bold 20px system-ui';c.fillText('OPS!',scene.ship.root.x+165,scene.ship.root.y-55);c.globalAlpha=1;
  }
  c.restore();
}
