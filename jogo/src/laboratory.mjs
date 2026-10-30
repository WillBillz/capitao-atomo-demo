import {drawLaboratoryLife,transformBackdropPlane} from './laboratory-life.mjs';
const TAU=Math.PI*2,mod=(x,n)=>(x%n+n)%n;
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
export function drawLaboratory(c,scene,images,pass){
  const t=scene.time,cam=scene.cameraX;
  if(pass==='back'){
    c.fillStyle='#10253d';c.fillRect(0,0,1280,720);
    for(const b of scene.backdrops??(scene.backdrop?[scene.backdrop]:[])){const f=b.frame;c.save();transformBackdropPlane(c,b);c.drawImage(images[f.image],f.x,f.y,f.w,f.h,0,0,f.w,f.h);c.restore();}
    const shade=c.createLinearGradient(0,220,0,590);shade.addColorStop(0,'#11273b00');shade.addColorStop(1,'#0b1a3566');c.fillStyle=shade;c.fillRect(0,220,1280,370);
    drawLaboratoryLife(c,scene);
    // Moving apparatus lives between the painted hall and the playable catwalk.
    for(let i=0;i<4;i++){
      const anchor=mod(i*510-cam*.32,2040)-340,y=75+(i%2)*70,x=anchor+Math.sin(t*.85+i*1.7)*9;
      c.strokeStyle='#40637b';c.lineWidth=9;c.beginPath();c.moveTo(anchor,0);c.quadraticCurveTo(anchor,y*.55,x,y);c.stroke();c.strokeStyle='#d2a96a';c.lineWidth=2;c.stroke();
      const glass=c.createLinearGradient(x-35,0,x+35,0);glass.addColorStop(0,'#456474bb');glass.addColorStop(.18,'#1f455b99');glass.addColorStop(.75,'#14314cbb');glass.addColorStop(1,'#8ab3bc99');c.fillStyle=glass;c.beginPath();c.roundRect(x-35,y,70,166,26);c.fill();c.strokeStyle='#a78b60';c.lineWidth=3;c.stroke();
      for(const yy of [y+7,y+158]){c.fillStyle='#846e4c';c.beginPath();c.ellipse(x,yy,36,9,0,0,TAU);c.fill();c.strokeStyle='#d2b17a';c.lineWidth=2;c.stroke();}
      const liquid=c.createLinearGradient(0,y,0,y+160);liquid.addColorStop(0,'#53cee955');liquid.addColorStop(1,'#8659bf88');c.fillStyle=liquid;c.beginPath();c.roundRect(x-27,y+18,54,135,20);c.fill();
      for(let j=0;j<6;j++){const rise=mod(t*.25+j/6+i*.14,1);c.fillStyle='#aaf5fc99';c.beginPath();c.arc(x+Math.sin(t*1.2+j)*15,y+146-rise*123,2+j%2+(scene.music?.accent??0)*1.5,0,TAU);c.fill();}
      c.save();c.translate(x,y+78);c.scale(1,.34);c.rotate(t*.6+i);c.strokeStyle='#82d9ed99';c.lineWidth=3;c.beginPath();c.ellipse(0,0,51,28,0,0,TAU);c.stroke();c.restore();
      if(scene.effects){c.save();c.globalAlpha=.55+.35*Math.sin(t*1.7+i)**2;glow(c,x,y+80,85,'#50ccef55');c.restore();}
    }
    // Closer copper conduits pass faster than the hall, behind all actors.
    const first=Math.floor(cam*.52/900)-1;
    for(let i=first;i<=first+3;i++){
      const x=i*900-cam*.52+170;if(x< -100||x>1380)continue;
      const pipe=c.createLinearGradient(x-10,0,x+10,0);pipe.addColorStop(0,'#1c3546');pipe.addColorStop(.3,'#aa8b55');pipe.addColorStop(.48,'#dac08a');pipe.addColorStop(.7,'#645e4d');pipe.addColorStop(1,'#203748');
      c.strokeStyle=pipe;c.lineWidth=18;c.beginPath();c.moveTo(x,-20);c.lineTo(x,208);c.bezierCurveTo(x,250,x+52,245,x+52,284);c.lineTo(x+52,516);c.stroke();
      for(const y of [45,175,348,480]){const px=y<210?x:x+52;c.fillStyle='#9a8051';c.beginPath();c.roundRect(px-14,y,28,11,3);c.fill();c.fillStyle='#d2b97e';c.fillRect(px-12,y+2,24,2);}
    }
    // Rear rail is below the characters' heads, and never hides a hazard.
    c.save();c.beginPath();c.rect(0,520,1280,45);for(const g of scene.gaps)c.rect(g.x,520,g.w,45);c.clip('evenodd');c.fillStyle='#29455a';c.fillRect(0,527,1280,5);c.fillStyle='#d2ac6c';c.fillRect(0,527,1280,1);
    for(let i=0;i<9;i++){const x=mod(i*180-cam*.7,1620)-170;c.fillStyle='#29455a';c.fillRect(x,530,5,36);}
    c.restore();
  }
  if(pass==='floor'){
    c.save();c.beginPath();c.rect(0,560,1280,160);for(const g of scene.gaps)c.rect(g.x,560,g.w,160);c.clip('evenodd');
    const floor=c.createLinearGradient(0,560,0,720);floor.addColorStop(0,'#547684');floor.addColorStop(.06,'#20384d');floor.addColorStop(1,'#0a1428');c.fillStyle=floor;c.fillRect(0,560,1280,160);
    const start=Math.floor(cam/160)-1;
    for(let i=start;i<=start+10;i++){
      const x=i*160-cam;c.fillStyle=i%2?'#294555':'#304c5c';c.beginPath();c.roundRect(x+2,564,156,20,4);c.fill();c.strokeStyle='#74929a';c.lineWidth=1;c.stroke();
      c.fillStyle='#b5ccd0';for(const dx of [10,149]){c.beginPath();c.arc(x+dx,570,2,0,TAU);c.fill();}
      c.fillStyle='#bc965a';c.fillRect(x+8,587,144,4);c.fillStyle='#102438';c.fillRect(x+22,603,116,60);c.strokeStyle='#38556c';c.lineWidth=5;c.beginPath();c.moveTo(x+23,606);c.lineTo(x+138,661);c.moveTo(x+138,606);c.lineTo(x+23,661);c.stroke();
      c.fillStyle='#7ee8ec';c.fillRect(x+60,587,40,3);if(scene.effects){glow(c,x+80,590,26,'#69e5f526');const flow=mod(t*.65-i*.14,1);c.fillStyle='#b8fbff';c.fillRect(x+8+flow*130,587,12,3);}
    }
    c.fillStyle='#ecd7a2';c.fillRect(0,559,1280,3);
    for(const p of scene.reactive.sources){const radius=p.radius??100;c.globalAlpha=p.energy*.45;glow(c,p.x,p.y??560,radius,p.color+'77');}c.restore();
  }
  if(pass==='front'&&scene.effects){
    for(let i=0;i<2;i++){const x=mod(i*910-cam*1.08,1820)-200;c.strokeStyle='#182c42';c.lineWidth=18;c.beginPath();c.moveTo(x,720);c.bezierCurveTo(x-70,685,x+70,682,x+90,720);c.stroke();c.strokeStyle='#416475';c.lineWidth=2;c.stroke();}
  }
}
