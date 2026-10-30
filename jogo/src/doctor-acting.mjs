import {solveArm,blendPoint,drawMappedPiece} from './limb-geometry.mjs';import {drawRig} from './rig.mjs';
const point=(x,y)=>({x,y}),mod=(x,n)=>(x%n+n)%n;
const gestures={near:[[6,47],[40,0],[23,-38],[39,12],[4,44],[24,-32]],far:[[24,36],[36,18],[13,-39],[38,8],[24,36],[33,-8]]};
function gesture(name,time){
  const poses=gestures[name],phase=mod(time/.62,poses.length),i=Math.floor(phase),u=phase-i;
  const coords=[0,1].map(j=>{const a=poses[mod(i-1,poses.length)][j],b=poses[i][j],c=poses[(i+1)%poses.length][j],d=poses[(i+2)%poses.length][j];return .5*(2*b+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);});return point(...coords);
}
export function sampleDoctorArms(time,{command=0,reaction=0,speaking=0,gesture:emphasis=0}={}){
  const result={};
  for(const [name,shoulder] of [['near',point(-24,-64)],['far',point(22,-63)]]){
    const near=name==='near',pose=gesture(name,time-(near?0:.09)),amplitude=.78+Math.max(speaking,emphasis)*.22;
    let target=point(shoulder.x+pose.x*amplitude,shoulder.y+pose.y*amplitude);
    target=blendPoint(target,point(shoulder.x+(near?51:34),shoulder.y+(near?-7:23)),command);
    target=blendPoint(target,point(shoulder.x+(near?13:38),shoulder.y+(near?-43:-28)),reaction);
    const arm=solveArm(shoulder,target,28,27);arm.pointing=near&&(command>.45||speaking>.6&&Math.sin(time*2.1)>.6);arm.handAngle=Math.atan2(arm.wrist.y-arm.elbow.y,arm.wrist.x-arm.elbow.x)+Math.sin(time*4.5-(near?.2:.5))*(.07+speaking*.09);
    result[name]=arm;
  }return result;
}
function drawArm(c,arm,images,far){
  const body=images['doctor-body-v03'],face=images['doctor-face-v03'];
  drawMappedPiece(c,body,far?[591,665,404,316]:[1103,115,250,215],far?point(844,641):point(1194,111),far?point(675,881):point(1315,303),arm.shoulder,arm.elbow,far?.065:.075);
  const sleeve=point(arm.shoulder.x,arm.shoulder.y+28);
  drawMappedPiece(c,body,far?[700,549,295,155]:[1103,18,250,150],far?point(844,641):point(1194,111),far?point(675,881):point(1315,303),arm.shoulder,sleeve,far?.065:.075);
  drawMappedPiece(c,body,far?[1119,550,358,300]:[142,575,307,247],far?point(1200,605):point(350,630),far?point(1300,840):point(263,809),arm.elbow,arm.wrist,far?.065:.075);
  const length=arm.pointing?25:16,tip=point(arm.wrist.x+Math.cos(arm.handAngle)*length,arm.wrist.y+Math.sin(arm.handAngle)*length);
  drawMappedPiece(c,face,arm.pointing?[540,625,510,268]:[1082,529,430,423],arm.pointing?point(600,780):point(1195,875),arm.pointing?point(1000,678):point(1325,700),arm.wrist,tip,far?.052:.058);
}
export function drawDoctor(c,doctor,rig,images,{crash=0}={}){
  const torso=doctor.nodes.find(n=>n.id==='torso'),root=doctor.root,hidden=new Set(['nearUpperArm','nearForearm','farUpperArm','farForearm','pointHand']);
  const core=doctor.nodes.map(n=>hidden.has(n.id)?{...n,alpha:0}:n.id==='torso'?{...n,frameId:null}:n.id==='head'?{...n,rotation:n.rotation+crash*.2}:n.id==='mouth'?{...n,alpha:Math.max(n.alpha,crash)}:n);
  const arms=crash>0?sampleDoctorArms(doctor.time,{reaction:crash,speaking:1}):doctor.arms;
  const transform=()=>{c.translate(root.x,root.y);c.scale(root.scale??1,root.scale??1);c.globalAlpha=root.alpha??1;c.rotate(torso.rotation);};
  const draw=far=>{c.save();transform();drawArm(c,arms[far?'far':'near'],images,far);c.restore();};
  draw(true);
  c.save();transform();const f=rig.frames.torso;c.scale(f.displayW/f.w,f.displayH/f.h);c.translate(-f.x-f.pivotX,-f.y-f.pivotY);
  // Remove the baked shoulder stubs; the articulated sleeves occupy these joints.
  const outline=[[715,22],[884,22],[900,90],[952,108],[937,210],[944,360],[989,530],[610,530],[647,360],[674,232],[672,117],[704,99]];
  c.beginPath();outline.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
  c.drawImage(images[f.image],f.x,f.y,f.w,f.h,f.x,f.y,f.w,f.h);
  c.restore();drawRig(c,rig,core,images,root);draw(false);
}
