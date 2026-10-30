import {createInput} from './input.mjs';
import {loadSettings,saveSettings} from './settings.mjs';
import {loadAssets} from './assets.mjs';
import {createTransport} from './audio-transport.mjs';
import {validateCues} from './timeline.mjs';
import {createRunner} from './runner.mjs';
import {advanceSimulation} from './simulation.mjs';
import {renderFrame} from './renderer.mjs';
import {createStage,stepStage,stageEnvironment} from './stage.mjs';
import {canvasSize} from './animation.mjs';
import {prepareOffline} from './offline.mjs';
import {PRODUCT_MANIFEST} from './product-manifest.mjs';
import {validateRig} from './rig.mjs';
import {createMotion,advanceMotion} from './motion.mjs';
import {validateChoreography,validateEncounters} from './choreography.mjs';
import {validateStory} from './stage-story.mjs';
import {createSceneAudio} from './scene-sound.mjs';
import {sampleGuidance,retryPoint,retryLabel} from './guidance.mjs';
import {createIntroductionClock,renderIntroduction,speechEnvelope} from './introduction.mjs';
import {triggerLaboratory} from './home-experiments.mjs';
import {beginCaptainConversation,advanceCaptainConversation,captainMessage,drawCaptainPortrait} from './captain-conversation.mjs';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
let storage;try{storage=localStorage;}catch{}
const settings=loadSettings(storage),session={mode:'loading',time:0,checkpoint:0,runner:createRunner(),actions:[]};
let audioContext,transport,sceneAudio,assets,playTicket=0,countdownUntil=0,warmed=false,lastFrameTime=0,homeAmbientAt=0,homeExperiments={},lastHomePaint=0,captainConversation={open:false,step:0};
const introduction=createIntroductionClock({onEnd:()=>{stopVoice();start(0,true);}});
let voiceSources=[],voiceGain=null;
// Dr. Certeza's recorded voice follows the introduction clock: it starts, pauses and resumes at the clock's time.
// The discreet intro music plays from the same clock; the mouth still follows only the voice buffer.
function playVoice(){stopVoice();const t=introduction.time,buffers=[assets?.voiceBuffer,assets?.introMusicBuffer].filter(b=>b&&t<b.duration);if(!buffers.length||!audioContext)return;voiceGain=audioContext.createGain();voiceGain.gain.value=settings.volume;voiceGain.connect(audioContext.destination);
  voiceSources=buffers.map(buffer=>{const source=audioContext.createBufferSource();source.buffer=buffer;source.connect(voiceGain);source.start(0,t);return source;});}
function stopVoice(){for(const source of voiceSources){try{source.stop();}catch{}source.disconnect();}voiceGain?.disconnect();voiceSources=[];voiceGain=null;}
const show=(id,yes)=>$(id).hidden=!yes;
const status=text=>$('load-status').textContent=text;
function setMode(mode){session.mode=mode;if(mode==='ended')homeAmbientAt=performance.now();else{show('lab-controls',false);show('captain-conversation',false);captainConversation={open:false,step:0};}$('game').dataset.mode=mode;if(mode!=='playing'){for(const id of ['touch-controls','punch','hint'])show(id,false);$('hint').textContent='';}}
for(const k of ['assisted','effects','subtitles']){$(k).checked=settings[k];$(k).onchange=()=>{settings[k]=$(k).checked;saveSettings(storage,settings);};}
  $('volume').value=settings.volume;$('volume').oninput=()=>{settings.volume=Number($('volume').value);saveSettings(storage,settings);transport?.setVolume(settings.volume*.85*(sceneAudio?.musicLevel??1));sceneAudio?.setVolume(settings.volume);if(voiceGain)voiceGain.gain.value=settings.volume;};
const input=createInput({surface:canvas,punchButton:$('punch'),jumpButton:$('jump'),duckButton:$('duck'),now:()=>session.time,onAction:a=>{
  if(session.mode==='intro'&&a.type==='pause')return pause();
  if(session.mode!=='playing')return;if(a.type==='pause')return pause();
  if(session.stage?.victory||session.time<3.2)return;
  session.actions.push(a);
  canvas.dataset.lastAction=a.type;canvas.dataset.lastActionTime=a.at.toFixed(3);
}});
function updateGuidance(){const g=sampleGuidance(session.stage,session.time),visible=session.mode==='playing'&&session.time>=3.2&&!session.stage.victory;show('touch-controls',visible);show('punch',visible);show('hint',visible&&!!g);const text=g?.text??'';if($('hint').textContent!==text)$('hint').textContent=text;if(g){$('hint').dataset.kind=g.kind;$('hint').style.setProperty('--cue-progress',g.kind==='action'?g.progress:0);}for(const [id,action] of [['jump','jump'],['duck','duck'],['punch','punch']])$(id).classList.toggle('suggested',visible&&g?.urgent&&g.action===action);}
function paint(){
  const began=performance.now();
  const size=canvasSize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio,matchMedia('(pointer:coarse)').matches);
  if(canvas.width!==size.width||canvas.height!==size.height){canvas.width=size.width;canvas.height=size.height;}
  ctx.setTransform(canvas.width/1280,0,0,canvas.height/720,0,0);
  canvas.dataset.sceneTime=session.time.toFixed(3);
  if(assets?.images&&!warmed){for(const image of Object.values(assets.images))ctx.drawImage(image,0,0,2,2);warmed=true;}
  if(['intro','intro-paused','intro-starting'].includes(session.mode)&&assets){const p=renderIntroduction(ctx,{time:introduction.time,assets,effects:settings.effects,voiceLevel:session.mode==='intro'?speechEnvelope(assets.voiceBuffer,introduction.time):0});$('intro-dialogue').textContent=p.line?.text??'';}
  else renderFrame(ctx,{session,assets,settings:{...settings,prompts:false,homeExperiments,captainConversation,homeAmbient:session.mode==='ended'?Math.max(0,(performance.now()-homeAmbientAt)/1000):0}});
  if(session.mode==='ended'&&captainConversation.open&&assets?.images)drawCaptainPortrait($('captain-portrait').getContext('2d'),assets.images['hero-run-v07'],performance.now()/1000);
  canvas.dataset.renderMs=(performance.now()-began).toFixed(2);
}
async function load(){
  setMode('loading');$('start').disabled=true;status('Preparando a música e a aventura…');
  try{
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)throw Error('Este navegador não oferece o áudio necessário.');
    audioContext??=new Context();
    assets=await loadAssets(PRODUCT_MANIFEST,{context:audioContext});
    for(const rig of Object.values(assets.data.rigs))validateRig(rig,assets.images);

    validateCues(assets.cues,103.2);
    validateEncounters(assets.cues);validateChoreography(assets.data.choreography,103.2);
    validateStory(assets.data.story,103.2);
    sceneAudio?.dispose();sceneAudio=createSceneAudio({context:audioContext,volume:settings.volume});
    transport?.dispose();transport=createTransport({context:audioContext,buffer:assets.buffer,
      onEnded:finish,onInterrupted:()=>pause('O áudio foi interrompido. Toque para retomar.')});
    transport.setVolume(settings.volume*.85);reset(0);setMode('menu');$('start').disabled=false;
    $('start').innerHTML='Começar aventura <span>→</span>';status('Música pronta · 1min43s de aventura');
    prepareOffline(text=>$('offline-status').textContent=text);
  }catch(error){setMode('error');$('start').disabled=false;$('start').textContent='Tentar novamente';status('Não foi possível carregar. '+error.message);}
}
async function beginIntroduction(){
  const ticket=++playTicket;transport.pause();stopVoice();sceneAudio.reset(0);input.clear();reset(0);introduction.reset();setMode('intro-starting');
  for(const id of ['menu','pause-screen','help-screen','end-screen','hud'])show(id,false);
  try{await audioContext.resume();if(ticket!==playTicket)return;setMode('intro');introduction.play();playVoice();show('intro-controls',true);sceneAudio.play('hologram');canvas.focus();orient();}
  catch{if(ticket===playTicket)pause('Toque para continuar a transmissão.');}
}
async function start(offset=0,skipIntroduction=false){
  if(!transport||session.mode==='error')return load();
  if(offset===0&&!skipIntroduction)return beginIntroduction();
  show('intro-controls',false);$('intro-dialogue').textContent='';
  const ticket=++playTicket;input.clear();session.actions=[];
  if(offset===0)reset(0);
  setMode('starting');
  try{
    const ok=await transport.play(offset);if(!ok||ticket!==playTicket)return;
    session.time=offset;
    sceneAudio?.reset(offset);
    for(const id of ['menu','pause-screen','help-screen','end-screen'])show(id,false);
    show('hud',true);show('punch',offset>=3.2);setMode('playing');canvas.focus();
    orient();
  }catch(error){if(ticket===playTicket)pause('Toque em Continuar para ativar o som. '+error.message);}
}
function pause(reason='A aventura espera por você.'){
  if(['intro','intro-starting'].includes(session.mode)){
    playTicket++;introduction.pause();stopVoice();sceneAudio?.reset(0);input.clear();setMode('intro-paused');show('intro-controls',false);
    $('pause-title').textContent='Transmissão pausada';$('pause-reason').textContent=reason;$('resume').textContent='Continuar introdução →';$('resume-point').textContent='A introdução continua de onde parou.';show('pause-screen',true);$('resume').focus();return;
  }
  if(!['playing','starting','countdown'].includes(session.mode))return;
  playTicket++;transport?.pause();sceneAudio?.reset(session.time);input.clear();setMode('paused');
  $('pause-title').textContent='Pronto para continuar?';$('resume').textContent='Continuar →';
  $('resume-point').textContent='A música continua de onde parou.';
  $('pause-reason').textContent=reason;show('pause-screen',true);$('resume').focus();
}
function reset(time){homeExperiments={};session.time=time;session.runner=createRunner();session.motion=createMotion(session.runner,time);session.actions=[];session.checkpoint=time;session.stage=createStage({cues:assets.cues,time,checkpoint:time,assisted:settings.assisted});}
function recover(reason){
  playTicket++;transport.pause();sceneAudio?.reset(session.time);input.clear();const cp=retryPoint(session.time);reset(cp);setMode('retry');
  $('pause-title').textContent='Vamos tentar outra possibilidade?';$('pause-reason').textContent=reason;
  $('resume-point').textContent='Retomar perto de onde parou: '+retryLabel(cp)+'.';
  $('resume').textContent='Tentar do trecho →';show('pause-screen',true);show('punch',false);$('resume').focus();
}
// A frame that arrives late (the computer stalled) is not the player's fault: never show the retry
// screen for it. A short stall silently re-syncs the song to the last simulated moment; a long one
// (tab frozen) pauses at that same moment.
function handleInterruption(gap=Infinity){
  if(session.stage?.victory)return pause('A cena final foi pausada. Toque para continuar de onde parou.');
  if(gap<=1.5)return start(session.time,true);
  pause('O jogo travou por um instante. Toque em Continuar para seguir de onde parou.');
}
async function resume(){
  if(session.mode==='intro-paused'){
    const ticket=++playTicket;try{await audioContext.resume();}catch{return;}
    if(ticket!==playTicket||document.hidden||needsRotation())return;
    show('pause-screen',false);setMode('intro');show('intro-controls',true);introduction.play();playVoice();canvas.focus();return;
  }
  if(session.mode!=='retry')return start(session.time,true);
  const ticket=++playTicket;setMode('starting');
  try{await audioContext.resume();}catch{if(ticket===playTicket)pause('Toque novamente para ativar o som.');return;}
  if(ticket!==playTicket||document.hidden||needsRotation())return;
  setMode('countdown');countdownUntil=performance.now()+3000;show('pause-screen',false);show('caption',true);
}
function menu(){
  stopVoice();introduction.reset();show('intro-controls',false);$('intro-dialogue').textContent='';
  playTicket++;transport?.pause();sceneAudio?.reset(0);setMode(assets?'menu':'error');session.time=0;input.clear();
  for(const id of ['hud','punch','pause-screen','help-screen','end-screen','rotate'])show(id,false);
  show('menu',true);$('hint').textContent='';$('start').focus();
}
function finish(){if(session.mode!=='playing')return;if(transport&&transport.position()<transport.duration-.05)return;if(!session.stage?.victory)return recover('A aventura foi interrompida. Vamos tentar de novo.');setMode('ended');input.clear();show('punch',false);show('hud',false);show('end-screen',false);talkToCaptain();}
function syncCaptainConversation(){const open=session.mode==='ended'&&captainConversation.open;show('captain-conversation',open);show('lab-controls',session.mode==='ended'&&!open);$('captain-text').textContent=captainMessage(captainConversation);$('captain-next').textContent=captainConversation.step===2?'Pode contar comigo!':'Continuar →';$('captain-progress').textContent=(captainConversation.step+1)+' de 3';}
function talkToCaptain(){if(session.mode!=='ended')return;captainConversation=beginCaptainConversation();syncCaptainConversation();$('captain-next').focus();}
function nextCaptainMessage(){if(session.mode!=='ended')return;captainConversation=advanceCaptainConversation(captainConversation);syncCaptainConversation();if(!captainConversation.open){$('lab-status').textContent='Combinado! Ainda há muitas possibilidades para descobrir.';$('lab-reactor').focus();}}
function skipCaptainMessage(){if(session.mode!=='ended')return;captainConversation={...captainConversation,open:false};syncCaptainConversation();$('lab-status').textContent='Escolha uma experiência com a equipe.';$('lab-reactor').focus();}
async function experiment(kind){
  if(session.mode!=='ended')return;
  const time=session.time+Math.max(0,(performance.now()-homeAmbientAt)/1000),next=triggerLaboratory(homeExperiments,kind,time);if(next===homeExperiments)return;homeExperiments=next;
  $('lab-status').textContent={reactor:'Capitão Átomo energizou o reator!',garden:'Lumi despertou novas possibilidades!',portal:'Quântico está transportando o cristal!'}[kind];
  const ticket=playTicket;try{await audioContext?.resume();if(ticket===playTicket&&session.mode==='ended'&&settings.volume>0)sceneAudio?.play({reactor:'punch',garden:'discovery',portal:'portalCharge'}[kind]);}catch{}
}
// A narrow desktop panel still has keyboard/mouse controls and can letterbox the stage.
function needsRotation(){return innerHeight>innerWidth&&matchMedia('(pointer: coarse) and (hover: none)').matches;}
function orient(){const rotate=needsRotation();if(rotate&&['playing','starting','countdown','intro','intro-starting'].includes(session.mode))pause('Vire o celular para continuar.');show('rotate',rotate&&['paused','retry','intro-paused'].includes(session.mode));}
function frame(now=performance.now()){
  canvas.dataset.frameIntervalMs=(lastFrameTime?now-lastFrameTime:0).toFixed(2);lastFrameTime=now;
  if(session.mode==='intro')introduction.tick();
  if(session.mode==='playing'){
    const t=transport.position();
    canvas.dataset.audioGapMs=((t-session.time)*1000).toFixed(2);
    const result=advanceSimulation(session,t,{environment:(time,r)=>stageEnvironment(session.stage,time,r),afterStep:range=>{
      Object.assign(session,stepStage(session.stage,session.runner,range));
      session.motion=advanceMotion(session.motion,session.runner,range.to);
      if(session.stage.failed)return false;
      session.checkpoint=session.stage.checkpoint;
      if(session.stage.victory)show('punch',false);
    }});
    if(result.interrupted)handleInterruption(t-session.time);
    else if(session.stage.failed)recover(session.stage.failureReason);
    if(session.mode==='playing'){sceneAudio?.sync(session);transport.setVolume(settings.volume*.85*(sceneAudio?.musicLevel??1));}
    $('progress').style.width=(t/transport.duration*100)+'%';
    $('time').textContent=Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
    if(session.mode==='playing')show('punch',t>=3.2&&!session.stage.victory);
  }
  if(session.mode==='countdown'){
    const left=countdownUntil-performance.now();$('caption').textContent=Math.max(1,Math.ceil(left/1000));
    if(left<=0){show('caption',false);start(session.time,true);}
  }else show('caption',false);
  updateGuidance();if(session.mode!=='ended'||now-lastHomePaint>=1000/24){paint();lastHomePaint=now;}requestAnimationFrame(frame);
}
$('start').onclick=()=>start();$('help').onclick=()=>{show('help-screen',true);$('close-help').focus();};
$('skip-intro').onclick=()=>{if(session.mode==='intro'){stopVoice();introduction.skip();}};$('pause-intro').onclick=()=>pause();
$('close-help').onclick=()=>{show('help-screen',false);$('help').focus();};
$('pause').onclick=()=>pause();$('resume').onclick=resume;
$('restart').onclick=()=>start(0);
for(const id of ['back','end-back','rotate-back'])$(id).onclick=menu;$('again').onclick=()=>start(0);
for(const kind of ['reactor','garden','portal'])$('lab-'+kind).onclick=()=>experiment(kind);
$('captain-next').onclick=nextCaptainMessage;$('captain-skip').onclick=skipCaptainMessage;$('lab-talk').onclick=talkToCaptain;
$('lab-again').onclick=()=>start(0);$('lab-back').onclick=menu;
addEventListener('resize',orient);addEventListener('blur',()=>pause());
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('A aventura foi pausada enquanto você estava fora.');});
load();requestAnimationFrame(frame);
