const clamp=x=>Math.max(0,Math.min(1,x)),u=(t,a,b)=>clamp((t-a)/(b-a)),ease=x=>x*x*(3-2*x),TAU=Math.PI*2;
export function sampleFinale(stage,time){
  const active=!!stage.victory&&!stage.failed&&stage.victoryAt>=0&&time>=stage.victoryAt;
  const exitAt=stage.exitAt??-1,visible=!stage.failed&&(exitAt>=0||active)&&time>=81.1;
  const portal={visible,x:1100-120*ease(u(time,81.1,89.5)),y:430,opening:visible?ease(u(time,81.1,83))*(1-ease(u(time,98.3,101.2))):0};
  if(!active)return {active:false,progress:0,hero:{x:410,y:560,alpha:1,scale:1,clip:false},helpers:{},ship:{x:0,y:0,rotation:0,toolFold:0,crash:0},home:{alpha:0,hero:{alpha:0}},portal};
  const enter=ease(u(time,96,97.8)),progress=u(time,stage.victoryAt,103.2),escapeStart=Math.max(90.5,stage.victoryAt+.1);
  const fall=u(time,96.8,98.11),crash=fall*fall,bounce=time>=98.11?Math.abs(Math.sin((time-98.11)*14))*Math.exp(-(time-98.11)*4)*22:0,arrival=ease(u(time,99.2,101.2));
  const hit=Math.max(0,time-98.11),rock=time>=98.11?Math.sin(hit*17)*Math.exp(-hit*2.8)*.13:Math.sin((time-96.8)*19)*Math.sin(fall*Math.PI)*.09;
  const lift=Math.sin(Math.PI*u(time,96.1,98.11))**2*70;
  const rotation=Math.sin((time-stage.victoryAt)*3)*.13*(1-ease(u(time,95,99)))+crash*.22-bounce*.003+rock;
  const support=time>=98.11?125*(Math.sin(.22)-Math.sin(rotation))+115*(Math.cos(.22)-Math.cos(rotation)):0;
  return {active:true,progress,
    hero:{x:410+570*ease(u(time,escapeStart,96)),y:560-enter*60,alpha:1-enter,scale:1-enter*.65,clip:time>=96},
    helpers:{lumi:{x:380*ease(u(time,escapeStart,95.5)),y:100*ease(u(time,escapeStart,95.5)),alpha:1-ease(u(time,95.2,96.5))},quantico:{x:670*ease(u(time,escapeStart+.15,96)),y:15*ease(u(time,escapeStart+.15,96)),alpha:1-ease(u(time,96,97.2))}},
    ship:{x:-20*ease(u(time,90,96))+crash*260+(time>=98.11?40*(1-Math.exp(-hit*3)):0),y:35*ease(u(time,90,96))+crash*42-lift-bounce+support,rotation,toolFold:ease(u(time,stage.victoryAt,stage.victoryAt+1)),crash,rock},
    home:{alpha:ease(u(time,99.3,101)),hero:{x:510+130*arrival,y:560,alpha:ease(u(time,99.1,99.7)),arrived:arrival>=1},portalOpening:1-ease(u(time,100.4,102))},portal};
}
export function drawExitPortal(c,p,time,{front=false,effects=true}={}){
  if(!p.visible||p.opening<=0)return;const rx=65*p.opening,ry=130*p.opening;
  c.save();c.translate(p.x,p.y);
  if(!front){
    if(effects){const light=c.createRadialGradient(0,0,10,0,0,185);light.addColorStop(0,'#c6f4ee44');light.addColorStop(.55,'#eacaff22');light.addColorStop(1,'#a9cfff00');c.fillStyle=light;c.fillRect(-185,-185,370,370);}
    const g=c.createRadialGradient(0,0,1,0,0,130);g.addColorStop(0,'#f1fff0');g.addColorStop(.2,'#7ae5f1');g.addColorStop(.55,'#4b6cd5');g.addColorStop(1,'#151a43');c.fillStyle=g;c.beginPath();c.ellipse(0,0,rx,ry,0,0,TAU);c.fill();
    c.save();c.beginPath();c.ellipse(0,0,Math.max(.1,rx-1),Math.max(.1,ry-1),0,0,TAU);c.clip();
    c.strokeStyle='#f1f8ca88';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(Math.sin(time*.7+i)*12,Math.cos(time*.5+i)*17,rx*(.25+i*.24),ry*(.3+i*.22),time*.35+i,0,TAU);c.stroke();}c.restore();
  }
  c.strokeStyle=front?'#fff1b8':'#b7d1f7';c.lineWidth=front?6:9;c.beginPath();c.ellipse(0,0,Math.max(1,rx),Math.max(1,ry),0,front?-Math.PI/2:0,front?Math.PI/2:TAU);c.stroke();
  c.restore();
}
