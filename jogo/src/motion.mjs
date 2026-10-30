import {resolveRig} from './rig.mjs';
import {RUN_SPEED,RUN_CYCLE,RUN_STANCE_FRACTION,RUN_HIP_X} from './pace.mjs';
export {RUN_CYCLE,RUN_STANCE_FRACTION} from './pace.mjs';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
const STANCE_DURATION=RUN_CYCLE*RUN_STANCE_FRACTION;
const actionOf=(r,t)=>t<r.punchUntil?'punch':r.h===64?'duck':!r.grounded?'jump':'run';
export function legTarget(time,side){
  const cycle=RUN_CYCLE,stanceDuration=STANCE_DURATION,elapsed=((time+side*cycle/2)%cycle+cycle)%cycle;
  if(elapsed<stanceDuration)return {x:RUN_SPEED*stanceDuration/2-RUN_SPEED*elapsed,y:0,stance:true};
  const u=(elapsed-stanceDuration)/(cycle-stanceDuration);
  const span=RUN_SPEED*stanceDuration;
  // Hermite return matches the moving floor's velocity at both support boundaries.
  return {x:-span/2+span*smooth(u)-RUN_SPEED*(cycle-stanceDuration)*u*(1-u)*(1-2*u),y:-24*Math.sin(Math.PI*u)**2,stance:false};
}
export function sampleFootfalls(time,origin=0){
  const out=[];
  for(const side of [0,1]){
    const latest=origin+Math.floor((time-origin+side*RUN_CYCLE/2)/RUN_CYCLE)*RUN_CYCLE-side*RUN_CYCLE/2;
    for(const at of [latest-RUN_CYCLE,latest])if(at>=origin&&time-at>=-1e-8&&time-at<.26)out.push({at,side,x:RUN_HIP_X[side]+RUN_SPEED*STANCE_DURATION/2});
  }
  return out.sort((a,b)=>a.at-b.at);
}
function solveLimb(dx,dy,l1,l2,bend=-1){
  const distance=Math.max(.00001,Math.hypot(dx,dy)),d=Math.max(Math.abs(l1-l2)+.001,Math.min(l1+l2-.001,distance)),angle=Math.atan2(-dx,dy);
  dx*=d/distance;dy*=d/distance;
  const upper=angle+bend*Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))));
  const kneeX=-Math.sin(upper)*l1,kneeY=Math.cos(upper)*l1;
  const lower=Math.atan2(-(dx-kneeX),dy-kneeY);
  return {upper,lower:lower-upper,tip:-lower};
}
function pose(action,r,time){
  const phase=time/RUN_CYCLE*TAU,air=!r.grounded,duck=r.h===64;
  let hipsY=-83+Math.cos(phase*2)*1.2;
  const landing=time-r.landedAt;if(r.landedAt>=0&&landing>=0&&landing<.16)hipsY+=4*Math.sin(landing/.16*Math.PI);
  // Velocity gives the flight its own rising, suspended and landing poses.
  const flight=smooth(((r.vy??0)+500)/1000),tuck=Math.sin(Math.PI*flight);
  const punch=action==='punch'?clamp((time-(r.punchedAt??r.punchUntil-.22))/.22):1;
  const extension=action==='punch'?smooth((punch-.14)/.24)*(1-smooth((punch-.65)/.35)):0;
  const windup=action==='punch'?Math.sin(Math.PI*clamp(punch/.24))*(1-extension):0;
  let torsoAngle=air?.12-flight*.15:.09+Math.sin(phase*2-.3)*.025;
  torsoAngle+=extension*.23-windup*.14;
  const recovering=!duck&&!air&&r.duckUntil>=0&&time>=r.duckUntil?1-smooth((time-r.duckUntil)/.12):0;
  hipsY+=recovering*10;torsoAngle+=recovering*.2;
  if(duck){hipsY=-14;torsoAngle=1.35;}
  const nodes=[],add=(id,parent,x,y,rotation=0)=>nodes.push({id,parent,x,y,rotation});
  add('hips',null,0,hipsY);add('torso','hips',duck?0:Math.sin(phase*2)*.8,duck?0:-3,torsoAngle);add('head','torso',3,-39,duck?-torsoAngle:-torsoAngle*.85);
  add('capeRoot','torso',-13,-38,(duck?-.4:.48)+Math.sin(phase-1)*.08+extension*.3+(air?tuck*.18:0));
  add('capeMid','capeRoot',0,168*50/444,.1+Math.sin(phase-1.8)*.13);
  add('capeTip','capeMid',0,168*50/444,.05+Math.sin(phase-2.5)*.18);
  const feet=[];
  for(const [side,prefix,hipX] of [[0,'near',-7],[1,'far',7]]){
    let foot=legTarget(time,side);
    if(air)foot={x:side?-26+flight*6:18+flight*9,y:side?-10-tuck*12:-8-tuck*30,stance:false};
    if(duck)foot={x:side?-40:60,y:0,stance:true};
    const leg=solveLimb(foot.x-hipX,foot.y-14-hipsY-6,38,36,duck&&side?1:-1);
    add(prefix+'Thigh','hips',hipX,6,leg.upper);add(prefix+'Shin',prefix+'Thigh',0,38,leg.lower);add(prefix+'Boot',prefix+'Shin',0,36,leg.tip);
    let upper=(side?-1:1)*Math.cos(phase)*.8+.1,fore=-1+Math.sin(phase+(side?Math.PI:0))*.15;
    if(air){upper=side?.8-flight*.65:-1.35+flight*1.55;fore=-.8-tuck*.45;}
    if(duck){
      // Solve wrist targets in torso coordinates: neither elbow nor glove goes below the floor.
      const target={x:side?-13:50,y:side?-25:-28},cs=Math.cos(torsoAngle),sn=Math.sin(torsoAngle);
      const localX=cs*target.x+sn*(target.y-hipsY),localY=-sn*target.x+cs*(target.y-hipsY);
      const arm=solveLimb(localX-(side?10:-13),localY+34,27,24);
      upper=arm.upper;fore=arm.lower;
    }
    if(action==='punch'&&side===0){upper=-.25+windup*.35-extension*1.57;fore=-1.05+extension*1.02;}
    add(prefix+'UpperArm','torso',side?10:-13,-34,upper);add(prefix+'Forearm',prefix+'UpperArm',0,27,fore);add(prefix+'Hand',prefix+'Forearm',0,24,.12);
    feet.push({...foot,x:r.x+foot.x,y:r.y+foot.y});
  }
  for(const n of nodes)n.alpha=duck?0:1;
  add('slidePose',null,duck?-4*(1-smooth((time-(r.duckedAt??time))/.06)):0,0);
  nodes.at(-1).alpha=duck?1:0;
  return {nodes,feet,root:{x:r.x,y:r.y,scale:1,scaleY:1},silhouetteHeight:duck?64:168};
}
export function createMotion(runner,time){return {action:actionOf(runner,time),since:time,origin:null,runner};}
export function advanceMotion(motion,runner,time){
  const action=actionOf(runner,time);if(action===motion.action)return {...motion,runner};
  // A low ceiling needs the low silhouette on the accepted frame, without crushing art.
  const origin=runner.h===64||motion.runner.h===64?null:sampleHero(motion,motion.runner,time).nodes;
  return {action,since:time,origin,runner};
}
export function sampleHero(motion,runner,time){
  const m=motion??createMotion(runner,time),out=pose(m.action,runner,time);
  if(m.origin){const p=smooth((time-m.since)/.08),old=new Map(m.origin.map(n=>[n.id,n]));
    for(const n of out.nodes){const a=old.get(n.id);if(!a)continue;for(const k of ['x','y'])n[k]=a[k]+(n[k]-a[k])*p;n.rotation=a.rotation+Math.atan2(Math.sin(n.rotation-a.rotation),Math.cos(n.rotation-a.rotation))*p;}
  }
  // The root obeys the collision stance immediately; blending limbs cannot stand the hero under a ceiling.
  const rig={frames:{},bones:out.nodes.map((n,i)=>({...n,frameId:null,z:i}))};
  const hand=resolveRig(rig,[]).find(n=>n.id==='nearHand').matrix;
  out.hand={x:out.root.x+hand[4],y:out.root.y+hand[5]*(out.root.scaleY??1)};
  return out;
}
