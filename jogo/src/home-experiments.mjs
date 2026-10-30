const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
export const HOME_EXPERIMENTS=['reactor','garden','portal'];
export function triggerLaboratory(state,kind,time){
  if(!HOME_EXPERIMENTS.includes(kind)||!Number.isFinite(time)||time<99.3)return state;
  return {...state,[kind+'At']:time};
}
export function sampleHomeExperiments(state={},time){
  const at=kind=>Math.max(state[kind+'At']??-1,{reactor:100.6,garden:101.1,portal:101.8}[kind]),age=kind=>time-at(kind);
  const pulse=kind=>age(kind)<0?0:Math.exp(-age(kind)*.65),cycle=((time-101.8)%6+6)%6;
  return {reactorAt:at('reactor'),reactor:pulse('reactor'),gardenAt:at('garden'),garden:smooth(age('garden')/1.4),gardenPulse:pulse('garden'),portalAt:at('portal'),portal:age('portal')<0?0:state.portalAt>=99.3?1-smooth((age('portal')-4)/1):.5+.5*Math.sin(time*1.2)**2,transfer:state.portalAt>=99.3?clamp(age('portal')/3):(cycle/6),active:age('reactor')>=0};
}
