import {overlaps,PUNCH_STRIKE_DELAY} from './runner.mjs';
import {eventsBetween} from './timeline.mjs';
import {recordSceneEvent} from './scene-events.mjs';
import {RUN_SPEED,BRIDGE_CENTER,BRIDGE_WIDTH} from './pace.mjs';
import {calculationCenter} from './calculation-screen.mjs';
import {PORTAL_PASSAGE,passageExitPosition,passageEnd} from './portal-passage.mjs';
import {lumiDiscoverySchedule,lumiTargetSolved} from './lumi-discovery.mjs';
import {shieldWindow,activeShieldWindow} from './shield-sequence.mjs';
export const SPEED=RUN_SPEED,FLOOR=560;
export function createStage({cues,time=0,checkpoint=0,assisted=true}){
  const portalCharge=cues.some(c=>c.id==='quantico-portal')&&time>=PORTAL_PASSAGE.readyAt;
  const shield=activeShieldWindow(cues,time);
  const objects=new Map();
  for(const c of cues.filter(c=>c.kind==='contact'&&['wave','beam','arm'].includes(c.payload.obstacle))){
    const high=c.payload.obstacle!=='wave';
    objects.set(c.id,{id:c.id,type:c.payload.obstacle,at:c.at,worldX:410+c.at*SPEED,w:high?66:54,h:high?58:44,y:high?400:516});
  }
  objects.set('prism',{id:'prism',type:'prism',at:52.4,worldX:410+52.4*SPEED,w:52,h:60,y:430});
  for(const c of cues.filter(c=>c.kind==='gate'&&c.payload.requires!=='prism'))objects.set(c.payload.requires,{id:c.payload.requires,type:'prism',appearance:c.payload.appearance,at:c.at,worldX:410+c.at*SPEED,w:c.payload.appearance?80:52,h:60,y:430});
  if(cues.some(c=>c.id==='sealed-bulkhead'))objects.set('sealed-bulkhead',{id:'sealed-bulkhead',type:'sealedBarrier',at:PORTAL_PASSAGE.barrierAt,worldX:410+PORTAL_PASSAGE.barrierAt*SPEED,w:PORTAL_PASSAGE.width,h:496,y:64});
  const stage={cues,checkpoint,assisted,objects,sceneEvents:[],completed:new Set(cues.filter(c=>c.at<=time).map(c=>c.id)),
    lumi:{active:time>=38.6,revealAt:time>=38.6?38.6:-1,revealUntil:time>=38.6?44:0,discoveries:new Set(lumiDiscoverySchedule(cues).filter(t=>t.revealAt<=time).map(t=>t.id))},
    quantico:{form:shield?'shield':time>=54&&time<58?'bridge':'orb',transitionAt:shield?.at??(time>=54&&time<58?54:-1),readyAt:shield?.readyAt??(time>=54&&time<58?54.55:-1),shieldReleaseAt:shield?.releaseAt??-1,shieldContactId:shield?.contactId??null,shieldAvailable:!!shield&&time<shield.impactAt,shieldUsed:!!shield&&time>=shield.impactAt,shieldHitAt:shield&&time>=shield.impactAt?shield.impactAt:-1,portalOpenedAt:portalCharge?PORTAL_PASSAGE.chargeAt:-1,portalReadyAt:portalCharge?PORTAL_PASSAGE.readyAt:-1},
    ship:{tool:null,expression:time>=60?'flustered':'confident'},prismHit:time>=60,prismHitAt:-1,hitPrisms:new Set(time>=60?['prism']:[]),prismImpactTimes:new Map(),
    portalCount:time>=41.8?1:0,portalUntil:time>=41.8?passageEnd():0,portalEnteredAt:time>=41.8?41.8:-1,portalExited:time>=PORTAL_PASSAGE.exitAt,blockedCount:0,failed:false,victory:false,victoryAt:-1,exitAt:-1,score:0,
    clearedGates:new Set(cues.filter(c=>c.kind==='gate'&&c.at<=time).map(c=>c.payload.requires))};
  restorePendingLaunches(stage,time);return stage;
}
// A retry can start after a machine was already announced: rebuild those launches so the
// obstacle is visible and thrown exactly as in an uninterrupted run (never an invisible hit).
export function restorePendingLaunches(s,time){
  for(const cue of s.cues){
    if(cue.at>time||!['warning','projection'].includes(cue.kind))continue;
    const contact=s.cues.find(c=>c.id===cue.payload.contactId);if(!contact)continue;
    if(cue.kind==='warning'&&contact.at>=time-.25){s.ship.tool=cue.payload.tool;recordSceneEvent(s,{id:cue.id,kind:'warning',at:cue.at,payload:{tool:cue.payload.tool,objectId:contact.id,contactAt:contact.at,fireAt:contact.at-1}});}
    if(cue.kind==='projection'&&time<contact.at+.85){s.ship.tool='projector';recordSceneEvent(s,{id:cue.id,kind:'projectionStart',at:cue.at,payload:{tool:'projector',fireAt:cue.payload.fireAt,contactAt:contact.at,objectId:contact.id,debris:contact.payload.debris??'block'}});}
  }
}
export function objectRect(o,time){const raw=o.worldX-time*SPEED,center=o.appearance==='calculation'?calculationCenter(raw):raw;return {x:center-o.w/2,y:o.y,w:o.w,h:o.h};}
export function stageEnvironment(stage,time,r){
  const gap=Math.abs((time-50.1)*SPEED)<44;
  const bridgeGap=time>55.15&&time<56.25;
  const onBridge=bridgeGap&&time>=55.45&&stage.prismHit&&stage.quantico.form==='bridge'&&stage.quantico.readyAt<=time&&r.y<=501;
  let ceiling=false;
  for(const o of stage.objects.values())if(['beam','arm'].includes(o.type)){
    const b=objectRect(o,time);if(r.x+r.w/2>b.x&&r.x-r.w/2<b.x+b.w)ceiling=true;
  }
  return {groundY:gap?Infinity:bridgeGap?(onBridge?500:Infinity):FLOOR,ceiling:r.h===64&&ceiling};
}
function fail(s,reason){s.failed=true;s.failureReason=reason;s.ship.expression='confident';}
export function stepStage(s,r,{from,to}){
  if(s.failed)return {stage:s,runner:r,failed:true};
  let runner={...r};
  if(s.portalEnteredAt>=0&&to<=s.portalUntil)runner.x=passageExitPosition(to);
  else if(to>s.portalUntil)runner.x=410;
  for(const o of s.objects.values()){
    if(o.type==='bridge')continue;
    const rect=objectRect(o,to);
    if(o.type==='sealedBarrier'){
      if(overlaps(runner,rect)){fail(s,'A máquina gigante bloqueou o caminho. Quântico precisa abrir os portais.');break;}
      continue;
    }
    if(o.type==='prism'){
      const punchAge=to-(runner.punchedAt>=0?runner.punchedAt:runner.punchUntil-.22);
      if(!(o.id==='prism'?s.prismHit:s.hitPrisms.has(o.id)||s.clearedGates.has(o.id))&&to<runner.punchUntil&&punchAge>=PUNCH_STRIKE_DELAY){
        const attack={x:runner.x+runner.w/2,y:runner.y-105,w:180+(s.assisted?45:0),h:65};
        if(attack.x<rect.x+rect.w&&attack.x+attack.w>rect.x&&attack.y<rect.y+rect.h&&attack.y+attack.h>rect.y){
          if(o.id==='prism'){s.prismHit=true;s.prismHitAt=to;}
          s.hitPrisms.add(o.id);s.prismImpactTimes.set(o.id,to);s.score++;s.ship.expression='indignant';recordSceneEvent(s,{id:'prism-hit:'+o.id,kind:'prismHit',at:to,payload:{worldX:o.worldX,y:o.y}});
        }
      }
      if(o.appearance==='door'&&!s.hitPrisms.has(o.id)&&!s.clearedGates.has(o.id)&&overlaps(runner,{...rect,y:340,h:220})){fail(s,'Use o Soco Átomo para destruir a porta.');break;}
    }else if(!s.completed.has('cleared:'+o.id)){
      const margin=s.assisted?6:0;
      const hit={...rect,x:rect.x+margin,w:rect.w-margin*2,y:rect.y+margin,h:rect.h-margin};
      if(overlaps(runner,hit)){fail(s,o.type==='wave'?'Salte um pouco antes da máquina.':'Deslize para baixo antes da máquina.');break;}
      if(rect.x+rect.w<runner.x-runner.w/2){s.completed.add('cleared:'+o.id);s.score++;}
    }
  }
  if(runner.y>FLOOR+75)fail(s,'Salte antes da abertura da ponte.');
  if(!s.failed)for(const cue of eventsBetween(s.cues,from,to)){
    if(s.completed.has(cue.id))continue;s.completed.add(cue.id);
    if(cue.kind==='warning'){
      s.ship.tool=cue.payload.tool;
      const contact=s.cues.find(c=>c.id===cue.payload.contactId);
      if(contact)recordSceneEvent(s,{id:cue.id,kind:'warning',at:cue.at,payload:{tool:cue.payload.tool,objectId:contact.id,contactAt:contact.at,fireAt:contact.at-1}});
    }
    if(cue.kind==='ship')s.ship.expression=cue.payload.expression;
    if(cue.kind==='projection'){const contact=s.cues.find(c=>c.id===cue.payload.contactId);if(contact){s.ship.tool='projector';recordSceneEvent(s,{id:cue.id,kind:'projectionStart',at:cue.at,payload:{tool:'projector',fireAt:cue.payload.fireAt,contactAt:contact.at,objectId:contact.id,debris:contact.payload.debris??'block'}});}}
    if(cue.kind==='checkpoint')s.checkpoint=cue.at;
    if(cue.id==='lumi-reveal'){s.lumi.active=true;s.lumi.revealAt=cue.at;s.lumi.revealUntil=44;recordSceneEvent(s,{id:cue.id,kind:'reveal',at:cue.at,payload:{}});}
    if(cue.id==='quantico-portal'){s.quantico.portalOpenedAt=cue.at;s.quantico.portalReadyAt=cue.at+(cue.payload.duration??.7);recordSceneEvent(s,{id:cue.id,kind:'portalCharge',at:cue.at,payload:{}});}
    if(cue.kind==='portal'&&s.portalCount===0&&s.quantico.portalReadyAt>=0&&s.quantico.portalReadyAt<=cue.at){s.portalCount++;s.portalEnteredAt=cue.at;s.portalUntil=passageEnd();runner.x=passageExitPosition(to);runner.y=FLOOR;runner.vy=0;runner.grounded=true;recordSceneEvent(s,{id:cue.id,kind:'portal',at:cue.at,payload:{}});}
    if(cue.id==='quantico-bridge'&&s.prismHit){s.quantico.form='bridge';s.quantico.transitionAt=cue.at;s.quantico.readyAt=cue.at+(cue.payload.duration??.55);s.objects.set('bridge',{id:'bridge',type:'bridge',at:BRIDGE_CENTER,worldX:410+BRIDGE_CENTER*SPEED,w:BRIDGE_WIDTH,h:28,y:500});recordSceneEvent(s,{id:cue.id,kind:'bridgeStart',at:cue.at,payload:{duration:cue.payload.duration??.55}});}
    if(cue.kind==='gate'&&!(cue.payload.requires==='prism'?s.prismHit:s.hitPrisms.has(cue.payload.requires)||s.clearedGates.has(cue.payload.requires)))fail(s,cue.payload.appearance==='calculation'?'Use o Soco Átomo para quebrar a previsão.':cue.payload.appearance?'Use o Soco Átomo para abrir a passagem.':'Use o Soco Átomo quando o prisma estiver perto.');
    if(cue.kind==='helper'&&cue.payload.form==='shield'){const w=shieldWindow(s.cues,cue);s.quantico.form='shield';s.quantico.transitionAt=cue.at;s.quantico.readyAt=w.readyAt;s.quantico.shieldReleaseAt=w.releaseAt;s.quantico.shieldContactId=w.contactId;s.quantico.shieldAvailable=true;s.quantico.shieldUsed=false;s.quantico.shieldHitAt=-1;recordSceneEvent(s,{id:cue.id,kind:'shieldStart',at:cue.at,payload:{duration:cue.payload.duration??.6,contactId:w.contactId}});}
    if(cue.kind==='contact'&&cue.payload.obstacle==='falling'){
      if(s.quantico.form==='shield'&&s.quantico.shieldAvailable&&!s.quantico.shieldUsed&&s.quantico.readyAt<=cue.at&&(!s.quantico.shieldContactId||s.quantico.shieldContactId===cue.id)){s.quantico.shieldUsed=true;s.quantico.shieldHitAt=cue.at;s.quantico.shieldAvailable=false;s.blockedCount++;s.score++;s.ship.expression='indignant';recordSceneEvent(s,{id:cue.id,kind:'shieldHit',at:cue.at,payload:{count:cue.payload.count??3}});}
      else fail(s,'O escudo ainda não estava pronto. Vamos tentar outra possibilidade.');
    }
    if(cue.kind==='exit')s.exitAt=cue.at;
    if(cue.kind==='victory'){s.victory=true;s.victoryAt=cue.at;s.ship.expression='perplexed';recordSceneEvent(s,{id:cue.id,kind:'victory',at:cue.at,payload:{}});}
    if(s.failed)break;
  }
  if(!s.failed)for(const target of lumiDiscoverySchedule(s.cues))if(target.revealAt>from&&target.revealAt<=to&&!lumiTargetSolved(s,target)){
    s.lumi.discoveries.add(target.id);recordSceneEvent(s,{id:'lumi-discovery:'+target.id,kind:'lumiDiscovery',at:target.revealAt,payload:{targetId:target.id,kind:target.kind}});
  }
  if(!s.failed)for(const e of s.sceneEvents.filter(e=>e.kind==='warning'||e.kind==='projectionStart'))if(e.payload.fireAt>from&&e.payload.fireAt<=to)recordSceneEvent(s,{id:e.id+'-fire',kind:'toolFire',at:e.payload.fireAt,payload:{tool:e.payload.tool,contactAt:e.payload.contactAt}});
  if(to>=58&&s.quantico.form==='bridge')s.quantico.form='orb';
  if(s.portalEnteredAt>=0&&!s.portalExited&&to>=PORTAL_PASSAGE.exitAt){s.portalExited=true;recordSceneEvent(s,{id:'quantum-portal-exit',kind:'portalExit',at:PORTAL_PASSAGE.exitAt,payload:{}});}
  if(s.quantico.form==='shield'&&to>=s.quantico.shieldReleaseAt+.6)s.quantico.form='orb';
  return {stage:s,runner,failed:s.failed};
}
