const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
export const machineSlot=tool=>tool==='wave'?0:['beam','arm'].includes(tool)?1:null;
export function sampleMachineActing(bot,time){
  const phase=(bot.slot??0)*1.7,attack=bot.mode==='attack'?1:0,charge=bot.charge??0,singing=bot.open??0;
  const arms=[-1,1].map(side=>{const a=.35+Math.sin(time*4.2+phase+side*.65)*(.5+singing*.35)-attack*.8,b=-.65+Math.sin(time*4.2+phase+side*.65-.8)*.65-attack*.45+Math.sin(time*6+phase+side)*singing*.18;
    const shoulder={x:side*21,y:1-singing*2},elbow={x:shoulder.x+side*Math.cos(a)*10,y:shoulder.y+Math.sin(a)*10},hand={x:elbow.x+side*Math.cos(a+b)*8,y:elbow.y+Math.sin(a+b)*8};return {shoulder,elbow,hand};});
  const blinkTime=((time+phase*.41)%3.8+3.8)%3.8,blink=blinkTime<.14?.12+.88*Math.abs(blinkTime/.07-1):1,dx=(bot.target?.x??410)-bot.x,dy=(bot.target?.y??430)-bot.y,d=Math.max(1,Math.hypot(dx,dy));
  return {arms,rotation:(bot.rotation??0)+Math.sin(time*3.4+phase)*.075-attack*.08,antenna:{x:Math.sin(time*3.7+phase)*4,y:-28-Math.sin(time*2.2+phase)*2},eye:{x:dx/d*1.7+Math.sin(time*.9+phase)*.2,y:dy/d*1.1},blink,rotorAngle:time*26+phase,thrust:8+Math.sin(time*17+phase)*3+charge*7+attack*4,charge};
}
export function sampleMachineSlot(base,stage,time,slot){
  const launch=stage.sceneEvents.filter(e=>e.kind==='warning'&&machineSlot(e.payload.tool)===slot&&e.payload.fireAt<=time).at(-1),age=launch?time-launch.payload.fireAt:Infinity;
  const rebuilding=age>=0&&age<.62,materialize=rebuilding?smooth((age-.1)/.52):1;
  const pending=stage.sceneEvents.find(e=>e.kind==='warning'&&machineSlot(e.payload.tool)===slot&&e.at<=time&&e.payload.fireAt>time),charge=pending?clamp((time-pending.at)/.6):0;
  return {...base,slot,alpha:materialize,materialize,rebuilding,scale:rebuilding?.65+.35*materialize:1,charge,flash:rebuilding?1-clamp(age/.12):0};
}
export function drawMachine(c,bot,rig,images,time,{effects=true}={}){
  const p=bot.materialize??1,alpha=bot.alpha??1,a=sampleMachineActing(bot,time);c.save();c.translate(bot.x,bot.y);c.rotate(a.rotation);c.scale(bot.scale??1,bot.scale??1);
  if(effects&&(bot.rebuilding||bot.charge>0)){
    const power=bot.rebuilding?Math.sin(Math.PI*p):bot.charge*.35;
    c.strokeStyle='#baf9ff';c.lineWidth=2;c.globalAlpha=power*.85;c.beginPath();c.ellipse(0,0,33+(1-p)*8,24+(1-p)*6,-time*2,0,TAU);c.stroke();
    if(bot.rebuilding)for(let i=0;i<10;i++){const angle=time*7+i*TAU/10,r=14+(1-p)*32;c.globalAlpha=power*.8;c.fillStyle=i%2?'#a7f6ff':'#ffe6a6';c.fillRect(Math.cos(angle)*r-1.5,Math.sin(angle)*r*.7-1.5,3,3);}
    if(bot.flash>0){c.globalAlpha=bot.flash*.65;c.fillStyle='#d4ffff';c.beginPath();c.ellipse(0,0,29,20,0,0,TAU);c.fill();}
  }
  if(alpha>0){
    c.save();c.globalAlpha=alpha;
    if(bot.rebuilding){c.beginPath();c.rect(-40,22-46*p,80,46*p);c.clip();}
    for(const side of [-1,1]){c.save();c.translate(side*26,11);c.fillStyle='#213b54';c.strokeStyle='#d9bb7b';c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,11,4,0,0,TAU);c.fill();c.stroke();c.strokeStyle='#b7f4ff';c.lineWidth=2;const r=a.rotorAngle+side*.8;c.beginPath();c.moveTo(-10*Math.cos(r),-3*Math.sin(r));c.lineTo(10*Math.cos(r),3*Math.sin(r));c.moveTo(-10*Math.sin(r),3*Math.cos(r));c.lineTo(10*Math.sin(r),-3*Math.cos(r));c.stroke();c.restore();}
    c.lineCap='round';
    for(const arm of a.arms){c.strokeStyle='#153d62';c.lineWidth=6;c.beginPath();c.moveTo(arm.shoulder.x,arm.shoulder.y);c.lineTo(arm.elbow.x,arm.elbow.y);c.lineTo(arm.hand.x,arm.hand.y);c.stroke();c.strokeStyle='#82d9e9';c.lineWidth=3;c.stroke();c.fillStyle='#ffe0a0';c.beginPath();c.arc(arm.elbow.x,arm.elbow.y,2.5,0,TAU);c.fill();c.fillStyle='#c7faff';c.beginPath();c.ellipse(arm.hand.x,arm.hand.y,3.5,2.5,time*2,0,TAU);c.fill();}
    c.strokeStyle='#a2dbe7';c.lineWidth=2;c.beginPath();c.moveTo(0,-13);c.quadraticCurveTo(a.antenna.x-3,-23,a.antenna.x,a.antenna.y);c.stroke();c.fillStyle='#ffe29a';c.beginPath();c.arc(a.antenna.x,a.antenna.y,2.5,0,TAU);c.fill();
    const f=rig.frames.engine;c.drawImage(images[f.image],f.x,f.y,f.w,f.h,-25,-17,50,36);
    c.fillStyle='#071a36';c.beginPath();c.roundRect(-17,-12,34,20,8);c.fill();
    c.fillStyle='#c4ffff';c.beginPath();c.ellipse(-7,-6,3.7,4*a.blink,0,0,TAU);c.ellipse(7,-6,3.7,4*a.blink,0,0,TAU);c.fill();
    if(a.blink>.4){c.fillStyle='#134b70';for(const x of [-7,7]){c.beginPath();c.ellipse(x+a.eye.x,-6+a.eye.y,1.65,2.5*a.blink,0,0,TAU);c.fill();}}
    c.fillStyle='#93eaff';c.beginPath();c.ellipse(0,3,6,1+(bot.open??0)*6,0,0,TAU);c.fill();c.restore();
  }
  if(effects&&alpha>0){const length=bot.skimming?4:a.thrust;c.globalAlpha=alpha*.7;c.fillStyle='#9defff';c.beginPath();c.moveTo(-7,17);c.quadraticCurveTo(0,20+length,7,17);c.closePath();c.fill();for(let i=0;i<3;i++){const u=((time*3+i/3)%1+1)%1;c.globalAlpha=alpha*(1-u)*.5;c.strokeStyle='#b8f6ff';c.lineWidth=1.5;c.beginPath();c.ellipse(0,19+u*length,4+u*5,1.5,0,0,TAU);c.stroke();}}
  c.restore();
}
