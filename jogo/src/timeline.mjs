export function validateCues(cues,duration=103.2){
  if(!Array.isArray(cues))throw Error('Roteiro inválido');const ids=new Set();let last=-1;
  for(const c of cues){
    if(!c.id||ids.has(c.id)||!Number.isFinite(c.at)||c.at<0||c.at>duration||c.at<last)
      throw Error('Evento musical inválido ou duplicado');ids.add(c.id);last=c.at;
  }return cues;
}
export function eventsBetween(cues,from,to){return to<from?[]:cues.filter(c=>c.at>from&&c.at<=to);}
