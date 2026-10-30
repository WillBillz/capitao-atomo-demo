export function animationFrame(r,time){
  if(time<r.punchUntil){const elapsed=.22-(r.punchUntil-time);return {atlas:'actions',index:elapsed<.045?3:elapsed<.17?4:5};}
  if(r.h===64)return {atlas:'actions',index:2};
  if(!r.grounded)return {atlas:'actions',index:r.vy<0?0:1};
  return {atlas:'run',index:Math.floor(time*11)%6};
}
export function canvasSize(width,height,dpr=1,mobile=false){
  const effective=Math.min(dpr,mobile?1.5:2,2048/Math.max(1,width));
  return {width:Math.round(width*effective),height:Math.round(height*effective),dpr:effective};
}
