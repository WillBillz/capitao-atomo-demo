import {sampleFootfalls} from './motion.mjs';import {objectRect,SPEED} from './stage.mjs';
import {RUN_START} from './pace.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
export function sampleContactScene({time,runner:r,stage,world,helpers,effects=true}){
  let surface=world.gaps?.some(g=>r.x>=g.x&&r.x<=g.x+g.w)?null:560;
  const bridge=stage.objects?.get('bridge');
  if(bridge&&stage.quantico?.form==='bridge'&&stage.quantico.readyAt<=time){
    const b=objectRect(bridge,time);if(r.x>=b.x&&r.x<=b.x+b.w&&r.y<=b.y+1)surface=b.y;
  }
  const height=surface===null?0:Math.max(0,surface-r.y);
  const shadow=surface===null?null:{x:r.x,y:surface,width:39/(1+height/220),height:5/(1+height/240),alpha:.3/(1+height/65)};
  const dust=[];
  if(effects&&r.grounded&&surface!==null&&(world.running??1)>.85){
    if(r.h===64&&r.duckedAt>=0)for(let i=0;i<6;i++){
      const at=Math.floor(time/.06)*.06-i*.06,age=time-at;if(at<r.duckedAt||age>=.36)continue;
      dust.push({x:r.x-22-age*320,y:surface-3-Math.sin(age/.36*Math.PI)*8,radius:3+age*7,alpha:(1-age/.36)*.18,color:i%2?'#e9daa8':'#9ddcdb'});
    }
    if(r.h!==64)for(const step of sampleFootfalls(time,r.landedAt>=0?r.landedAt:RUN_START)){
      if(step.at<(r.landedAt??-1))continue;
      const age=time-step.at,life=clamp(1-age/.26),origin=r.x+step.x-age*SPEED;
      for(let i=0;i<3;i++)dust.push({x:origin-age*(15+i*13),y:surface-3-age*(16+i*8),radius:2+age*12+i*.5,alpha:life*.24,color:i===1?'#9be9e7':'#f4d995'});
    }
    const age=time-(r.landedAt??-1);
    if(r.landedAt>=0&&age>=0&&age<.5)for(let i=0;i<8;i++){
      const side=i%2?1:-1;dust.push({x:r.x-age*SPEED+side*(8+age*(35+i*7)),y:surface-3-Math.sin(age/.5*Math.PI)*(5+i%3*3),radius:3+age*12,alpha:(1-age/.5)*.3,color:i%3?'#f1dcaa':'#a6e8e6'});
    }
  }
  const lights=[];let beam=null;
  if(helpers?.lumi?.root.alpha>0){
    const l=helpers.lumi.root,b=helpers.bridge?.morph>0?helpers.bridge.rect:null;
    const x=b?b.x+b.w+22:l.x,y=560;
    lights.push({kind:'lumi',x,y,energy:.3*l.alpha,color:'#ffe0a0',radius:b?95:70});
    if(b)lights.push({kind:'bridge',x:b.x+b.w-16,y:b.y,energy:.35*l.alpha,color:'#ffe4ad',radius:42});
    beam={from:{x:l.x,y:l.y},to:b?{x:b.x+b.w-16,y:b.y}:{x,y},strength:(b?.14:.045)*l.alpha};
  }
  const age=time-(r.landedAt??-1),landing=effects&&surface!==null&&r.landedAt>=0&&age>=0&&age<.34?{x:r.x-age*SPEED,y:surface,radius:12+age/.34*96,alpha:(1-age/.34)**2,progress:age/.34}:null;
  return {shadow,dust,lights,beam,landing};
}
export function drawContactScene(c,scene,{pass='back',root}={}){
  c.save();
  if(pass==='back'){
    const landing=scene.landing;
    if(landing){
      c.save();c.globalAlpha=landing.alpha*.75;c.strokeStyle='#d3faff';c.lineWidth=2.5;c.beginPath();c.ellipse(landing.x,landing.y-2,landing.radius,3+landing.progress*10,0,0,Math.PI*2);c.stroke();
      c.globalAlpha=landing.alpha*.3;c.strokeStyle='#ffe3a4';c.beginPath();c.ellipse(landing.x,landing.y-1,landing.radius*.72,2+landing.progress*6,0,0,Math.PI*2);c.stroke();c.restore();
    }
    const s=scene.shadow;
    if(s){c.fillStyle='#101e3b';for(const [scale,alpha] of [[1.25,.15],[1,.35],[.7,.5]]){c.globalAlpha=s.alpha*alpha*(root?.alpha??1);c.beginPath();c.ellipse(root?.x??s.x,s.y,s.width*scale*(root?.scaleX??1),s.height*scale,0,0,Math.PI*2);c.fill();}}
    const b=scene.beam;
    if(b){const g=c.createLinearGradient(b.from.x,b.from.y,b.to.x,b.to.y);g.addColorStop(0,'#ffe6b5');g.addColorStop(1,'#ffe5a000');c.globalAlpha=b.strength;c.fillStyle=g;c.beginPath();c.moveTo(b.from.x,b.from.y);c.quadraticCurveTo(b.to.x-30,b.to.y-60,b.to.x-65,b.to.y);c.quadraticCurveTo(b.to.x,b.to.y+12,b.to.x+65,b.to.y);c.quadraticCurveTo(b.to.x+30,b.to.y-60,b.from.x,b.from.y);c.fill();}
    for(const light of scene.lights)if(light.kind==='bridge'){
      c.save();c.translate(light.x,light.y);c.scale(1,.16);const g=c.createRadialGradient(0,0,0,0,0,light.radius);g.addColorStop(0,'#fff0c6cc');g.addColorStop(1,'#ffe0a000');c.globalAlpha=light.energy;c.fillStyle=g;c.fillRect(-light.radius,-light.radius,light.radius*2,light.radius*2);c.restore();
    }
  }else for(const d of scene.dust){c.globalAlpha=d.alpha;c.fillStyle=d.color;c.beginPath();c.ellipse(d.x,d.y,d.radius*1.5,d.radius*.7,0,0,Math.PI*2);c.fill();}
  c.restore();
}
