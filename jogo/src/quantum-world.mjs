import {drawLaboratory} from './laboratory.mjs';
import {RUN_SPEED} from './pace.mjs';
import {sampleOpening} from './stage-story.mjs';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
const pulse=(at,time,duration)=>{const age=time-at;return at<0||age<0||age>duration?0:Math.sin(Math.PI*age/duration);};
const mod=(x,n)=>(x%n+n)%n;
function palette(regions,key){
  const rgb=[0,0,0];for(const r of regions){const hex=r.palette[key];for(let i=0;i<3;i++)rgb[i]+=parseInt(hex.slice(1+i*2,3+i*2),16)*r.weight;}
  return 'rgb('+rgb.map(Math.round).join(',')+')';
}
export function sampleWorld({time,runner,stage,world,effects=true}){
  const gaps=world.gaps.map(g=>({x:410+(g.centerTime-time)*RUN_SPEED-g.width/2,w:g.width}));
  const unsupported=x=>gaps.some(g=>x>g.x&&x<g.x+g.w);
  const opening=sampleOpening(time),cameraX=opening.distance,regions=world.regions.map((r,i)=>({...r,weight:(i===0?1:smooth((time-r.start+2)/4))*(i===world.regions.length-1?1:1-smooth((time-r.end+2)/4))}));
  const total=regions.reduce((a,r)=>a+r.weight,0)||1;for(const r of regions)r.weight/=total;
  const objects=[],tile=400,start=Math.floor(cameraX/tile)-1;
  const variants=world.floorVariants??['floor'];
  for(let i=start;i<=start+5;i++)objects.push({id:'floor:'+i,kind:'floor',worldX:i*tile,x:i*tile-cameraX,y:560,w:tile,depth:1,scale:1,frame:world.frames[variants[mod(i,variants.length)]],pass:'floor'});
  const decor=[];
  for(const m of world.modules){
    const origin=Math.floor(cameraX*m.depth/m.period)-1;
    for(let i=origin;i<=origin+3;i++){
      const x=i*m.period-cameraX*m.depth+260;if(x< -300||x>1550)continue;
      decor.push({id:m.id+':'+i,kind:'island',worldX:i*m.period,x,y:m.y+Math.sin(time*.35+i)*12,depth:m.depth,scale:m.scale*(1+(i%3)*.06),frame:world.frames[m.frameId],pass:'back'});
    }
  }
  for(const d of world.decorations){
    const x=d.worldX-(cameraX+RUN_SPEED*2.6)*d.depth;if(x< -200||x>1480)continue;
    if(d.depth>=.95&&unsupported(x))continue;
    const proximity=Math.exp(-(((x-runner.x)/160)**2));
    decor.push({...d,x,frame:world.frames[d.frameId],sway:Math.sin(time*1.4+d.worldX)*.025+Math.tanh((x-runner.x)/55)*proximity*.14});
  }
  // Low foreground fronds establish another moving depth without hiding the action.
  const nearOrigin=Math.floor(cameraX*1.12/720)-1;
  for(let i=nearOrigin;i<=nearOrigin+3;i++){
    const x=i*720-cameraX*1.12+140;if(x< -200||x>1480)continue;
    if(unsupported(x))continue;
    decor.push({id:'frond:'+i,kind:'plant',worldX:i*720,x,y:752,depth:1.12,scale:1.35,frame:world.frames.plant,pass:'front',sway:Math.sin(time*1.3+i)*.035});
  }
  decor.sort((a,b)=>a.depth-b.depth);
  const maxDecor=Math.min(world.budget.maxObjects-objects.length,effects?84:24);objects.push(...decor.slice(0,maxDecor));
  const particles=Array.from({length:effects?world.budget.maxParticles:8},(_,i)=>({x:mod(i*137-cameraX*(.03+i%3*.02),1400)-60,y:70+(i*73)%570+Math.sin(time*.6+i)*15,r:1+i%3,alpha:.2+.35*(1+Math.sin(time+i))*.5}));
  const sources=[],landingEnergy=pulse(runner.landedAt??-1,time,.5)*.35;
  if(landingEnergy>0)sources.push({x:runner.x,y:runner.y,at:runner.landedAt,energy:landingEnergy,color:'#fff0b6'});
  for(const e of stage.sceneEvents){
    const duration=e.kind==='prismHit'?1.3:e.kind==='shieldHit'?.65:e.kind==='reveal'?2.5:0;
    if(!duration)continue;const energy=pulse(e.at,time,duration)*(e.kind==='prismHit'?1:.4);
    if(energy>0)sources.push({x:Number.isFinite(e.payload?.worldX)?e.payload.worldX-time*RUN_SPEED:runner.x,y:e.payload?.y??runner.y-55,at:e.at,energy,color:e.kind==='reveal'?'#ffe6a0':'#b8faff'});
  }
  for(const o of objects)if(o.kind==='plant'||o.kind==='crystal'){
    const impulse=sources.reduce((s,p)=>s+p.energy*Math.exp(-(((o.x-p.x)/150)**2))*Math.sin((time-p.at)*12),0);
    o.sway=(o.sway??0)+impulse*.16;
  }
  const b=world.backdrop;let backdrops=[];
  if(b?.scroll==='mirror'){
    const distance=cameraX*b.depth,index=Math.floor(distance/b.displayW);
    backdrops=[index,index+1].map(i=>({id:'hall:'+i,frame:b,x:i*b.displayW-distance,y:0,width:b.displayW,height:b.displayH,mirrored:Math.abs(i%2)===1})).filter(p=>p.x<1280&&p.x+p.width>0);
  }else if(b)backdrops=[{frame:b,x:-Math.min(Math.max(0,b.displayW-1280),cameraX*b.depth),y:0,width:b.displayW,height:b.displayH}];
  const backdrop=backdrops[0]??null;
  return {time,cameraX,running:opening.hero.runWeight,regions,objects,particles,effects,backdrop,backdrops,setting:world.setting,reactive:{energy:clamp(sources.reduce((s,p)=>s+p.energy,0)),x:runner.x,sources},gaps};
}
function drawPart(c,o,images,time,sources){
  const f=o.frame;c.save();c.translate(o.x,o.y);c.rotate(o.sway??Math.sin(time*.3+o.worldX)*.015);
  c.scale(o.scale,o.scale);
  // Distant material remains opaque; value and saturation establish depth.
  if(o.kind==='island')c.filter=o.depth<.1?'saturate(.3) contrast(.55) brightness(1.25)':o.depth<.2?'saturate(.4) contrast(.65) brightness(1.15)':'saturate(.75)';
  if(o.kind==='plant'){
    // A continuous painted frond bends with delayed motion, with its root fixed.
    const strips=12,sx=f.displayW/f.w,sy=f.displayH/f.h;
    for(let i=0;i<strips;i++){
      const start=i*f.h/strips,height=Math.min(f.h-start,f.h/strips),u=(i+.5)/strips;
      const offset=(1-u)**2*Math.sin(time*1.7+o.worldX*.01+u*2.3)*4;
      c.drawImage(images[f.image],f.x,f.y+start,f.w,height,-f.pivotX*sx+offset,(start-f.pivotY)*sy,f.displayW,height*sy+.3);
    }
  }else c.drawImage(images[f.image],f.x,f.y,f.w,f.h,-f.pivotX/f.w*f.displayW,-f.pivotY/f.h*f.displayH,f.displayW,f.displayH);
  c.filter='none';
  const energy=sources.reduce((s,p)=>s+p.energy*Math.exp(-(((o.x-p.x)/180)**2)),0);
  if(energy>0&&(o.kind==='crystal'||o.kind==='plant')){
    const glow=c.createRadialGradient(0,-32,0,0,-32,70);glow.addColorStop(0,o.kind==='crystal'?'#bbfaff99':'#ffeab955');glow.addColorStop(1,'#bbfaff00');c.globalAlpha=Math.min(.7,energy);c.fillStyle=glow;c.fillRect(-70,-102,140,140);
  }c.restore();
}
function floorSegments(gaps){
  const visible=gaps.filter(g=>g.x<1280&&g.x+g.w>0).sort((a,b)=>a.x-b.x),segments=[];let start=0;
  for(const g of visible){if(g.x>start)segments.push([start,g.x-start]);start=Math.max(start,g.x+g.w);}
  if(start<1280)segments.push([start,1280-start]);return segments;
}
export function drawWorld(c,scene,images,pass){
  if(scene.setting==='laboratory'){drawLaboratory(c,scene,images,pass);return;}
  const t=scene.time,light=palette(scene.regions,'light');
  if(pass==='back'){
    const sky=c.createLinearGradient(0,0,0,720);sky.addColorStop(0,palette(scene.regions,'top'));sky.addColorStop(.55,palette(scene.regions,'middle'));sky.addColorStop(1,palette(scene.regions,'bottom'));c.fillStyle=sky;c.fillRect(0,0,1280,720);
    if(scene.backdrop){const b=scene.backdrop,f=b.frame;c.drawImage(images[f.image],f.x,f.y,f.w,f.h,b.x,b.y,b.width,b.height);}
    const atmosphere=c.createLinearGradient(0,190,0,610);atmosphere.addColorStop(0,'#a2bcd400');atmosphere.addColorStop(.55,'#88b1cd18');atmosphere.addColorStop(1,'#98c1d700');c.fillStyle=atmosphere;c.fillRect(0,190,1280,420);
    const halo=c.createRadialGradient(1100,70,10,1100,70,650);halo.addColorStop(0,'#fff2caba');halo.addColorStop(.35,'#ffdba54a');halo.addColorStop(1,'#ffc89000');c.fillStyle=halo;c.fillRect(300,0,980,720);
    for(const p of scene.particles){c.globalAlpha=p.alpha;c.fillStyle=light;c.beginPath();c.arc(p.x,p.y,p.r,0,TAU);c.fill();}c.globalAlpha=1;
    if(scene.effects){
      // Broad moving sunlight stays behind actors and never strobes.
      c.save();c.globalCompositeOperation='screen';
      for(let i=0;i<3;i++){
        const x=650+i*220+Math.sin(t*.18+i)*65;
        c.save();c.translate(x,150);c.rotate(.28);c.scale(.26,1.6);
        const shaft=c.createRadialGradient(0,0,0,0,0,300);shaft.addColorStop(0,'#ffebbd30');shaft.addColorStop(.45,'#fff3cf15');shaft.addColorStop(1,'#fff3cf00');
        c.fillStyle=shaft;c.fillRect(-300,-300,600,600);c.restore();
      }
      c.restore();
      // Slow probability currents cross behind the play area; no rapid flashes.
      for(let i=0;i<3;i++){
        const x=mod(i*570-t*18,1900)-280,y=180+i*110;
        c.strokeStyle=i%2?'#d8faff38':'#fff0cf35';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+180,y-45+Math.sin(t*.6+i)*15,x+300,y+90,x+480,y+25);c.stroke();
        for(let j=0;j<3;j++){
          const u=mod(t*.14+j/3+i*.17,1),v=1-u,px=x+3*v*v*u*180+3*v*u*u*300+u*u*u*480,py=v*v*v*y+3*v*v*u*(y-45+Math.sin(t*.6+i)*15)+3*v*u*u*(y+90)+u*u*u*(y+25);
          const glow=c.createRadialGradient(px,py,0,px,py,13);glow.addColorStop(0,'#edfcffbc');glow.addColorStop(.2,'#a7eaff65');glow.addColorStop(1,'#a7eaff00');c.fillStyle=glow;c.fillRect(px-13,py-13,26,26);
        }
      }
    }
    for(const o of scene.objects)if(o.pass==='back')drawPart(c,o,images,t,scene.reactive.sources);
  }
  if(pass==='floor')for(const [x,w] of floorSegments(scene.gaps)){
    c.save();c.beginPath();c.rect(x,560,w,160);c.clip();
    const rock=c.createLinearGradient(0,560,0,720);rock.addColorStop(0,'#234860');rock.addColorStop(1,'#111d38');c.fillStyle=rock;c.fillRect(x,560,w,160);
    for(const o of scene.objects)if(o.kind==='floor'){
      const f=o.frame;c.drawImage(images[f.image],f.x,f.y,f.w,f.h,o.x,560-f.pivotY/f.h*f.displayH,402,f.displayH);
    }
    for(const p of scene.reactive.sources){
      const radius=p.radius??130,g=c.createRadialGradient(p.x,p.y??560,2,p.x,p.y??560,radius);g.addColorStop(0,p.color+'88');g.addColorStop(1,p.color+'00');c.globalAlpha=p.energy;c.fillStyle=g;c.fillRect(p.x-radius,560,radius*2,130);
    }
    c.restore();
  }
  if(pass==='front')for(const o of scene.objects)if(o.pass==='front')drawPart(c,o,images,t,scene.reactive.sources);
}
