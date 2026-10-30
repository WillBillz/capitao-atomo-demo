const TAU=Math.PI*2;
export const SHIP_CRASH={start:96.8,engineAt:97.25,impactAt:98.11,shorts:[97.37,97.74,98.24,98.69],clinks:[98.32,98.48,98.76,99.02]};
// Fixed birth times and ballistic trajectories make pause, replay and seeking identical.
export function sampleShipCrash(time,active){
  if(!active||time<SHIP_CRASH.start)return {active:false,smoke:[],sparks:[],bolts:[],dust:[],arcs:[],impact:0};
  const age=time-SHIP_CRASH.start,hit=time-SHIP_CRASH.impactAt,smoke=[],sparks=[],bolts=[],dust=[],arcs=[];
  for(let i=0;i<30;i++){const t=age-i*.075;if(t<0||t>2)continue;smoke.push({x:(i%2?263:55)-t*32+i%3*8,y:(i%2?155:140)-t*74,r:7+t*30,alpha:Math.sin(Math.PI*t/2)*.35});}
  for(let i=0;i<32;i++){const t=hit-i%4*.025;if(t<0||t>.95)continue;const a=Math.PI*(1.06+i/32*.88),speed=95+i%6*39;sparks.push({x:Math.cos(a)*speed*t,y:Math.sin(a)*speed*t+180*t*t,alpha:1-t/.95,length:4+t*12});}
  for(let i=0;i<12;i++){
    const t=hit-i%3*.032;if(t<0||t>2.5)continue;
    const vy=-230-i%4*60,g=580,startY=-20-i%3*12,land=(-vy+Math.sqrt(vy*vy-2*g*startY))/g,v=vy+g*land,b=t-land,bounce=2*v*.34/g;
    const y=t<land?startY+vy*t+g*t*t/2:b<bounce?-v*.34*b+g*b*b/2:0;
    const vx=(i%2?1:-1)*(180+i%5*65),travel=t<land?t:land+(1-Math.exp(-b*2.8))/2.8;
    bolts.push({x:(i%3-1)*27+vx*travel,y,rotation:i*.6+Math.min(t,land+bounce)*(i%2?9:-7),alpha:Math.min(1,(2.5-t)*2),scale:1.25+i%3*.22,washer:i%4===0});
  }
  for(let i=0;i<16;i++){const t=hit-i%4*.055;if(t<0||t>1.75)continue;dust.push({x:(i%2?1:-1)*(12+t*(55+i%5*18)),y:-10-t*(24+i%3*20),rx:18+Math.sqrt(t)*(65+i%4*8),ry:10+Math.sqrt(t)*(24+i%3*5),alpha:Math.sin(Math.PI*t/1.75)*.26});}
  for(const [i,at] of SHIP_CRASH.shorts.entries()){const t=time-at;if(t<0||t>.3)continue;arcs.push({x:i%2?258:65,y:i%2?153:137,alpha:Math.sin(Math.PI*t/.3)*(.55+.25*Math.sin(t*47)**2),phase:t*33+i});}
  return {active:true,smoke,sparks,bolts,dust,arcs,impact:hit>=0?Math.exp(-hit*7):0};
}
function bolt(c,b){
  c.save();c.translate(b.x,b.y);c.rotate(b.rotation);c.scale(b.scale,b.scale);c.globalAlpha*=b.alpha;c.lineWidth=1.2;c.strokeStyle='#283d4e';
  if(b.washer){c.fillStyle='#b7c5c8';c.beginPath();c.arc(0,0,7,0,TAU);c.arc(0,0,3,0,TAU,true);c.fill();c.stroke();}
  else{
    const metal=c.createLinearGradient(0,-5,0,5);metal.addColorStop(0,'#eff9ee');metal.addColorStop(.4,'#a5bfc9');metal.addColorStop(1,'#496170');c.fillStyle=metal;c.fillRect(-2,-3,15,6);c.strokeRect(-2,-3,15,6);
    for(let x=1;x<13;x+=3){c.beginPath();c.moveTo(x,-3);c.lineTo(x+2,3);c.stroke();}
    c.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6,x=-5+Math.cos(a)*6,y=Math.sin(a)*6;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fill();c.stroke();c.strokeStyle='#607d87';c.beginPath();c.moveTo(-8,0);c.lineTo(-2,0);c.stroke();
  }c.restore();
}
function puff(c,x,y,rx,ry,color,alpha){
  c.save();c.translate(x,y);c.scale(1,ry/rx);c.globalAlpha=alpha;const g=c.createRadialGradient(-rx*.2,-rx*.15,0,0,0,rx);g.addColorStop(0,color);g.addColorStop(.45,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(-rx,-rx,rx*2,rx*2);c.restore();
}
export function drawShipCrash(c,scene,finale,{effects=true,front=false}={}){
  const p=sampleShipCrash(scene.time,finale?.active);if(!p.active)return;
  const x=scene.ship.root.x+(finale.ship.x??0),y=scene.ship.root.y+(finale.ship.y??0),groundX=x+240,a=finale.ship.rotation??0;
  const mounted=(px,py)=>({x:x+170+(px-170)*Math.cos(a)-(py-90)*Math.sin(a),y:y+90+(px-170)*Math.sin(a)+(py-90)*Math.cos(a)});
  c.save();
  if(!front&&effects){
    for(const [i,s] of p.smoke.entries()){const pos=mounted(s.x,s.y);puff(c,pos.x,pos.y,s.r,s.r*.85,i%3?'#536575':'#a5aa9e',s.alpha);}
    for(const d of p.dust)puff(c,groundX+d.x,557+d.y,d.rx*1.3,d.ry,'#a9b8bb',d.alpha);
  }
  if(front){
    if(p.impact>0){c.globalAlpha=p.impact*.55;c.strokeStyle='#ffdf9b';c.lineWidth=3;c.beginPath();c.ellipse(groundX,558,35+(1-p.impact)*130,4+(1-p.impact)*10,0,0,TAU);c.stroke();}
    if(effects){
      for(const a of p.arcs){
        const pos=mounted(a.x,a.y);c.save();c.translate(pos.x,pos.y);c.globalAlpha=a.alpha;c.lineJoin='round';
        const points=Array.from({length:8},(_,i)=>({x:i*8-26,y:Math.sin(i*2.7+a.phase)*13+i*2}));
        for(const width of [6,2]){c.lineWidth=width;c.strokeStyle=width===6?'#43b8ff90':'#e2ffff';c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
        for(let j=0;j<5;j++){const angle=j*TAU/5+a.phase;c.strokeStyle='#aef7ff';c.lineWidth=1.5;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(angle)*22,Math.sin(angle)*22);c.stroke();}c.restore();
      }
      for(const s of p.sparks){c.globalAlpha=s.alpha;c.strokeStyle='#ffe5a6';c.lineWidth=2;c.beginPath();c.moveTo(groundX+s.x,551+s.y);c.lineTo(groundX+s.x-s.length,551+s.y-4);c.stroke();}
      for(const d of p.dust)puff(c,groundX+d.x,557+d.y*.6,d.rx,d.ry*.65,'#c6b89b',d.alpha);
      c.globalAlpha=1;for(const b of p.bolts){c.save();c.translate(groundX,555);bolt(c,b);c.restore();}
    }
  }c.restore();
}
