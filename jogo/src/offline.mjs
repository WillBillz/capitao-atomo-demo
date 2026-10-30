export async function prepareOffline(onStatus){
  if(!('serviceWorker' in navigator)||!isSecureContext){onStatus('O jogo está pronto para jogar com internet.');return;}
  onStatus('Preparando acesso sem internet…');
  let timer;
  try{
    const manifest=await fetch('data/assets.json').then(r=>{if(!r.ok)throw Error('Pacote de desenvolvimento');return r.json();});
    const registration=await navigator.serviceWorker.register('./sw.js',{type:'module'});
    timer=setTimeout(()=>onStatus('Jogo pronto. O acesso sem internet ainda não foi confirmado.'),25000);
    const verify=worker=>{
      if(!worker)return;
      const channel=new MessageChannel();channel.port1.onmessage=event=>{
        clearTimeout(timer);channel.port1.close();
        onStatus(event.data.ready&&event.data.version===manifest.version?'Pronto para jogar sem internet.':'Jogo pronto. O acesso sem internet não ficou disponível.');
      };worker.postMessage({type:'VERIFY_OFFLINE'},[channel.port2]);
    };
    if(registration.active)verify(registration.active);
    if(registration.installing){const worker=registration.installing;worker.addEventListener('statechange',()=>{
      if(worker.state==='activated')verify(worker);
      if(worker.state==='redundant'){clearTimeout(timer);onStatus('Jogo pronto. O acesso sem internet não ficou disponível.');}
    });}
  }catch{clearTimeout(timer);onStatus('Pronto para jogar com internet.');}
}
