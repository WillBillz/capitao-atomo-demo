export function shieldWindow(cues,cue){
  const contact=cues.find(c=>c.id===cue.payload.contactId)??cues.find(c=>c.kind==='contact'&&c.payload.obstacle==='falling'&&c.at>=cue.at);
  const impactAt=contact?.at??cue.at+2;
  return {at:cue.at,readyAt:cue.at+(cue.payload.duration??.6),impactAt,releaseAt:cue.payload.releaseAt??impactAt+1.4,contactId:contact?.id??null};
}
export function activeShieldWindow(cues,time){
  return cues.filter(c=>c.kind==='helper'&&c.payload.form==='shield'&&c.at<=time).map(c=>shieldWindow(cues,c)).filter(w=>time<w.releaseAt+.6).at(-1)??null;
}
