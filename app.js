(()=>{
  'use strict';

  const tg=window.Telegram?.WebApp;
  try{tg?.ready();tg?.expand();tg?.setHeaderColor?.('#07090d');tg?.setBackgroundColor?.('#07090d')}catch(_){ }

  const BASE='https://raw.githubusercontent.com/YalaCom/radiotommart/main/';
  const tracks=[
    {title:'Прыгну со скалы',artist:'Король и Шут',file:'Korol_i_SHut_-_Prygnu_so_skaly_(musmore.org).mp3'},
    {title:'Конь',artist:'Любэ',file:'Lyubje_-_Kon_(musmore.org).mp3'},
    {title:'Marlboro',artist:'Miyagi',file:'Miyagi_-_Marlboro_(eu.monfons.com).mp3'},
    {title:'Там',artist:'Стас Михайлов',file:'Stas_Mikhajjlov_-_Tam_(eu.monfons.com).mp3'},
    {title:'Районы-кварталы',artist:'Звери',file:'Zveri_-_Rajjony-kvartaly_(musmore.org).mp3'}
  ].map(t=>({...t,url:BASE+encodeURIComponent(t.file)}));

  const $=id=>document.getElementById(id);
  const audio=$('audio');
  const playBtn=$('playBtn');
  const playIcon=$('playIcon');
  const prevBtn=$('prevBtn');
  const nextBtn=$('nextBtn');
  const title=$('trackTitle');
  const artist=$('trackArtist');
  const progress=$('progress');
  const currentTime=$('currentTime');
  const duration=$('duration');
  const volume=$('volume');
  const volumeValue=$('volumeValue');
  const vinyl=$('vinyl');
  const signal=$('signal');
  const list=$('playlist');
  const count=$('trackCount');

  let index=0;
  let dragging=false;

  const fmt=s=>{
    if(!Number.isFinite(s)) return '0:00';
    const m=Math.floor(s/60),sec=Math.floor(s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  };

  function renderPlaylist(){
    count.textContent=`${tracks.length} треков`;
    list.innerHTML=tracks.map((t,i)=>`<div class="track${i===index?' active':''}" data-index="${i}"><div class="track-num">${String(i+1).padStart(2,'0')}</div><div class="track-info"><strong>${t.title}</strong><span>${t.artist}</span></div><div class="track-state">${i===index?'В ЭФИРЕ':'PLAY'}</div></div>`).join('');
    list.querySelectorAll('.track').forEach(el=>el.addEventListener('click',()=>{
      index=Number(el.dataset.index)||0;
      loadTrack(true);
    }));
  }

  function loadTrack(autoplay=false){
    const t=tracks[index];
    audio.src=t.url;
    title.textContent=t.title;
    artist.textContent=t.artist;
    progress.value=0;
    currentTime.textContent='0:00';
    duration.textContent='0:00';
    renderPlaylist();
    if(autoplay) audio.play().catch(()=>setPlaying(false));
  }

  function setPlaying(on){
    vinyl.classList.toggle('playing',on);
    signal.classList.toggle('active',on);
    playBtn.setAttribute('aria-label',on?'Пауза':'Воспроизвести');
    playIcon.innerHTML=on?'<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>':'<path d="M8 5v14l11-7z"/>';
    renderPlaylist();
  }

  playBtn.addEventListener('click',()=>{
    if(audio.paused) audio.play().catch(()=>setPlaying(false));
    else audio.pause();
  });

  prevBtn.addEventListener('click',()=>{
    index=(index-1+tracks.length)%tracks.length;
    loadTrack(true);
  });

  nextBtn.addEventListener('click',()=>{
    index=(index+1)%tracks.length;
    loadTrack(true);
  });

  audio.addEventListener('play',()=>setPlaying(true));
  audio.addEventListener('pause',()=>setPlaying(false));
  audio.addEventListener('ended',()=>{
    index=(index+1)%tracks.length;
    loadTrack(true);
  });
  audio.addEventListener('loadedmetadata',()=>duration.textContent=fmt(audio.duration));
  audio.addEventListener('timeupdate',()=>{
    if(!dragging&&Number.isFinite(audio.duration)&&audio.duration>0){
      progress.value=(audio.currentTime/audio.duration)*100;
      currentTime.textContent=fmt(audio.currentTime);
      duration.textContent=fmt(audio.duration);
    }
  });
  audio.addEventListener('error',()=>{
    artist.textContent='Не удалось загрузить трек — переключаю дальше';
    setTimeout(()=>{index=(index+1)%tracks.length;loadTrack(true)},1200);
  });

  progress.addEventListener('input',()=>{
    dragging=true;
    if(Number.isFinite(audio.duration)) currentTime.textContent=fmt((Number(progress.value)/100)*audio.duration);
  });
  progress.addEventListener('change',()=>{
    if(Number.isFinite(audio.duration)) audio.currentTime=(Number(progress.value)/100)*audio.duration;
    dragging=false;
  });

  volume.addEventListener('input',()=>{
    audio.volume=Number(volume.value);
    volumeValue.textContent=`${Math.round(audio.volume*100)}%`;
  });

  audio.volume=Number(volume.value);
  loadTrack(false);
})();