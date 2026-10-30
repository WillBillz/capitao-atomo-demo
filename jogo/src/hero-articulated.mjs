// Approved painted head, torso and cape with authored overlapping limb sprites.
// All joint motion is presentation; collision geometry stays intact.
import {RUN_SPEED,RUN_CYCLE,RUN_STANCE_FRACTION,RUN_HIP_X} from './pace.mjs';
import {blendPoint,solveArm,drawMappedPiece} from './limb-geometry.mjs';
import {drawCape} from './hero-cape.mjs';
const TAU=Math.PI*2,S=.4,CYCLE=RUN_CYCLE,mod=(x,n)=>(x%n+n)%n;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
const mix=(a,b,u)=>a+(b-a)*u;
const P={
  cape:[[290,110],[285,130],[248,146],[214,157],[190,177],[173,202],[160,231],[147,245],[115,246],[83,233],[33,241],[30,220],[45,196],[81,173],[128,154],[178,136],[234,127],[270,114]],
  head:[[299,39],[332,25],[409,25],[434,50],[430,103],[407,136],[377,150],[344,148],[313,130],[296,93]],
  torso:[[310,120],[334,125],[349,145],[370,151],[366,174],[361,196],[351,214],[330,232],[318,248],[290,252],[253,245],[260,223],[276,202],[288,177],[298,151]],
  pelvis:[[253,242],[290,240],[327,245],[328,266],[311,284],[282,298],[248,287],[231,269],[238,244]]
};
const L={thighNear:[121,14,200,480],shinNear:[487,15,188,472],bootNear:[784,297,360,210],upper:[1239,38,235,446],thighFar:[127,517,243,466],shinFar:[487,513,185,466],bootFar:[794,790,359,202],fore:[1267,527,182,451]};
const hipSource={x:286,y:268},waistSource={x:303,y:246},neckSource={x:348,y:137};
function point(x,y){return {x,y};}
function turn(p,a){return {x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)};}
function bodyPoint(x,y,hip,rotation){const p=turn(point((x-hipSource.x)*S,(y-hipSource.y)*S),rotation);return point(hip.x+p.x,hip.y+p.y);}
function chestPoint(x,y,waist,rotation){const p=turn(point((x-waistSource.x)*S,(y-waistSource.y)*S),rotation);return point(waist.x+p.x,waist.y+p.y);}
function limbEnd(start,angle,length){return point(start.x-Math.sin(angle)*length,start.y+Math.cos(angle)*length);}
function joint(a,b,l1,l2,bend=1){
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(.01,Math.min(l1+l2-.01,Math.hypot(dx,dy))),angle=Math.atan2(dy,dx),along=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-along*along));
  return point(a.x+Math.cos(angle)*along+bend*Math.sin(angle)*h,a.y+Math.sin(angle)*along-bend*Math.cos(angle)*h);
}
export function articulatedFoot(time,side){
  const elapsed=mod(time+side*CYCLE/2,CYCLE),stanceDuration=CYCLE*RUN_STANCE_FRACTION,span=RUN_SPEED*stanceDuration;
  if(elapsed<stanceDuration){const u=elapsed/stanceDuration,pitch=-.12*(1-smooth(u/.14))+.32*smooth((u-.66)/.34);return {x:RUN_HIP_X[side]+span/2-RUN_SPEED*elapsed,y:0,stance:true,pitch,rollPivot:pitch<0?-6:25};}
  const u=(elapsed-stanceDuration)/(CYCLE-stanceDuration);
  // Fold the heel early, then drive the knee forward before the next ground strike.
  const lift=smooth(u/.28)*(1-smooth((u-.3)/.7));
  return {x:RUN_HIP_X[side]-span/2+span*smooth(u)-RUN_SPEED*(CYCLE-stanceDuration)*u*(1-u)*(1-2*u),y:-48*lift,stance:false,pitch:.32*(1-smooth(u/.22))-.22*Math.sin(Math.PI*u)**2-.12*smooth((u-.8)/.2),rollPivot:25*(1-smooth(u/.25))-6*smooth((u-.75)/.25)};
}
export function sampleArticulatedHero(r,time,root,{idle=false,low=0,air=0,accent=0,runWeight=idle?0:1,thumbs=0,greeting=0,arrivalFlight=-1,arrivalLand=0,gaitOrigin=0}={}){
  const gaitTime=Math.max(0,time-Math.max(gaitOrigin,r.landedAt??0)),phase=mod(gaitTime,CYCLE)/CYCLE*TAU,age=time-r.punchedAt,attacking=r.punchedAt>=0&&age>=0&&age<.34;
  const wind=attacking?smooth(age/.035)*(1-smooth((age-.035)/.045)):0,extension=attacking?smooth((age-.035)/.045)*(1-smooth((age-.13)/.21)):0;
  const strength=Math.max(wind,extension),flight=arrivalFlight>=0?arrivalFlight:r.grounded&&r.landedAt>=0?1:smooth(((r.vy??0)+450)/900),tuck=Math.sin(Math.PI*flight)**2;
  const landingAge=time-(r.landedAt??-1),landing=r.grounded&&r.landedAt>=0?smooth(landingAge/.035)*(1-smooth((landingAge-.035)/.15)):0;
  const slideAge=Math.max(0,time-(r.duckedAt??time)),glide=low*(1-air),settle=Math.sin(Math.min(1,slideAge/.3)*Math.PI)*Math.exp(-slideAge*4);
  const bob=Math.cos(phase*2-TAU*.3)*2.6,travel=runWeight*(Math.sin(time*.9)*3+Math.sin(time*1.7)*1.2)*(1-low);
  const runRotation=mix(-.24+Math.sin(time*1.8)*.008,.1+Math.sin(phase-.2)*.014,runWeight);
  const rotation=mix(mix(runRotation,.035+flight*.06,air),.84+.04*Math.sin(slideAge*8)+settle*.07,low)+extension*.045-wind*.035+arrivalLand*.16-greeting*.055;
  const pelvisRotation=(Math.sin(phase)*.023*runWeight-extension*.025)*(1-low)+glide*Math.sin(slideAge*7)*.035;
  const hip=point(travel+extension*5-wind*2+(Math.sin(phase)*.9+accent*.8)*runWeight*(1-low)+glide*(7+Math.sin(slideAge*6)*3),mix(mix(-88+Math.sin(time*2)*.8,-79+bob*(1-air),runWeight)+landing*7+arrivalLand*12-greeting*3,-34+Math.sin(slideAge*9)*1.3+settle*2,low*low));
  const waist=bodyPoint(waistSource.x,waistSource.y,hip,pelvisRotation);
  const neck=chestPoint(neckSource.x,neckSource.y,waist,rotation),headRotation=mix(rotation*.14+Math.sin(time*2)*.006+Math.sin(phase-.7)*.018*runWeight*(1-air),.25,low)-thumbs*.08+greeting*.12;
  const eye=turn(point((376-neckSource.x)*S,(85-neckSource.y)*S),headRotation),face=point(neck.x+eye.x,neck.y+eye.y);
  const arms={},legs={};
  for(const [side,name] of [[0,'near'],[1,'far']]){
    const shoulder=chestPoint(side?372:271,side?161:142,waist,rotation);
    if(side){shoulder.x+=extension*3;shoulder.y+=extension*.8;}
    let upper=mix(side?-.18:.18,.03+Math.cos(phase+side*Math.PI)*.88,runWeight),fore=mix(-.28,-1.5+Math.sin(phase+side*Math.PI-.52)*.2,runWeight);
    upper=mix(upper,side?.65-flight*.8:-.9+flight*.6,air);fore=mix(fore,-1.1-tuck*.25,air);
    let target=limbEnd(limbEnd(shoulder,upper,31),upper+fore,27);
    target=blendPoint(target,point(side?-12+Math.sin(slideAge*7)*3:62+Math.sin(slideAge*6)*4,side?-38+Math.sin(slideAge*6)*2:-29+Math.sin(slideAge*7)*2),low);
    if(!side)target=blendPoint(target,point(shoulder.x+52,shoulder.y+12-greeting*3),thumbs);
    if(side)target=blendPoint(target,point(shoulder.x-8,shoulder.y+44),greeting*.6);
    if(side&&attacking){target=blendPoint(target,point(shoulder.x-14,shoulder.y+31),wind);target=blendPoint(target,point(shoulder.x+54.5,shoulder.y+14),extension);}
    if(!side&&attacking)target=blendPoint(target,point(shoulder.x+21,shoulder.y+15),strength*.7);
    const arm=solveArm(shoulder,target),baseAngle=Math.atan2(arm.wrist.y-arm.elbow.y,arm.wrist.x-arm.elbow.x),handAngle=baseAngle*(side?1-extension:1);
    arm.handAngle=handAngle;arm.thumbs=!side?thumbs:0;arm.knuckle=point(arm.wrist.x+Math.cos(handAngle)*10,arm.wrist.y+Math.sin(handAngle)*10);arms[name]=arm;
    let foot=articulatedFoot(gaitTime,side);foot={...foot,...blendPoint(point(side?-19:21,0),foot,runWeight),pitch:foot.pitch*runWeight,rollPivot:(foot.rollPivot??0)*runWeight};
    const airFoot=side?{x:-32+flight*10,y:-35+flight*20}:{x:20+flight*9,y:-24*tuck};
    foot={...foot,...blendPoint(foot,airFoot,air),pitch:mix(foot.pitch,-.08*flight,air),rollPivot:mix(foot.rollPivot??0,0,air)};
    const slideFoot=point(side?-60+Math.sin(slideAge*7)*5:70+Math.sin(slideAge*5)*2,side?-28+Math.sin(slideAge*7)*2:0);
    // Feet settle before the pelvis lowers, then lift after the body recovers.
    // Keeping the folded heel away from the hip prevents the IK knee whipping.
    const slideY=mix(foot.y,slideFoot.y,1-(1-low)**3);
    foot={...foot,...blendPoint(foot,slideFoot,low),y:slideY,pitch:mix(foot.pitch,side?-.35+Math.sin(slideAge*8)*.06:0,low),rollPivot:(foot.rollPivot??0)*(1-low)};
    const h=bodyPoint(side?249:303,side?277:279,hip,pelvisRotation),lever=foot.rollPivot??0,angle=foot.pitch;
    const ankle=point(foot.x+lever-lever*Math.cos(angle)+9.6*Math.sin(angle),foot.y-lever*Math.sin(angle)-9.6*Math.cos(angle)),knee=joint(h,ankle,37,42);
    legs[name]={hip:h,knee,ankle,foot};
  }
  const hand=arms.far.knuckle;
  return {hip,waist,neck,rotation,pelvisRotation,headRotation,face,arms,legs,attack:strength,extension,posture:{low,air,landing},travel,idle,time,accent,runWeight,source:'hero-run-v07',hand:{x:root.x+hand.x*root.scaleX,y:root.y+hand.y*root.scaleY}};
}
function path(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function paint(c,image,part){
  if(L[part]){const [x,y,w,h]=L[part];c.drawImage(image,x,y,w,h,x,y,w,h);}
  else{path(c,P[part]);c.clip();c.drawImage(image,0,0,460,455,0,0,460,455);}
}
function mapped(c,image,part,sourceA,sourceB,a,b,width=S){
  c.save();const sa=Math.atan2(sourceB.y-sourceA.y,sourceB.x-sourceA.x),ta=Math.atan2(b.y-a.y,b.x-a.x),ratio=Math.hypot(b.x-a.x,b.y-a.y)/Math.hypot(sourceB.x-sourceA.x,sourceB.y-sourceA.y);
  c.translate(a.x,a.y);c.rotate(ta);c.scale(ratio,width);c.rotate(-sa);c.translate(-sourceA.x,-sourceA.y);paint(c,image,part);c.restore();
}
function disc(c,p,r){c.fillStyle='#164b8a';c.beginPath();c.arc(p.x,p.y,r,0,TAU);c.fill();}
function drawLeg(c,image,l,far){
  mapped(c,image,far?'thighFar':'thighNear',far?point(205,552):point(213,52),far?point(281,880):point(250,393),l.hip,l.knee,far?.118:.13);
  mapped(c,image,far?'shinFar':'shinNear',far?point(593,580):point(590,84),far?point(577,923):point(575,429),l.knee,l.ankle,far?.104:.11);
  c.save();c.translate(l.ankle.x,l.ankle.y);c.rotate(l.foot.pitch);c.scale(far?.095:.1,.1);c.translate(far?-868:-861,far?-893:-409);paint(c,image,far?'bootFar':'bootNear');c.restore();
}
function drawArm(c,image,a,far){
  disc(c,a.shoulder,10);disc(c,a.elbow,6);
  mapped(c,image,'upper',point(1364,147),point(1340,423),a.shoulder,a.elbow,far?.104:.115);
  drawMappedPiece(c,image,[1267,527,182,315],point(1353,564),point(1368,831),a.elbow,a.wrist,far?.108:.12);
  if(a.thumbs>.3){
    c.save();c.translate(a.wrist.x,a.wrist.y);c.fillStyle='#1764a9';c.strokeStyle='#102f65';c.lineWidth=1.2;c.beginPath();c.roundRect(-3,-4,14,12,4);c.fill();c.stroke();
    c.beginPath();c.moveTo(0,-2);c.lineTo(2,-13);c.quadraticCurveTo(5,-17,7,-12);c.lineTo(6,0);c.fill();c.stroke();c.strokeStyle='#b4eaff';c.beginPath();c.moveTo(2,-11);c.lineTo(3,-5);c.moveTo(0,1);c.lineTo(7,1);c.stroke();c.restore();
  }else drawMappedPiece(c,image,[1267,817,182,165],point(1368,831),point(1373,949),a.wrist,a.knuckle,far?.095:.105);
}
export function drawArticulatedHero(c,pose,images){
  const a=pose.articulation,image=images[a.source],limbs=images['hero-limbs-v09'],root=pose.root;
  c.save();c.translate(root.x,root.y);c.scale(root.scaleX,root.scaleY);c.globalAlpha=root.alpha;
  const capeRoot=chestPoint(296,130,a.waist,a.rotation),capeAngle=a.rotation*(1-a.posture.low)*.45;
  c.save();c.translate(capeRoot.x,capeRoot.y);c.rotate(capeAngle);c.scale(S,S);c.translate(-296,-130);
  drawCape(c,image,P.cape,a);c.restore();
  drawArm(c,limbs,a.arms.far,true);drawLeg(c,limbs,a.legs.far,true);drawLeg(c,limbs,a.legs.near,false);
  c.save();c.translate(a.hip.x,a.hip.y);c.rotate(a.pelvisRotation);c.scale(S,S);c.translate(-hipSource.x,-hipSource.y);paint(c,image,'pelvis');c.restore();
  c.save();c.translate(a.waist.x,a.waist.y);c.rotate(a.rotation);c.scale(S,S);c.translate(-waistSource.x,-waistSource.y);paint(c,image,'torso');c.restore();
  c.save();c.translate(a.neck.x,a.neck.y);c.rotate(a.headRotation);c.scale(S,S);c.translate(-neckSource.x,-neckSource.y);paint(c,image,'head');c.restore();
  drawArm(c,limbs,a.arms.near,false);c.restore();
}
