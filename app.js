(()=>{
  'use strict';

  const tg=window.Telegram?.WebApp;
  try{tg?.ready();tg?.expand();tg?.setHeaderColor?.('#07090d');tg?.setBackgroundColor?.('#07090d')}catch(_){ }

  const MUSIC_BASE='https://raw.githubusercontent.com/YalaCom/radiotommart/main/';
  const BROKER='wss://broker.emqx.io:8084/mqtt';
  const BUS='tommart/fm/20260821/9d4a';
  const TOP={state:BUS+'/state',command:BUS+'/command',presence:BUS+'/presence',admin:BUS+'/signal/admin'};
  const signalTopic=id=>BUS+'/signal/'+id;
  const ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];

  const tracks=[
    {title:'Прыгну со скалы',artist:'Король и Шут',file:'Korol_i_SHut_-_Prygnu_so_skaly_(musmore.org).mp3'},
    {title:'Конь',artist:'Любэ',file:'Lyubje_-_Kon_(musmore.org).mp3'},
    {title:'Marlboro',artist:'Miyagi',file:'Miyagi_-_Marlboro_(eu.monfons.com).mp3'},
    {title:'Там',artist:'Стас Михайлов',file:'Stas_Mikhajjlov_-_Tam_(eu.monfons.com).mp3'},
    {title:'Районы-кварталы',artist:'Звери',file:'Zveri_-_Rajjony-kvartaly_(musmore.org).mp3'}
  ].map(t=>({...t,url:MUSIC_BASE+encodeURIComponent(t.file)}));

  const $=id=>document.getElementById(id);
  const audio=$('audio'),specialAudio=$('specialAudio'),liveAudio=$('liveAudio');
  const playBtn=$('playBtn'),playIcon=$('playIcon'),prevBtn=$('prevBtn'),nextBtn=$('nextBtn');
  const title=$('trackTitle'),artist=$('trackArtist'),nowLabel=$('nowLabel');
  const progress=$('progress'),progressWrap=$('progressWrap'),currentTime=$('currentTime'),duration=$('duration');
  const volume=$('volume'),volumeValue=$('volumeValue'),vinyl=$('vinyl'),signal=$('signal');
  const list=$('playlist'),count=$('trackCount'),livePill=$('livePill'),livePillText=$('livePillText'),modeValue=$('modeValue');

  let index=0,dragging=false,override=null,resumeWasPlaying=false,specialToken=0;
  let mqttLink=null,pc=null,liveSession='',pendingIce=[];

  const fmt=s=>{if(!Number.isFinite(s))return'0:00';const m=Math.floor(s/60),sec=Math.floor(s%60).toString().padStart(2,'0');return`${m}:${sec}`};
  const makeId=()=>{try{let id=localStorage.getItem('tommartfm_listener_id');if(!id){id=crypto.randomUUID?crypto.randomUUID():'u-'+Math.random().toString(36).slice(2)+Date.now();localStorage.setItem('tommartfm_listener_id',id)}return id}catch(_){return'u-'+Math.random().toString(36).slice(2)+Date.now()}};
  const listenerId=makeId();

  function renderPlaylist(){
    count.textContent=`${tracks.length} треков`;
    list.innerHTML=tracks.map((t,i)=>`<div class="track${i===index?' active':''}" data-index="${i}"><div class="track-num">${String(i+1).padStart(2,'0')}</div><div class="track-info"><strong>${t.title}</strong><span>${t.artist}</span></div><div class="track-state">${i===index?'В ЭФИРЕ':'PLAY'}</div></div>`).join('');
    list.querySelectorAll('.track').forEach(el=>el.addEventListener('click',()=>{
      if(override)return;
      index=Number(el.dataset.index)||0;loadTrack(true);
    }));
  }

  function restoreTrackInfo(){
    const t=tracks[index];
    nowLabel.textContent='СЕЙЧАС ИГРАЕТ';
    title.textContent=t.title;artist.textContent=t.artist;
    modeValue.textContent='24 / 7';
    livePill.classList.remove('studio-live','studio-special');
    livePillText.textContent='ON AIR';
    progressWrap.classList.remove('dimmed');
    prevBtn.disabled=false;nextBtn.disabled=false;playBtn.disabled=false;
  }

  function showOverride(kind,main,sub){
    override=kind;
    nowLabel.textContent=kind==='live'?'ПРЯМОЙ ЭФИР':'СТУДИЯ TOMMARTFM';
    title.textContent=main;artist.textContent=sub||'';
    modeValue.textContent=kind==='live'?'LIVE':kind.toUpperCase();
    livePill.classList.toggle('studio-live',kind==='live');
    livePill.classList.toggle('studio-special',kind!=='live');
    livePillText.textContent=kind==='live'?'LIVE':kind==='ad'?'РЕКЛАМА':kind==='joke'?'АНЕКДОТ':'JINGLE';
    progressWrap.classList.add('dimmed');
    prevBtn.disabled=true;nextBtn.disabled=true;
  }

  function loadTrack(autoplay=false){
    const t=tracks[index];audio.src=t.url;progress.value=0;currentTime.textContent='0:00';duration.textContent='0:00';
    if(!override)restoreTrackInfo();renderPlaylist();
    if(autoplay)audio.play().catch(()=>setPlaying(false));
  }

  function setPlaying(on){
    const visual=on||override==='live'||!!override;
    vinyl.classList.toggle('playing',visual);signal.classList.toggle('active',visual);
    playBtn.setAttribute('aria-label',on?'Пауза':'Воспроизвести');
    playIcon.innerHTML=on?'<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>':'<path d="M8 5v14l11-7z"/>';
    renderPlaylist();
  }

  function rememberAndPause(){
    if(!override)resumeWasPlaying=!audio.paused;
    audio.pause();
  }
  function resumeMusic(){
    override=null;restoreTrackInfo();renderPlaylist();
    if(resumeWasPlaying)audio.play().catch(()=>setPlaying(false));else setPlaying(false);
    resumeWasPlaying=false;
  }

  async function playSpecial(items,kind,label){
    if(liveSession)return;
    const token=++specialToken;
    rememberAndPause();
    try{specialAudio.pause();specialAudio.currentTime=0}catch(_){ }
    showOverride(kind,label||'TomMartFM','Музыка вернётся после вставки');setPlaying(true);
    for(const item of items||[]){
      if(token!==specialToken)return;
      title.textContent=item.title||label||'TomMartFM';artist.textContent=item.sub||'Студийная вставка';
      specialAudio.src=item.url;
      specialAudio.volume=Number(volume.value);
      try{await specialAudio.play()}catch(_){break}
      await new Promise(res=>{let done=false;const fin=()=>{if(done)return;done=true;res()};specialAudio.onended=fin;specialAudio.onerror=fin;setTimeout(fin,Math.max(12000,Number(item.maxMs)||120000))});
    }
    if(token===specialToken)resumeMusic();
  }

  function stopSpecial(){
    specialToken++;try{specialAudio.pause();specialAudio.currentTime=0}catch(_){ }
  }

  function pub(topic,obj){try{if(mqttLink?.connected)mqttLink.publish(topic,JSON.stringify(obj),{qos:0,retain:false})}catch(_){ }}
  function closePeer(){if(pc){try{pc.close()}catch(_){ }pc=null}pendingIce=[];try{liveAudio.pause();liveAudio.srcObject=null}catch(_){ }}

  async function ensurePeer(){
    if(pc)return pc;
    pc=new RTCPeerConnection({iceServers:ICE});
    pc.onicecandidate=e=>{if(e.candidate)pub(TOP.admin,{type:'ice',from:listenerId,session:liveSession,candidate:e.candidate.toJSON?e.candidate.toJSON():e.candidate})};
    pc.ontrack=e=>{liveAudio.srcObject=e.streams[0]||new MediaStream([e.track]);liveAudio.volume=Number(volume.value);liveAudio.play().catch(()=>{artist.textContent='Нажми Play, чтобы услышать LIVE'})};
    pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc?.connectionState||''))closePeer()};
    return pc;
  }

  async function startLive(session){
    if(!session)return;
    if(liveSession===session&&pc)return;
    stopSpecial();closePeer();rememberAndPause();
    liveSession=session;showOverride('live','TomMartFM — прямой эфир','Подключаю микрофон студии…');setPlaying(true);
    pub(TOP.admin,{type:'live-join',from:listenerId,session});
  }

  function stopLive(){
    if(!liveSession)return;
    liveSession='';closePeer();resumeMusic();
  }

  async function onSignal(m){
    if(!m||m.session!==liveSession)return;
    if(m.type==='close'){stopLive();return}
    if(m.type==='offer'){
      try{
        const p=await ensurePeer();await p.setRemoteDescription({type:'offer',sdp:m.sdp});
        const ans=await p.createAnswer();await p.setLocalDescription(ans);
        pub(TOP.admin,{type:'answer',from:listenerId,session:liveSession,sdp:p.localDescription.sdp});
        for(const c of pendingIce.splice(0)){try{await p.addIceCandidate(c)}catch(_){ }}
      }catch(_){artist.textContent='Не удалось подключить LIVE'}
      return;
    }
    if(m.type==='ice'&&m.candidate){
      if(pc?.remoteDescription)pc.addIceCandidate(m.candidate).catch(()=>{});else pendingIce.push(m.candidate);
    }
  }

  function connectStudio(){
    if(!window.mqtt)return;
    const clientId='tmfm_listener_'+listenerId.replace(/[^a-zA-Z0-9]/g,'').slice(-12)+'_'+Math.random().toString(16).slice(2,7);
    mqttLink=mqtt.connect(BROKER,{clientId,clean:true,keepalive:20,reconnectPeriod:1800,connectTimeout:10000,protocolVersion:4,resubscribe:true});
    mqttLink.on('connect',()=>{
      mqttLink.subscribe([TOP.state,TOP.command,signalTopic(listenerId)],{qos:0});
      pub(TOP.presence,{type:'hello',id:listenerId,ts:Date.now()});
    });
    mqttLink.on('message',(topic,payload)=>{
      let m;try{m=JSON.parse(payload.toString())}catch(_){return}
      if(topic===TOP.state){if(m.mode==='live')startLive(m.session);else if(m.mode==='music')stopLive();return}
      if(topic===TOP.command&&m.type==='special-sequence'){playSpecial(m.items,m.kind,m.label);return}
      if(topic===signalTopic(listenerId))onSignal(m);
    });
    setInterval(()=>pub(TOP.presence,{type:'ping',id:listenerId,ts:Date.now(),live:!!liveSession}),7000);
  }

  playBtn.addEventListener('click',()=>{
    if(liveSession){liveAudio.play().catch(()=>{});return}
    if(override)return;
    if(audio.paused)audio.play().catch(()=>setPlaying(false));else audio.pause();
  });
  prevBtn.addEventListener('click',()=>{if(override)return;index=(index-1+tracks.length)%tracks.length;loadTrack(true)});
  nextBtn.addEventListener('click',()=>{if(override)return;index=(index+1)%tracks.length;loadTrack(true)});

  audio.addEventListener('play',()=>setPlaying(true));
  audio.addEventListener('pause',()=>{if(!override)setPlaying(false)});
  audio.addEventListener('ended',()=>{index=(index+1)%tracks.length;loadTrack(true)});
  audio.addEventListener('loadedmetadata',()=>duration.textContent=fmt(audio.duration));
  audio.addEventListener('timeupdate',()=>{if(!dragging&&Number.isFinite(audio.duration)&&audio.duration>0){progress.value=(audio.currentTime/audio.duration)*100;currentTime.textContent=fmt(audio.currentTime);duration.textContent=fmt(audio.duration)}});
  audio.addEventListener('error',()=>{if(override)return;artist.textContent='Не удалось загрузить трек — переключаю дальше';setTimeout(()=>{index=(index+1)%tracks.length;loadTrack(true)},1200)});
  progress.addEventListener('input',()=>{if(override)return;dragging=true;if(Number.isFinite(audio.duration))currentTime.textContent=fmt((Number(progress.value)/100)*audio.duration)});
  progress.addEventListener('change',()=>{if(override)return;if(Number.isFinite(audio.duration))audio.currentTime=(Number(progress.value)/100)*audio.duration;dragging=false});
  volume.addEventListener('input',()=>{const v=Number(volume.value);audio.volume=v;specialAudio.volume=v;liveAudio.volume=v;volumeValue.textContent=`${Math.round(v*100)}%`});

  audio.volume=Number(volume.value);specialAudio.volume=audio.volume;liveAudio.volume=audio.volume;
  loadTrack(false);connectStudio();
})();