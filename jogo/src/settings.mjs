const memory=new WeakMap();let fallback;
const defaults=()=>({volume:.8,assisted:true,effects:true,subtitles:true});
function normalize(v={}){return{volume:Number.isFinite(v.volume)?Math.max(0,Math.min(1,v.volume)):.8,
  assisted:typeof v.assisted==='boolean'?v.assisted:true,effects:typeof v.effects==='boolean'?v.effects:true,subtitles:typeof v.subtitles==='boolean'?v.subtitles:true};}
export function loadSettings(storage){
  if(storage&&memory.has(storage))return{...memory.get(storage)};
  try{const value=normalize(JSON.parse(storage?.getItem('capitao-settings')||'{}'));
    if(storage)memory.set(storage,value);return value;
  }catch{return{...(fallback||defaults())};}
}
export function saveSettings(storage,value){
  const v=normalize(value);if(storage)memory.set(storage,v);else fallback=v;
  try{storage?.setItem('capitao-settings',JSON.stringify(v));}catch{}
  return v;
}
