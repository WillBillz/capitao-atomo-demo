export function classifySwipe({dx,dy,elapsedMs,width,height}) {
  const threshold=Math.max(24,Math.min(width,height)*.065);
  if(elapsedMs>650||Math.abs(dy)<threshold||Math.abs(dy)<Math.abs(dx)*1.35)return null;
  return dy<0?'jump':'duck';
}
export function createInput({surface,punchButton,jumpButton,duckButton,onAction,now,keyTarget=globalThis.window}) {
  const pointers=new Map(),held=new Set(),listeners=[];
  const listen=(el,type,fn)=>{el?.addEventListener(type,fn);listeners.push(()=>el?.removeEventListener(type,fn));};
  const emit=type=>onAction({type,at:now()});
  listen(surface,'pointerdown',e=>{
    if(e.button!=null&&e.button!==0)return;
    e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,at:performance.now()});
    try{surface.setPointerCapture?.(e.pointerId);}catch{}
  });
  listen(surface,'pointercancel',e=>pointers.delete(e.pointerId));
  listen(surface,'lostpointercapture',e=>pointers.delete(e.pointerId));
  listen(surface,'pointerup',e=>{
    const p=pointers.get(e.pointerId);pointers.delete(e.pointerId);if(!p)return;
    const rect=surface.getBoundingClientRect();
    const action=classifySwipe({dx:e.clientX-p.x,dy:e.clientY-p.y,
      elapsedMs:performance.now()-p.at,width:rect.width,height:rect.height});
    if(action){e.preventDefault();emit(action);}
  });
  for(const [button,action] of [[jumpButton,'jump'],[duckButton,'duck'],[punchButton,'punch']]){
    listen(button,'pointerdown',e=>{if(e.button!=null&&e.button!==0)return;e.preventDefault();e.stopPropagation();emit(action);});
    listen(button,'click',e=>{if(e.detail===0){e.preventDefault();emit(action);}});
  }
  const keys={Space:'jump',KeyW:'jump',ArrowUp:'jump',KeyS:'duck',ArrowDown:'duck',
    KeyJ:'punch',KeyZ:'punch',Escape:'pause',KeyP:'pause'};
  listen(keyTarget,'keydown',e=>{
    if(e.target?.matches?.('input,textarea,select,button'))return;
    const action=keys[e.code];if(!action)return;
    e.preventDefault();if(e.repeat||held.has(e.code))return;
    held.add(e.code);emit(action);
  });
  listen(keyTarget,'keyup',e=>held.delete(e.code));
  const clear=()=>{pointers.clear();held.clear();};
  listen(keyTarget,'blur',clear);
  return{clear,destroy(){clear();for(const off of listeners)off();}};
}
