const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
// Smoothly hold the projection inside the frame, then join the physical track.
export function calculationCenter(raw){const z=(800-raw)/60;return 800-60*(Math.max(z,0)+Math.log1p(Math.exp(-Math.abs(z))));}
export function sampleCalculationScreen(o,b,time,hitAt=-1){
  const age=hitAt>=0?time-hitAt:-1,fracture=age>=0?clamp(age/.11):0,fragments=age>.11?clamp((age-.11)/.45):0;
  return {x:b.x+b.w/2,y:b.y+b.h/2+Math.sin(time*3.1)*2,w:228,h:148,time,age,fracture,fragments,unfold:smooth((time-5.9)/.28),percent:Math.round(100*(1-smooth((time-5.9)/.6))),scan:((time*43)%120+120)%120,
    tilt:Math.sin(time*2.4)*.009,shake:age>=0&&age<.13?Math.sin(age*160)*5*(1-age/.13):0,bodyAlpha:age<0?1:1-smooth((age-.06)/.07),cameraWeight:smooth((time-5.5)/.4)*(hitAt>=0?1-smooth((time-hitAt-.15)/.5):1)};
}
function glass(c){c.beginPath();c.moveTo(-100,-74);c.lineTo(100,-74);c.lineTo(114,-60);c.lineTo(114,60);c.lineTo(100,74);c.lineTo(-100,74);c.lineTo(-114,60);c.lineTo(-114,-60);c.closePath();}
export function drawCalculationScreen(c,p,{effects=true}={}){
  if(p.unfold<=0||p.age>.72)return;c.save();
  if(effects&&p.bodyAlpha>0){c.save();c.globalAlpha=p.bodyAlpha*p.unfold;const light=c.createRadialGradient(p.x,p.y,8,p.x,p.y,160);light.addColorStop(0,'#8ceaff44');light.addColorStop(1,'#69dfff00');c.fillStyle=light;c.fillRect(p.x-160,p.y-160,320,320);c.restore();}
  // Brass emitter and translucent energy glass belong to the laboratory palette.
  c.save();c.globalAlpha=p.age<0?p.unfold:1-smooth(p.age/.25);c.fillStyle='#33444d';c.strokeStyle='#d7af6b';c.lineWidth=3;c.beginPath();c.ellipse(p.x,554,30,6,0,0,TAU);c.fill();c.stroke();c.strokeStyle='#c6ffff';c.lineWidth=2;c.beginPath();c.ellipse(p.x,551,18,3,0,0,TAU);c.stroke();
  if(effects){c.fillStyle='#90e7ff24';c.beginPath();c.moveTo(p.x-14,550);c.lineTo(p.x-p.w*.42,p.y+p.h/2);c.lineTo(p.x+p.w*.42,p.y+p.h/2);c.lineTo(p.x+14,550);c.closePath();c.fill();}c.restore();
  if(p.bodyAlpha>0){
    c.save();c.translate(p.x+p.shake,p.y);c.rotate(p.tilt);c.scale(.95+.05*p.unfold,p.unfold);c.globalAlpha=p.bodyAlpha;
    const tint=c.createLinearGradient(0,-74,0,74);tint.addColorStop(0,'#1d607dc9');tint.addColorStop(.45,'#16475988');tint.addColorStop(1,'#348a9ea0');glass(c);c.fillStyle=tint;c.fill();c.strokeStyle='#a1f9ff';c.lineWidth=2;c.stroke();
    c.save();glass(c);c.clip();c.strokeStyle='#b0f8ff1c';c.lineWidth=1;for(let y=-66;y<74;y+=8){c.beginPath();c.moveTo(-114,y);c.lineTo(114,y);c.stroke();}
    if(effects){c.fillStyle='#cbffff22';c.fillRect(-114,p.scan-72,228,12);c.strokeStyle='#d9ffff66';c.beginPath();c.moveTo(-114,p.scan-60);c.lineTo(114,p.scan-60);c.stroke();}c.restore();
    for(const side of [-1,1]){c.fillStyle='#846844';c.strokeStyle='#f0d49a';c.lineWidth=1.5;c.beginPath();c.roundRect(side*116-4,-42,8,84,3);c.fill();c.stroke();for(const y of [-53,53]){c.fillStyle='#fff0bb';c.beginPath();c.arc(side*108,y,3,0,TAU);c.fill();}}
    c.textAlign='center';c.shadowColor='#072136';c.shadowBlur=6;c.fillStyle='#ffdfa2';c.font='bold 17px system-ui';c.fillText('CHANCE DE FUGA',0,-43);
    c.fillStyle=p.age>=0?'#fff2c9':'#e9ffff';c.font=p.age>=0?'bold 40px system-ui':'bold 56px system-ui';c.fillText(p.age>=0?'ERRO!':p.percent+'%',0,18);
    c.fillStyle='#dcf8fa';c.font='bold 15px system-ui';c.fillText(p.age>=0?'RECALCULANDO…':p.percent>0?'ANALISANDO…':'IMPOSSÍVEL!',0,47);c.shadowBlur=0;
    c.strokeStyle='#9ce9ec66';c.lineWidth=3;c.beginPath();c.moveTo(-78,61);c.lineTo(78,61);c.stroke();c.strokeStyle='#f2d192';c.beginPath();c.moveTo(-78,61);c.lineTo(-78+156*p.percent/100,61);c.stroke();
    if(p.fracture>0){c.strokeStyle='#f1ffff';c.lineWidth=2;for(let i=0;i<8;i++){const a=i*TAU/8;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*24,Math.sin(a)*18);c.lineTo(Math.cos(a+.15)*94*p.fracture,Math.sin(a+.15)*64*p.fracture);c.stroke();}}
    c.restore();
  }
  if(p.fragments>0&&effects){const t=p.age-.11;for(let i=0;i<12;i++){const a=i*2.399,dx=Math.cos(a)*(90+i%3*25),dy=Math.sin(a)*95;c.save();c.globalAlpha=(1-p.fragments)**1.2;c.translate(p.x+dx*t*2,p.y+dy*t*2+t*t*210);c.rotate(a+t*(i%2?3:-3));c.fillStyle=i%3?'#83e7f0aa':'#f2d192';c.strokeStyle='#c4ffff';c.lineWidth=1.5;c.beginPath();c.moveTo(-12,-8);c.lineTo(16+i%3*5,-3);c.lineTo(-5,12);c.closePath();c.fill();c.stroke();c.restore();}}
  c.restore();
}
