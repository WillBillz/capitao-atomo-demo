import {objectRect} from './stage.mjs';
import {punchVisual,burstVisual} from './presentation.mjs';
import {drawRig} from './rig.mjs';
import {sampleHero} from './motion.mjs';
import {sampleEnsemble,drawEnsemble,toolMuzzle} from './ensemble.mjs';
import {sampleThrownObstacle,obstacleLaunch} from './thrown-obstacles.mjs';
import {drawHomecoming} from './homecoming.mjs';
import {sampleHelpers,drawHelpers} from './helpers.mjs';
import {sampleWorld,drawWorld} from './quantum-world.mjs';
import {sampleChoreography} from './choreography.mjs';
import {sampleFinale,drawExitPortal} from './finale.mjs';
import {sampleContactScene,drawContactScene} from './scene-contact.mjs';
import {sampleDrawnHero,drawDrawnHero} from './drawn-hero.mjs';
import {sampleAirflow,drawAirflow} from './hero-airflow.mjs';
import {machineSlot,drawMachine} from './escort-machines.mjs';
import {sampleOpening,sampleVocalPerformance,drawArrival,drawStoryObject,drawStoryEnvironment,drawStoryOverlay} from './stage-story.mjs';
import {sampleProjectionAttack,drawProjectionAttack} from './laser-barrage.mjs';
const TAU=Math.PI*2;
function ellipse(c,x,y,rx,ry,color,width=3){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.stroke();}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function pill(c,text,x,y,color='#fff2ce'){
  c.font='bold 21px system-ui';const w=c.measureText(text).width+32;
  c.fillStyle='#121c35e8';c.beginPath();c.roundRect(x-w/2,y-27,w,42,16);c.fill();
  c.fillStyle=color;c.textAlign='center';c.fillText(text,x,y);c.textAlign='left';
}
function obstacle(c,o,t,s,assets,effects,prompts=true){
  if(o.type==='sealedBarrier')return;
  if(o.appearance){const opened=s.clearedGates?.has(o.id);if(!opened||o.appearance==='door'||s.prismImpactTimes.has(o.id)){const b=objectRect(o,t);if(b.x> -200&&b.x<1450){
    if(o.appearance==='calculation'&&!s.hitPrisms.has(o.id)&&t>=5.9){const ship=sampleEnsemble(s,t).ship.root;c.save();c.strokeStyle='#9ceaff66';c.lineWidth=1.5;c.setLineDash([16,20]);c.lineDashOffset=-t*100;for(const y of [386,534]){c.beginPath();c.moveTo(ship.x+305,ship.y+78);c.quadraticCurveTo(b.x+b.w/2-190,ship.y+95,b.x+b.w/2-114,y);c.stroke();}c.restore();}
    if(o.appearance==='door'&&!opened&&!s.hitPrisms.has(o.id)&&t>=o.at-1.6&&t<o.at-.75){const ship=sampleEnsemble(s,t).ship.root;c.save();c.strokeStyle='#ffd09199';c.lineWidth=2;c.setLineDash([8,12]);c.lineDashOffset=-t*90;c.beginPath();c.moveTo(ship.x+300,ship.y+78);c.quadraticCurveTo(b.x-130,180,b.x+b.w/2,263);c.stroke();c.restore();}
    drawStoryObject(c,o,b,t,s.prismImpactTimes.get(o.id)??-1,{effects,opened,image:assets.images['lab-door-v23']});if(prompts&&!opened&&!s.hitPrisms.has(o.id)&&b.x<1100&&t>=o.at-2)pill(c,'✦ SOCO ÁTOMO',b.x+b.w/2,o.appearance==='calculation'?350:300);
  }}return;}
  if(o.type==='bridge'||o.type==='prism'&&(o.id==='prism'?s.prismHit:s.hitPrisms.has(o.id)))return;
  let b=objectRect(o,t);if(b.x<-150||b.x>1400)return;
  let flight=null;
  if(o.type!=='prism'){
    const launch=obstacleLaunch(o,s);let origin={x:260,y:330};
    if(launch)origin=sampleEnsemble(s,launch.payload.fireAt).choir[machineSlot(launch.payload.tool)];
    flight=sampleThrownObstacle(o,s,t,origin);
    if(!flight.visible){if(flight.warning&&b.x<1280){c.strokeStyle='#ffca8888';c.lineWidth=2;c.beginPath();c.ellipse(b.x+b.w/2,558,34,5,0,0,TAU);c.stroke();if(prompts)pill(c,o.type==='wave'?'↑ SALTE':'↓ DESVIE',b.x+b.w/2,412);}return;}
    b=flight.rect;
  }
  c.save();if(flight?.flying){c.translate(flight.center.x,flight.center.y);c.rotate(flight.rotation);c.scale(flight.scale,flight.scale);c.translate(-flight.center.x,-flight.center.y);}
  if(o.type!=='prism'){
    const x=b.x+b.w/2,y=b.y+b.h/2;
    if(effects)glow(c,x,y,o.type==='wave'?44:48,o.type==='wave'?'#ffcd7955':'#94f1ff44');
    drawMachine(c,{x,y,mode:'attack',skimming:o.type==='wave'&&!flight?.flying,scale:o.w/50,alpha:1,open:.25+.25*Math.sin(t*8)**2,target:{x:410,y:490}},assets.data.rigs.ship,assets.images,t,{effects});
  }else{
    glow(c,b.x+26,b.y+30,85,'#aaf8ff88');c.fillStyle='#80ecff';c.strokeStyle='#fff6d0';c.lineWidth=4;
    c.beginPath();c.moveTo(b.x+26,b.y);c.lineTo(b.x+52,b.y+30);c.lineTo(b.x+26,b.y+60);c.lineTo(b.x,b.y+30);c.closePath();c.fill();c.stroke();
    if(prompts)pill(c,'✦ SOCO',b.x+26,b.y-25);
  }
  c.restore();
  if(prompts&&o.type!=='prism'&&!flight?.flying&&b.x>470&&b.x<1150)pill(c,o.type==='wave'?'↑ SALTE':'↓ DESVIE',b.x+b.w/2,b.y-35);
}
function impact(c,x,y,at,time,effects,color='#a8f9ff'){
  const burst=burstVisual(at,time);if(!burst)return;
  c.save();c.globalAlpha=burst.alpha;ellipse(c,x,y,burst.radius,burst.radius*.7,color,effects?4:2);
  if(effects){glow(c,x,y,65*(1-burst.progress),'#c3fbff66');
    for(let i=0;i<10;i++){const a=i*TAU/10+.12,r=burst.radius+10;c.fillStyle=i%2?'#ffe9a9':color;c.save();c.translate(x+Math.cos(a)*r,y+Math.sin(a)*r*.7);c.rotate(a+burst.progress);c.beginPath();c.moveTo(-5,-3);c.lineTo(8,0);c.lineTo(-5,3);c.closePath();c.fill();c.restore();}}
  c.restore();
}
function energyPunch(c,r,time,effects,hand,direction={x:1,y:0}){
  const wave=punchVisual(r,time);if(!wave)return;
  const x=0,y=0,length=wave.reach,h=wave.thickness,dy=0;
  c.save();c.translate(hand?.x??r.x+25,hand?.y??r.y-83);c.rotate(Math.atan2(direction.y,direction.x));c.globalAlpha=wave.alpha;
  if(effects)glow(c,x+length*.6,y,90,'#87efff77');
  const g=c.createLinearGradient(x,y,x+length,y);g.addColorStop(0,'#fff8db');g.addColorStop(.45,'#c6fcff');g.addColorStop(1,'#6ce6ff88');c.fillStyle=g;
  c.beginPath();c.moveTo(x,y-h*.35);c.bezierCurveTo(x+45,y-h,x+length-30,y+dy-h*.8,x+length,y+dy);c.bezierCurveTo(x+length-30,y+dy+h*.8,x+45,y+h,x,y+h*.35);c.closePath();c.fill();
  ellipse(c,x+length-8,y+dy,12+wave.progress*9,h*.9,'#eaffff',3);
  if(effects)for(let i=0;i<7;i++){const spread=(i-3)*5,px=x+length*wave.progress+i*13; c.strokeStyle=i%2?'#ffe7a6':'#97f7ff';c.lineWidth=2;c.beginPath();c.moveTo(px-12,y+spread);c.lineTo(px,y+spread);c.stroke();}
  c.restore();
}
export function renderFrame(c,{session,assets,settings}){
  const {time:t,runner:r,stage:s}=session;const images=assets?.images;
  c.clearRect(0,0,1280,720);c.fillStyle='#19233f';c.fillRect(0,0,1280,720);
  if(!assets?.data?.world||!s)return;
  const performance=sampleChoreography(assets.data.choreography,t);
  const opening=sampleOpening(t);
  Object.assign(performance,sampleVocalPerformance(assets.data.story,t));
  const helpers=sampleHelpers(s,r,t);
  const ensemble=sampleEnsemble(s,t,performance),projector=ensemble.tools.find(tool=>tool.tool==='projector'),barrage=sampleProjectionAttack(s,r,t,projector?toolMuzzle(projector,assets.data.rigs.tool):null);
  const world=sampleWorld({time:t,runner:r,stage:s,world:assets.data.world,effects:settings.effects});
  const visualRunner=opening.active?{...r,x:opening.hero.x,y:opening.hero.y,grounded:opening.hero.arrivalAir===0,landedAt:t>=1.1?1.1:-1}:helpers.portal.hero?{...r,x:helpers.portal.hero.x,grounded:helpers.portal.hero.alpha>0}:r;
  const contact=sampleContactScene({time:t,runner:visualRunner,stage:s,world,helpers,effects:settings.effects});
  world.reactive.sources.push(...contact.lights);
  if(settings.effects)world.reactive.sources.push(...barrage.lights);
  world.reactive.energy=Math.min(1,world.reactive.energy+performance.accent*.2);
  world.music={accent:performance.accent,choir:performance.choir};
  drawWorld(c,world,images,'back');drawWorld(c,world,images,'floor');
  drawStoryEnvironment(c,session,settings.effects);
  if(opening.active)drawArrival(c,opening.portal,t,'#9cf4ff',{effects:settings.effects});
  const finale=sampleFinale(s,t);
  drawEnsemble(c,ensemble,assets.data.rigs,images,{effects:settings.effects,finale});
  drawProjectionAttack(c,barrage,t,{effects:settings.effects});
  drawExitPortal(c,finale.portal,t,{effects:settings.effects});
  drawHelpers(c,helpers,assets.data.rigs,images,r,t,{effects:settings.effects,pass:'back',finale});
  if(settings.prompts!==false&&helpers.bridge.solid&&helpers.bridge.rect&&helpers.bridge.rect.x+helpers.bridge.rect.w>r.x-20)pill(c,'↑ SALTE PARA A PONTE',780,220,'#bffaff');
  for(const o of s.objects.values())obstacle(c,o,t,s,assets,settings.effects,settings.prompts!==false);
  const hero=sampleHero(session.motion,r,t);
  if(opening.active){hero.root.x=opening.hero.x;hero.root.y=opening.hero.y;hero.root.alpha=opening.hero.alpha;}
  if(performance.speaking.hero>0)hero.nodes.find(n=>n.id==='head').rotation-=performance.speaking.hero*.12;
  if(helpers.portal.hero){const dx=helpers.portal.hero.x-hero.root.x;hero.root.x+=dx;hero.root.alpha=helpers.portal.hero.alpha;hero.hand.x+=dx;}
  if(finale.active){hero.root.x=finale.hero.x;hero.root.y=finale.hero.y;hero.root.alpha=finale.hero.alpha;hero.root.scaleX=finale.hero.scale;hero.root.scaleY=finale.hero.scale;}
  const drawn=assets.data.rigs.heroDrawn?sampleDrawnHero(assets.data.rigs.heroDrawn,r,t,{...(opening.active?opening.hero:{}),...hero.root,accent:performance.accent,runWeight:opening.hero.runWeight,thumbs:opening.hero.thumbs,gaitOrigin:r.landedAt<0?opening.hero.gaitOrigin:0}):null;
  const airflow=drawn&&opening.hero.runWeight>.8?sampleAirflow(r,drawn,t,{effects:settings.effects,accent:performance.accent}):null;
  if(airflow)drawAirflow(c,airflow);
  energyPunch(c,r,t,settings.effects,drawn?.hand??hero.hand,drawn?.punchDirection);
  for(const prism of s.objects.values())if(prism.type==='prism'){const b=objectRect(prism,t);impact(c,b.x+b.w/2,b.y+b.h/2,s.prismImpactTimes.get(prism.id)??-1,t,settings.effects);}
  drawContactScene(c,contact,{root:hero.root});
  c.save();if(finale.active&&finale.hero.clip){c.beginPath();c.ellipse(finale.portal.x,finale.portal.y,Math.max(1,65*finale.portal.opening),Math.max(1,130*finale.portal.opening),0,0,TAU);c.clip();}
  if(opening.hero.clip){c.beginPath();c.rect(opening.hero.clip.x,0,1280-opening.hero.clip.x,600);c.clip();}
  const portalClip=helpers.portal.hero?.clip;
  if(portalClip){c.beginPath();if(portalClip.side==='entry')c.rect(0,0,Math.max(0,portalClip.x),600);else c.rect(portalClip.x,0,Math.max(0,1280-portalClip.x),600);c.clip();}
  if(drawn)drawDrawnHero(c,drawn,images);else drawRig(c,assets.data.rigs.hero,hero.nodes,images,hero.root);
  if(airflow)drawAirflow(c,airflow,{front:true});
  drawContactScene(c,contact,{pass:'front'});
  c.restore();drawExitPortal(c,finale.portal,t,{front:true,effects:settings.effects});
  drawHelpers(c,helpers,assets.data.rigs,images,r,t,{effects:settings.effects,pass:'front'});
  drawWorld(c,world,images,'front');
  // Only the completed home scene uses an ambient clock; gameplay and song stay frozen.
  drawHomecoming(c,finale,assets,t+(settings.homeAmbient??0),settings.effects,settings.homeExperiments,settings.captainConversation?.open);
  const lower=c.createLinearGradient(0,660,0,720);lower.addColorStop(0,'#111a3500');lower.addColorStop(1,'#111a35');c.fillStyle=lower;c.fillRect(0,660,1280,60);
  if(settings.overlays!==false)renderOverlays(c,{session,assets,settings});
}
export function renderOverlays(c,{session,assets,settings}){const scene=sampleEnsemble(session.stage,session.time);c.save();drawStoryOverlay(c,session,assets.data.story,{...settings,doctor:{...scene.doctor.root,alpha:scene.doctor.root.alpha*scene.teleport.alpha}});c.restore();}
