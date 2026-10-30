export const PUNCH_STRIKE_DELAY=.065;
export function createRunner({x=410,y=560}={}){
  return {x,y,w:52,h:120,vy:0,grounded:true,coyoteUntil:-1,bufferUntil:-1,duckUntil:-1,punchUntil:-1,punchReadyAt:-1,landedAt:-1,jumpedAt:-1,airborneAt:-1,duckedAt:-1,punchedAt:-1,stoodAt:-1};
}
export function overlaps(r,b){return r.x+r.w/2>b.x&&r.x-r.w/2<b.x+b.w&&r.y>b.y&&r.y-r.h<b.y+b.h;}
export function stepRunner(r,action,{dt,time,groundY=560,ceiling=false}){
  const n={...r};
  if(n.grounded&&Number.isFinite(groundY)&&n.y>=groundY-1)n.coyoteUntil=time+.1;
  else if(n.grounded){n.grounded=false;n.airborneAt=time;}
  if(action?.type==='jump')n.bufferUntil=time+.1;
  if(action?.type==='duck'&&n.grounded){n.duckUntil=time+.65;if(n.h!==64||n.duckedAt<0)n.duckedAt=time;}
  if(action?.type==='punch'&&time>=n.punchReadyAt){n.punchUntil=time+.22;n.punchReadyAt=time+.35;n.punchedAt=time;}
  n.h=time<n.duckUntil||ceiling?64:120;
  const jump=()=>{n.vy=-650;n.grounded=false;n.bufferUntil=-1;n.coyoteUntil=-1;n.duckUntil=-1;n.h=120;n.jumpedAt=time;n.airborneAt=time;};
  if(n.bufferUntil>=time&&(n.grounded||n.coyoteUntil>=time)&&!ceiling)jump();
  n.vy+=1800*dt;n.y+=n.vy*dt;
  if(n.y>=groundY&&n.vy>=0){if(!n.grounded)n.landedAt=time;n.y=groundY;n.vy=0;n.grounded=true;if(n.bufferUntil>=time&&!ceiling)jump();}
  if(r.h===64&&n.h!==64)n.stoodAt=time;
  return n;
}
