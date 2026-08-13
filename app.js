const STORAGE_KEY='fitWarehouseCareer_v1';

const ROLES={
  outsourcer:{name:'Аутсорс',salary:'Сдельная оплата',next:'seniorOutsourcer'},
  seniorOutsourcer:{name:'Старший аутсорс',salary:'450 ₽ / смена',next:'branch'},
  intake:{name:'Приёмка',salary:'620 ₽ / смена',next:'intakeSpecialist'},
  placement:{name:'Размещение',salary:'620 ₽ / смена',next:'placementSpecialist'},
  intakeSpecialist:{name:'Специалист приёмки',salary:'780 ₽ / смена',next:'storekeeper'},
  placementSpecialist:{name:'Специалист размещения',salary:'780 ₽ / смена',next:'storekeeper'},
  storekeeper:{name:'Кладовщик',salary:'980 ₽ / смена',next:'operations'},
  picker:{name:'Сборщик заказов',salary:'1 250 ₽ / смена',next:'seniorPicker'},
  forklift:{name:'Водитель ПРТ',salary:'1 300 ₽ / смена',next:'seniorForklift'},
  quality:{name:'Контролёр качества',salary:'1 180 ₽ / смена',next:'seniorQuality'},
  seniorPicker:{name:'Старший сборщик',salary:'1 650 ₽ / смена',next:'brigadier'},
  seniorForklift:{name:'Старший водитель ПРТ',salary:'1 720 ₽ / смена',next:'transport'},
  seniorQuality:{name:'Старший контролёр',salary:'1 600 ₽ / смена',next:'qualityLead'},
  brigadier:{name:'Бригадир сборки',salary:'2 100 ₽ / смена',next:'logistician'},
  transport:{name:'Координатор транспорта',salary:'2 150 ₽ / смена',next:'logistician'},
  qualityLead:{name:'Руководитель качества',salary:'2 150 ₽ / смена',next:'shiftLead'},
  logistician:{name:'Логист',salary:'2 600 ₽ / смена',next:'seniorLogistician'},
  seniorLogistician:{name:'Старший логист',salary:'3 300 ₽ / смена',next:'shiftLead'},
  shiftLead:{name:'Начальник смены',salary:'4 200 ₽ / смена',next:'warehouseLead'},
  warehouseLead:{name:'Начальник склада',salary:'6 500 ₽ / смена',next:'regional'},
  regional:{name:'Региональный руководитель',salary:'9 000 ₽ / смена',next:'operationsDirector'},
  operationsDirector:{name:'Операционный директор',salary:'14 000 ₽ / смена',next:'ceo'},
  ceo:{name:'Генеральный директор',salary:'25 000 ₽ / смена',next:'owner'},
  owner:{name:'Собственник FIT',salary:'Доход компании',next:null}
};

const CAREER=[
 ['outsourcer','Аутсорс'],['seniorOutsourcer','Старший аутсорс'],['intake','Приёмка / Размещение'],['intakeSpecialist','Специалист участка'],['storekeeper','Кладовщик'],['picker','Сборка / ПРТ / Качество'],['seniorPicker','Старший сотрудник'],['brigadier','Бригадир / Координатор'],['logistician','Логист'],['seniorLogistician','Старший логист'],['shiftLead','Начальник смены'],['warehouseLead','Начальник склада'],['regional','Региональный руководитель'],['operationsDirector','Операционный директор'],['ceo','Генеральный директор'],['owner','Собственник']
];

const defaultState={
  started:false,name:'',role:'outsourcer',money:0,todayEarned:0,reputation:0,careerPoints:0,
  boxes:0,badBoxes:0,workActions:0,teamRounds:0,teamScore:0,branch:null,
  intakeWins:0,placementWins:0,totalPerfect:0,sound:true,activeTab:'home',createdAt:Date.now(),lastPayday:0
};

let state=loadState();
let boxTimer=null;
let intakeRound=null;
let placementRound=null;

function loadState(){
  try{return {...defaultState,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch(e){return {...defaultState}}
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));updateHeader()}
function money(n){return Math.round(n).toLocaleString('ru-RU')+' ₽'}
function pct(n){return Math.max(0,Math.min(100,n))}
function roleName(){return ROLES[state.role]?.name||'Аутсорс'}
function progressToSenior(){return pct((state.boxes/150)*100)}
function toast(text){const el=document.getElementById('toast');el.textContent=text;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),1800)}
function updateHeader(){const el=document.getElementById('headerStatus');if(!el)return;el.textContent=state.started?roleName():'Первый рабочий день'}
function showNav(show=true){document.getElementById('bottomNav').classList.toggle('hidden',!show)}
function setActiveTab(tab){state.activeTab=tab;document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));save()}

function render(){
  updateHeader();
  if(!state.started){showNav(false);return renderOnboarding()}
  showNav(true);
  if(state.activeTab==='work')return renderWork();
  if(state.activeTab==='career')return renderCareer();
  if(state.activeTab==='profile')return renderProfile();
  renderHome();
}

function renderOnboarding(){
  document.getElementById('screen').innerHTML=`
    <section class="hero">
      <div class="eyebrow">FIT / Складской симулятор</div>
      <h1>Начни с пустых коробок. Дойди до владельца компании.</h1>
      <p>Твоя карьера начинается на складе FIT. Работай, не косячь, зарабатывай репутацию и принимай решения, которые изменят дальнейший путь.</p>
      <div class="card" style="margin-top:22px">
        <div class="small muted">Кандидат</div>
        <input id="nameInput" class="input" maxlength="18" placeholder="Введите имя персонажа" autocomplete="off">
        <button id="startBtn" class="primary" style="margin-top:12px">Устроиться в FIT</button>
      </div>
    </section>
    <div class="stats">
      <div class="stat-card"><div class="stat-label">Старт</div><div class="stat-value">Аутсорс</div></div>
      <div class="stat-card"><div class="stat-label">Финал</div><div class="stat-value">Собственник</div></div>
      <div class="stat-card"><div class="stat-label">Карьерных этапов</div><div class="stat-value">16+</div></div>
      <div class="stat-card"><div class="stat-label">Полный путь</div><div class="stat-value">~14 дней</div></div>
    </div>`;
  document.getElementById('startBtn').onclick=()=>{
    const name=document.getElementById('nameInput').value.trim();
    if(name.length<2)return toast('Введите имя');
    state={...defaultState,started:true,name,createdAt:Date.now(),activeTab:'home'};save();toast('Вы приняты в FIT');render();
  };
}

function renderHome(){
  const nextText=state.role==='outsourcer'?'Собери 150 коробок':state.role==='seniorOutsourcer'?'Проведи 3 сильные смены команды':state.role==='intake'?'Пройди 5 проверок приёмки':state.role==='placement'?'Пройди 5 заданий размещения':'Продолжай карьеру и улучшай показатели';
  const progress=state.role==='outsourcer'?progressToSenior():state.role==='seniorOutsourcer'?pct(state.teamRounds/3*100):(state.role==='intake'?pct(state.intakeWins/5*100):(state.role==='placement'?pct(state.placementWins/5*100):25));
  document.getElementById('screen').innerHTML=`
    <div class="money-row"><div><div class="eyebrow">Сотрудник FIT</div><div class="profile-name">${escapeHtml(state.name)}</div></div><span class="badge orange">${roleName()}</span></div>
    <div class="stats">
      <div class="stat-card"><div class="stat-label">Баланс</div><div class="stat-value">${money(state.money)}</div></div>
      <div class="stat-card"><div class="stat-label">Сегодня</div><div class="stat-value">${money(state.todayEarned)}</div></div>
      <div class="stat-card"><div class="stat-label">Репутация</div><div class="stat-value">${state.reputation}</div></div>
      <div class="stat-card"><div class="stat-label">Карьерный рейтинг</div><div class="stat-value">${state.careerPoints}</div></div>
    </div>
    <section class="card">
      <div class="card-head"><div><div class="small muted">ТЕКУЩАЯ ЦЕЛЬ</div><h3>${nextText}</h3></div><span class="badge">${Math.round(progress)}%</span></div>
      <div class="progress"><i style="width:${progress}%"></i></div>
      <button id="goWork" class="primary" style="margin-top:16px">Начать работу</button>
    </section>
    <section class="card">
      <div class="card-head"><h3>Следующая зарплата</h3><span class="badge">12:00</span></div>
      <p class="muted small">Заработанное за игровые смены копится в показателе «Сегодня». Расчёт зарплаты будет отдельной ежедневной механикой.</p>
    </section>
    <section class="card">
      <h3>Компания FIT</h3>
      <p class="muted small">Большой склад товаров для ремонта: крепёж, электрика, инструмент, расходники и тысячи складских позиций. Здесь начинается твоя карьера.</p>
    </section>`;
  document.getElementById('goWork').onclick=()=>{setActiveTab('work');renderWork()};
}

function renderWork(){
  stopTimers();
  if(state.role==='outsourcer')return renderOutsourcerWork();
  if(state.role==='seniorOutsourcer')return renderTeamWork();
  if(state.role==='intake')return renderIntakeWork();
  if(state.role==='placement')return renderPlacementWork();
  return renderFutureWork();
}

function renderOutsourcerWork(){
  document.getElementById('screen').innerHTML=`
    <div class="eyebrow">Рабочая зона</div><h2 class="section-title">Пустая тара</h2><p class="section-subtitle">Собирай коробки с линии. За целую коробку +3 ₽. Мятая требует аккуратности и даёт меньше.</p>
    <div class="card"><div class="card-head"><h3>До повышения</h3><span class="badge orange">${state.boxes}/150</span></div><div class="progress"><i id="boxProgress" style="width:${progressToSenior()}%"></i></div></div>
    <div id="workZone" class="work-zone">
      <div class="work-hud"><div class="hud-box"><b id="boxCount">${state.boxes}</b><span>КОРОБОК</span></div><div class="hud-box"><b id="earnCount">${money(state.todayEarned).replace(' ₽','')}</b><span>ЗАРАБОТАНО</span></div><div class="hud-box"><b id="repCount">${state.reputation}</b><span>РЕПУТАЦИЯ</span></div></div>
      <div class="shift-note">Нажимай на коробки, пока они на линии</div><div class="conveyor"></div>
    </div>`;
  spawnBox();boxTimer=setInterval(spawnBox,950);
}

function spawnBox(){
  const zone=document.getElementById('workZone');if(!zone)return;
  const old=zone.querySelectorAll('.box');if(old.length>4)return;
  const b=document.createElement('button');const bad=Math.random()<.16;b.className='box'+(bad?' bad':'');b.textContent=bad?'2':'3';
  b.style.left=(8+Math.random()*76)+'%';b.style.bottom=(72+Math.random()*38)+'px';
  b.onclick=()=>{
    if(!b.isConnected)return;
    state.boxes++;state.workActions++;const earn=bad?2:3;state.todayEarned+=earn;state.money+=earn;
    if(bad){state.badBoxes++;state.reputation+=1}else{state.reputation+=2}
    state.careerPoints+=bad?1:2;b.remove();save();updateOutsourceHud();
    if(state.boxes>=150&&state.role==='outsourcer'){stopTimers();promotionSenior()}
  };
  zone.appendChild(b);setTimeout(()=>{if(b.isConnected)b.remove()},2600);
}
function updateOutsourceHud(){
  const q=id=>document.getElementById(id);if(q('boxCount'))q('boxCount').textContent=state.boxes;if(q('earnCount'))q('earnCount').textContent=state.todayEarned;if(q('repCount'))q('repCount').textContent=state.reputation;if(q('boxProgress'))q('boxProgress').style.width=progressToSenior()+'%';
}
function promotionSenior(){
  modal(`<div class="eyebrow">Отдел кадров</div><h2>Первое повышение</h2><p>Ты собрал 150 коробок и показал, что можешь работать в темпе. FIT предлагает должность <b>Старший аутсорс</b>.</p><div class="card"><div class="kpi"><span>Новая роль</span><b>Старший аутсорс</b></div><div class="kpi"><span>Новая механика</span><b>Управление командой</b></div></div><button id="acceptPromotion" class="primary" style="margin-top:15px">Принять повышение</button>`);
  document.getElementById('acceptPromotion').onclick=()=>{state.role='seniorOutsourcer';state.reputation+=40;state.careerPoints+=75;save();closeModal();toast('Повышение получено');renderHome()};
}

function renderTeamWork(){
  const workers=[['Максим',92,64],['Антон',73,94],['Николай',81,82],['Илья',65,97]];
  document.getElementById('screen').innerHTML=`
    <div class="eyebrow">Старший аутсорс</div><h2 class="section-title">Распредели команду</h2><p class="section-subtitle">Быстрых отправляй на тару, аккуратных — на сортировку. Проведи 3 успешных раунда, чтобы получить перевод.</p>
    <div class="card"><div class="card-head"><h3>Смены команды</h3><span class="badge orange">${state.teamRounds}/3</span></div><div class="progress"><i style="width:${pct(state.teamRounds/3*100)}%"></i></div></div>
    <div class="card">${workers.map((w,i)=>`<div class="employee"><div><strong>${w[0]}</strong><span>Скорость ${w[1]} / Точность ${w[2]}</span></div><select id="worker${i}"><option value="boxes">Пустая тара</option><option value="sort">Сортировка</option></select></div>`).join('')}</div>
    <button id="finishTeam" class="primary" style="margin-top:14px">Запустить смену</button>`;
  document.getElementById('finishTeam').onclick=()=>{
    let score=0;workers.forEach((w,i)=>{const v=document.getElementById('worker'+i).value;score+=v==='boxes'?w[1]:w[2]});score=Math.round(score/4);state.teamRounds++;state.teamScore+=score;state.todayEarned+=450;state.money+=450;state.reputation+=score>=82?18:6;state.careerPoints+=score>=82?30:12;save();
    if(state.teamRounds>=3)return offerBranch();toast('Эффективность смены: '+score+'%');renderTeamWork();
  };
}
function offerBranch(){
  modal(`<div class="eyebrow">Карьерный выбор</div><h2>Куда дальше?</h2><p>Руководство предлагает постоянный перевод. Выбери направление — от него изменятся следующие задания.</p><div class="choice-grid"><button class="choice" id="chooseIntake"><strong>Приёмка</strong><span>Проверять поставки, количество, пересорт и повреждения.</span></button><button class="choice" id="choosePlacement"><strong>Размещение</strong><span>Выбирать правильные ячейки и оптимизировать склад.</span></button></div>`);
  document.getElementById('chooseIntake').onclick=()=>chooseBranch('intake');document.getElementById('choosePlacement').onclick=()=>chooseBranch('placement');
}
function chooseBranch(role){state.role=role;state.branch=role;state.reputation+=60;state.careerPoints+=120;save();closeModal();toast('Перевод оформлен');renderWork()}

function renderIntakeWork(){
  intakeRound=makeIntakeRound();
  document.getElementById('screen').innerHTML=`
    <div class="eyebrow">Приёмка</div><h2 class="section-title">Проверка поставки</h2><p class="section-subtitle">Сравни документы с фактическим количеством. Ошибки снижают репутацию.</p>
    <div class="card"><div class="card-head"><h3>Поставщик №${intakeRound.shipment}</h3><span class="badge">${state.intakeWins}/5 проверок</span></div><div class="divider"></div><div class="kpi"><span>По документам</span><b>${intakeRound.docs} шт.</b></div><div class="kpi"><span>Фактически на паллете</span><b>${intakeRound.actual} шт.</b></div></div>
    <div class="choice-grid"><button class="choice answer" data-answer="ok"><strong>Всё совпадает</strong><span>Принять товар без расхождений</span></button><button class="choice answer" data-answer="short"><strong>Недостача</strong><span>Фактически товара меньше</span></button><button class="choice answer" data-answer="over"><strong>Излишек</strong><span>Фактически товара больше</span></button></div>`;
  document.querySelectorAll('.answer').forEach(b=>b.onclick=()=>resolveIntake(b.dataset.answer));
}
function makeIntakeRound(){const docs=18+Math.floor(Math.random()*25);const delta=[-3,-2,-1,0,0,0,1,2][Math.floor(Math.random()*8)];return{docs,actual:docs+delta,shipment:100+Math.floor(Math.random()*900),answer:delta===0?'ok':delta<0?'short':'over'}}
function resolveIntake(ans){const ok=ans===intakeRound.answer;if(ok){state.intakeWins++;state.todayEarned+=120;state.money+=120;state.reputation+=15;state.careerPoints+=25;toast('Верно. Поставка оформлена')}else{state.reputation=Math.max(0,state.reputation-8);state.careerPoints=Math.max(0,state.careerPoints-5);toast('Ошибка проверки')};save();if(state.intakeWins>=5)return promoteSpecialist('intakeSpecialist');setTimeout(renderIntakeWork,450)}

function renderPlacementWork(){
  placementRound=makePlacementRound();
  document.getElementById('screen').innerHTML=`
    <div class="eyebrow">Размещение</div><h2 class="section-title">Найди лучшую ячейку</h2><p class="section-subtitle">Учитывай вес и оборачиваемость товара. Ходовой товар лучше держать ближе, тяжёлый — ниже.</p>
    <div class="card"><h3>${placementRound.item}</h3><div class="divider"></div><div class="kpi"><span>Вес</span><b>${placementRound.weight} кг</b></div><div class="kpi"><span>Оборачиваемость</span><b>${placementRound.fast?'Высокая':'Низкая'}</b></div></div>
    <div class="choice-grid">${placementRound.cells.map((c,i)=>`<button class="choice cell" data-index="${i}"><strong>${c.code}</strong><span>${c.near?'Близко к сборке':'Дальний сектор'} · ${c.low?'Нижний ярус':'Верхний ярус'}</span></button>`).join('')}</div>`;
  document.querySelectorAll('.cell').forEach(b=>b.onclick=()=>resolvePlacement(Number(b.dataset.index)));
}
function makePlacementRound(){const items=['Крепёж','Электроинструмент','Кабель','Розетки','Расходники','Ручной инструмент'];const weight=20+Math.floor(Math.random()*430);const fast=Math.random()>.45;const cells=[{code:'A-01-03',near:true,low:true},{code:'B-06-12',near:true,low:false},{code:'D-14-02',near:false,low:true},{code:'F-20-11',near:false,low:false}];let best;if(weight>250)best=fast?0:2;else best=fast?0:3;return{item:items[Math.floor(Math.random()*items.length)],weight,fast,cells,best}}
function resolvePlacement(index){const ok=index===placementRound.best;if(ok){state.placementWins++;state.todayEarned+=120;state.money+=120;state.reputation+=15;state.careerPoints+=25;toast('Оптимальное размещение')}else{state.reputation=Math.max(0,state.reputation-5);toast('Можно было разместить лучше')};save();if(state.placementWins>=5)return promoteSpecialist('placementSpecialist');setTimeout(renderPlacementWork,450)}

function promoteSpecialist(role){
  modal(`<div class="eyebrow">Повышение</div><h2>${ROLES[role].name}</h2><p>Ты стабильно справляешься с задачами участка. Следующий этап станет сложнее: больше ответственности и меньше права на ошибку.</p><button id="acceptSpec" class="primary">Принять должность</button>`);
  document.getElementById('acceptSpec').onclick=()=>{state.role=role;state.reputation+=80;state.careerPoints+=180;save();closeModal();renderFutureWork()};
}

function renderFutureWork(){
  document.getElementById('screen').innerHTML=`
    <div class="eyebrow">${roleName()}</div><h2 class="section-title">Следующий уровень</h2><p class="section-subtitle">Эта должность уже открыта в твоей карьере. Её полноценная механика будет добавлена в следующем обновлении игры.</p>
    <section class="hero"><div class="eyebrow">В разработке</div><h1>От работы руками — к управлению всем складом.</h1><p>Дальше появятся сборка заказов, ПРТ, логистика, начальник смены, управление складом, директора и финальная цель — собственник FIT.</p></section>
    <button id="backHome" class="secondary" style="margin-top:14px">На главную</button>`;
  document.getElementById('backHome').onclick=()=>{setActiveTab('home');renderHome()};
}

function renderCareer(){
  const currentIndex=currentCareerIndex();
  document.getElementById('screen').innerHTML=`
    <div class="eyebrow">Карьерная карта</div><h2 class="section-title">Путь в FIT</h2><p class="section-subtitle">Первые повышения быстрые. Чем выше должность, тем дольше и сложнее аттестация.</p>
    <div class="career-list">${CAREER.map((n,i)=>`<div class="career-node ${i===currentIndex?'current':''} ${i>currentIndex?'locked':''}"><div class="career-step">${i+1}</div><div><strong>${n[1]}</strong><span>${i<4?'Старт карьеры':i<9?'Профессиональный уровень':i<13?'Руководство':'Высшее руководство'}</span></div><span class="badge">${i<currentIndex?'Пройдено':i===currentIndex?'Сейчас':'Закрыто'}</span></div>`).join('')}</div>`;
}
function currentCareerIndex(){if(state.role==='outsourcer')return 0;if(state.role==='seniorOutsourcer')return 1;if(['intake','placement'].includes(state.role))return 2;if(['intakeSpecialist','placementSpecialist'].includes(state.role))return 3;const map={storekeeper:4,picker:5,forklift:5,quality:5,seniorPicker:6,seniorForklift:6,seniorQuality:6,brigadier:7,transport:7,qualityLead:7,logistician:8,seniorLogistician:9,shiftLead:10,warehouseLead:11,regional:12,operationsDirector:13,ceo:14,owner:15};return map[state.role]??4}

function renderProfile(){
  const days=Math.max(1,Math.ceil((Date.now()-state.createdAt)/86400000));
  document.getElementById('screen').innerHTML=`
    <div class="eyebrow">Личное дело</div><div class="profile-name">${escapeHtml(state.name)}</div><p class="section-subtitle">Сотрудник компании FIT</p>
    <div class="card"><div class="kpi"><span>Должность</span><b>${roleName()}</b></div><div class="kpi"><span>Стаж</span><b>${days} дн.</b></div><div class="kpi"><span>Баланс</span><b>${money(state.money)}</b></div><div class="kpi"><span>Репутация</span><b>${state.reputation}</b></div><div class="kpi"><span>Карьерный рейтинг</span><b>${state.careerPoints}</b></div><div class="kpi"><span>Собрано коробок</span><b>${state.boxes}</b></div></div>
    <div class="card"><h3>Прогресс сохраняется на устройстве</h3><p class="muted small">Сейчас это первая тестовая версия. Позже подключим аккаунты Telegram и облачное сохранение, чтобы прогресс работал на разных устройствах.</p></div>
    <button id="resetBtn" class="danger" style="margin-top:16px">Начать карьеру заново</button>`;
  document.getElementById('resetBtn').onclick=()=>modal(`<div class="eyebrow">Сброс прогресса</div><h2>Начать заново?</h2><p>Будут удалены деньги, должность и вся текущая карьера на этом устройстве.</p><div class="button-row"><button id="cancelReset" class="secondary">Отмена</button><button id="confirmReset" class="danger">Сбросить</button></div>`);
  setTimeout(()=>{const c=document.getElementById('cancelReset'),r=document.getElementById('confirmReset');if(c)c.onclick=closeModal;if(r)r.onclick=()=>{localStorage.removeItem(STORAGE_KEY);state={...defaultState};closeModal();render()}},0)
}

function modal(html){document.getElementById('modalRoot').innerHTML=`<div class="modal-backdrop"><div class="modal">${html}</div></div>`}
function closeModal(){document.getElementById('modalRoot').innerHTML=''}
function stopTimers(){if(boxTimer){clearInterval(boxTimer);boxTimer=null}}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

document.getElementById('bottomNav').addEventListener('click',e=>{const b=e.target.closest('.nav-item');if(!b)return;stopTimers();setActiveTab(b.dataset.tab);render()});
document.getElementById('soundToggle').onclick=()=>{state.sound=!state.sound;save();toast(state.sound?'Звук включён':'Звук выключен')};
window.addEventListener('beforeunload',save);
render();
