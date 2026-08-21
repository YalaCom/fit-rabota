(()=>{
'use strict';

const tg=window.Telegram?.WebApp;
try{tg?.ready();tg?.expand();tg?.setHeaderColor?.('#07090d');tg?.setBackgroundColor?.('#07090d')}catch(_){}

const RAW='https://raw.githubusercontent.com/YalaCom/radiotommart/main/music/';
const DURATIONS='https://raw.githubusercontent.com/YalaCom/radiotommart/main/durations-v15.json';
const BROKER='wss://broker.emqx.io:8084/mqtt';
const BUS='tommart/fm/one-wave/v2/20260821';
const TOP={station:BUS+'/station',presence:BUS+'/presence',admin:BUS+'/signal/admin'};
const signalTopic=id=>BUS+'/signal/'+id;
const ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];
const ANCHOR=Date.UTC(2026,7,21,0,0,0);

const SPECIAL={
  radioJingle:{title:'Фирменный джингл TomMart',file:'gemini_generated_video_5EC56A5E 2.mp3'},
  adJingle:{title:'Джингл перед рекламой',file:'gemini_music_[cut_6sec].mp3'},
  jokeJingle:{title:'Джингл «Анекдоты»',file:'gemini-generated-video-347EB0A2-1786537580748-z3e2i.mp3'},
  selfDefenseJingle:{title:'Джингл «Уроки самообороны»',file:'gemini-generated-video-A93026D7-1786537444359-7upq5.mp3'},
  laugh:{title:'Смех в студии',file:'a2ae7f65eb5f5fd.mp3'},
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
const JINGLES=[SPECIAL.radioJingle,SPECIAL.adJingle,SPECIAL.jokeJingle,SPECIAL.selfDefenseJingle];

const KNOWN_TITLES={
 '%d0%9c%d0%be%d0%bb%d0%b4%d0%b0%d0%b2%d1%81%d0%ba%d0%b0%d1%8f%20-%20%d0%9c%d0%be%d0%bb%d0%b4%d0%b0%d0%b2%d1%81%d0%ba%d0%b0%d1%8f.mp3.mp3':'Молдавская — Молдавская',
 'Akmal_Grigorijj_Leps_-_SHutka_80838502.mp3':'Akmal’ & Григорий Лепс — Шутка',
 'Grigorijj_Leps_Andrejj_Davinchi_-_Zanovo_nachat_79421060.mp3':'Григорий Лепс & Андрей Davinchi — Заново начать',
 'Kipelov_-_YA_svoboden_(musmore.org).mp3':'Кипелов — Я свободен',
 'Kleopatra_Stratan_-_Ghi_Gicu_(musportal.org).mp3':'Cleopatra Stratan — Ghi Gicu',
 'Korol_i_SHut_-_Durak_i_molniya_(musmore.org).mp3':'Король и Шут — Дурак и молния',
 'Korol_i_SHut_-_Kukla_kolduna_(musmore.org).mp3':'Король и Шут — Кукла колдуна',
 'Leonid_Agutin_DJ_DANI_WOO_-_Ostrov_78425583.mp3':'Леонид Агутин & DJ DANI WOO — Остров',
 'Leprikonsy_-_KHali-gali_paratruper_(musmore.org).mp3':'Леприконсы — Хали-гали, паратрупер',
 'Sektor_Gaza_-_Pora_domojj_(musmore.org).mp3':'Сектор Газа — Пора домой',
 'Sektor_Gaza_-_Tuman_(musmore.org).mp3':'Сектор Газа — Туман',
 'Splin_-_Vykhoda_net_(musmore.org).mp3':'Сплин — Выхода нет',
 'ace-of-base-beautiful-life.mp3':'Ace of Base — Beautiful Life',
 'basta-vypusknojj-medljachok.mp3':'Баста — Выпускной (Медлячок)',
 'chajj-vdvoem-malchishka-malchishka-kotoromu-dazhe-16-net.mp3':'Чай вдвоём — Мальчишка',
 'ed-sheeran-shape-of-you.mp3':'Ed Sheeran — Shape of You',
 'elton-john-dua-lipa-cold-heart-pnau-remix.mp3':'Elton John & Dua Lipa — Cold Heart',
 'imagine-dragons-thunder.mp3':'Imagine Dragons — Thunder',
 'luis-fonsi-feat.-daddy-yankee-despacito.mp3':'Luis Fonsi feat. Daddy Yankee — Despacito',
 'madcon-beggin.mp3':'Madcon — Beggin',
 'nico-vinz-am-i-wrong.mp3':'Nico & Vinz — Am I Wrong',
 'ruki-vverkh-plachesh-v-temnote.mp3':'Руки Вверх! — Плачешь в темноте',
 'the-weeknd-blinding-lights.mp3':'The Weeknd — Blinding Lights',
 'grigorijj-leps-chto-zh-ty-natvorila.mp3':'Григорий Лепс — Что ж ты натворила',
 'jony-titry.mp3':'JONY — Титры',
 'coldplay-a-sky-full-of-stars.mp3':'Coldplay — A Sky Full of Stars',
 'Liliana_-_Mariana_(Zvyki.com).mp3':'Liliana — Mariana',
 'Miyagi_-_Marlboro_(eu.monfons.com).mp3':'Miyagi — Marlboro',
 'Stas_Mikhajjlov_-_Tam_(eu.monfons.com).mp3':'Стас Михайлов — Там'
};

const $=id=>document.getElementById(id);
const audio=$('audio'),specialAudio=$('specialAudio'),liveAudio=$('liveAudio');
const playBtn=$('playBtn'),playIcon=$('playIcon'),title=$('trackTitle'),artist=$('trackArtist'),nowLabel=$('nowLabel');
const progress=$('progress'),currentTime=$('currentTime'),duration=$('duration'),volume=$('volume'),volumeValue=$('volumeValue');
const vinyl=$('vinyl'),signal=$('signal'),list=$('playlist'),count=$('trackCount'),livePill=$('livePill'),livePillText=$('livePillText'),modeValue=$('modeValue');
const studioToggle=$('studioToggle'),studioPanel=$('studioPanel'),studioChevron=$('studioChevron'),syncState=$('syncState'),listenerCount=$('listenerCount');
const liveBtn=$('liveBtn'),liveBtnText=$('liveBtnText'),airState=$('airState'),micMeter=$('micMeter'),adBtn=$('adBtn'),jokeBtn=$('jokeBtn'),jingleBtn=$('jingleBtn');
const studioStatus=$('studioStatus'),studioSub=$('studioSub'),jingleList=$('jingleList'),adList=$('adList'),jokeList=$('jokeList');

const fmt=s=>{if(!Number.isFinite(s)||s<0)return'0:00';const m=Math.floor(s/60),sec=Math.floor(s%60).toString().padStart(2,'0');return`${m}:${sec}`};
const urlFor=f=>RAW+encodeURIComponent(f);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const makeId=()=>{try{let id=localStorage.getItem('tommartfm_onewave_id');if(!id){id=crypto.randomUUID?crypto.randomUUID():'u-'+Math.random().toString(36).slice(2)+Date.now();localStorage.setItem('tommartfm_onewave_id',id)}return id}catch(_){return'u-'+Math.random().toString(36).slice(2)+Date.now()}};
const listenerId=makeId();

let manifest=null,library=[],program=[],cycleDuration=0,clockOffset=0,ready=false,listening=false,syncing=false,currentMusicKey='',currentSpecialKey='';
let mqttLink=null,station={rev:0,baseDelayMs:0,mode:'music'};
let livePc=null,pendingLiveIce=[],liveSession='';
let broadcasting=false,broadcastSession='',mic=null,meterStop=null;
const listeners=new Map(),peers=new Map(),pendingPeerIce=new Map();
let adCursor=0,jokeCursor=0,jingleCursor=0;

function radioNow(){return Date.now()+clockOffset}
function prettyTitle(file){
  if(KNOWN_TITLES[file])return KNOWN_TITLES[file];
  let s=file;try{s=decodeURIComponent(s)}catch(_){}
  s=s.replace(/\.mp3(?:\.mp3)?$/i,'').replace(/\((?:musmore\.org|musportal\.org|eu\.monfons\.com|Zvyki\.com)\)/gi,'').replace(/_\d{6,}$/,'').replace(/_-_/g,' — ').replace(/_/g,' ').replace(/\s+/g,' ').trim();
  if(s.includes(' - ')){const p=s.split(' - ');if(p.length===2)return p[1].trim()+' — '+p[0].trim()}
  return s;
}
function randFactory(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function fixedShuffle(a){const out=a.slice(),r=randFactory(0x51F17A);for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function buildLibrary(){
  const excluded=new Set([SPECIAL.radioJingle.file,SPECIAL.adJingle.file,SPECIAL.jokeJingle.file,SPECIAL.selfDefenseJingle.file,SPECIAL.laugh.file,...SPECIAL.ads.map(x=>x.file),...SPECIAL.jokes.map(x=>x.file)]);
  library=Object.keys(manifest).filter(f=>/\.mp3(?:\.mp3)?$/i.test(f)&&!excluded.has(f)&&Number(manifest[f])>0).sort((a,b)=>a<b?-1:a>b?1:0).map(file=>({file,title:prettyTitle(file),dur:Number(manifest[file])}));
  const shuffled=fixedShuffle(library);let pos=0;
  program=shuffled.map((x,i)=>{const y={...x,index:i,start:pos,end:pos+x.dur};pos=y.end;return y});
  cycleDuration=pos;
  if(!program.length||!cycleDuration)throw Error('EMPTY_PROGRAM');
}
function programState(programMs){
  let sec=((programMs-ANCHOR)/1000)%cycleDuration;if(sec<0)sec+=cycleDuration;
  let lo=0,hi=program.length-1;
  while(lo<=hi){const mid=(lo+hi)>>1,x=program[mid];if(sec<x.start)hi=mid-1;else if(sec>=x.end)lo=mid+1;else return{...x,offset:sec-x.start}}
  const x=program[Math.max(0,Math.min(program.length-1,lo))];return{...x,offset:0};
}
function specialDuration(s){return Math.max(0,Number(s?.endAt||0)-Number(s?.startAt||0))}
function effectiveDelay(now,s=station){
  let d=Math.max(0,Number(s.baseDelayMs)||0);
  if(s.mode==='special'&&s.special){d+=Math.max(0,Math.min(now-s.special.startAt,s.special.endAt-s.special.startAt))}
  else if(s.mode==='live'&&s.live){d+=Math.max(0,now-s.live.startAt)}
  return d;
}
function normalizedStation(now=radioNow()){
  if(station.mode==='special'&&station.special&&now>=station.special.endAt){return{rev:Number(station.rev||0),baseDelayMs:(Number(station.baseDelayMs)||0)+specialDuration(station.special),mode:'music'}}
  return{...station};
}
function modeAt(now=radioNow()){
  if(station.mode==='live'&&station.live&&now>=station.live.startAt)return'live';
  if(station.mode==='special'&&station.special&&now>=station.special.startAt&&now<station.special.endAt)return'special';
  return'music';
}
function currentProgram(now=radioNow()){return programState(now-effectiveDelay(now))}

async function calibrateClock(){
  const vals=[];
  for(let i=0;i<5;i++){
    try{const t0=Date.now(),r=await fetch('index.html?tmclock='+t0+'-'+i,{method:'HEAD',cache:'no-store'}),t1=Date.now(),h=r.headers.get('date');if(h){const server=Date.parse(h)+500,mid=(t0+t1)/2;if(Number.isFinite(server))vals.push(server-mid)}}catch(_){}
    await sleep(60);
  }
  if(vals.length){vals.sort((a,b)=>a-b);clockOffset=vals[Math.floor(vals.length/2)]}
}

function setPlayingVisual(on){vinyl.classList.toggle('playing',on);signal.classList.toggle('active',on);playIcon.innerHTML=listening?'<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>':'<path d="M8 5v14l11-7z"/>'}
function setMode(kind,label,sub){
  nowLabel.textContent=kind==='music'?'ОБЩИЙ ЭФИР':kind==='live'?'ПРЯМОЙ ЭФИР':'СТУДИЯ TOMMARTFM';title.textContent=label;artist.textContent=sub||'';
  livePill.classList.toggle('studio-live',kind==='live');livePill.classList.toggle('studio-special',kind==='special');
  livePillText.textContent=kind==='live'?'LIVE':kind==='special'?'ВСТАВКА':'ONE WAVE';modeValue.textContent=kind==='live'?'LIVE':kind==='special'?'СТУДИЯ':'SYNC';
}
function renderPlaylist(s){
  if(!program.length)return;count.textContent=library.length+' песен';
  const rows=[];for(let n=0;n<6;n++){const x=program[(s.index+n)%program.length];rows.push(`<div class="track ${n===0?'active':'up-next'}"><div class="track-num">${n===0?'▶':String(n+1).padStart(2,'0')}</div><div class="track-info"><strong>${x.title}</strong><span>${n===0?'Играет на всех устройствах':'Дальше в общей волне'}</span></div><div class="track-state ${n===0?'sync':''}">${n===0?'SYNC':'LOCKED'}</div></div>`)}list.innerHTML=rows.join('');
}
function paintMusic(s){setMode('music',s.title,'Одна волна • одинаковая секунда у всех');currentTime.textContent=fmt(s.offset);duration.textContent=fmt(s.dur);progress.value=Math.max(0,Math.min(100,(s.offset/s.dur)*100));renderPlaylist(s)}
function specialPosition(sp,now){
  let e=(now-sp.startAt)/1000;if(e<0)return null;for(let i=0;i<sp.items.length;i++){const x=sp.items[i];if(e<x.dur)return{item:x,index:i,offset:e};e-=x.dur}return null;
}
function paintSpecial(p,sp){const kind=sp.kind==='ad'?'РЕКЛАМА':sp.kind==='joke'?'АНЕКДОТ':'ДЖИНГЛ';setMode('special',p.item.title,p.item.sub||kind);livePillText.textContent=kind;currentTime.textContent=fmt(p.offset);duration.textContent=fmt(p.item.dur);progress.value=Math.max(0,Math.min(100,(p.offset/p.item.dur)*100))}
function paintLive(){setMode('live','TomMartFM — прямой эфир',broadcasting?'Твой микрофон сейчас в эфире':'Живой микрофон студии');currentTime.textContent='LIVE';duration.textContent='';progress.value=100}

function waitMeta(el,timeout=5000){if(el.readyState>=1&&Number.isFinite(el.duration))return Promise.resolve();return new Promise(res=>{let done=false;const fin=()=>{if(done)return;done=true;res()};el.addEventListener('loadedmetadata',fin,{once:true});el.addEventListener('canplay',fin,{once:true});el.addEventListener('error',fin,{once:true});setTimeout(fin,timeout)})}
async function syncMusic(force=false){
  const now=radioNow(),s=currentProgram(now);paintMusic(s);
  if(!listening){try{audio.pause()}catch(_){};setPlayingVisual(false);return}
  const key=s.file;
  if(currentMusicKey!==key||!audio.src){currentMusicKey=key;try{audio.pause()}catch(_){};audio.src=urlFor(s.file);audio.load();await waitMeta(audio);const fresh=currentProgram(radioNow());if(fresh.file!==key){currentMusicKey='';return syncMusic(true)};try{audio.currentTime=Math.max(0,Math.min(fresh.offset,Math.max(0,(audio.duration||fresh.dur)-.06)));audio.playbackRate=1;await audio.play()}catch(_){};setPlayingVisual(!audio.paused);return}
  if(audio.paused){try{audio.currentTime=s.offset;await audio.play()}catch(_){};setPlayingVisual(!audio.paused);return}
  const diff=(audio.currentTime||0)-s.offset,ad=Math.abs(diff);if(force||ad>.24){try{audio.currentTime=s.offset;audio.playbackRate=1}catch(_){}}else if(ad>.05){try{audio.playbackRate=diff>0?.985:1.015}catch(_){}}else try{audio.playbackRate=1}catch(_){};setPlayingVisual(true);
}
async function syncSpecial(force=false){
  const sp=station.special,p=specialPosition(sp,radioNow());if(!p)return syncMusic(force);paintSpecial(p,sp);try{audio.pause();liveAudio.pause()}catch(_){};
  if(!listening){try{specialAudio.pause()}catch(_){};setPlayingVisual(false);return}
  const key=sp.id+':'+p.index;
  if(currentSpecialKey!==key||!specialAudio.src){currentSpecialKey=key;try{specialAudio.pause()}catch(_){};specialAudio.src=urlFor(p.item.file);specialAudio.load();await waitMeta(specialAudio);const fresh=specialPosition(sp,radioNow());if(!fresh||fresh.index!==p.index){currentSpecialKey='';return syncSpecial(true)};try{specialAudio.currentTime=Math.max(0,Math.min(fresh.offset,Math.max(0,(specialAudio.duration||fresh.item.dur)-.04)));specialAudio.playbackRate=1;await specialAudio.play()}catch(_){};setPlayingVisual(!specialAudio.paused);return}
  if(specialAudio.paused){try{specialAudio.currentTime=p.offset;await specialAudio.play()}catch(_){};return}
  const diff=(specialAudio.currentTime||0)-p.offset,ad=Math.abs(diff);if(force||ad>.2){try{specialAudio.currentTime=p.offset;specialAudio.playbackRate=1}catch(_){}}else if(ad>.04){try{specialAudio.playbackRate=diff>0?.985:1.015}catch(_){}}else try{specialAudio.playbackRate=1}catch(_){};setPlayingVisual(true);
}
function closeListenerPeer(){if(livePc){try{livePc.close()}catch(_){}livePc=null}pendingLiveIce=[];try{liveAudio.pause();liveAudio.srcObject=null}catch(_){}liveSession=''}
function pub(topic,obj,retain=false){try{if(mqttLink?.connected)mqttLink.publish(topic,JSON.stringify(obj),{qos:0,retain})}catch(_){} }
async function ensureListenerPeer(session){
  if(livePc&&liveSession===session)return livePc;closeListenerPeer();liveSession=session;livePc=new RTCPeerConnection({iceServers:ICE});
  livePc.onicecandidate=e=>{if(e.candidate)pub(TOP.admin,{type:'ice',from:listenerId,session,candidate:e.candidate.toJSON?e.candidate.toJSON():e.candidate})};
  livePc.ontrack=e=>{liveAudio.srcObject=e.streams[0]||new MediaStream([e.track]);liveAudio.volume=Number(volume.value)};
  livePc.onconnectionstatechange=()=>{if(['failed','closed'].includes(livePc?.connectionState||''))closeListenerPeer()};return livePc;
}
async function onListenerSignal(m){
  const session=station.live?.session;if(!session||m?.session!==session)return;if(m.type==='close'){closeListenerPeer();return}
  if(m.type==='offer'){try{const p=await ensureListenerPeer(session);await p.setRemoteDescription({type:'offer',sdp:m.sdp});const ans=await p.createAnswer();await p.setLocalDescription(ans);pub(TOP.admin,{type:'answer',from:listenerId,session,sdp:p.localDescription.sdp});for(const c of pendingLiveIce.splice(0)){try{await p.addIceCandidate(c)}catch(_){}}}catch(_){}return}
  if(m.type==='ice'&&m.candidate){if(livePc?.remoteDescription)livePc.addIceCandidate(m.candidate).catch(()=>{});else pendingLiveIce.push(m.candidate)}
}
async function syncLive(){
  paintLive();try{audio.pause();specialAudio.pause()}catch(_){};currentMusicKey='';currentSpecialKey='';
  if(broadcasting){setPlayingVisual(true);return}
  const session=station.live?.session;if(!session)return;
  if(!listening){try{liveAudio.pause()}catch(_){};setPlayingVisual(false);return}
  if(liveSession!==session){liveSession=session;pub(TOP.admin,{type:'live-join',from:listenerId,session});setTimeout(()=>{if(liveSession===session&&!livePc)pub(TOP.admin,{type:'live-join',from:listenerId,session})},900)}
  if(liveAudio.srcObject){try{await liveAudio.play()}catch(_){};setPlayingVisual(!liveAudio.paused)}else setPlayingVisual(true);
}
async function syncWave(force=false){
  if(!ready||syncing)return;syncing=true;try{const m=modeAt();if(m==='live')await syncLive();else{if(liveSession&&!broadcasting)closeListenerPeer();if(m==='special')await syncSpecial(force);else{currentSpecialKey='';try{specialAudio.pause()}catch(_){};await syncMusic(force)}}}finally{syncing=false}
}

function setStudioMessage(a,b=''){studioStatus.textContent=a;studioSub.textContent=b}
function setStudioControls(){
  liveBtn.classList.toggle('on',broadcasting);liveBtnText.textContent=broadcasting?'ЗАВЕРШИТЬ ПРЯМОЙ ЭФИР':'ВЫЙТИ В ПРЯМОЙ ЭФИР';airState.textContent=broadcasting?'Ты сейчас в эфире':'Микрофон выключен';
  const locked=broadcasting||modeAt()==='special';adBtn.disabled=locked;jokeBtn.disabled=locked;jingleBtn.disabled=locked;document.querySelectorAll('.control-row button').forEach(b=>b.disabled=locked);liveBtn.disabled=modeAt()==='special';
}
function activeListeners(){const now=Date.now();for(const[id,ts]of listeners)if(now-ts>22000){listeners.delete(id);closeBroadcastPeer(id)}listenerCount.textContent=Math.max(0,listeners.size-(listeners.has(listenerId)?1:0))}
function renderRows(el,arr,prefix,fn){el.innerHTML='';arr.forEach((x,i)=>{const row=document.createElement('div');row.className='control-row';row.innerHTML=`<div class="num">${prefix}${i+1}</div><div><strong></strong><span></span></div><button>ВКЛЮЧИТЬ</button>`;row.querySelector('strong').textContent=x.title;row.querySelector('span').textContent='Запустить синхронно у всех';row.querySelector('button').onclick=()=>fn(i);el.appendChild(row)})}
function item(x,sub){return{title:x.title,sub,file:x.file,dur:Number(manifest?.[x.file]||0)}}
function commitOldPause(s,now=radioNow()){
  if(s.mode==='special'&&s.special&&now>=s.special.endAt)return{rev:Number(s.rev||0),baseDelayMs:(Number(s.baseDelayMs)||0)+specialDuration(s.special),mode:'music'};
  return{...s};
}
function publishStation(next){station=next;pub(TOP.station,next,true);setStudioControls();syncWave(true)}
function startSpecial(kind,label,items){
  if(!ready||!mqttLink?.connected||broadcasting)return;let base=commitOldPause(station);if(base.mode==='live')return;
  const clean=items.filter(x=>x.dur>0),total=clean.reduce((a,x)=>a+x.dur,0)*1000;if(!clean.length||!total)return;
  const startAt=radioNow()+1300,id=(crypto.randomUUID?crypto.randomUUID():'sp-'+Date.now());const next={rev:Number(base.rev||0)+1,baseDelayMs:Number(base.baseDelayMs)||0,mode:'special',special:{id,kind,label,startAt,endAt:startAt+total,items:clean}};
  publishStation(next);setStudioMessage(label,'Запуск через 1,3 сек. Все устройства начнут одновременно.');
  setTimeout(()=>{if(station.mode==='special'&&station.special?.id===id){const done={rev:Number(station.rev||0)+1,baseDelayMs:(Number(station.baseDelayMs)||0)+specialDuration(station.special),mode:'music'};publishStation(done);setStudioMessage('Музыка вернулась','Общая волна продолжилась с той же точки.')}},total+1800);
}
function playAd(i=null){const n=i==null?(adCursor++%SPECIAL.ads.length):i;startSpecial('ad','Реклама TomMart',[item(SPECIAL.adJingle,'Сейчас будет реклама'),item(SPECIAL.ads[n],'Рекламный ролик')])}
function playJoke(i=null){const n=i==null?(jokeCursor++%SPECIAL.jokes.length):i;startSpecial('joke','Анекдот TomMart',[item(SPECIAL.jokeJingle,'Программа «Анекдоты»'),item(SPECIAL.jokes[n],'Анекдот TomMart'),item(SPECIAL.laugh,'Смех после анекдота')])}
function playJingle(i=null){const n=i==null?(jingleCursor++%JINGLES.length):i;startSpecial('jingle',JINGLES[n].title,[item(JINGLES[n],'Джингл TomMartFM')])}

function closeBroadcastPeer(id){const p=peers.get(id);if(p){try{p.close()}catch(_){}peers.delete(id)}pendingPeerIce.delete(id)}
function closeAllBroadcastPeers(){for(const id of [...peers.keys()])closeBroadcastPeer(id)}
async function offerTo(id){
  if(!broadcasting||!mic||id===listenerId||!mqttLink?.connected)return;closeBroadcastPeer(id);const pc=new RTCPeerConnection({iceServers:ICE});peers.set(id,pc);pendingPeerIce.set(id,[]);mic.getTracks().forEach(t=>pc.addTrack(t,mic));
  pc.onicecandidate=e=>{if(e.candidate)pub(signalTopic(id),{type:'ice',session:broadcastSession,candidate:e.candidate.toJSON?e.candidate.toJSON():e.candidate})};pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState))closeBroadcastPeer(id)};
  try{const off=await pc.createOffer();await pc.setLocalDescription(off);pub(signalTopic(id),{type:'offer',session:broadcastSession,sdp:pc.localDescription.sdp})}catch(_){closeBroadcastPeer(id)}
}
async function onAdminSignal(m){
  if(!broadcasting||!m?.from||m.session!==broadcastSession)return;listeners.set(m.from,Date.now());activeListeners();
  if(m.type==='live-join'){offerTo(m.from);return}
  if(m.type==='answer'){const pc=peers.get(m.from);if(!pc)return;try{await pc.setRemoteDescription({type:'answer',sdp:m.sdp});for(const c of pendingPeerIce.get(m.from)||[]){try{await pc.addIceCandidate(c)}catch(_){}}pendingPeerIce.set(m.from,[])}catch(_){}return}
  if(m.type==='ice'&&m.candidate){const pc=peers.get(m.from);if(pc?.remoteDescription)pc.addIceCandidate(m.candidate).catch(()=>{});else{const q=pendingPeerIce.get(m.from)||[];q.push(m.candidate);pendingPeerIce.set(m.from,q)}}
}
function startMeter(stream){try{const AC=window.AudioContext||window.webkitAudioContext,ac=new AC(),src=ac.createMediaStreamSource(stream),an=ac.createAnalyser();an.fftSize=256;src.connect(an);const data=new Uint8Array(an.frequencyBinCount);let raf;const tick=()=>{an.getByteFrequencyData(data);let sum=0;for(const x of data)sum+=x;micMeter.style.width=Math.min(100,Math.max(3,(sum/data.length)/1.4))+'%';raf=requestAnimationFrame(tick)};tick();return()=>{cancelAnimationFrame(raf);try{src.disconnect();ac.close()}catch(_){}}}catch(_){return()=>{}}}
async function startBroadcast(){
  if(broadcasting||modeAt()==='special'||!mqttLink?.connected)return;setStudioMessage('Запрашиваю микрофон','Разреши Telegram доступ к микрофону.');
  try{mic=await navigator.mediaDevices.getUserMedia({video:false,audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});meterStop=startMeter(mic);const base=commitOldPause(station);broadcastSession=crypto.randomUUID?crypto.randomUUID():'live-'+Date.now();broadcasting=true;const startAt=radioNow()+1500;publishStation({rev:Number(base.rev||0)+1,baseDelayMs:Number(base.baseDelayMs)||0,mode:'live',live:{session:broadcastSession,startAt}});setStudioControls();setStudioMessage('ПРЯМОЙ ЭФИР','Старт через 1,5 сек. Музыка замрёт у всех на одной точке.')}catch(e){if(mic)mic.getTracks().forEach(t=>t.stop());mic=null;if(meterStop)meterStop();meterStop=null;micMeter.style.width='3%';setStudioMessage('Не удалось включить эфир',e?.name==='NotAllowedError'?'Нет доступа к микрофону.':'Проверь интернет и попробуй ещё раз.')}
}
function stopBroadcast(){
  if(!broadcasting)return;const now=radioNow(),start=Number(station.live?.startAt||now),base=(Number(station.baseDelayMs)||0)+Math.max(0,now-start);for(const id of listeners.keys())pub(signalTopic(id),{type:'close',session:broadcastSession});closeAllBroadcastPeers();if(mic)mic.getTracks().forEach(t=>t.stop());mic=null;if(meterStop)meterStop();meterStop=null;micMeter.style.width='3%';broadcasting=false;broadcastSession='';publishStation({rev:Number(station.rev||0)+1,baseDelayMs:base,mode:'music'});setStudioControls();setStudioMessage('Музыка вернулась','Общая волна продолжилась с точки, где начался LIVE.')
}

function connectMQTT(){
  if(!window.mqtt){syncState.querySelector('b').textContent='NO MQTT';return}
  mqttLink=mqtt.connect(BROKER,{clientId:'tmfm_wave_'+listenerId.replace(/[^a-zA-Z0-9]/g,'').slice(-12)+'_'+Math.random().toString(16).slice(2,7),clean:true,keepalive:20,reconnectPeriod:1600,connectTimeout:10000,protocolVersion:4,resubscribe:true});
  mqttLink.on('connect',()=>{syncState.classList.add('ok');syncState.querySelector('b').textContent='ONLINE';mqttLink.subscribe([TOP.station,TOP.presence,TOP.admin,signalTopic(listenerId)],{qos:0});pub(TOP.presence,{id:listenerId,ts:Date.now()});setStudioMessage('Студия готова','Команды синхронизируются через общую станцию.')});
  const offline=()=>{syncState.classList.remove('ok');syncState.querySelector('b').textContent='RECONNECT'};mqttLink.on('reconnect',offline);mqttLink.on('offline',offline);mqttLink.on('close',offline);mqttLink.on('error',offline);
  mqttLink.on('message',(topic,payload)=>{let m;try{m=JSON.parse(payload.toString())}catch(_){return}
    if(topic===TOP.station&&m&&Number(m.rev||0)>=Number(station.rev||0)){station=m;setStudioControls();syncWave(true);return}
    if(topic===TOP.presence&&m?.id){listeners.set(m.id,Date.now());activeListeners();return}
    if(topic===TOP.admin){onAdminSignal(m);return}
    if(topic===signalTopic(listenerId)){onListenerSignal(m)}
  });
  setInterval(()=>pub(TOP.presence,{id:listenerId,ts:Date.now(),listening}),6500);
}

async function boot(){
  playBtn.disabled=true;modeValue.textContent='ЗАГРУЗКА';artist.textContent='Загружаю точный таймлайн всех песен…';
  try{const r=await fetch(DURATIONS+'?v=20260821',{cache:'no-store'});if(!r.ok)throw Error('DURATIONS '+r.status);manifest=await r.json();buildLibrary();await calibrateClock();ready=true;playBtn.disabled=false;modeValue.textContent='SYNC';const s=currentProgram();paintMusic(s);setPlayingVisual(false);connectMQTT();setStudioControls();setStudioMessage('Студия готовится','Основная волна уже синхронизирована.')}catch(e){console.error(e);modeValue.textContent='ERROR';artist.textContent='Не удалось загрузить общую волну';artist.classList.add('sync-error')}
}

studioToggle.onclick=()=>{const open=studioPanel.hidden;studioPanel.hidden=!open;studioChevron.textContent=open?'−':'+'};
playBtn.onclick=async()=>{if(!ready)return;if(listening){listening=false;try{audio.pause();specialAudio.pause();liveAudio.pause()}catch(_){};setPlayingVisual(false);return}listening=true;playBtn.disabled=true;await calibrateClock();currentMusicKey='';currentSpecialKey='';await syncWave(true);playBtn.disabled=false;setPlayingVisual(true)};
volume.oninput=()=>{const v=Number(volume.value);audio.volume=v;specialAudio.volume=v;liveAudio.volume=v;volumeValue.textContent=Math.round(v*100)+'%'};
liveBtn.onclick=()=>broadcasting?stopBroadcast():startBroadcast();adBtn.onclick=()=>playAd();jokeBtn.onclick=()=>playJoke();jingleBtn.onclick=()=>playJingle();
renderRows(jingleList,JINGLES,'J',i=>playJingle(i));renderRows(adList,SPECIAL.ads,'A',i=>playAd(i));renderRows(jokeList,SPECIAL.jokes,'Ю',i=>playJoke(i));
setInterval(()=>syncWave(false),700);setInterval(activeListeners,5000);setInterval(async()=>{if(!ready)return;await calibrateClock();currentMusicKey='';currentSpecialKey='';syncWave(true)},60000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&ready){currentMusicKey='';currentSpecialKey='';calibrateClock().then(()=>syncWave(true))}});
window.addEventListener('beforeunload',()=>{if(broadcasting){try{stopBroadcast()}catch(_){}}});
audio.volume=Number(volume.value);specialAudio.volume=audio.volume;liveAudio.volume=audio.volume;
boot();
})();