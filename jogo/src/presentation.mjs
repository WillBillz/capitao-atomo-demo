const clamp=value=>Math.max(0,Math.min(1,value));
const identity=()=>({x:0,y:0,scaleX:1,scaleY:1,rotation:0});
// Presentation is a pure projection of the music clock; hitboxes never use it.
export function bodyTransform(r,time,effects=true){
  const pose=identity();if(!effects)return pose;
  if(time<r.punchUntil){const p=clamp((time-r.punchUntil+.22)/.22);pose.x=-3*Math.sin(p*Math.PI*2);pose.rotation=.012*Math.sin(p*Math.PI);return pose;}
  if(r.h===64){pose.x=2*Math.sin(time*14);return pose;}
  if(!r.grounded){pose.rotation=Math.max(-.035,Math.min(.035,(r.vy||0)/13000));return pose;}
  const since=time-r.landedAt;
  if(r.landedAt>=0&&since>=0&&since<.16){const e=Math.sin(since/.16*Math.PI);pose.scaleX=1+.07*e;pose.scaleY=1-.06*e;return pose;}
  pose.y=-1.8*(1-Math.cos(time*11/3*Math.PI*2))/2;
  pose.rotation=.007*Math.sin(time*11/3*Math.PI);
  return pose;
}
export function punchVisual(r,time){
  if(!(time<r.punchUntil))return null;
  const age=time-(r.punchedAt??r.punchUntil-.22);if(age<.055)return null;
  const progress=clamp((age-.055)/.165),extension=clamp((age-.055)/.04),release=extension*extension*(3-2*extension);
  return {progress,alpha:Math.sin(Math.PI*(.08+progress*.88)),reach:48+132*release,thickness:5+21*Math.sin(progress*Math.PI)};
}
export function burstVisual(at,time,duration=.45){
  const age=time-at;if(at<0||age<0||age>=duration)return null;
  const progress=age/duration;return {progress,radius:12+progress*72,alpha:(1-progress)**2};
}
export function shipImageKey(expression){return expression==='perplexed'?'shipSurprised':['indignant','flustered'].includes(expression)?'shipAnnoyed':'ship';}
