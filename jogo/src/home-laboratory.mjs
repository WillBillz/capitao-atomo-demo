const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
export function sampleHomeActivity(time){
  const power=.25+.75*smooth((time-100.25)/1.1);
  return {power,arm:Math.sin(time*1.4)*.22,transfer:(time*.36)%1,branch:smooth((time-100.7)/1.2),greeting:smooth((time-101.2)/.5),needle:Math.sin(time*1.9)*.45,bubbles:Array.from({length:6},(_,i)=>({x:Math.sin(time+i*2)*5,y:((time*19+i*13)%65),r:1.4+i%3*.6}))};
}
function metal(c,x,y,w,h){
  const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#ebd8a6');g.addColorStop(.13,'#b3945a');g.addColorStop(.2,'#365e7b');g.addColorStop(.6,'#16314e');g.addColorStop(.94,'#315e7c');g.addColorStop(1,'#a58b58');
  c.fillStyle=g;c.strokeStyle='#d1ba7f';c.lineWidth=2;c.beginPath();c.roundRect(x,y,w,h,12);c.fill();c.stroke();
}
function gauge(c,x,y,a){
  c.save();c.translate(x,y);c.fillStyle='#e4dfc2';c.strokeStyle='#b49c69';c.lineWidth=3;c.beginPath();c.arc(0,0,15,0,TAU);c.fill();c.stroke();
  c.strokeStyle='#35495b';c.lineWidth=1;for(let i=0;i<7;i++){const t=-Math.PI+i*Math.PI/6;c.beginPath();c.moveTo(Math.cos(t)*10,Math.sin(t)*10);c.lineTo(Math.cos(t)*12,Math.sin(t)*12);c.stroke();}
  c.rotate(a);c.strokeStyle='#aa4736';c.lineWidth=2;c.beginPath();c.moveTo(0,3);c.lineTo(0,-10);c.stroke();c.restore();
}
function flask(c,x,y,p,time,color){
  c.save();c.translate(x,y);c.strokeStyle='#aee8e4';c.lineWidth=2;c.fillStyle='#c5f6eb18';c.beginPath();c.moveTo(-6,-64);c.lineTo(-6,-44);c.bezierCurveTo(-7,-37,-23,-25,-23,-12);c.bezierCurveTo(-23,8,23,8,23,-12);c.bezierCurveTo(23,-25,7,-37,6,-44);c.lineTo(6,-64);c.closePath();c.fill();c.stroke();
  c.save();c.clip();c.fillStyle=color;c.globalAlpha=.38+p.power*.26;c.beginPath();c.moveTo(-27,-20);for(let j=0;j<9;j++)c.lineTo(-27+j*7,-20+Math.sin(time*2+j*.6)*2);c.lineTo(27,8);c.lineTo(-27,8);c.fill();c.globalAlpha=.75;c.fillStyle='#d6ffed';for(const b of p.bubbles){const yy=-b.y*.4;if(yy< -21)continue;c.beginPath();c.arc(b.x,yy,b.r*.7,0,TAU);c.fill();}c.restore();
  c.strokeStyle='#f0ffff88';c.beginPath();c.moveTo(-14,-20);c.lineTo(-14,-9);c.stroke();metal(c,-9,-65,18,5);c.restore();
}
// Apparatus is behind the returning team; the walking lane remains clear.
export function drawHomeApparatus(c,time,{effects=true,image}={}){
  const p=sampleHomeActivity(time);c.save();
  for(const [x,w] of [[70,150],[875,335]]){c.fillStyle='#06172c66';c.beginPath();c.ellipse(x+w/2,560,w*.65,14,0,0,TAU);c.fill();metal(c,x,462,w,96);if(image){c.save();c.beginPath();c.roundRect(x+2,463,w-4,92,10);c.clip();c.drawImage(image,785,450,285,85,x,462,w,96);c.restore();}metal(c,x-7,450,w+14,17);c.strokeStyle='#749eac';c.lineWidth=2;for(let i=0;i<4;i++){c.beginPath();c.moveTo(x+16,503+i*8);c.lineTo(x+55,503+i*8);c.stroke();}}
  gauge(c,172,496,p.needle);gauge(c,1158,492,-p.needle);
  // Suspended gyroscope on the left bench.
  metal(c,117,423,55,27);c.save();c.translate(145,384);c.fillStyle='#72dff51c';c.strokeStyle='#86e6e2';c.lineWidth=2;c.beginPath();c.ellipse(0,0,43,48,0,0,TAU);c.fill();c.stroke();
  for(let i=0;i<3;i++){c.save();c.rotate(time*(.4+i*.1)+i*1.1);c.scale(1,.35);c.strokeStyle=i%2?'#c4a8ef':'#b5e7f0';c.beginPath();c.arc(0,0,28+i*4,0,TAU);c.stroke();c.restore();}c.fillStyle='#d1fcf2';c.beginPath();c.arc(0,0,6+p.power*2,0,TAU);c.fill();c.restore();
  for(let i=0;i<6;i++){c.fillStyle=i/6<p.power?'#8ce9d4':'#384e64';c.beginPath();c.roundRect(914+i*26,492,15,6+Math.sin(time*2+i)*2,2);c.fill();}
  flask(c,924,447,p,time,'#69dcb6');flask(c,995,447,p,time+2,'#ad86ee');flask(c,1172,447,p,time+4,'#69c9fa');
  // A real articulated sample arm continuously transfers a glowing specimen.
  const base={x:1090,y:446},elbow={x:1095+Math.sin(time*1.4)*13,y:392},hand={x:1055+Math.sin(time*1.4)*31,y:363+Math.cos(time*1.4)*13};
  c.lineCap='round';for(const width of [14,8]){c.strokeStyle=width===14?'#ba9d68':'#4d7d96';c.lineWidth=width;c.beginPath();c.moveTo(base.x,base.y);c.lineTo(elbow.x,elbow.y);c.lineTo(hand.x,hand.y);c.stroke();}for(const j of [base,elbow,hand]){c.fillStyle='#dbd3a5';c.beginPath();c.arc(j.x,j.y,6,0,TAU);c.fill();}
  c.strokeStyle='#afc7c7';c.lineWidth=3;c.beginPath();c.moveTo(hand.x-6,hand.y);c.lineTo(hand.x-8,hand.y+16);c.moveTo(hand.x+6,hand.y);c.lineTo(hand.x+8,hand.y+16);c.stroke();c.fillStyle='#a6fbe9';c.beginPath();c.arc(hand.x,hand.y+14,4,0,TAU);c.fill();
  // Lumi's light branches into alternatives rather than one calculated path.
  metal(c,759,486,24,65);metal(c,739,548,64,10);metal(c,744,465,55,24);c.save();c.translate(771,455);c.globalAlpha=.35+.65*p.branch;c.strokeStyle='#b6f3dc';c.lineWidth=2;
  for(let i=0;i<5;i++){const end={x:(i-2)*29,y:-95-Math.sin(i*2)*23},sway=Math.sin(time*1.1+i)*5;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(0,-40,end.x+sway,-55,end.x+sway,end.y);c.stroke();c.fillStyle=['#9aeed9','#f7d58e','#acbbfa'][i%3];c.beginPath();c.arc(end.x+sway,end.y,5+Math.sin(time*2+i),0,TAU);c.fill();if(effects){c.globalAlpha=.6;const u=(p.transfer+i*.19)%1;c.beginPath();c.arc((end.x+sway)*u*u,end.y*u,2.3,0,TAU);c.fill();c.globalAlpha=.35+.65*p.branch;}}
  c.restore();
  // Cables and signal flow connect the new workstations to the painted reactor.
  c.strokeStyle='#b2945d';c.lineWidth=4;c.beginPath();c.moveTo(1210,495);c.bezierCurveTo(1250,495,1255,385,1197,354);c.stroke();
  if(effects){c.strokeStyle='#91efdfaa';c.lineWidth=1.5;c.setLineDash([5,18]);c.lineDashOffset=-time*32;c.stroke();c.setLineDash([]);if(p.greeting>0){c.globalAlpha=p.greeting*.45;c.strokeStyle='#b8b2ff';c.lineWidth=2;c.setLineDash([4,14]);c.lineDashOffset=-time*38;c.beginPath();c.moveTo(360,413);c.bezierCurveTo(290,435,232,350,154,384);c.stroke();}}
  c.restore();return p;
}
