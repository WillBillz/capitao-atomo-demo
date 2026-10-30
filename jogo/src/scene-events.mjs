export function recordSceneEvent(stage,event){
  if(stage.sceneEvents.some(e=>e.id===event.id))return false;
  stage.sceneEvents.push({...event,payload:{...event.payload}});return true;
}
export const sceneEventsSince=(stage,from,to)=>stage.sceneEvents.filter(e=>e.at>from&&e.at<=to);
