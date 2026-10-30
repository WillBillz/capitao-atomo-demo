// Energy is registered to the painting, never to the camera or the hero.
// Everything uses song time: pause and seeking reproduce exactly the same scene.
const TAU=Math.PI*2,mod=(x,n)=>(x%n+n)%n;
function halo(c,x,y,r,color,alpha=1){
  c.save();c.globalAlpha*=alpha;
  const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
}
function orb(c,x,y,r,color){
  halo(c,x,y,r*4,color,.55);c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
  c.fillStyle='#f1fdff';c.beginPath();c.arc(x-r*.2,y-r*.2,r*.4,0,TAU);c.fill();
}
function reactor(c,t,energy,effects){
  c.save();c.translate(447,267);
  const breath=.5+.5*Math.sin(t*1.65);
  halo(c,0,0,177,'#497dfb',.10+breath*.15+energy*.14);
  halo(c,-20,10,103,'#9b72ff',.08+breath*.16+energy*.12);
  // Distinct tilted orbits revolve inside the painted brass ring.
  for(let i=0;i<3;i++){
    c.save();c.rotate(i*1.04+Math.sin(t*.26+i)*.22);c.scale(1,.32+i*.12);
    const a=t*(.7+i*.19)+i*2.1;
    c.strokeStyle=i%2?'#c3a7ff70':'#8eeeff65';c.lineWidth=2.1;c.beginPath();c.ellipse(0,0,139,126,0,a,a+TAU*.77);c.stroke();
    orb(c,Math.cos(a)*139,Math.sin(a)*126,3.8+i*.6,i%2?'#caacff':'#9df4ff');c.restore();
  }
  if(effects)for(let i=0;i<12;i++){
    const a=t*(.2+i%3*.08)+i*2.4,r=40+i*8;
    c.globalAlpha=.3+.35*Math.sin(t*1.2+i)**2;
    c.fillStyle=i%3?'#b3f4ff':'#d6b2ff';c.beginPath();c.arc(Math.cos(a)*r,Math.sin(a)*r*.78,1.3+i%2,0,TAU);c.fill();
  }
  c.restore();
}
function coil(c,x,y,h,t,phase,effects,energy){
  c.save();c.translate(x,y);
  halo(c,0,h*.5,h*.62,'#697cff',.07+(.5+.5*Math.sin(t*1.8+phase))*.1+energy*.1);
  // Flow travels up the existing glass column; it never flashes on/off.
  c.beginPath();c.rect(-24,0,48,h);c.clip();
  const count=effects?6:3;
  for(let j=0;j<count;j++){
    const u=mod(t*.21+j/count+phase,1),yy=h*(1-u),rx=10+8*Math.sin(u*Math.PI);
    c.globalAlpha=Math.sin(u*Math.PI)*.8;c.strokeStyle=j%2?'#c8b9ff':'#97efff';c.lineWidth=2;
    c.beginPath();c.ellipse(0,yy,rx,4,Math.sin(t*.4+j)*.2,0,TAU);c.stroke();
    if(effects)halo(c,0,yy,22,'#8cdfff',.28);
  }
  c.restore();
}
function conduits(c,t,energy){
  // Coordinates follow pipes and bridge cables already present in the painting.
  for(const [i,points] of [
    [[455,505],[475,555],[535,520],[575,582]],
    [[730,150],[755,230],[810,252],[842,285]],
    [[1050,468],[1140,444],[1250,427],[1340,397]],
    [[1560,485],[1650,460],[1670,520],[1720,560]]
  ].entries()){
    const [a,b,d,e]=points;
    c.strokeStyle='#75dbf12b';c.lineWidth=3;c.beginPath();c.moveTo(...a);c.bezierCurveTo(...b,...d,...e);c.stroke();
    for(let j=0;j<3;j++){
      const u=mod(t*.23+j/3+i*.17,1),v=1-u;
      const x=v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*d[0]+u*u*u*e[0];
      const y=v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*d[1]+u*u*u*e[1];
      orb(c,x,y,2.3+energy, i%2?'#dbc4ff':'#8bf0ff');
    }
  }
}
export function transformBackdropPlane(c,b){
  c.translate(b.x+(b.mirrored?b.width:0),b.y);c.scale((b.mirrored?-1:1)*b.width/b.frame.w,b.height/b.frame.h);
  c.beginPath();c.rect(0,0,b.frame.w,b.frame.h);c.clip();
}
export function drawLaboratoryLife(c,scene){
  if(!scene.backdrop)return;
  const t=scene.time,music=scene.music?.accent??0,energy=Math.min(1,scene.reactive.energy+music*.65),effects=scene.effects;
  for(const b of scene.backdrops??[scene.backdrop]){
  c.save();transformBackdropPlane(c,b);
  c.globalCompositeOperation='screen';
  reactor(c,t,energy,effects);
  for(const [i,v] of [[440,552,123],[1001,254,155],[1658,152,205],[2000,173,128],[1302,397,141]].entries())coil(c,...v,t,i*.7,effects,energy);
  if(effects){
    conduits(c,t,energy);
    for(const [i,point] of [[790,340],[1410,360],[1910,315]].entries()){
      c.save();c.globalCompositeOperation='source-over';c.globalAlpha=.8;c.translate(...point);c.rotate(t*(i%2?-.7:.6));const metal=c.createLinearGradient(-50,-58,45,58);metal.addColorStop(0,'#d5b778');metal.addColorStop(.25,'#7b6747');metal.addColorStop(.6,'#253c49');metal.addColorStop(1,'#af8a50');c.strokeStyle='#b49a67';c.lineWidth=2;
      c.beginPath();for(let tooth=0;tooth<48;tooth++){const a=tooth*TAU/48,r=tooth%2?50:58,x=Math.cos(a)*r,y=Math.sin(a)*r;tooth?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fillStyle=metal;c.fill();c.stroke();c.fillStyle='#112b3d';c.beginPath();c.arc(0,0,39,0,TAU);c.fill();
      c.strokeStyle='#b7cfd566';c.lineWidth=3;c.beginPath();c.arc(0,0,34,0,TAU);c.stroke();
      for(let blade=0;blade<4;blade++){c.rotate(TAU/4);c.beginPath();c.moveTo(10,0);c.quadraticCurveTo(24,-22,40,-4);c.quadraticCurveTo(28,12,10,0);c.fillStyle='#7499ad55';c.fill();}orb(c,0,0,4,'#baf8ff');c.restore();
    }
    // Musical accents push energy through apparatus behind the actors.
    for(let i=0;i<3;i++){const x=620+i*420,u=mod(t*.36+i*.27,1);c.save();c.globalAlpha=(.08+music*.17)*Math.sin(Math.PI*u);c.strokeStyle='#abf2ff';c.lineWidth=2;c.beginPath();c.ellipse(x,300,30+u*110,14+u*52,.3,0,TAU);c.stroke();c.restore();}
    // Warm shafts breathe and drift very slowly through the remote upper hall.
    for(let i=0;i<3;i++){
      c.save();c.translate(1660+i*170+Math.sin(t*.18+i)*22,90);c.rotate(.35);c.scale(.25,1);
      halo(c,0,200,300,'#ffe1a4',.06+Math.sin(t*.5+i)**2*.04);c.restore();
    }
  }
  c.restore();
  }
  if(effects){
    c.save();c.globalCompositeOperation='screen';
    for(const [i,p] of scene.particles.entries()){
      if(p.y>535)continue;
      const x=p.x+Math.sin(t*.8+i)*8,y=p.y-Math.sin(t*.47+i)*12;
      c.globalAlpha=p.alpha*.75;c.fillStyle=i%4?'#a6e4f5':'#ffe0a7';
      c.beginPath();c.ellipse(x,y,p.r*.65,p.r*.65,0,0,TAU);c.fill();
      if(i%7===0)halo(c,x,y,12,'#a9e9ff',.35);
    }
    // Low drifting vapour stays behind the catwalk and all actors.
    for(let i=0;i<4;i++){
      const x=mod(i*470-t*22-scene.cameraX*.045,1880)-300;
      c.save();c.translate(x,480+Math.sin(t*.65+i)*10);c.scale(2.7,.28);
      halo(c,0,0,145,'#8ec8e1',.09);c.restore();
    }
    c.restore();
  }
}
export function drawHomeLaboratoryLife(c,time,effects){
  c.save();c.globalCompositeOperation='screen';
  const x=1145,y=203;
  halo(c,x,y,113,'#65dfff',.16+Math.sin(time*.9)**2*.1);
  c.save();c.translate(x,y);
  for(let i=0;i<2;i++){
    c.save();c.rotate(time*.26+i*1.4);c.scale(1,.54);
    c.strokeStyle='#bcf6ff80';c.lineWidth=1.4;c.beginPath();c.ellipse(0,0,72,72,0,0,TAU);c.stroke();
    orb(c,Math.cos(time*.7+i*3)*72,Math.sin(time*.7+i*3)*72,2.5,'#c9f9ff');c.restore();
  }c.restore();
  if(effects){
    for(const xx of [499,887]){
      c.save();c.translate(xx,271);c.rotate(time*.35);c.strokeStyle='#91e9ff65';c.lineWidth=1;
      for(let i=0;i<3;i++){c.rotate(TAU/3);c.beginPath();c.ellipse(0,0,21,8,0,0,TAU);c.stroke();}c.restore();
    }
    for(let i=0;i<14;i++){
      const xx=mod(i*137+time*7,1280),yy=130+i*23+Math.sin(time*.6+i)*9;
      c.globalAlpha=.15+Math.sin(time*.8+i)**2*.2;c.fillStyle='#fff0c4';c.beginPath();c.arc(xx,yy,1+i%2*.5,0,TAU);c.fill();
    }
  }c.restore();
}
