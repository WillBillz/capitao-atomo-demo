const IDENTITY=[1,0,0,1,0,0];
const multiply=(p,m)=>[
  p[0]*m[0]+p[2]*m[1],p[1]*m[0]+p[3]*m[1],
  p[0]*m[2]+p[2]*m[3],p[1]*m[2]+p[3]*m[3],
  p[0]*m[4]+p[2]*m[5]+p[4],p[1]*m[4]+p[3]*m[5]+p[5]
];
function local(n){const c=Math.cos(n.rotation??0),s=Math.sin(n.rotation??0),sx=n.scaleX??1,sy=n.scaleY??1;return[c*sx,s*sx,-s*sy,c*sy,n.x??0,n.y??0];}
export function validateRig(rig,images){
  if(!rig?.frames||!Array.isArray(rig.bones))throw Error('Rig sem peças ou ossos.');
  for(const [id,f] of Object.entries(rig.frames)){
    const img=images[f.image];if(!img)throw Error('Imagem do atlas ausente: '+f.image);
    for(const key of ['x','y','w','h','pivotX','pivotY','displayW','displayH'])if(!Number.isFinite(f[key]))throw Error('Valor não finito no recorte '+id+': '+key);
    if(f.x<0||f.y<0||f.w<=0||f.h<=0||f.displayW<=0||f.displayH<=0||f.x+f.w>img.width||f.y+f.h>img.height)throw Error('Recorte fora do atlas: '+id);
  }
  const bones=new Map();
  for(const b of rig.bones){
    if(bones.has(b.id))throw Error('Osso duplicado: '+b.id);bones.set(b.id,b);
    for(const key of ['x','y','rotation','z'])if(!Number.isFinite(b[key]))throw Error('Valor não finito no osso '+b.id+': '+key);
    if(b.frameId&&!rig.frames[b.frameId])throw Error('Peça ausente: '+b.frameId);
  }
  const visited=new Set(),visiting=new Set();
  function visit(id){
    if(visiting.has(id))throw Error('Ciclo no rig: '+id);if(visited.has(id))return;
    const b=bones.get(id);if(!b)throw Error('Pai ausente: '+id);
    visiting.add(id);if(b.parent)visit(b.parent);visiting.delete(id);visited.add(id);
  }
  for(const b of rig.bones)visit(b.id);return true;
}
export function resolveRig(rig,nodes=[]){
  const changes=new Map(nodes.map(n=>[n.id,n])),bones=new Map(rig.bones.map(b=>[b.id,b])),resolved=new Map();
  function resolve(id){
    if(resolved.has(id))return resolved.get(id);
    const n={...bones.get(id),...changes.get(id)},p=n.parent?resolve(n.parent):{matrix:IDENTITY,alpha:1};
    const part={id,frame:rig.frames[n.frameId],matrix:multiply(p.matrix,local(n)),alpha:p.alpha*(n.alpha??1),z:n.z??0};
    resolved.set(id,part);return part;
  }
  for(const b of rig.bones)resolve(b.id);
  return [...resolved.values()].sort((a,b)=>a.z-b.z);
}
export function drawRig(c,rig,nodes,images,root={}){
  c.save();c.translate(root.x??0,root.y??0);c.scale(root.scaleX??root.scale??1,root.scaleY??root.scale??1);
  for(const p of resolveRig(rig,nodes)){
    if(!p.frame||p.alpha<=0)continue;
    const f=p.frame,sx=f.displayW/f.w,sy=f.displayH/f.h;
    c.save();c.globalAlpha=(root.alpha??1)*p.alpha;c.transform(...p.matrix);
    if(f.clipEllipse){const [x,y,rx,ry]=f.clipEllipse;c.beginPath();c.ellipse((x-f.pivotX)*sx,(y-f.pivotY)*sy,rx*sx,ry*sy,0,0,Math.PI*2);c.clip();}
    c.drawImage(images[f.image],f.x,f.y,f.w,f.h,-f.pivotX*sx,-f.pivotY*sy,f.displayW,f.displayH);c.restore();
  }
  c.restore();
}
