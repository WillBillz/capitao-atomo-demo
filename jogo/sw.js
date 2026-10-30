import {installPackage,verifyOffline,cacheName} from './src/cache-policy.mjs';
const VERSION='498d83e20f40e6cf',SCOPE=self.registration.scope;
async function manifest(){const response=await fetch(new URL('data/assets.json',SCOPE),{cache:'reload'});if(!response.ok)throw Error('Manifesto ausente');const m=await response.json();if(m.version!==VERSION)throw Error('Versão incompatível');return m;}
self.addEventListener('install',event=>event.waitUntil(manifest().then(m=>installPackage({cacheStorage:caches,manifest:m,scope:SCOPE}))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('capitao-atomo-')&&k!==cacheName(VERSION)).map(k=>caches.delete(k))))));
// No skipWaiting/claim: an active game keeps its current version until its tabs close.
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET'||!request.url.startsWith(SCOPE))return;
  event.respondWith(caches.open(cacheName(VERSION)).then(async cache=>{
    const cached=await cache.match(request,{ignoreSearch:true});if(cached)return cached;
    if(request.mode==='navigate')return (await cache.match(new URL('index.html',SCOPE).href))||fetch(request);
    return fetch(request);
  }).catch(()=>fetch(request)));
});
self.addEventListener('message',event=>{
  if(event.data?.type!=='VERIFY_OFFLINE')return;
  event.waitUntil((async()=>{try{const cache=await caches.open(cacheName(VERSION));const response=await cache.match(new URL('data/assets.json',SCOPE).href);const m=response?await response.json():null;const ready=m?.version===VERSION&&await verifyOffline({cacheStorage:caches,manifest:m,scope:SCOPE});event.ports[0]?.postMessage({ready:!!ready,version:VERSION});}catch{event.ports[0]?.postMessage({ready:false});}})());
});
