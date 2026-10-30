export function createTransport({context,buffer,onEnded=()=>{},onInterrupted=()=>{}}){
  const duration=buffer.duration,gain=context.createGain();gain.connect(context.destination);
  let offset=0,started=0,running=false,source=null,generation=0,disposed=false;
  const position=()=>Math.max(0,Math.min(duration,offset+(running?context.currentTime-started:0)));
  function stopSource(){if(source){const old=source;source=null;try{old.stop();}catch{}old.disconnect();}}
  function pause(){offset=position();running=false;generation++;stopSource();return offset;}
  async function play(at=offset){
    if(disposed)throw Error('Transporte encerrado');
    pause();offset=Math.max(0,Math.min(duration,at));const ticket=++generation;
    await context.resume();if(ticket!==generation||disposed)return false;
    const node=context.createBufferSource();node.buffer=buffer;node.playbackRate.value=1;node.connect(gain);
    node.onended=()=>{
      if(ticket!==generation||!running)return;
      running=false;offset=duration;generation++;node.disconnect();source=null;onEnded();
    };
    source=node;started=context.currentTime;running=true;
    try{node.start(0,offset);}catch(e){pause();throw e;}return true;
  }
  const previous=context.onstatechange;
  context.onstatechange=()=>{
    previous?.();if(running&&context.state!=='running'){pause();onInterrupted();}
  };
  return{duration,position,play,pause,setVolume(value){gain.gain.value=Math.max(0,Math.min(1,value));},
    dispose(){pause();disposed=true;gain.disconnect();context.onstatechange=previous;}};
}
