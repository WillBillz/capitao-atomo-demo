import {drawExitPortal} from './finale.mjs';import {sampleHomeExperiments} from './home-experiments.mjs';
const TAU=Math.PI*2;
function light(c,x,y,r,color,alpha){c.save();c.globalAlpha*=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
function crystal(c,x,y,angle){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle='#9cf6f4';c.strokeStyle='#eefcf1';c.lineWidth=2;c.beginPath();c.moveTo(0,-11);c.lineTo(8,0);c.lineTo(0,11);c.lineTo(-8,0);c.closePath();c.fill();c.stroke();c.restore();}
export function drawPaintedHomeLaboratory(c,image,time,{effects=true,state={}}={}){
  const p=sampleHomeExperiments(state,time);c.save();
  // Two complete painted cabinets occupy the foreground; the central aisle stays usable.
  for(const [sx,x,y,w,h] of [[0,15,235,425,417],[845,859,224,405,397]]){c.fillStyle='#07182b55';c.beginPath();c.ellipse(x+w/2,620,w*.49,18,0,0,TAU);c.fill();c.drawImage(image,sx,70,825,810,x,y,w,h);}
  // Living terrarium: leaves open and light travels into branches under Lumi's hand.
  const garden={x:167,y:414};
  light(c,garden.x,garden.y,90,'#ffe8a4',.12+p.gardenPulse*.22);
  c.save();c.translate(garden.x,garden.y);c.globalAlpha=.4+.6*p.garden;
  for(let i=0;i<11;i++){const a=i*2.4,x=Math.cos(a)*(22+i*2),y=-Math.abs(Math.sin(a))*48+8,open=p.garden*(.7+.3*Math.sin(time*1.7+i)**2);c.save();c.translate(x,y);c.rotate(a+Math.sin(time*1.3+i)*.12);c.fillStyle=i%3?'#a4efb7':'#ffe598';c.beginPath();c.ellipse(0,0,5+open*3,2+open*2,0,0,TAU);c.fill();c.restore();}c.restore();
  // Rotating scientific orbits sit on the painted crystal's existing brass gyroscope.
  const core={x:1087,y:365};light(c,core.x,core.y,105,'#72e9ff',.16+p.reactor*.25);
  for(let i=0;i<3;i++){c.save();c.translate(core.x,core.y);c.rotate(time*(.25+i*.08)+i*1.1);c.scale(1,.45);c.strokeStyle=i%2?'#fff0b3bb':'#b5fcf2bb';c.lineWidth=2;c.beginPath();c.ellipse(0,0,56+i*8,56+i*8,0,0,TAU);c.stroke();const a=time*(.9+i*.2)+i;c.fillStyle='#f4ffec';c.beginPath();c.arc(Math.cos(a)*(56+i*8),Math.sin(a)*(56+i*8),3,0,TAU);c.fill();c.restore();}
  // The specimen travels INTO one portal, vanishes, then comes OUT on the far side.
  if(p.portal>0){for(const x of [485,822]){c.save();c.translate(x,449);c.scale(.36,.36);drawExitPortal(c,{visible:true,x:0,y:0,opening:p.portal},time,{effects});c.restore();}const u=p.transfer;if(u<.43)crystal(c,447+u/.43*38,449-Math.sin(u/.43*Math.PI)*9,time);else if(u>.56&&u<.99)crystal(c,822+(u-.56)/.43*77,449-Math.sin((u-.56)/.43*Math.PI)*9,time);}
  // Instrument arm and conveyor deliver new samples to the workstation.
  const elbow={x:1209+Math.sin(time*1.5)*8,y:449},hand={x:1183+Math.sin(time*1.5)*30,y:409+Math.cos(time*1.5)*12};c.lineCap='round';
  for(const [width,color] of [[13,'#b99b61'],[7,'#527d98']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(1222,494);c.lineTo(elbow.x,elbow.y);c.lineTo(hand.x,hand.y);c.stroke();}for(const j of [elbow,hand]){c.fillStyle='#e2d29f';c.beginPath();c.arc(j.x,j.y,6,0,TAU);c.fill();}crystal(c,hand.x,hand.y+13,time*.7);
  // Registered bubbles and pressure dials move within the painted apparatus.
  for(const [i,x,y] of [[0,302,428],[1,925,434],[2,1230,541]]){c.save();c.beginPath();c.ellipse(x,y,15,24,0,0,TAU);c.clip();for(let j=0;j<5;j++){c.globalAlpha=.7;c.fillStyle=i?'#bbfef9':'#e1c7ff';c.beginPath();c.arc(x+Math.sin(j*3+time)*6,y+22-((time*17+j*11)%44),1.6+j%2,0,TAU);c.fill();}c.restore();}
  if(effects){
    c.strokeStyle='#ffeab7aa';c.lineWidth=2;c.globalAlpha=.35+p.gardenPulse*.3;c.setLineDash([5,14]);c.lineDashOffset=-time*32;c.beginPath();c.moveTo(432,295);c.bezierCurveTo(350,305,240,300,garden.x,garden.y-25);c.stroke();
    c.strokeStyle='#c6b7ffaa';c.beginPath();c.moveTo(797,350);c.quadraticCurveTo(780,425,822,445);c.stroke();c.setLineDash([]);
    if(p.reactor>.02){c.globalAlpha=p.reactor*.7;c.strokeStyle='#b7f8fd';c.lineWidth=3;c.beginPath();c.moveTo(715,455);c.bezierCurveTo(800,370,960,420,core.x,core.y);c.stroke();for(let i=0;i<12;i++){const a=i*TAU/12+time,r=35+(1-p.reactor)*95;c.fillStyle=i%2?'#a1f7fb':'#ffe5a3';c.beginPath();c.arc(core.x+Math.cos(a)*r,core.y+Math.sin(a)*r*.7,2,0,TAU);c.fill();}}
    // Tiny hovering survey drones and sample trays add life above the aisle.
    for(let i=0;i<2;i++){const x=540+i*170+Math.sin(time*.8+i)*24,y=227+Math.sin(time*1.7+i)*12;c.globalAlpha=.85;c.fillStyle='#ccd9cb';c.strokeStyle='#bb9d64';c.lineWidth=2;c.beginPath();c.ellipse(x,y,17,7,0,0,TAU);c.fill();c.stroke();c.fillStyle='#8cf8e7';c.beginPath();c.arc(x,y-4,5,0,TAU);c.fill();c.strokeStyle='#9bf5ed66';c.beginPath();c.ellipse(x,y+13,11+Math.sin(time*5+i)*2,3,0,0,TAU);c.stroke();}
  }
  c.restore();return p;
}
