export const cacheName=version=>'capitao-atomo-'+version;
function url(scope,p){return new URL(p,scope).href;}
export async function installPackage({cacheStorage,manifest,scope,fetchFn=fetch}){
  const name=cacheName(manifest.version);
  try{
    const cache=await cacheStorage.open(name);
    for(const file of manifest.files){
      const response=await fetchFn(url(scope,file.path),{cache:'reload'});if(!response.ok)throw Error('Download incompleto: '+file.path);
      if(file.sha256){const hash=await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer());const actual=Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');if(actual!==file.sha256)throw Error('Integridade: '+file.path);}
      await cache.put(url(scope,file.path),response);
    }
    await cache.put(url(scope,'data/assets.json'),new Response(JSON.stringify(manifest),{headers:{'Content-Type':'application/json'}}));
  }catch(error){await cacheStorage.delete(name).catch(()=>{});throw error;}
}
export async function verifyOffline({cacheStorage,manifest,scope}){
  if(!(await cacheStorage.keys()).includes(cacheName(manifest.version)))return false;
  const cache=await cacheStorage.open(cacheName(manifest.version));
  for(const file of manifest.files)if(!(await cache.match(url(scope,file.path))))return false;
  return true;
}
