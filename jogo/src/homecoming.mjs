import {drawDrawnHero,sampleDrawnHero} from './drawn-hero.mjs';import {drawRig} from './rig.mjs';import {drawExitPortal} from './finale.mjs';
import {drawHomeLaboratoryLife} from './laboratory-life.mjs';
import {drawHomeApparatus,sampleHomeActivity} from './home-laboratory.mjs';
import {drawPaintedHomeLaboratory} from './home-lab-scene.mjs';import {sampleHomeExperiments} from './home-experiments.mjs';
export function drawHomecoming(c,finale,assets,time,effects=true,experimentState={},conversationOpen=false){
  const h=finale.home;if(!h||h.alpha<=0)return;
  c.save();c.globalAlpha=h.alpha;
  const background=assets.images['lab-atomo-v07'];c.drawImage(background,0,0,background.width,background.height,0,0,1280,720);
  drawHomeLaboratoryLife(c,time,effects);
  const floor=c.createLinearGradient(0,560,0,720);floor.addColorStop(0,'#4b6c85');floor.addColorStop(.05,'#c6b18e');floor.addColorStop(.08,'#21364e');floor.addColorStop(1,'#0e1d38');c.fillStyle=floor;c.fillRect(0,560,1280,160);
  for(let i=0;i<8;i++){c.strokeStyle='#647d90';c.lineWidth=1;c.beginPath();c.moveTo(i*180,563);c.lineTo(i*180-80,720);c.stroke();}
  const activity=sampleHomeActivity(time),experiments=sampleHomeExperiments(experimentState,time),workstations=assets.images['home-workstations-v25'];if(workstations)drawPaintedHomeLaboratory(c,workstations,time,{effects,state:experimentState});else drawHomeApparatus(c,time,{effects,image:background});
  const portal={visible:true,x:500,y:440,opening:h.portalOpening};drawExitPortal(c,portal,time,{effects});
  const runner={x:h.hero.x,y:h.hero.y,grounded:true,h:120,vy:0,punchedAt:experiments.reactorAt,punchUntil:experiments.reactorAt+.22,duckedAt:-1,duckUntil:-1,jumpedAt:-1,landedAt:-1};
  const pose=sampleDrawnHero(assets.data.rigs.heroDrawn,runner,time,{idle:h.hero.arrived,thumbs:activity.greeting,greeting:activity.greeting,alpha:h.alpha*h.hero.alpha,y:h.hero.y});drawDrawnHero(c,pose,assets.images);
  for(const [i,name] of ['quantico','lumi'].entries()){
    const work=activity.greeting,x=(h.hero.x-90+i*220)*(1-work)+[795,440][i]*work+Math.sin(time*1.8+i)*7,y=405+Math.sin(time*3+i)*9-[70,125][i]*work;
    drawRig(c,assets.data.rigs[name],[{id:'body',rotation:Math.sin(time*2+i)*.1},{id:'nearHand',rotation:(i?-.9:.7)+Math.sin(time*3+i)*.2},{id:'farHand',rotation:(i?.5:-.9)+Math.sin(time*3+i)*.2}],assets.images,{x,y,alpha:h.alpha,scale:1.15});
  }
  if(time>101.3&&!conversationOpen){c.globalAlpha=h.alpha;c.fillStyle='#0c2546dd';c.beginPath();c.roundRect(310,90,660,63,24);c.fill();c.fillStyle='#fff0c4';c.font='bold 27px system-ui';c.textAlign='center';c.fillText('Parte das possibilidades voltou!',640,131);c.textAlign='left';}
  c.restore();
}
