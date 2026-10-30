const clamp=x=>Math.max(0,Math.min(1,x));
const envelope=(time,start,end)=>time<start||time>=end?0:Math.min(1,(time-start)/.12,(end-time)/.12);
export function validateChoreography(data,duration){
  const ids=new Set();
  for(const collection of ['phrases','accents','choir']){
    if(!Array.isArray(data[collection]))throw Error('Coreografia sem '+collection);
    for(const item of data[collection]){
      if(!item.id||ids.has(item.id))throw Error('ID de coreografia duplicado');ids.add(item.id);
      const start=item.at??item.start,end=item.end??start;
      if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<start||end>duration)throw Error('Tempo de coreografia fora da faixa');
      if(collection==='accents'&&(!Number.isFinite(item.strength)||item.strength<0||item.strength>1))throw Error('Acento inválido');
      if(collection==='phrases'&&(!['doctor','hero'].includes(item.actor)||!Number.isFinite(item.gesture)))throw Error('Ator ou gesto inválido');
    }
  }
  return true;
}
export function sampleChoreography(data,time){
  const out={gesture:0,choir:0,accent:0,speaking:{doctor:0,hero:0}};
  for(const p of data.phrases){const e=envelope(time,p.start,p.end);out.speaking[p.actor]=Math.max(out.speaking[p.actor],e);if(p.actor==='doctor')out.gesture=Math.max(out.gesture,p.gesture*e);}
  for(const p of data.choir)out.choir=Math.max(out.choir,envelope(time,p.start,p.end));
  for(const a of data.accents){const age=time-a.at;if(age>=0&&age<.4)out.accent=Math.max(out.accent,a.strength*Math.sin(age/.4*Math.PI));}
  out.gesture=clamp(out.gesture+out.accent*.12);return out;
}
export function validateEncounters(cues){
  const encounters=cues.filter(c=>c.kind==='gate'||c.kind==='contact'&&c.payload.obstacle!=='falling');
  for(const c of encounters){const warning=cues.find(w=>w.kind==='warning'&&w.payload.contactId===c.id);if(!warning||c.at-warning.at<.8)throw Error('Aviso insuficiente para '+c.id);}
  const physical=encounters.filter(c=>c.kind==='contact');
  for(let i=1;i<physical.length;i++)if(physical[i].at-physical[i-1].at<.95)throw Error('Ações incompatíveis sobrepostas');
  return true;
}
