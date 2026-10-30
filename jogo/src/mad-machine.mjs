const TAU=Math.PI*2;
const sprites=new WeakMap(),parts=[
  {id:'head',pivot:[478,373],points:[[428,92],[509,92],[524,223],[563,246],[583,290],[580,337],[557,362],[468,374],[374,362],[338,341],[349,291],[369,242],[421,226]]},
  {id:'left',pivot:[235,770],points:[[182,720],[264,736],[305,824],[297,892],[259,941],[290,1014],[260,1114],[191,1239],[55,1252],[0,1198],[0,1072],[72,1022],[65,929],[106,881],[131,788]]},
  {id:'right',pivot:[860,746],points:[[803,713],[918,716],[954,781],[1008,816],[1008,1176],[963,1238],[851,1241],[754,1190],[704,1130],[730,1040],[741,934],[769,881]]}
];
function machineSprites(c,image){
  if(sprites.has(image))return sprites.get(image);
  if(typeof OffscreenCanvas!=='function'&&typeof document==='undefined'&&typeof c.canvas!=='object')return {body:image,parts:[]};
  const make=()=>typeof OffscreenCanvas==='function'?new OffscreenCanvas(image.width,image.height):typeof document!=='undefined'?Object.assign(document.createElement('canvas'),{width:image.width,height:image.height}):new c.canvas.constructor(image.width,image.height);
  const body=make(),b=body.getContext('2d');b.drawImage(image,0,0);const result={body,parts:[]};
  for(const part of parts){const canvas=make(),p=canvas.getContext('2d');for(const target of [b,p]){target.save();target.beginPath();part.points.forEach(([x,y],i)=>i?target.lineTo(x,y):target.moveTo(x,y));target.closePath();if(target===b){target.globalCompositeOperation='destination-out';target.fill();}else{target.clip();target.drawImage(image,0,0);}target.restore();}result.parts.push({...part,canvas});}
  sprites.set(image,result);return result;
}
export function sampleMadMachine(time){return {head:Math.sin(time*1.8)*.065-.025,left:Math.sin(time*2.6-.8)*.055,right:Math.sin(time*2.3+1.2)*-.06,pressure:.5+.5*Math.sin(time*3.6),tread:time*2.8};}
export function drawMadMachine(c,image,b,time,{effects=true}={}){
  if(!image||b.x>1450||b.x+b.w< -200)return;
  const width=344,height=536,cx=b.x+b.w/2,ground=560;
  c.save();c.translate(cx,ground);c.rotate(Math.sin(time*2.3)*.004);c.scale(1+Math.sin(time*3.6)*.006,1+Math.sin(time*3.6-.8)*.004);
  const art=machineSprites(c,image),motion=sampleMadMachine(time),sx=width/image.width,sy=height/image.height;
  c.drawImage(art.body,0,0,image.width,image.height,-width/2,-height,width,height);
  for(const part of art.parts){const px=-width/2+part.pivot[0]*sx,py=-height+part.pivot[1]*sy;c.save();c.translate(px,py);c.rotate(motion[part.id]);c.translate(-px,-py);c.drawImage(part.canvas,0,0,image.width,image.height,-width/2,-height,width,height);c.restore();}
  for(const [i,point] of [[205,1370],[605,1360],[904,1376]].entries()){
    const x=-width/2+point[0]*sx,y=-height+point[1]*sy;c.save();c.translate(x,y);c.rotate(motion.tread);c.strokeStyle='#d3b77799';c.lineWidth=1.4;for(let j=0;j<3;j++){c.rotate(TAU/3);c.beginPath();c.moveTo(4,0);c.lineTo(i===2?13:19,0);c.stroke();}c.restore();
  }
  // Reactor rotation, pressure and exhaust bring the painted machine to life.
  if(effects){
    c.save();c.globalCompositeOperation='screen';
    const rx=9,ry=-height*.59,power=.22+.13*Math.sin(time*5)**2,g=c.createRadialGradient(rx,ry,3,rx,ry,55);g.addColorStop(0,'#cfffff');g.addColorStop(.4,'#75f4ff88');g.addColorStop(1,'#38d5ff00');c.globalAlpha=power;c.fillStyle=g;c.fillRect(rx-55,ry-55,110,110);
    c.globalAlpha=.6;c.strokeStyle='#caffff';c.lineWidth=1.3;
    for(let i=0;i<3;i++){const a=time*2+i*TAU/3;c.beginPath();c.ellipse(rx,ry,32,24,a,a+.12,a+1.5);c.stroke();}
    for(let i=0;i<8;i++){const u=((time*.8+i/8)%1+1)%1;c.globalAlpha=(1-u)*.22;c.fillStyle='#d6f6ff';c.beginPath();c.ellipse(width*.26+u*23,-height*.86-u*52,4+u*13,3+u*8,-.4,0,TAU);c.fill();}
    c.restore();
  }
  c.restore();
  if(effects){c.save();c.globalAlpha=.18;c.fillStyle='#9bf0ff';c.beginPath();c.ellipse(cx,557,110,4,0,0,TAU);c.fill();c.restore();}
}
