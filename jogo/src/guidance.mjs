const clamp=x=>Math.max(0,Math.min(1,x));
import {sampleLumiDiscovery} from './lumi-discovery.mjs';
import {activeShieldWindow} from './shield-sequence.mjs';
// Safe retry moments (seconds of the song): each one is outside the portal, prism-bridge and
// shield sequences and leaves at least ~1.5 s before the next machine, so a retry restarts close
// to where the player was hit instead of rewinding a whole section.
export const RETRY_POINTS=[0,8.3,12.6,14.3,18.7,23.3,28.9,36.3,43.5,48.2,56.4,61.5,68.7,73.6,78.5,83.8,89,90.8];
export function retryPoint(failTime){return RETRY_POINTS.filter(t=>t<=failTime-.4).at(-1)??0;}
export function retryLabel(time){const m=Math.floor(time/60),s=Math.floor(time%60);return checkpointLabel(time)+' ('+m+':'+String(s).padStart(2,'0')+')';}
export function checkpointLabel(time){return time>=81.1?'Saída do laboratório':time>=60?'Núcleo do laboratório':time>=31?'Setor central':time>=11.5?'Entrada do laboratório':'Começo da aventura';}
export function sampleGuidance(stage,time){
  if(!stage||stage.victory||time<3.2)return null;
  if(time>=40&&time<43.15&&stage.objects.has('sealed-bulkhead'))return {kind:'helper',action:null,text:time<40.95?(stage.lumi.discoveries?.has('sealed-bulkhead')?'LUMI: MÁQUINA BLINDADA · USE OS PORTAIS':'MÁQUINA GIGANTE · NÃO DÁ PARA PASSAR'):time<41.65?'QUÂNTICO ABRE A ENTRADA E A SAÍDA':time<41.8?'OS DOIS PORTAIS ESTÃO PRONTOS':'ATRAVESSANDO PELOS PORTAIS DO QUÂNTICO',progress:0,urgent:false};
  const contact=stage.cues.find(c=>['contact','gate'].includes(c.kind)&&c.payload.obstacle!=='falling'&&c.at>=time-.05&&c.at-time<2.2&&!stage.completed.has('cleared:'+c.id)&&!(c.kind==='gate'&&(c.payload.requires==='prism'?stage.prismHit:stage.hitPrisms.has(c.payload.requires)||stage.clearedGates.has(c.payload.requires))));
  if(contact){const type=contact.payload.appearance??contact.payload.obstacle??'prism',action=['wave','gap'].includes(type)?'jump':['beam','arm'].includes(type)?'duck':'punch',label={wave:'↑ SALTE A MÁQUINA',gap:'↑ SALTE A ABERTURA',beam:'↓ DESVIE DA MÁQUINA',arm:'↓ DESVIE DA MÁQUINA',calculation:'✦ QUEBRE A PREVISÃO',door:'✦ ABRA A PASSAGEM',prism:'✦ ACERTE O PRISMA'}[type],urgent=contact.at-time<({jump:.55,duck:.5,punch:.65}[action]),discovery=sampleLumiDiscovery(stage,time),hint=discovery.discovered&&!discovery.solved&&discovery.target?.id===(contact.payload.requires??contact.id)?(action==='punch'?'LUMI: PONTO FRACO · ':action==='jump'?'LUMI: CAMINHO REVELADO · ':''):'';return {kind:'action',action,text:hint?hint+label:urgent?label:'PREPARE: '+label,progress:clamp(1-(contact.at-time)/2.2),urgent};}
  if(stage.prismHit&&time>=53.8&&time<55.35)return {kind:'action',action:'jump',text:'↑ SALTE PARA A PONTE',progress:clamp((time-53.8)/1.3),urgent:time>54.7};
  const shield=activeShieldWindow(stage.cues,time);if(shield&&time<shield.releaseAt)return {kind:'helper',action:null,text:time<shield.readyAt?'PEÇAS CAINDO · QUÂNTICO PREPARA O ESCUDO':'QUÂNTICO PROTEGE VOCÊ',progress:0,urgent:false};
  const checkpoint=stage.cues.filter(c=>c.kind==='checkpoint'&&c.at<=time&&time-c.at<1.2).at(-1);
  if(checkpoint)return {kind:'checkpoint',action:null,text:'✓ TRECHO SALVO',progress:0,urgent:false};
  if(time<5.6)return {kind:'controls',action:null,text:'↑ SALTAR · ↓ DESVIAR · ✦ SOCAR',progress:0,urgent:false};
  return null;
}
