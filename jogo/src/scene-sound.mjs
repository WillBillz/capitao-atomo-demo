import {sampleFootfalls} from './motion.mjs';import {RUN_START} from './pace.mjs';
import {DOCTOR_TELEPORT} from './doctor-teleport.mjs';
import {SHIP_CRASH} from './ship-crash.mjs';
export function soundEventsBetween(session,from,to){
  if(to<=from||to-from>.25)return [];const r=session.runner,s=session.stage,events=[];
  const add=(id,kind,at)=>{if(Number.isFinite(at)&&at>from&&at<=to)events.push({id,kind,at});};
  for(const [id,kind,at] of [['entry-portal','portal',.05],['entry-jump','jump',.3],['entry-land','land',1.1],['lumi-entry','portal',3.1],['quantico-entry','portal',4.4],['calculation-projector','projection',5.9],['exit-portal','portal',95.5]])add(id,kind,at);
  if(s.objects?.has('sealed-bulkhead')){add('sealed-bulkhead-lock','motor',39.8);add('doctor-hologram-depart','hologram',DOCTOR_TELEPORT.departAt);add('doctor-hologram-arrive','hologram',DOCTOR_TELEPORT.arriveAt);}
  if(s.objects?.has('sealed-bulkhead'))for(const at of [40.43,42.46])add('robot-piston:'+at,'gear',at);
  if(s.victory&&!s.failed){add('ship-engine-failure','engineFail',SHIP_CRASH.engineAt);add('ship-impact','crash',SHIP_CRASH.impactAt);for(const at of SHIP_CRASH.shorts)add('ship-short:'+at,'shortCircuit',at);for(const at of SHIP_CRASH.clinks)add('ship-debris:'+at,'boltClink',at);add('home-reactivation','discovery',100.85);}
  for(const e of s.sceneEvents??[])if(['portalCharge','portal','portalExit'].includes(e.kind))add('passage:'+e.id,e.kind==='portalCharge'?'portalCharge':e.kind==='portalExit'?'portalExit':'portal',e.at);
  for(const e of s.sceneEvents??[])if(e.kind==='lumiDiscovery')add(e.id,'discovery',e.at);
  for(const [key,kind] of [['jumpedAt','jump'],['punchedAt','punch'],['duckedAt','slide'],['landedAt','land']])if(r[key]>=0)add(kind+':'+r[key],kind,r[key]);
  if(r.grounded&&r.h!==64&&to>=3.15)for(const step of sampleFootfalls(to,r.landedAt>=0?r.landedAt:RUN_START))add('step:'+step.side+':'+step.at,'step',step.at);
  add('closing-behind','motor',49.38);
  for(const [id,o] of s.objects??[])if(o.appearance==='door'){add('motor:'+id,'motor',o.at-1.4);if(!s.hitPrisms?.has(id))add('slam:'+id,'doorSlam',o.at-.78);}
  for(const e of s.sceneEvents??[])if(e.kind==='prismHit')add('break:'+e.id,'break',e.at);else if(e.kind==='shieldHit')add('shield:'+e.id,'shield',e.at);else if(e.kind==='toolFire'&&['wave','beam','arm'].includes(e.payload.tool)){add('launch:'+e.id,'whoosh',e.at);add('rebuild:'+e.id,'rebuild',e.at+.1);}
  for(const e of s.sceneEvents??[])if(e.kind==='projectionStart')add('charge:'+e.id,'laserCharge',e.at);else if(e.kind==='shieldStart')add('barrier:'+e.id,'barrier',e.at);else if(e.kind==='toolFire'&&e.payload.tool==='projector')for(let i=0;i<3;i++)add('laser:'+e.id+':'+i,'laser',e.at+i*.16);
  return events.sort((a,b)=>a.at-b.at);
}
export function createSoundConductor(play){
  let previous=0;return {reset(time=0){previous=time;},sync(session,{enabled=true}={}){const events=enabled?soundEventsBetween(session,previous,session.time):[];previous=session.time;for(const e of events)play(e);return events;}};
}
// Swish at wind-up, body and crack at fist extension, then a short atomic resonance.
export const PUNCH_SOUND_LAYERS=[
  {noise:true,duration:.09,gain:.15,cutoff:1100,filter:'highpass',delay:0},
  {noise:true,duration:.055,gain:.24,cutoff:3900,filter:'highpass',delay:.055},
  {a:165,b:44,duration:.24,gain:.4,type:'sine',delay:.055},
  {a:290,b:85,duration:.075,gain:.11,type:'triangle',delay:.06},
  {a:1180,b:290,duration:.21,gain:.09,type:'sine',delay:.075},
  {noise:true,duration:.27,gain:.09,cutoff:900,filter:'lowpass',delay:.1},
  {a:440,b:130,duration:.18,gain:.035,type:'sine',delay:.19}
];
export function createSceneAudio({context,volume=.7}){
  const master=context.createGain();master.gain.value=volume*.9;master.connect(context.destination);const active=new Set();let played=0,disposed=false,duckAt=-Infinity;
  const noise=context.createBuffer(1,Math.ceil(context.sampleRate*.6),context.sampleRate),samples=noise.getChannelData(0);let seed=817;
  for(let i=0;i<samples.length;i++){seed=(seed*1664525+1013904223)>>>0;samples[i]=seed/2147483648-1;}
  function source(node,gain,duration,at){
    const envelope=context.createGain();envelope.gain.setValueAtTime(.0001,at);envelope.gain.exponentialRampToValueAtTime(gain,at+.012);envelope.gain.exponentialRampToValueAtTime(.0001,at+duration);
    node.connect(envelope);envelope.connect(master);active.add(node);node.onended=()=>{active.delete(node);node.disconnect();envelope.disconnect();};node.start(at);node.stop(at+duration+.025);
  }
  function tone(a,b,duration,gain=.2,type='triangle',delay=0){const at=context.currentTime+.003+delay,node=context.createOscillator();node.type=type;node.frequency.setValueAtTime(a,at);node.frequency.exponentialRampToValueAtTime(b,at+duration);source(node,gain,duration,at);}
  function rush(duration,gain=.16,cutoff=1200,delay=0,filterType='lowpass'){const node=context.createBufferSource();node.buffer=noise;const filter=context.createBiquadFilter();filter.type=filterType;filter.frequency.value=cutoff;node.connect(filter);
    const at=context.currentTime+.003+delay,envelope=context.createGain();envelope.gain.setValueAtTime(.0001,at);envelope.gain.exponentialRampToValueAtTime(gain,at+.012);envelope.gain.exponentialRampToValueAtTime(.0001,at+duration);filter.connect(envelope);envelope.connect(master);active.add(node);node.onended=()=>{active.delete(node);node.disconnect();filter.disconnect();envelope.disconnect();};node.start(at);node.stop(at+duration+.02);}
  function playEffect(kind){
    if(disposed)return;played++;
    if(['punch','break','jump','slide','whoosh','laser','shield','crash','doorSlam'].includes(kind))duckAt=context.currentTime;
    if(kind==='portal'){tone(180,740,.48,.18,'sine');tone(370,1110,.42,.09,'triangle',.06);rush(.38,.08,1900);}
    else if(kind==='portalCharge'){tone(145,690,.7,.13,'sine');tone(290,1380,.62,.06,'triangle',.06);rush(.55,.08,2300);}
    else if(kind==='portalExit'){tone(980,390,.3,.18,'sine');tone(490,740,.23,.08,'triangle',.035);rush(.24,.19,2100);}
    else if(kind==='hologram'){tone(880,1760,.12,.1,'sine');tone(1760,440,.2,.08,'triangle',.06);rush(.16,.09,3300,0,'highpass');}
    else if(kind==='discovery'){tone(660,660,.13,.085,'sine');tone(990,990,.18,.075,'sine',.075);tone(1320,1320,.23,.045,'sine',.15);}
    else if(kind==='gear'){rush(.12,.12,2700);tone(330,90,.18,.13,'triangle');}
    else if(kind==='doorSlam'){rush(.22,.22,800);tone(110,38,.25,.24,'sine');tone(420,150,.2,.06,'triangle',.04);}
    else if(kind==='engineFail'){tone(180,42,.6,.18,'sawtooth');for(let i=0;i<4;i++)rush(.07,.1,850,i*.12);}
    else if(kind==='shortCircuit'){for(let i=0;i<4;i++){rush(.028,.065,3800,i*.045,'highpass');tone(1400+i*260,220+i*70,.045,.035,'sawtooth',i*.045);}tone(95,48,.19,.06,'triangle');}
    else if(kind==='boltClink'){tone(2100,1850,.1,.08,'sine');tone(3300,2700,.075,.035,'triangle',.018);rush(.045,.04,3200,0,'highpass');tone(1200,700,.12,.035,'sine',.085);}
    else if(kind==='crash'){rush(.52,.3,900);rush(.13,.2,3800);tone(100,27,.6,.32,'sine');tone(920,140,.4,.09,'triangle',.04);tone(240,65,.36,.12,'triangle',.025);rush(.35,.09,2400,.16);}
    else if(kind==='jump'){tone(420,940,.2,.27,'sine');tone(700,1500,.13,.08,'triangle',.02);rush(.15,.13,2400);}
    else if(kind==='punch')for(const layer of PUNCH_SOUND_LAYERS){if(layer.noise)rush(layer.duration,layer.gain,layer.cutoff,layer.delay,layer.filter);else tone(layer.a,layer.b,layer.duration,layer.gain,layer.type,layer.delay);}
    else if(kind==='slide'){rush(.32,.23,1700);tone(320,140,.18,.1);}
    else if(kind==='break'){rush(.3,.32,3200);tone(1100,700,.18,.08,'sine');tone(1450,950,.2,.06,'sine',.04);}
    else if(kind==='motor'){tone(130,65,.45,.14,'triangle');rush(.4,.1,450);}
    else if(kind==='land'){tone(95,42,.12,.18,'sine');rush(.12,.12,450);}
    else if(kind==='shield'){tone(740,340,.25,.2,'sine');tone(1100,1600,.28,.1,'sine',.04);rush(.18,.17,2800);}
    else if(kind==='laserCharge'){tone(180,880,.55,.12,'sine');tone(360,1760,.45,.05,'triangle',.05);}
    else if(kind==='laser'){tone(1450,380,.21,.18,'triangle');rush(.14,.1,2800);}
    else if(kind==='barrier'){tone(420,840,.4,.13,'sine');tone(630,1260,.34,.07,'sine',.06);}
    else if(kind==='step'){tone(130,65,.055,.07,'sine');rush(.045,.025,750);}
    else if(kind==='rebuild'){tone(600,900,.13,.1,'sine');tone(900,1400,.14,.08,'sine',.07);}
    else if(kind==='projection'){tone(260,900,.28,.16,'sine');rush(.22,.08,1800);}
    else{rush(.3,.22,2400);tone(580,170,.18,.12);}
  }
  const conductor=createSoundConductor(e=>playEffect(e.kind));
  function reset(time=0){conductor.reset(time);for(const node of active){try{node.stop();}catch{}}active.clear();duckAt=-Infinity;}
  return {sync(session,options={}){if(disposed)return [];return conductor.sync(session,options);},play:playEffect,reset,setVolume(value){master.gain.setTargetAtTime(Math.max(0,Math.min(1,value))*.9,context.currentTime,.025);},get played(){return played;},get musicLevel(){const u=Math.max(0,Math.min(1,(context.currentTime-duckAt)/.26));return .68+.32*u*u*(3-2*u);},dispose(){reset();disposed=true;master.disconnect();}};
}
