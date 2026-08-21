(()=>{
'use strict';

const BROKER='wss://broker.emqx.io:8084/mqtt';
const BUS='tommart/fm/20260821/9d4a';
const TOP={state:BUS+'/state',command:BUS+'/command',presence:BUS+'/presence',admin:BUS+'/signal/admin'};
const signalTopic=id=>BUS+'/signal/'+id;
const ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];
const RAW='https://raw.githubusercontent.com/YalaCom/radiotommart/main/music/';
const urlFor=f=>RAW+encodeURIComponent(f);

const SPECIAL={
  jingles:[
    {title:'Фирменный джингл TomMart',file:'gemini_generated_video_5EC56A5E 2.mp3'},
    {title:'Джингл перед рекламой',file:'gemini_music_[cut_6sec].mp3'},
    {title:'Джингл «Анекдоты»',file:'gemini-generated-video-347EB0A2-1786537580748-z3e2i.mp3'},
    {title:'Джингл «Уроки самообороны»',file:'gemini-generated-video-A93026D7-1786537444359-7upq5.mp3'}
  ],
  ads:[
    {title:'Реклама TomMart 1',file:'ae6bf76f_-2000108951_1786361749_fc88336ec2613f77119364255812d4c5 (mp3cut.net).mp3'},
    {title:'Реклама TomMart 2',file:'14e75fcb_-2000108951_1786363277_2b854cbe448c07c9e0df74898841a74b.mp3'},
    {title:'Реклама TomMart 3',file:'726f0355_-2000108951_1786433837_87a38f1f3fcf228627af966624732aad.mp3'},
    {title:'Реклама TomMart 4',file:'1f8ea9b0_-2000108951_1786451950_78db1e424f3590d5ecf6b3c8cf087211.mp3'}
  ],
  jokes:[
    {title:'Анекдот 1',file:'6a7f0303a9b67742643247_[cut_5sec].mp3'},
    {title:'Анекдот 2',file:'6a7f0303a9b67742643247_[cut_7sec].mp3'},
    {title:'Анекдот 3',file:'6a7f043678133238779034_[cut_14sec].mp3'},
    {title:'Анекдот 4',file:'6a7f043678133238779034_[cut_8sec].mp3'}
  ]
};

const $=id=>document.getElementById(id);
const syncState=$('syncState'),listenerCount=$('listenerCount'),liveBtn=$('liveBtn'),liveBtnText=$('liveBtnText'),airState=$('airState'),micMeter=$('micMeter'),liveHint=$('liveHint');
const adBtn=$('adBtn'),jokeBtn=$('jokeBtn'),jingleList=$('jingleList'),adList=$('adList'),jokeList=$('jokeList'),studioStatus=$('studioStatus'),studioSub=$('studioSub'),monitorAudio=$('monitorAudio');

let client=null,mic=null,meterStop=null,live=false,session='',busy=false,adCursor=0,jokeCursor=0;
const listeners=new Map(),peers=new Map(),pendingIce=new Map();

function setStatus(main,sub=''){
  studioStatus.textContent=main;studioSub.textContent=sub;
}
function setSync(ok){syncState.classList.toggle('ok',ok);syncState.querySelector('span').textContent=ok?'ONLINE':'RECONNECT'}
function pub(topic,obj,retain=false){try{if(client?.connected)client.publish(topic,JSON.stringify(obj),{qos:0,retain})}catch(_){ }}
function activeListeners(){const now=Date.now();for(const[id,ts]of listeners)if(now-ts>22000){listeners.delete(id);closePeer(id)}listenerCount.textContent=listeners.size;return listeners.size}

function item(x,sub){return{title:x.title,sub,url:urlFor(x.file)}}
function renderRows(el,arr,prefix,onPlay){
  el.innerHTML='';arr.forEach((x,i)=>{
    const row=document.createElement('div');row.className='control-row';
    row.innerHTML=`<div class="num">${prefix}${i+1}</div><div><strong></strong><span></span></div><button>ВКЛЮЧИТЬ</button>`;
    row.querySelector('strong').textContent=x.title;row.querySelector('span').textContent='Старая библиотека TomMart';
    row.querySelector('button').onclick=()=>onPlay(i);el.appendChild(row);
  });
}
function setControls(){
  liveBtn.classList.toggle('on',live);liveBtnText.textContent=live?'ЗАВЕРШИТЬ ЭФИР':'ВЫЙТИ В ЭФИР';airState.textContent=live?'Ты сейчас в эфире':'Эфир выключен';
  adBtn.disabled=busy||live;jokeBtn.disabled=busy||live;
  document.querySelectorAll('.control-row button').forEach(b=>b.disabled=busy||live);
  liveBtn.disabled=busy;
}

async function monitor(items){
  for(const x of items){
    monitorAudio.src=x.url;
    try{await monitorAudio.play()}catch(_){return}
    await new Promise(res=>{let done=false;const fin=()=>{if(done)return;done=true;res()};monitorAudio.onended=fin;monitorAudio.onerror=fin;setTimeout(fin,120000)});
  }
}

async function sendSequence(kind,label,items){
  if(busy||live)return;
  busy=true;setControls();setStatus(label,'Музыка у слушателей поставлена на паузу.');
  const packet={type:'special-sequence',kind,label,items,ts:Date.now(),nonce:crypto.randomUUID?crypto.randomUUID():String(Date.now())};
  pub(TOP.command,packet,false);
  await monitor(items);
  busy=false;setControls();setStatus('Музыка вернулась','Студийная вставка закончилась.');
}

function playAd(i=null){
  const idx=i==null?(adCursor++%SPECIAL.ads.length):i;
  const items=[item(SPECIAL.jingles[1],'Сейчас будет реклама'),item(SPECIAL.ads[idx],'Рекламный ролик')];
  sendSequence('ad','Реклама TomMart',items);
}
function playJoke(i=null){
  const idx=i==null?(jokeCursor++%SPECIAL.jokes.length):i;
  const items=[item(SPECIAL.jingles[2],'Программа «Анекдоты»'),item(SPECIAL.jokes[idx],'Анекдот TomMart')];
  sendSequence('joke','Анекдот TomMart',items);
}
function playJingle(i){sendSequence('jingle',SPECIAL.jingles[i].title,[item(SPECIAL.jingles[i],'Джингл TomMartFM')])}

function closePeer(id){
  const p=peers.get(id);if(p){try{p.close()}catch(_){ }peers.delete(id)}pendingIce.delete(id);
}
function closeAllPeers(){for(const id of [...peers.keys()])closePeer(id)}

async function offerTo(id){
  if(!live||!mic||!client?.connected)return;
  closePeer(id);
  const pc=new RTCPeerConnection({iceServers:ICE});peers.set(id,pc);pendingIce.set(id,[]);
  mic.getTracks().forEach(t=>pc.addTrack(t,mic));
  pc.onicecandidate=e=>{if(e.candidate)pub(signalTopic(id),{type:'ice',session,candidate:e.candidate.toJSON?e.candidate.toJSON():e.candidate})};
  pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState))closePeer(id)};
  try{const off=await pc.createOffer();await pc.setLocalDescription(off);pub(signalTopic(id),{type:'offer',session,sdp:pc.localDescription.sdp})}catch(_){closePeer(id)}
}

async function onAdminSignal(m){
  if(!m?.from||m.session!==session)return;
  listeners.set(m.from,Date.now());activeListeners();
  if(m.type==='live-join'){offerTo(m.from);return}
  if(m.type==='answer'){
    const pc=peers.get(m.from);if(!pc)return;
    try{await pc.setRemoteDescription({type:'answer',sdp:m.sdp});for(const c of pendingIce.get(m.from)||[]){try{await pc.addIceCandidate(c)}catch(_){ }}pendingIce.set(m.from,[])}catch(_){ }
    return;
  }
  if(m.type==='ice'&&m.candidate){
    const pc=peers.get(m.from);if(pc?.remoteDescription)pc.addIceCandidate(m.candidate).catch(()=>{});else{const q=pendingIce.get(m.from)||[];q.push(m.candidate);pendingIce.set(m.from,q)}
  }
}

function startMeter(stream){
  try{
    const AC=window.AudioContext||window.webkitAudioContext,ac=new AC(),src=ac.createMediaStreamSource(stream),an=ac.createAnalyser();an.fftSize=256;src.connect(an);const data=new Uint8Array(an.frequencyBinCount);let raf;
    const tick=()=>{an.getByteFrequencyData(data);let sum=0;for(const x of data)sum+=x;const level=Math.min(100,Math.max(3,(sum/data.length)/1.4));micMeter.style.width=level+'%';raf=requestAnimationFrame(tick)};tick();
    return()=>{cancelAnimationFrame(raf);try{src.disconnect();ac.close()}catch(_){ }};
  }catch(_){return()=>{}}
}

async function startLive(){
  if(busy||live)return;
  busy=true;setControls();setStatus('Запрашиваю микрофон','Разреши доступ к микрофону на телефоне.');
  try{
    mic=await navigator.mediaDevices.getUserMedia({video:false,audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});
    meterStop=startMeter(mic);session=crypto.randomUUID?crypto.randomUUID():'live-'+Date.now();live=true;busy=false;
    pub(TOP.state,{mode:'live',session,ts:Date.now()},true);
    setControls();setStatus('ТЫ В ПРЯМОМ ЭФИРЕ','Музыка у слушателей остановлена, сейчас идёт твой микрофон.');liveHint.textContent='Говори в телефон. Чтобы вернуть музыку — нажми «Завершить эфир».';
    for(const id of listeners.keys())setTimeout(()=>offerTo(id),150);
  }catch(e){
    if(mic)mic.getTracks().forEach(t=>t.stop());mic=null;busy=false;setControls();setStatus('Не удалось включить эфир',e?.name==='NotAllowedError'?'Нет доступа к микрофону.':'Проверь интернет и попробуй ещё раз.');
  }
}
function stopLive(){
  if(!live)return;
  busy=true;setControls();for(const id of listeners.keys())pub(signalTopic(id),{type:'close',session});pub(TOP.state,{mode:'music',ts:Date.now()},true);
  closeAllPeers();if(mic)mic.getTracks().forEach(t=>t.stop());mic=null;if(meterStop)meterStop();meterStop=null;micMeter.style.width='3%';live=false;session='';busy=false;setControls();
  setStatus('Музыка вернулась','Прямой эфир завершён.');liveHint.textContent='Нажми кнопку — телефон запросит доступ к микрофону.';
}

function connect(){
  if(!window.mqtt){setStatus('MQTT не загрузился','Обнови страницу.');return}
  client=mqtt.connect(BROKER,{clientId:'tmfm_admin_'+Math.random().toString(16).slice(2),clean:true,keepalive:20,reconnectPeriod:1800,connectTimeout:10000,protocolVersion:4,resubscribe:true});
  client.on('connect',()=>{setSync(true);client.subscribe([TOP.presence,TOP.admin],{qos:0});pub(TOP.state,{mode:'music',ts:Date.now()},true);setStatus('Студия готова','Связь со слушателями установлена.')});
  client.on('reconnect',()=>setSync(false));client.on('offline',()=>setSync(false));client.on('close',()=>setSync(false));client.on('error',()=>setSync(false));
  client.on('message',(topic,payload)=>{let m;try{m=JSON.parse(payload.toString())}catch(_){return}if(topic===TOP.presence&&m.id){listeners.set(m.id,Date.now());activeListeners();return}if(topic===TOP.admin)onAdminSignal(m)});
}

renderRows(jingleList,SPECIAL.jingles,'J',playJingle);renderRows(adList,SPECIAL.ads,'A',i=>playAd(i));renderRows(jokeList,SPECIAL.jokes,'Ю',i=>playJoke(i));
adBtn.onclick=()=>playAd();jokeBtn.onclick=()=>playJoke();liveBtn.onclick=()=>live?stopLive():startLive();
setInterval(activeListeners,5000);window.addEventListener('beforeunload',()=>{if(live){pub(TOP.state,{mode:'music',ts:Date.now()},true);if(mic)mic.getTracks().forEach(t=>t.stop())}});
setControls();connect();
})();