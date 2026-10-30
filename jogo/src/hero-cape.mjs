const clamp=x=>Math.max(0,Math.min(1,x));
// A wave travels from the pinned shoulder towards the free hem. The same
// continuous deformation maps every vertex, including shared panel edges.
export function capePoint(x,y,{time=0,runWeight=1,posture={},extension=0}={}){
  const u=clamp((296-x)/266),low=posture.low??0,air=posture.air??0,landing=posture.landing??0;
  const phase=time*(2.6+runWeight*4.1)-u*5.6,v=clamp((y-110)/145);
  const flutter=(Math.sin(phase)*(10+runWeight*19)+Math.sin(phase*1.31-u*1.4)*5+Math.sin(time*1.8-u*2.4)*8)*u**1.4;
  const billow=Math.sin(phase-1.3+v*2.4)*13*u*v;
  const lift=(-runWeight*25-air*24-low*24-extension*15+landing*19)*u*u;
  return {x:296+(x-296)*(1+Math.sin(phase-.7)*.045*u),y:130+(y-130)*(1-low*.3)+flutter+billow+lift};
}
const textures=new WeakMap();
function capeTexture(c,image,outline){
  if(textures.has(image))return textures.get(image);
  const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(460,455):typeof document!=='undefined'?Object.assign(document.createElement('canvas'),{width:460,height:455}):c.canvas&&typeof c.canvas==='object'?new c.canvas.constructor(460,455):null;
  if(!canvas)return null;
  const target=canvas.getContext('2d');target.beginPath();outline.forEach(([x,y],i)=>i?target.lineTo(x,y):target.moveTo(x,y));target.closePath();target.clip();target.drawImage(image,0,0,460,455,0,0,460,455);textures.set(image,canvas);return canvas;
}
function triangle(c,image,outline,s,d,texture){
  const [a,b,e]=s,[p,q,r]=d,det=(b.x-a.x)*(e.y-a.y)-(e.x-a.x)*(b.y-a.y);
  const xx=((q.x-p.x)*(e.y-a.y)-(r.x-p.x)*(b.y-a.y))/det,xy=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(e.x-a.x))/det;
  const yx=((q.y-p.y)*(e.y-a.y)-(r.y-p.y)*(b.y-a.y))/det,yy=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(e.x-a.x))/det;
  const center={x:(p.x+q.x+r.x)/3,y:(p.y+q.y+r.y)/3};
  c.save();c.beginPath();d.forEach((v,i)=>{const dx=v.x-center.x,dy=v.y-center.y,l=Math.hypot(dx,dy),x=v.x+dx/l*.35,y=v.y+dy/l*.35;i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.clip();
  c.transform(xx,yx,xy,yy,p.x-xx*a.x-xy*a.y,p.y-yx*a.x-yy*a.y);
  if(!texture){c.beginPath();outline.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();}
  c.drawImage(texture??image,0,0,460,455,0,0,460,455);c.restore();
}
export function drawCape(c,image,outline,pose){
  const count=16,rows=3,texture=capeTexture(c,image,outline);
  for(let i=0;i<count;i++)for(let row=0;row<rows;row++){
    const x=30+266*i/count,next=30+266*(i+1)/count,y=95+160*row/rows,bottom=95+160*(row+1)/rows,s=[{x,y},{x:next,y},{x:next,y:bottom},{x,y:bottom}],d=s.map(p=>capePoint(p.x,p.y,pose));
    triangle(c,image,outline,[s[0],s[1],s[2]],[d[0],d[1],d[2]],texture);triangle(c,image,outline,[s[0],s[2],s[3]],[d[0],d[2],d[3]],texture);
  }
  c.save();c.beginPath();outline.map(([x,y])=>capePoint(x,y,pose)).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();
  for(let i=0;i<3;i++){const x=80+i*65,a=capePoint(x,100,pose),b=capePoint(x-15,175,pose),d=capePoint(x-3,255,pose);c.strokeStyle=i%2?'#e6f8ff24':'#071c4c25';c.lineWidth=10;c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(b.x,b.y,d.x,d.y);c.stroke();}c.restore();
}
