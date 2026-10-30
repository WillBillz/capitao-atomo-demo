import {RUN_SPEED} from './pace.mjs';
const TAU=Math.PI*2,mod=(x,n)=>(x%n+n)%n;
export function sampleAirflow(r,pose,time,{effects=true,accent=0}={}){
  const root=pose.root,sx=root.scaleX??1,sy=root.scaleY??1,low=pose.low??0;
  const anchor={x:root.x+pose.face.x*sx-6,y:root.y+(pose.face.y+34)*sy};
  if(!effects)return {anchor,curves:[],streaks:[],alpha:0,time};
  const tilt=r.grounded?0:Math.max(-13,Math.min(13,(r.vy??0)*.025)),curves=[];
  const paths=[
    [50,2,48,-22,2,-32,-130,-17],
    [49,8,38,32,-17,48-low*12,-148,33-low*12],
    [-15,-24,-55,-39,-110,-18,-175,-30],
    [-20,39-low*18,-75,52-low*18,-110,30,-181,41-low*18]
  ];
  for(const [i,p] of paths.entries())curves.push({points:p.map((v,j)=>j%2?anchor.y+(v+tilt*j/7)*sy:anchor.x+v*sx),phase:mod(time*RUN_SPEED*.75+i*51,124),alpha:(i<2?.34:.20)*(.85+accent*.15),front:i<2});
  const age=time-(r.punchedAt??-1),punch= r.punchedAt>=0&&age>=.035&&age<.24?Math.sin(Math.PI*(age-.035)/.205):0;
  const streaks=[];
  for(let i=0;i<7;i++){
    const u=mod(time*(r.grounded?3.6:4.2)+i/7,1),flight=r.grounded?0:tilt;
    streaks.push({x:root.x+(-24-u*160)*sx,y:root.y+(-125+i*19+Math.sin(time*4+i)*6+flight)*sy,length:(20+u*42)*sx,alpha:Math.sin(Math.PI*u)*(.24+accent*.1)});
  }
  return {anchor,curves,streaks,slide:r.grounded&&low>0?{x:root.x,y:root.y,weight:low,phase:mod(time*4,1)}:null,punch:punch>0?{x:pose.hand.x,y:pose.hand.y,energy:punch,progress:(age-.035)/.205}:null,alpha:root.alpha??1,time};
}
function cubic(p,u){const q=1-u;return{x:q*q*q*p[0]+3*q*q*u*p[2]+3*q*u*u*p[4]+u*u*u*p[6],y:q*q*q*p[1]+3*q*q*u*p[3]+3*q*u*u*p[5]+u*u*u*p[7]};}
export function drawAirflow(c,flow,{front=false}={}){
  c.save();c.lineCap='round';
  if(flow.slide){const s=flow.slide;c.globalAlpha=s.weight*flow.alpha*.5;c.strokeStyle='#b4f6ed';c.lineWidth=front?2.5:1.5;for(let i=0;i<3;i++){const x=s.x-45-i*34-s.phase*35,y=s.y-5-i*4;c.beginPath();c.moveTo(x-55,y);c.quadraticCurveTo(x-20,y-7,x+17,y-2);c.stroke();}if(front){c.globalAlpha*=.6;c.strokeStyle='#fff0ba';c.beginPath();c.ellipse(s.x+51,s.y-40,36,27,.15,-1.25,.65);c.stroke();}}
  if(!front)for(const streak of flow.streaks??[]){c.globalAlpha=streak.alpha*flow.alpha;c.strokeStyle='#c3f4ff';c.lineWidth=1.5;c.beginPath();c.moveTo(streak.x,streak.y);c.lineTo(streak.x-streak.length,streak.y+2);c.stroke();}
  if(front&&flow.punch){const p=flow.punch;c.globalAlpha=p.energy*flow.alpha*.75;c.strokeStyle='#fff0b7';c.lineWidth=2.5;c.beginPath();c.ellipse(p.x-8,p.y,12+p.progress*14,17+p.progress*24,-.18,Math.PI*.55,Math.PI*1.5);c.stroke();}
  for(const [i,curve] of flow.curves.entries()){
    if(curve.front!==front)continue;const p=curve.points;c.globalAlpha=curve.alpha*flow.alpha;
    if(front){
      c.beginPath();for(let k=0;k<=10;k++){const v=cubic(p,k*.032);k?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y);}
      c.globalAlpha=flow.alpha*.12;c.strokeStyle='#133148';c.lineWidth=4;c.stroke();c.globalAlpha=flow.alpha*.32;c.strokeStyle='#e5fbff';c.lineWidth=1.8;c.stroke();
    }
    c.globalAlpha=curve.alpha*flow.alpha;c.strokeStyle=i%2?'#b8f4ff':'#fff4cf';c.lineWidth=1.7;c.setLineDash([19,105]);c.lineDashOffset=-curve.phase;
    c.beginPath();c.moveTo(p[0],p[1]);c.bezierCurveTo(...p.slice(2));c.stroke();c.setLineDash([]);
    for(let j=0;j<2;j++){const u=mod(flow.time*2+i*.17+j*.5,1),v=cubic(p,u);c.globalAlpha=Math.sin(Math.PI*u)*curve.alpha*flow.alpha;c.fillStyle='#e5fcff';c.beginPath();c.ellipse(v.x,v.y,2.5,1.1,0,0,TAU);c.fill();}
  }c.restore();
}
