const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
export const RUN_DURATION=.64;
const faces={run0:[281,70],run1:[620,70],run2:[989,70],run3:[282,428],run4:[625,432],run5:[987,429],run6:[282,795],run7:[621,794],run8:[987,794],run9:[281,1155],run10:[621,1157],run11:[988,1157],rise:[417,90],apex:[884,85],fall:[1400,110],windup:[364,594],strike:[858,598],recover:[1374,601],slide:[1097,315]};
Object.assign(faces,{duck0:[425,115],duck1:[872,150],duck2:[1400,198],jump0:[400,598],jump1:[880,600],land:[1395,603]});
Object.assign(faces,{rise:[417,80],apex:[886,77],fall:[1382,106],duck0:[416,117],duck1:[868,150],duck2:[1376,203],jump0:[395,595],jump1:[849,596],land:[1386,608],slide:[1051,307],windup:[350,582],strike:[851,591],recover:[1373,594]});
const mix=(a,b,u)=>a+(b-a)*u;
export function faceAnchor(key,frame){if(key.startsWith('runV7_')){const n=Number(key.slice(6));return [[376,786,1230,1671][n%4],frame.y+60];}return faces[key];}
function track(keys,stops,value,weight,add){let i=0;while(i<stops.length-2&&value>stops[i+1])i++;const u=clamp((value-stops[i])/(stops[i+1]-stops[i]));add(keys[i],weight*(1-u));add(keys[i+1],weight*u);}
export function sampleBlendedHero(atlas,r,time,override={}){
  const runKeys=atlas.motionRun??['run6','run7','run8','run9','run10','run11'];
  const phase=((time%RUN_DURATION)+RUN_DURATION)%RUN_DURATION/RUN_DURATION,index=phase*runKeys.length,i=Math.floor(index),u=index-i;
  const weights=new Map(),base=new Map(),put=(map,key,w)=>{if(w>1e-8)map.set(key,(map.get(key)??0)+w);},add=(key,w)=>put(weights,key,w),addBase=(key,w)=>put(base,key,w);
  const recovered=Math.max(r.duckUntil,r.stoodAt??-1),ended=r.jumpedAt>r.duckedAt?Math.min(recovered,r.jumpedAt):recovered;
  const low=r.duckedAt>=0?smooth((time-r.duckedAt)/.14)*(r.h===64?1:1-smooth((time-ended)/.24)):(r.h===64?1:0);
  const airborneAt=Math.max(r.airborneAt??-1,r.jumpedAt??-1);
  const takeoffDuration=(r.airborneAt??-1)>(r.jumpedAt??-1)?.16:.08;
  const air=!r.grounded?smooth((time-(airborneAt>=0?airborneAt:time-takeoffDuration))/takeoffDuration):r.landedAt>=0?1-smooth((time-r.landedAt)/.10):0;
  const age=time-r.punchedAt,punch=r.punchedAt>=0&&age>=0?smooth(age/.045)*(1-smooth((age-.18)/.14)):0;
  const action=r.h===64?'slide':time<r.punchUntil||punch>0?'punch':!r.grounded?'jump':'run';
  const runAdd=w=>{addBase(runKeys[i],w*(1-u));addBase(runKeys[(i+1)%runKeys.length],w*u);};
  const landed=r.grounded&&r.landedAt>=0&&time-r.landedAt<.14;
  if(landed){track(['fall','land','run'],[0,.45,1],smooth((time-r.landedAt)/.14),1-punch,(key,w)=>key==='run'?runAdd(w):addBase(key,w));}
  else{runAdd((1-punch)*(1-air));track(['rise','jump0','apex','jump1','fall'],[-650,-200,80,330,650],r.vy,air*(1-punch),addBase);}
  const extension=smooth((age-.025)/.065)*(1-smooth((age-.13)/.1)),recovery=smooth((age-.15)/.09);
  addBase('windup',punch*(1-extension)*(1-recovery));addBase('strike',punch*extension);addBase('recover',punch*(1-extension)*recovery);
  track(['base','duck0','duck1','duck2','slide'],[0,.22,.48,.74,1],low,1,(key,w)=>key==='base'?[...base].forEach(([k,v])=>add(k,w*v)):add(key,w));
  if(override.idle){weights.clear();add('recover',1);}
  const face={x:34,y:mix(-152,-72,low)+(override.idle?Math.sin(time*2)*1.2:(1-low)*(1-air)*Math.sin(phase*Math.PI*4)*1.4)};
  const root={x:override.x??r.x,y:override.y??r.y,scaleX:override.scaleX??override.scale??1,scaleY:override.scaleY??override.scale??1,alpha:override.alpha??1};
  // Keep a clear dominant drawing; the overlap stays brief at normal speed.
  const total=[...weights.values()].reduce((a,b)=>a+b*b,0)||1;
  const layers=[...weights].map(([key,w])=>{const frame=atlas.frames[key],v7=key.startsWith('runV7_'),n=v7?Number(key.slice(6)):0,sourceFace=faceAnchor(key,frame),scale=frame.displayW/frame.w;return {key,frame,sourceFace,footSource:v7?(n<4?452:878):frame.y+frame.pivotY,scale,alpha:w*w/total,face:{...face},support:1-air};});
  const primary=layers.reduce((a,b)=>a.alpha>b.alpha?a:b),frame=primary.frame;
  let hand={x:34+55,y:-102};
  if(punch>0){const f=atlas.frames.strike,source=faces.strike,s=f.displayW/f.w;hand={x:face.x+(f.x+f.handX-source[0])*s,y:face.y+(f.y+f.handY-source[1])*s};}
  return {key:action==='jump'?(r.vy< -170?'rise':r.vy<190?'apex':'fall'):action==='punch'?(age<.045?'windup':age<.16?'strike':'recover'):action,action,frame,root,layers,face,low,air,hand:{x:root.x+hand.x*root.scaleX,y:root.y+hand.y*root.scaleY}};
}
const buffers=new WeakMap();
function buffer(c){
  if(buffers.has(c))return buffers.get(c);
  let canvas=null;
  if(typeof OffscreenCanvas==='function')canvas=new OffscreenCanvas(768,512);
  else if(c.canvas?.ownerDocument){canvas=c.canvas.ownerDocument.createElement('canvas');canvas.width=768;canvas.height=512;}
  else if(typeof c.canvas?.getContext==='function')canvas=new c.canvas.constructor(768,512);
  const item=canvas?{canvas,c:canvas.getContext('2d')}:null;buffers.set(c,item);return item;
}
function drawLayer(c,l,images){
  const f=l.frame,[eyeX,eyeY]=l.sourceFace,s=l.scale,neck=eyeY+35,foot=l.footSource;
  const neckTarget=l.face.y+35*s,bodyScale=mix(s,(0-neckTarget)/(foot-neck),l.support);
  for(const head of [true,false]){
    c.save();c.translate(l.face.x,head?l.face.y:neckTarget);c.scale(s,head?s:bodyScale);c.translate(-eyeX,head?-eyeY:-neck);
    c.beginPath();c.rect(f.x,head?f.y:neck,f.w,head?neck-f.y:f.y+f.h-neck);c.clip();
    if(f.clip?.length){c.beginPath();for(const [i,p] of f.clip.entries()){if(i)c.lineTo(f.x+p[0],f.y+p[1]);else c.moveTo(f.x+p[0],f.y+p[1]);}c.closePath();c.clip();}
    c.drawImage(images[f.image],f.x,f.y,f.w,f.h,f.x,f.y,f.w,f.h);c.restore();
  }
}
export function drawBlendedHero(c,pose,images){
  const scratch=buffer(c),target=scratch?.c??c;
  if(scratch){target.clearRect(0,0,768,512);target.save();target.scale(2,2);target.translate(160,225);target.globalCompositeOperation='lighter';}
  else{target.save();target.translate(pose.root.x,pose.root.y);target.scale(pose.root.scaleX,pose.root.scaleY);}
  for(const l of pose.layers){target.globalAlpha=l.alpha;drawLayer(target,l,images);}target.restore();
  if(scratch){c.save();c.translate(pose.root.x,pose.root.y);c.scale(pose.root.scaleX,pose.root.scaleY);c.globalAlpha=clamp(pose.root.alpha);c.drawImage(scratch.canvas,0,0,768,512,-160,-225,384,256);c.restore();}
}
