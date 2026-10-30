import {sampleBlendedHero,drawBlendedHero} from './hero-blend.mjs';
import {sampleArticulatedHero,drawArticulatedHero} from './hero-articulated.mjs';
export function sampleDrawnHero(atlas,r,time,override={}){
  const pose=sampleBlendedHero(atlas,r,time,override);
  const articulation=sampleArticulatedHero(r,time,pose.root,{...override,low:pose.low,air:override.arrivalAir??pose.air});
  return {...pose,layers:[],articulation,face:articulation.face,hand:articulation.hand,punchDirection:{x:1,y:0}};
}
export function drawDrawnHero(c,pose,images){
  if(pose.articulation)drawArticulatedHero(c,pose,images);else drawBlendedHero(c,pose,images);
}
