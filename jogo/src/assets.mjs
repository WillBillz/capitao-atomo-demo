async function decodeImage(blob){
  if(globalThis.createImageBitmap)return createImageBitmap(blob);
  const image=new Image(),url=URL.createObjectURL(blob);
  try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});return image;}
  finally{URL.revokeObjectURL(url);}
}
export async function loadAssets(manifest,{context,signal,fetchFn=globalThis.fetch,timeoutMs=60000}={}){
  const abort=new AbortController(),forward=()=>abort.abort();signal?.addEventListener('abort',forward,{once:true});
  if(signal?.aborted)abort.abort();
  let rejectDeadline;const deadline=new Promise((_,reject)=>{rejectDeadline=reject;});
  const cancelled=()=>rejectDeadline(Error('Carregamento interrompido ou tempo esgotado.'));
  abort.signal.addEventListener('abort',cancelled,{once:true});if(abort.signal.aborted)cancelled();
  const timer=setTimeout(()=>abort.abort(),timeoutMs);
  async function request(url){const res=await fetchFn(url,{signal:abort.signal});if(!res.ok)throw Error(`Falha ao carregar (${res.status}): ${url}`);return res;}
  try{return await Promise.race([deadline,(async()=>{
    const audio=await request(manifest.audio),buffer=await context.decodeAudioData(await audio.arrayBuffer());
    // The intro voice is optional: the adventure still starts if it fails to load.
    const voiceBuffer=manifest.voice?await request(manifest.voice).then(r=>r.arrayBuffer()).then(b=>context.decodeAudioData(b)).catch(()=>null):null;
    const images=Object.fromEntries(await Promise.all(Object.entries(manifest.images||{}).map(async([id,url])=>{
      const response=await request(url);return[id,await decodeImage(await response.blob())];
    })));
    const data=manifest.cues?await(await request(manifest.cues)).json():[];
    const sprites=manifest.sprites?await(await request(manifest.sprites)).json():null;
    const extra=Object.fromEntries(await Promise.all(Object.entries(manifest.data||{}).map(async([key,url])=>[key,await(await request(url)).json()])));
    // Discreet background music under the intro speech; optional like the voice.
    const introMusicBuffer=manifest.introMusic?await request(manifest.introMusic).then(r=>r.arrayBuffer()).then(b=>context.decodeAudioData(b)).catch(()=>null):null;
    return{buffer,voiceBuffer,introMusicBuffer,images,cues:data,sprites,data:extra};
  })()]);}finally{clearTimeout(timer);signal?.removeEventListener('abort',forward);abort.signal.removeEventListener('abort',cancelled);}
}
