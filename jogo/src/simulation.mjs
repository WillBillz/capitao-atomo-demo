import {stepRunner} from './runner.mjs';
export function advanceSimulation(session,target,{environment=()=>({groundY:560,ceiling:false}),afterStep=()=>{}}={}){
  if(target-session.time>.2)return {interrupted:true};
  while(target-session.time>1e-7){
    const dt=Math.min(1/120,target-session.time),time=session.time+dt;
    const actions=session.actions??=[];
    const action=actions[0]?.at<=time?actions.shift():null;
    session.runner=stepRunner(session.runner,action,{dt,time,...environment(time,session.runner)});
    const from=session.time;session.time=time;
    if(afterStep({from,to:time})===false)return {interrupted:false};
  }
  session.time=target;
  return {interrupted:false};
}
