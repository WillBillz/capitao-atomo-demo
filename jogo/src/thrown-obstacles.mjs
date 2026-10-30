import {objectRect} from './stage.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
const hermite=(a,b,va,vb,u,duration)=>(2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*va*duration+(-2*u**3+3*u*u)*b+(u**3-u*u)*vb*duration;
export function obstacleLaunch(o,stage){return stage.sceneEvents.find(e=>e.kind==='warning'&&(e.payload.objectId===o.id||e.payload.contactAt===o.at));}
export function sampleThrownObstacle(o,stage,time,origin={x:260,y:330}){
  const warning=obstacleLaunch(o,stage),rect=objectRect(o,time),center={x:rect.x+rect.w/2,y:rect.y+rect.h/2};
  if(!warning)return {visible:o.type==='prism',flying:false,center,rect,rotation:0,scale:1,warning:false};
  const fire=warning.payload.fireAt,land=fire+.45;
  if(time<fire)return {visible:false,flying:false,center,rect,rotation:0,scale:1,warning:time>=warning.at};
  if(time>=land)return {visible:true,flying:false,center,rect,rotation:0,scale:1,warning:false,landedAt:land};
  const duration=.45,u=clamp((time-fire)/duration),target=objectRect(o,land),arrival={x:target.x+target.w/2,y:target.y+target.h/2};
  // Accelerate out of the dock, then match the moving track without snapping velocity.
  const speed=(objectRect(o,land).x-objectRect(o,land+.01).x)/.01;
  const p={x:hermite(origin.x,arrival.x,0,-speed,u,duration),y:hermite(origin.y,arrival.y,0,0,u,duration)-60*Math.sin(Math.PI*u)**2};
  const smooth=u*u*(3-2*u),startScale=50/o.w;
  return {visible:true,flying:true,center:p,rect:{...rect,x:p.x-rect.w/2,y:p.y-rect.h/2},rotation:Math.sin(Math.PI*u)**2*.15,scale:startScale+(1-startScale)*smooth,warning:false};
}
