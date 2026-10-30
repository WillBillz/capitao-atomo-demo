const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
export function barrierGeometry(r){return {x:r.x,y:r.y-18,rx:138,ry:180};}
export function sampleProjectionAttack(stage,r,time,muzzle){
  const event=stage.sceneEvents.find(e=>e.kind==='projectionStart'&&time>=e.at&&time<e.payload.contactAt+.85);
  if(!event)return {active:false,muzzle,objects:[],lights:[]};
  const {fireAt,contactAt}=event.payload,g=barrierGeometry(r),hit=stage.sceneEvents.find(e=>e.kind==='shieldHit'&&e.at===contactAt),protectedNow=!!hit&&time>=hit.at;
  const objects=[-1,0,1].map((side,i)=>{
    const a=side*.48,contact={x:g.x+Math.sin(a)*g.rx,y:g.y-Math.cos(a)*g.ry},radius=[22,27,20][i],spawnAt=fireAt+i*.16,build=smooth((time-spawnAt)/.25),dropAt=fireAt+.97+i*.08;
    const origin={x:contact.x+side*22,y:195+i*8},end={x:contact.x+Math.sin(a)*radius,y:contact.y-Math.cos(a)*radius},u=clamp((time-dropAt)/(contactAt-dropAt)),age=time-contactAt;
    let x=origin.x+(end.x-origin.x)*u*u,y=origin.y+(end.y-origin.y)*u*u;
    if(age>=0){if(protectedNow){x=end.x+side*age*420;y=end.y-age*(320+i*35)+age*age*210;}else{y=end.y+age*370+age*age*400;}}
    return {i,kind:event.payload.debris??'block',side,contact,radius,spawnAt,dropAt,build,visible:time>=spawnAt,beam:time>=spawnAt&&time<spawnAt+.35?1-smooth((time-spawnAt-.18)/.17):0,x,y,rotation:(time-spawnAt)*(.6+side*.3)+(protectedNow?age*side*5:0),deflected:protectedNow,alpha:protectedNow?1-smooth((age-.15)/.55):1};
  });
  const impact=protectedNow?Math.max(0,1-(time-hit.at)/.65):0;
  return {active:true,muzzle,objects,protected:protectedNow,charge:smooth((time-event.at)/.65)*(1-smooth((time-fireAt-.45)/.3)),impact,hitAt:hit?.at??-1,geometry:g,lights:impact>0?objects.map(o=>({x:o.contact.x,y:o.contact.y,energy:impact*.45,color:'#c5f6ff',radius:90})):[]};
}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function cube(c,o,time,effects){
  if(!o.visible||o.alpha<=0)return;c.save();c.translate(o.x,o.y);c.rotate(o.rotation);c.globalAlpha=o.alpha;
  if(o.build<1){c.beginPath();c.rect(-o.radius-12,o.radius+12-(o.radius*2+24)*o.build,o.radius*2+24,(o.radius*2+24)*o.build);c.clip();}
  if(o.kind!=='block'){const d=o.radius;c.strokeStyle='#edcd90';c.lineWidth=2;
    if(o.kind==='gear'){c.fillStyle='#657583';c.beginPath();for(let i=0;i<32;i++){const a=i*TAU/32,r=i%2?d*.82:d*1.12;i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.stroke();c.fillStyle='#20384c';c.beginPath();c.arc(0,0,d*.62,0,TAU);c.fill();c.stroke();c.strokeStyle='#9de9f3';for(let i=0;i<4;i++){c.rotate(TAU/4);c.beginPath();c.moveTo(0,0);c.lineTo(d*.55,0);c.stroke();}}
    else if(o.kind==='coil'){c.fillStyle='#263c56';c.beginPath();c.roundRect(-d*.7,-d,d*1.4,d*2,7);c.fill();c.stroke();for(let i=0;i<6;i++){c.strokeStyle=i%2?'#d9b67c':'#91e5e9';c.lineWidth=3;c.beginPath();c.ellipse(0,-d*.7+i*d*.28,d*.9,d*.23,-.12,0,TAU);c.stroke();}}
    else{const g=c.createLinearGradient(-d,-d,d,d);g.addColorStop(0,'#afc4ca');g.addColorStop(.3,'#506b85');g.addColorStop(1,'#1c2e43');c.fillStyle=g;c.beginPath();c.moveTo(-d,-d*.75);c.lineTo(d*.8,-d);c.lineTo(d,d*.65);c.lineTo(-d*.65,d);c.closePath();c.fill();c.stroke();c.strokeStyle='#a3ebef';for(let i=0;i<3;i++){c.beginPath();c.moveTo(-d*.5,-d*.35+i*d*.35);c.lineTo(d*.5,-d*.45+i*d*.35);c.stroke();}}
    c.restore();return;}
  const d=o.radius;c.lineWidth=2;c.strokeStyle='#f4d59b';c.fillStyle='#42536d';c.beginPath();c.moveTo(-d,-d);c.lineTo(d*.65,-d);c.lineTo(d,d*.6);c.lineTo(-d*.65,d);c.closePath();c.fill();c.stroke();
  c.fillStyle='#8c755a';c.beginPath();c.moveTo(-d,-d);c.lineTo(-d*.5,-d*1.3);c.lineTo(d,-d*1.3);c.lineTo(d*.65,-d);c.closePath();c.fill();c.stroke();c.fillStyle='#283a50';c.beginPath();c.moveTo(d*.65,-d);c.lineTo(d,-d*1.3);c.lineTo(d*1.35,d*.3);c.lineTo(d,d*.6);c.closePath();c.fill();c.stroke();
  c.strokeStyle='#c8ffff';c.lineWidth=3;c.beginPath();c.moveTo(-d*.55,-d*.2);c.lineTo(d*.4,-d*.2);c.moveTo(-d*.4,d*.25);c.lineTo(d*.45,d*.25);c.stroke();
  if(effects){c.fillStyle='#e7ffff';c.shadowColor='#9ceaff';c.shadowBlur=12;c.beginPath();c.arc(0,-2,4+Math.sin(time*8+o.i)*.8,0,TAU);c.fill();}c.restore();
}
export function drawProjectionAttack(c,p,time,{effects=true}={}){
  if(!p.active||!p.muzzle)return;c.save();const m=p.muzzle;
  if(p.charge>0){if(effects)glow(c,m.x,m.y,35+25*p.charge,'#9ceaff88');c.strokeStyle='#e0ffff';c.lineWidth=2;c.beginPath();c.arc(m.x,m.y,6+9*p.charge,0,TAU);c.stroke();}
  for(const o of p.objects){
    if(o.beam>0){c.save();c.globalAlpha=o.beam;c.strokeStyle='#97f2ff';c.lineWidth=effects?5:2;c.beginPath();c.moveTo(m.x,m.y);c.quadraticCurveTo(m.x+70,m.y-150,o.x,o.y);c.stroke();c.strokeStyle='#f4ffff';c.lineWidth=1.5;c.stroke();c.strokeStyle='#ffe2a2';c.lineWidth=2;c.beginPath();c.ellipse(o.x,o.y,37,11,-.2,0,TAU);c.stroke();if(effects)glow(c,o.x,o.y,65,'#a5eaff66');c.restore();}
    if(effects&&o.visible&&o.build===1&&time>o.dropAt&&!o.deflected){c.strokeStyle='#9df2ff88';c.lineWidth=2;for(const side of [-1,1]){c.beginPath();c.moveTo(o.x+side*14,o.y-42);c.lineTo(o.x+side*12,o.y-20);c.stroke();}}
    cube(c,o,time,effects);
    if(effects&&o.deflected&&p.impact>0)for(let i=0;i<4;i++){const age=time-p.hitAt,a=i*2.4+o.i;c.globalAlpha=p.impact;c.fillStyle=i%2?'#e1ffff':'#c9adff';c.beginPath();c.arc(o.contact.x+Math.cos(a)*age*250,o.contact.y+Math.sin(a)*age*200,2+2*p.impact,0,TAU);c.fill();}c.globalAlpha=1;
  }c.restore();
}
export function drawQuantumBarrier(c,h,r,time,{effects=true}={}){
  if(h.progress<=0)return;const g=h.geometry,p=h.progress,hit=h.impact;c.save();
  const dome=()=>{c.beginPath();c.ellipse(g.x,g.y,g.rx*p*(1-hit*.025),g.ry*p,0,Math.PI,TAU);c.closePath();};
  if(effects){glow(c,g.x,g.y-90,220*p,'#8fcaff22');c.fillStyle='#9aeaff0d';dome();c.fill();}
  c.strokeStyle='#c8faff';c.lineWidth=3+hit*3;c.beginPath();c.ellipse(g.x,g.y,g.rx*p*(1-hit*.025),g.ry*p,0,Math.PI,TAU);c.stroke();
  if(effects){c.strokeStyle='#bda0ff99';c.lineWidth=2;c.beginPath();c.ellipse(g.x,g.y,g.rx*p+7,g.ry*p+7,0,Math.PI,TAU);c.stroke();c.save();dome();c.clip();
    for(let row=0;row<6;row++)for(let col=0;col<8;col++){const x=g.x-150+col*42+(row%2)*21,y=g.y-180+row*35,energy=.12+.1*Math.sin(time*3+col+row);c.strokeStyle=`rgba(173,224,255,${energy+hit*.35})`;c.lineWidth=1;c.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6;i?c.lineTo(x+Math.cos(a)*23,y+Math.sin(a)*23):c.moveTo(x+Math.cos(a)*23,y+Math.sin(a)*23);}c.closePath();c.stroke();}c.restore();}
  for(const e of h.emitters){c.strokeStyle='#b5ebff';c.lineWidth=2;c.beginPath();c.moveTo(e.x,e.y);c.quadraticCurveTo(e.x+30,e.y-65,g.x-g.rx*.55*p,g.y-g.ry*.83*p);c.stroke();if(effects)glow(c,e.x,e.y,25,'#aefaff66');}
  if(hit>0)for(const side of [-1,0,1]){const a=side*.48,x=g.x+Math.sin(a)*g.rx,y=g.y-Math.cos(a)*g.ry,age=time-h.hitAt;c.save();c.translate(x,y);c.rotate(side*.4);c.strokeStyle='#edffff';c.lineWidth=2+hit*2;c.globalAlpha=hit;c.beginPath();c.ellipse(0,0,9+age*125,5+age*65,0,0,TAU);c.stroke();if(effects)glow(c,0,0,45*hit,'#d3faffaa');c.restore();}
  c.restore();
}
