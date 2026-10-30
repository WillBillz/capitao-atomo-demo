const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
export function sampleDoorMotion(at,time,hitAt=-1,opened=false){
  const age=time-(at-1.4),drop=smooth(age/.62),settle=age>.62?Math.sin((age-.62)*22)*Math.exp(-(age-.62)*7)*.025:0;
  return {drop:drop-settle,pressure:smooth(age/.24),closing:age>=0&&age<.9,impact:Math.max(0,1-Math.abs(age-.62)/.16),broken:opened||hitAt>=0&&time>=hitAt,breakAge:hitAt>=0?time-hitAt:Infinity};
}
function plate(c,x,y,w,h,a,b,stroke='#ac9c79',r=5){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,a);g.addColorStop(.35,b);g.addColorStop(1,a);c.fillStyle=g;c.strokeStyle=stroke;c.lineWidth=1.7;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();c.stroke();}
export function drawLabDoor(c,o,b,time,hitAt,{effects=true,opened=false,image}={}){
  const p=sampleDoorMotion(o.at,time,hitAt,opened),x=b.x+b.w/2;if(x< -200||x>1480)return;
  if(image){drawPaintedDoor(c,image,x,time,p,effects);return;}
  c.save();c.translate(x,0);
  // Heavy rails and hydraulics remain after the shutter is broken.
  for(const side of [-1,1]){
    const sx=side*81;plate(c,sx-13,272,26,288,'#12283a','#b39154');plate(c,sx-7,287,14,260,'#c4cdd0','#375465','#d6dbcc',3);
    c.strokeStyle='#d2dce0';c.lineWidth=5;c.beginPath();c.moveTo(sx,284);c.lineTo(sx,290+238*p.drop);c.stroke();
    for(const y of [284,390,545]){c.fillStyle='#dfc88f';c.beginPath();c.arc(sx,y,4,0,TAU);c.fill();c.strokeStyle='#243d4b';c.lineWidth=2;c.beginPath();c.moveTo(sx-2,y);c.lineTo(sx+2,y);c.stroke();}
    plate(c,sx-20,327,40,68,'#2a3c48','#786b47');c.fillStyle=p.broken?'#79ddb4':'#f1c17c';c.fillRect(sx-11,340,22,4);c.fillRect(sx-11,353,22,4);c.fillRect(sx-11,366,22,4);
    c.save();c.translate(sx,303);c.fillStyle='#e6e1c2';c.strokeStyle='#715634';c.lineWidth=3;c.beginPath();c.arc(0,0,12,0,TAU);c.fill();c.stroke();c.rotate(-.8+p.pressure*1.3+(!p.broken?Math.sin(time*7)*.1:0));c.strokeStyle='#55393b';c.lineWidth=1.5;c.beginPath();c.moveTo(-3,0);c.lineTo(9,0);c.stroke();c.restore();
  }
  plate(c,-107,234,214,43,'#132b3f','#5b7786');plate(c,-93,240,186,29,'#3b4550','#b99b5e');
  c.font='bold 12px system-ui';c.textAlign='center';c.fillStyle='#ffebbc';c.fillText(p.broken?'PASSAGEM LIBERADA':'ACESSO CALCULADO',0,260);
  if(!p.broken){
    c.save();c.beginPath();c.rect(-71,279,142,282);c.clip();c.translate(0,-282*(1-p.drop));
    plate(c,-70,279,140,282,'#102d43','#5e8191','#c4d1c9');
    for(let row=0;row<6;row++){
      const y=285+row*44;plate(c,-63,y,126,38,'#1a3d50','#698b98','#9aada6',3);
      c.strokeStyle='#b5c4be66';c.lineWidth=1;c.beginPath();c.moveTo(-57,y+5);c.lineTo(53,y+5);c.stroke();
      for(const side of [-1,1]){c.fillStyle='#c5ad75';c.beginPath();c.arc(side*54,y+29,2.4,0,TAU);c.fill();}
      c.fillStyle='#e6bb70';for(let j=0;j<4;j++){c.save();c.translate(-44+j*25,y+18);c.rotate(-.5);c.fillRect(-7,-2,14,4);c.restore();}
    }
    plate(c,-23,438,46,45,'#0c2639','#496775','#ffdf94',8);c.strokeStyle='#f9e8b7';c.lineWidth=2;c.beginPath();c.arc(0,460,13,0,TAU);c.stroke();c.fillStyle='#bafaff';c.beginPath();c.arc(0,460,5,0,TAU);c.fill();
    c.restore();
  }else if(p.breakAge>=0&&p.breakAge<.8){
    for(let i=0;i<12;i++){const a=p.breakAge,side=i%2?1:-1;c.save();c.globalAlpha=(1-a/.8)**1.3;c.translate(side*(18+a*(70+i*15)),315+(i%6)*39-a*(70+i*4)+a*a*200);c.rotate(side*a*(2+i*.3));plate(c,-10,-7,20+i%3*5,14,'#2b4656','#b8c0b3');c.restore();}
  }
  if(effects){
    const power=p.closing?p.impact:0;
    for(const side of [-1,1])for(let i=0;i<5;i++){
      const u=((time*1.5+i/5)%1+1)%1,life=p.broken&&p.breakAge<.7?1-p.breakAge/.7:power;
      if(life<=0)continue;c.globalAlpha=life*(1-u)*.35;c.fillStyle='#d0e5e6';c.beginPath();c.ellipse(side*(83+u*32),554-u*30,4+u*10,3+u*6,side*.3,0,TAU);c.fill();
    }
    c.globalAlpha=1;if(p.closing){c.globalCompositeOperation='screen';c.strokeStyle='#ffe0a6';c.lineWidth=1.5;for(let i=0;i<4;i++){const u=((time*3+i/4)%1+1)%1;c.globalAlpha=power*(1-u);c.beginPath();c.moveTo(-56+i*37,555);c.lineTo(-56+i*37+(i%2?1:-1)*u*25,555-u*19);c.stroke();}}
  }
  c.restore();
}
function drawPaintedDoor(c,image,x,time,p,effects){
  const w=238,h=326,top=560-h,iw=image.width,ih=image.height,left=-w/2+w*.235,innerTop=top+h*.185,innerW=w*.54,innerH=h*.805;
  c.save();c.translate(x,0);
  c.save();c.beginPath();c.rect(-w/2,top,w,h);c.rect(left,innerTop,innerW,innerH);c.clip('evenodd');c.drawImage(image,0,0,iw,ih,-w/2,top,w,h);c.restore();
  if(!p.broken){
    c.save();c.beginPath();c.rect(left,innerTop,innerW,innerH);c.clip();c.translate(0,-innerH*(1-p.drop));
    // Reassemble the painted plates around the actual punch-height lock.
    c.drawImage(image,iw*.235,ih*.516,iw*.54,ih*.357,left,innerTop,innerW,425-innerTop);
    c.drawImage(image,iw*.235,ih*.295,iw*.54,ih*.221,left,425,innerW,71);
    c.drawImage(image,iw*.235,ih*.804,iw*.54,ih*.186,left,496,innerW,innerTop+innerH-496);c.restore();
  }else if(p.breakAge>=0&&p.breakAge<.8){
    const age=p.breakAge;for(let i=0;i<14;i++){c.save();c.globalAlpha=(1-age/.8)**1.3;c.translate((i%2?1:-1)*(14+age*(80+i*9)),315+i%6*38-age*(65+i*3)+age*age*190);c.rotate((i%2?1:-1)*age*(3+i*.2));c.drawImage(image,iw*(.25+i%3*.14),ih*(.55+i%4*.08),iw*.12,ih*.065,-9,-11,18,22);c.restore();}
  }
  for(const side of [-1,1]){const dx=side*89.5,dy=top+h*.265;c.save();c.translate(dx,dy);c.rotate(-.7+p.pressure*1.25+(!p.broken?Math.sin(time*5)*.15:0));c.strokeStyle='#633c2d';c.lineWidth=1.4;c.beginPath();c.moveTo(-2,0);c.lineTo(7,0);c.stroke();c.restore();}
  if(effects){
    c.save();c.globalCompositeOperation='screen';
    for(const side of [-1,1]){const u=((time*.7+side*.13)%1+1)%1;c.globalAlpha=.28*Math.sin(Math.PI*u);c.strokeStyle='#d0ffff';c.lineWidth=2;c.beginPath();c.moveTo(side*88,top+120+u*100);c.lineTo(side*88,top+137+u*100);c.stroke();
      for(let i=0;i<4;i++){const age=((time*1.5+i/4)%1+1)%1,life=p.broken&&p.breakAge<.8?1-p.breakAge/.8:p.impact;if(life<=0)continue;c.globalAlpha=life*(1-age)*.4;c.fillStyle='#d3e4e7';c.beginPath();c.ellipse(side*(90+age*22),553-age*23,3+age*13,2+age*8,0,0,TAU);c.fill();}
    }c.restore();
  }
  c.restore();
}
