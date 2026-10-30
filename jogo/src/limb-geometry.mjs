export const mix=(a,b,u)=>a+(b-a)*u;
export const blendPoint=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u)});
export function solveArm(shoulder,target,upper=31,fore=27,bend=-1){
  const dx=target.x-shoulder.x,dy=target.y-shoulder.y,length=Math.max(.0001,Math.hypot(dx,dy));
  const d=Math.max(Math.abs(upper-fore)+.05,Math.min(upper+fore-.12,length)),wrist={x:shoulder.x+dx*d/length,y:shoulder.y+dy*d/length};
  const angle=Math.atan2(dy,dx),along=(upper*upper-fore*fore+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
  return {shoulder,elbow:{x:shoulder.x+Math.cos(angle)*along+bend*Math.sin(angle)*height,y:shoulder.y+Math.sin(angle)*along-bend*Math.cos(angle)*height},wrist};
}
// Register the painted segment's own axis, rather than assuming it points down.
export function drawMappedPiece(c,image,box,sourceA,sourceB,a,b,width){
  const sourceAngle=Math.atan2(sourceB.y-sourceA.y,sourceB.x-sourceA.x),angle=Math.atan2(b.y-a.y,b.x-a.x),ratio=Math.hypot(b.x-a.x,b.y-a.y)/Math.hypot(sourceB.x-sourceA.x,sourceB.y-sourceA.y);
  c.save();c.translate(a.x,a.y);c.rotate(angle);c.scale(ratio,width);c.rotate(-sourceAngle);c.translate(-sourceA.x,-sourceA.y);c.drawImage(image,...box,...box);c.restore();
}
