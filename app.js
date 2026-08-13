const STORAGE_KEY='fitWarehouseCareer_v2';

const ROLES=[
  {id:'outsourcer',name:'Аутсорс',goal:80,label:'Собрать коробки'},
  {id:'seniorOutsourcer',name:'Старший аутсорс',goal:3,label:'Провести смены команды'},
  {id:'intake',name:'Приёмка',goal:5,label:'Пройти проверки'},
  {id:'placement',name:'Размещение',goal:5,label:'Выполнить размещения'},
  {id:'picker',name:'Сборщик заказов',goal:8,label:'Собрать заказы'},
  {id:'forklift',name:'Водитель ПРТ',goal:8,label:'Переместить паллеты'},
  {id:'logistician',name:'Логист',goal:10,label:'Закрыть маршруты'},
  {id:'shiftLead',name:'Начальник смены',goal:12,label:'Провести смены'},
  {id:'warehouseLead',name:'Начальник склада',goal:16,label:'Удержать эффективность'},
  {id:'operationsDirector',name:'Операционный директор',goal:22,label:'Закрыть управленческие задачи'},
  {id:'ceo',name:'Генеральный директор',goal:30,label:'Выполнить цели компании'},
  {id:'owner',name:'Собственник FIT',goal:0,label:'Финальная должность'}
];

const defaults={started:false,name:'',roleIndex:0,money:0,todayEarned:0,reputation:0,careerPoints:0,progress:0,totalActions:0,combo:0,bestCombo:0,activeTab:'home',sound:true};
let state=load();
let boxTimer=null;

function load(){try{return {...defaults,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch{return {...defaults}}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));syncHeader()}
function role(){return ROLES[state.roleIndex]||ROLES[0]}
function fmt(n){return Math.round(n).toLocaleString('ru-RU')+' ₽'}
function pct(){const g=role().goal||1;return Math.min(100,Math.round((state.progress/g)*100))}
function esc(s){return String(s).replace(/[&<>'\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[m]))}
function q(id){return document.getElementById(id)}
function toast(t){const e=q('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),1400)}
function syncHeader(){const e=q('headerStatus');if(e)e.textContent=state.started?role().name:'Первый рабочий день'}
function stopTimers(){if(boxTimer){clearInterval(boxTimer);boxTimer=null}}
function showNav(on){q('bottomNav')?.classList.toggle('hidden',!on)}
function setTab(tab){state.activeTab=tab;save();document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));render()}

function render(){stopTimers();syncHeader();if(!state.started){showNav(false);return onboarding()}showNav(true);document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.activeTab));if(state.activeTab==='work')return work();if(state.activeTab==='career')return career();if(state.activeTab==='profile')return profile();home()}

function onboarding(){q('screen').innerHTML=`<section class="hero"><div class="eyebrow">FIT / карьерный симулятор</div><h1>С нуля на складе — до собственника FIT.</h1><p>Начни аутсорсом, выполняй смены, повышай репутацию и открывай новые должности.</p><div class="card onboarding-card"><label class="small muted">Имя сотрудника</label><input id="nameInput" class="input" maxlength="18" placeholder="Например, Саша"><button id="startBtn" class="primary">Устроиться в FIT</button></div></section><div class="stats"><div class="stat-card"><span>Старт</span><b>Аутсорс</b></div><div class="stat-card"><span>Финал</span><b>Собственник</b></div><div class="stat-card"><span>Формат</span><b>Mini App</b></div><div class="stat-card"><span>Путь</span><b>~14 дней</b></div></div>`;q('startBtn').onclick=()=>{const name=q('nameInput').value.trim();if(name.length<2)return toast('Введите имя');state={...defaults,started:true,name,activeTab:'home'};save();render()}}

function home(){q('screen').innerHTML=`<section class="dashboard-head"><div><div class="eyebrow">Сотрудник FIT</div><h1>${esc(state.name)}</h1><p>${role().name}</p></div><div class="rank-pill">${state.roleIndex+1}/${ROLES.length}</div></section><div class="stats"><div class="stat-card"><span>Баланс</span><b>${fmt(state.money)}</b></div><div class="stat-card"><span>Сегодня</span><b>${fmt(state.todayEarned)}</b></div><div class="stat-card"><span>Репутация</span><b>${state.reputation}</b></div><div class="stat-card"><span>Карьерный рейтинг</span><b>${state.careerPoints}</b></div></div><section class="card focus-card"><div class="card-head"><div><div class="small muted">ТЕКУЩАЯ ЦЕЛЬ</div><h3>${role().label}</h3></div><span class="badge orange">${state.progress}/${role().goal||'—'}</span></div><div class="progress"><i style="width:${pct()}%"></i></div><button id="goWork" class="primary">Начать смену</button></section><section class="card"><div class="card-head"><h3>Следующее повышение</h3><span class="badge">${state.roleIndex<ROLES.length-1?ROLES[state.roleIndex+1].name:'Финал'}</span></div><p class="muted small">Чем выше должность, тем больше заданий и требований. Первые повышения быстрые, последние рассчитаны на долгую игру.</p></section>`;q('goWork').onclick=()=>setTab('work')}

function work(){if(state.roleIndex===0)return outsourcer();return taskWork()}

function outsourcer(){q('screen').innerHTML=`<div class="eyebrow">Смена / пустая тара</div><h2 class="section-title">Собирай коробки</h2><p class="section-subtitle">Нажимай на коробки до того, как они исчезнут. Серия без пропусков даёт бонус.</p><section class="card compact"><div class="work-stats"><div><span>Собрано</span><b id="pCount">${state.progress}/${role().goal}</b></div><div><span>Комбо</span><b id="combo">x${state.combo}</b></div><div><span>Сегодня</span><b id="earn">${fmt(state.todayEarned)}</b></div></div><div class="progress"><i id="workProgress" style="width:${pct()}%"></i></div></section><div id="workZone" class="work-zone"><div class="warehouse-bg"><div class="rack r1"></div><div class="rack r2"></div><div class="rack r3"></div></div><div class="conveyor"></div><div class="shift-note">Коробка = деньги + рейтинг</div></div>`;spawnBox();boxTimer=setInterval(spawnBox,800)}

function spawnBox(){const zone=q('workZone');if(!zone)return;if(zone.querySelectorAll('.box').length>=5)return;const b=document.createElement('button');const rare=Math.random()<.12;b.className='box'+(rare?' rare':'');b.innerHTML=rare?'<span>FIT</span><small>+8</small>':'<span>FIT</span><small>+3</small>';b.style.left=(8+Math.random()*76)+'%';b.style.bottom=(72+Math.random()*95)+'px';let hit=false;b.onclick=()=>{if(hit)return;hit=true;state.progress++;state.totalActions++;state.combo++;state.bestCombo=Math.max(state.bestCombo,state.combo);const gain=rare?8:3;const bonus=Math.min(5,Math.floor(state.combo/5));state.money+=gain+bonus;state.todayEarned+=gain+bonus;state.reputation+=rare?3:1;state.careerPoints+=1+bonus;b.classList.add('hit');setTimeout(()=>b.remove(),120);save();updateWorkHud();if(state.progress>=role().goal)setTimeout(promote,150)};zone.appendChild(b);setTimeout(()=>{if(!hit&&b.isConnected){state.combo=0;b.remove();save();updateWorkHud()}},2100)}
function updateWorkHud(){if(q('pCount'))q('pCount').textContent=`${state.progress}/${role().goal}`;if(q('combo'))q('combo').textContent='x'+state.combo;if(q('earn'))q('earn').textContent=fmt(state.todayEarned);if(q('workProgress'))q('workProgress').style.width=pct()+'%'}

function taskWork(){const r=role();const tasks=taskSet(state.roleIndex);q('screen').innerHTML=`<div class="eyebrow">Смена / ${r.name}</div><h2 class="section-title">Рабочие задачи</h2><p class="section-subtitle">На этой должности важны решения, а не скорость кликов.</p><section class="card"><div class="card-head"><h3>${r.label}</h3><span class="badge orange">${state.progress}/${r.goal}</span></div><div class="progress"><i style="width:${pct()}%"></i></div></section><div class="task-grid">${tasks.map((t,i)=>`<button class="task-card" data-task="${i}"><span class="task-no">0${i+1}</span><strong>${t.title}</strong><small>${t.desc}</small></button>`).join('')}</div>`;document.querySelectorAll('[data-task]').forEach(btn=>btn.onclick=()=>resolveTask(tasks[Number(btn.dataset.task)]))}

function taskSet(level){const sets=[[],[{title:'Распредели людей',desc:'Поставь сильных сотрудников на перегруженную линию'},{title:'Проверь темп',desc:'Выбери участок, который сильнее всего отстаёт'},{title:'Сними проблему',desc:'Реши, кого отправить на замену'}],[{title:'Сверь поставку',desc:'Найди расхождение в количестве товара'},{title:'Проверь маркировку',desc:'Определи неверную этикетку'},{title:'Прими решение',desc:'Что делать с повреждённой коробкой'}],[{title:'Выбери ячейку',desc:'Поставь ходовой товар ближе к сборке'},{title:'Размести тяжёлое',desc:'Не поднимай тяжёлую паллету наверх'},{title:'Освободи проход',desc:'Реши, какую паллету переместить первой'}]];if(level<sets.length)return sets[level];return [{title:'Срочная задача',desc:'Прими решение в условиях ограниченного времени'},{title:'План смены',desc:'Выбери лучший вариант распределения ресурсов'},{title:'Контроль KPI',desc:'Подними эффективность без лишних затрат'}]}

function resolveTask(t){const good=Math.random()<0.82;if(good){state.progress++;state.money+=40+state.roleIndex*18;state.todayEarned+=40+state.roleIndex*18;state.reputation+=3;state.careerPoints+=5+state.roleIndex;toast('Задача выполнена')}else{state.reputation=Math.max(0,state.reputation-2);toast('Ошибка — попробуй ещё')}save();if(state.progress>=role().goal)setTimeout(promote,350);else taskWork()}

function promote(){stopTimers();if(state.roleIndex>=ROLES.length-1)return;const next=ROLES[state.roleIndex+1];q('modalRoot').innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="eyebrow">Отдел кадров FIT</div><h2>Повышение</h2><p>Твои показатели подходят для перевода на следующую должность.</p><div class="promotion-box"><span>Новая должность</span><strong>${next.name}</strong></div><button id="acceptPromotion" class="primary">Принять повышение</button></div></div>`;q('acceptPromotion').onclick=()=>{state.roleIndex++;state.progress=0;state.combo=0;state.reputation+=10+state.roleIndex*3;state.careerPoints+=25+state.roleIndex*10;save();q('modalRoot').innerHTML='';state.activeTab='home';save();render();toast('Новая должность: '+role().name)}}

function career(){q('screen').innerHTML=`<div class="eyebrow">Карьерная карта</div><h2 class="section-title">Путь в FIT</h2><p class="section-subtitle">От первой смены до управления всей компанией.</p><div class="career-list">${ROLES.map((r,i)=>`<div class="career-node ${i===state.roleIndex?'current':''} ${i>state.roleIndex?'locked':''}"><div class="career-step">${String(i+1).padStart(2,'0')}</div><div><strong>${r.name}</strong><span>${i<state.roleIndex?'Пройдено':i===state.roleIndex?'Текущая должность':'Закрыто'}</span></div><div class="career-state">${i<state.roleIndex?'✓':i===state.roleIndex?pct()+'%':'—'}</div></div>`).join('')}</div>`}

function profile(){q('screen').innerHTML=`<div class="eyebrow">Личное дело</div><h2 class="section-title">${esc(state.name)}</h2><section class="card profile-card"><div class="kpi"><span>Должность</span><b>${role().name}</b></div><div class="kpi"><span>Баланс</span><b>${fmt(state.money)}</b></div><div class="kpi"><span>Репутация</span><b>${state.reputation}</b></div><div class="kpi"><span>Карьерный рейтинг</span><b>${state.careerPoints}</b></div><div class="kpi"><span>Лучшее комбо</span><b>x${state.bestCombo}</b></div><div class="kpi"><span>Всего действий</span><b>${state.totalActions}</b></div></section><button id="resetBtn" class="secondary">Начать карьеру заново</button>`;q('resetBtn').onclick=()=>{if(confirm('Сбросить весь прогресс?')){localStorage.removeItem(STORAGE_KEY);state={...defaults};render()}}}

document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
q('soundToggle')?.addEventListener('click',()=>{state.sound=!state.sound;save();toast(state.sound?'Звук включён':'Звук выключен')});
render();