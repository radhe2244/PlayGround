(() => {
  'use strict';
  const SAVE_KEY = 'indie-empire-save-v1';
  const staffSeed = [
    { name: 'Avery Lin', role: 'Game designer', skill: 7, salary: 95, initials: 'AL' },
    { name: 'Morgan Kim', role: 'Programmer', skill: 8, salary: 115, initials: 'MK' },
    { name: 'Rory Patel', role: 'Artist', skill: 6, salary: 85, initials: 'RP' },
    { name: 'You', role: 'Studio founder', skill: 5, salary: 0, initials: 'JD' }
  ];
  const newState = () => ({ day: 14, month: 3, year: 2025, cash: 24850, revenue: 3420, reputation: 68, team: staffSeed, project: { name: 'Mosslight', genre: 'Adventure', platform: 'PC', phase: 'Production', progress: 42, budget: 12000, quality: 0, planned: true }, games: [], research: [], officeLevel: 1, marketing: 0, competitors: [{name:'Moonbeam Studio', genre:'Cozy adventure', share:28, initials:'M'}, {name:'Bit Orchard', genre:'Indie platformer', share:22, initials:'B'}, {name:'Copper Kite', genre:'Narrative RPG', share:17, initials:'C'}], activity: [], daysPlayed: 0, sound: true, goalsDismissed: false });
  let state;
  try { const saved = JSON.parse(localStorage.getItem(SAVE_KEY)); state = saved && saved.version === 1 ? {...newState(), ...saved, team: saved.team || staffSeed} : newState(); } catch { state = newState(); }
  let currentView = 'overview';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const fmt = n => '$' + Math.floor(Math.max(0, n)).toLocaleString('en-US');
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify({...state, version:1})); } catch {} };
  const dateString = () => new Date(state.year, state.month, state.day).toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'});
  const notify = (message, icon='✦') => { const toast=document.createElement('div'); toast.className='toast'; toast.innerHTML=`<span>${icon}</span>${escapeHtml(message)}`; $('#toastRegion').append(toast); setTimeout(()=>toast.remove(), 3300); };
  const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const log = (icon, tone, html, when='Just now') => { state.activity.unshift({icon,tone,text:html,when}); state.activity=state.activity.slice(0,8); };
  const projectProgress = () => state.project && state.project.progress;
  const goals = () => [
    {title:'Ship your first game', detail: state.games.length ? 'First release is out in the world!' : 'Finish and release a game', done:state.games.length>0},
    {title:'Grow your team to 5', detail:`${state.team.length} / 5 people`, done:state.team.length>=5},
    {title:'Complete a research project', detail:state.research.length ? `${state.research.length} upgrade${state.research.length===1?'':'s'} unlocked` : 'Choose your first studio upgrade', done:state.research.length>0}
  ];
  function update() {
    $('#cashValue').textContent=fmt(state.cash); $('#chartBalance').textContent=fmt(state.cash + state.games.length*8500);
    $('#revenueValue').textContent=fmt(state.revenue); $('#teamValue').textContent=state.team.length;
    $('#repValue').textContent=Math.min(100,state.reputation); $('#dateLabel').textContent=dateString();
    const season=['Winter','Winter','Spring','Spring','Spring','Summer','Summer','Summer','Fall','Fall','Fall','Winter'][state.month];
    $('#seasonLabel').textContent=`${season}, ${state.year}`;
    $('#projectCount').textContent=state.project?'1':'0';
    const p=state.project;
    if(p){ $('#progressText').textContent=`${p.progress}%`; $('#progressBar').style.width=`${p.progress}%`; $('#progressPhase').textContent=`${p.progress} / 100 points`; $('#assignedText').innerHTML=`${Math.min(3,state.team.length)} <em>assigned</em>`; $('#releaseText').textContent=`${Math.max(1,Math.ceil((100-p.progress)/Math.max(4,Math.min(10,state.team.length*1.35))))} weeks`; }
    else { $('#progressText').textContent='Ready'; $('#progressBar').style.width='100%'; $('#progressPhase').textContent='Your next adventure awaits'; $('#assignedText').innerHTML=`${state.team.length} <em>available</em>`; $('#releaseText').textContent='Start a project'; }
    $('#activityList').innerHTML=state.activity.length ? state.activity.slice(0,4).map(a=>`<div class="activity-item"><div class="activity-icon ${a.tone}">${a.icon}</div><div class="activity-copy">${a.text}<time>${a.when}</time></div></div>`).join('') : `<div class="empty-state">✳<strong>Your story starts here</strong>Your team's latest news will show up here.</div>`;
    const gs=goals(); $('#goalCount').textContent=`${gs.filter(g=>g.done).length} / 3`; $('#goalList').innerHTML=gs.map(g=>`<div class="goal-item ${g.done?'done':''}"><span class="goal-check">${g.done?'✓':''}</span><div><strong>${g.title}</strong><small>${g.detail}</small></div></div>`).join('');
    save();
  }
  function tick({focused=false}={}) {
    const dailyRoyalty=state.games.reduce((sum,g)=>sum+Math.max(18,Math.floor(g.royalty*(.92+Math.random()*.18))),0);
    const salary=state.team.reduce((sum,p)=>sum+p.salary,0);
    const officeCost=state.officeLevel*24;
    const dailyIncome=dailyRoyalty + (state.marketing>0?Math.floor(state.marketing*.1):0);
    state.cash += dailyIncome-salary-officeCost;
    state.revenue=Math.max(0, dailyRoyalty*7);
    state.day++; state.daysPlayed++;
    const next=new Date(state.year,state.month,state.day); state.day=next.getDate();state.month=next.getMonth();state.year=next.getFullYear();
    if (state.project) {
      let gain=Math.max(3, Math.round(state.team.reduce((n,p)=>n+p.skill,0)*.22));
      if(state.research.includes('agile')) gain+=2;
      if(focused) gain+=Math.max(5,Math.round(state.team.reduce((n,p)=>n+p.skill,0)*.33));
      const p=state.project;
      if(p.phase==='Concept') p.phase='Production';
      p.progress=Math.min(100,p.progress+gain);
      if(p.progress>=100) releaseGame();
    }
    state.competitors.forEach(c=>{c.share=Math.max(10,Math.min(42,c.share+(Math.random()>.5?1:-1)));});
    if(state.daysPlayed%7===0){log('＄','green',`Your studio closed the week with <strong>${fmt(dailyIncome*7)}</strong> in revenue.`,`Week ${Math.ceil(state.daysPlayed/7)}`);}
    if(state.cash<0){state.reputation=Math.max(0,state.reputation-1);}
    update();
    if(currentView!=='overview') $('#viewContainer').innerHTML=(views[currentView]||projectsView)();
  }
  function releaseGame(){
    const p=state.project; const insightBonus=state.research.includes('insights')?8:0;
    const quality=Math.min(98,Math.max(48,Math.round(52+p.progress/8+state.reputation/12+state.research.length*3+insightBonus+Math.random()*12)));
    const communityBonus=state.research.includes('community')?1.15:1;
    const game={name:p.name,genre:p.genre,platform:p.platform,quality,royalty:Math.round((90+quality*5+state.marketing*.7)*communityBonus),released:dateString(),sales:Math.round(450+quality*45+state.marketing*1.5)};
    state.games.unshift(game); state.project=null; state.reputation=Math.min(100,state.reputation+8); state.cash+=game.sales;
    log('★','yellow',`<strong>${escapeHtml(game.name)}</strong> launched to a ${quality}% player rating!`,`Today · ${dateString()}`);
    notify(`${game.name} launched! ${fmt(game.sales)} in opening sales.`, '★');
  }
  function work(){if(!state.project){notify('Start a new game project first.','◈');navigate('projects');return;}tick({focused:true});if(state.project)notify(`Great work! ${state.project.name} is now ${state.project.progress}% complete.`);}
  function newProject(name,genre,platform,budget){if(state.project){notify('Finish your active project before starting another.','◈');return;}if(state.cash<budget){notify('Not enough cash for that project.','＄');return;}state.cash-=budget;state.project={name,genre,platform,phase:'Concept',progress:0,budget,planned:true};log('◈','blue',`The team kicked off <strong>${escapeHtml(name)}</strong>.`);update();notify(`${name} is in development. Let's make something great!`);navigate('overview');}
  const researchOptions=[
    {name:'Agile workflows',icon:'⌬',cost:4500,desc:'A tighter production pipeline. Your team gains +2 development points each workday.',effect:'+2 daily progress',key:'agile'},
    {name:'Player insights',icon:'◎',cost:6000,desc:'Learn what players love. Every new release gets a quality boost.',effect:'+8 release quality',key:'insights'},
    {name:'Cross-platform tools',icon:'▤',cost:9000,desc:'Bring your games to more players with a second platform option.',effect:'Unlock more players',key:'platforms'},
    {name:'Community building',icon:'♡',cost:3800,desc:'Build a loyal fanbase that follows every launch.',effect:'+15% royalties',key:'community'}
  ];
  function getResearchCost(o){return o.cost;}
  function buyResearch(key){const o=researchOptions.find(x=>x.key===key);if(!o||state.research.includes(key))return;if(state.cash<o.cost){notify('You need more cash for this research.','＄');return;}state.cash-=o.cost;state.research.push(key);if(key==='community')state.reputation=Math.min(100,state.reputation+5);log('⌬','purple',`Research complete: <strong>${o.name}</strong>.`);update();notify(`${o.name} unlocked!`);navigate('research');}
  function hire(role){const roster={Designer:{salary:90,skill:6,initials:'DS'},Programmer:{salary:120,skill:7,initials:'PG'},Artist:{salary:85,skill:6,initials:'AR'},Producer:{salary:105,skill:6,initials:'PR'},Marketer:{salary:95,skill:5,initials:'MK'}};const r=roster[role];if(!r)return;if(state.team.length>=state.officeLevel*5){notify('Your office is full. Upgrade your space before hiring again.','⌂');navigate('office');return;}const cost=r.salary*7;if(state.cash<cost){notify(`Hiring bonus requires ${fmt(cost)}.`,'＄');return;}const first=['Sam','Alex','Taylor','Casey','Jordan','Cameron','Robin','Drew'][Math.floor(Math.random()*8)];const last=['Park','Reed','Stone','Rivera','Bell','Nguyen','Brooks','Wells'][Math.floor(Math.random()*8)];state.cash-=cost;state.team.push({name:`${first} ${last}`,role,skill:r.skill,salary:r.salary,initials:r.initials});state.reputation=Math.min(100,state.reputation+1);log('♧','green',`<strong>${escapeHtml(first)} ${escapeHtml(last)}</strong> joined as a ${role.toLowerCase()}.`);update();notify(`${first} joined your studio. Welcome aboard!`);navigate('team');}
  function upgradeOffice(){const cost=state.officeLevel===1?8500:state.officeLevel===2?22000:45000;if(state.officeLevel>=4){notify('Your studio is already at its biggest!');return;}if(state.cash<cost){notify(`Office upgrade costs ${fmt(cost)}.`,'＄');return;}state.cash-=cost;state.officeLevel++;state.reputation=Math.min(100,state.reputation+3);log('⌂','blue',`Your studio moved into a bigger office. Welcome to <strong>Level ${state.officeLevel}</strong>!`);update();notify('A bigger office — room for bigger dreams!');navigate('office');}
  function campaign(){const cost=2500;if(state.cash<cost){notify('Not enough cash for a campaign.','＄');return;}state.cash-=cost;state.marketing+=500;state.reputation=Math.min(100,state.reputation+4);state.competitors.forEach(c=>c.share=Math.max(8,c.share-2));log('↗','yellow',`A community campaign is bringing new fans to <strong>${escapeHtml(state.project?.name||'your studio')}</strong>.`);update();notify('Campaign launched! Your reputation is up.');navigate('market');}

  const projectsView=()=>`<div class="view-heading"><div><div class="eyebrow">MAKE SOMETHING MEMORABLE</div><h1>Your projects</h1><p>Dream up a new game, then bring it to life with your team.</p></div><span class="card-tag">${state.games.length} RELEASED</span></div>${state.project?`<div class="wide-panel"><h2>Currently in development</h2><div class="employee-row"><div class="card-icon">◈</div><div class="employee-info"><strong>${escapeHtml(state.project.name)} · ${state.project.progress}% complete</strong><small>${escapeHtml(state.project.genre)} · ${escapeHtml(state.project.platform)} · ${state.project.phase}</small></div><button class="card-action" data-action="work">Work today</button></div><div class="progress-track"><span style="width:${state.project.progress}%"></span></div></div>`:`<div class="content-grid">${[{name:'Starlit Harbor',genre:'Cozy simulation',platform:'PC',budget:9000,icon:'✿',desc:'Build a little harbor town, one friendship at a time.'},{name:'Neon Courier',genre:'Arcade action',platform:'PC',budget:10500,icon:'↗',desc:'Race the clock through a neon-soaked future city.'},{name:'Pocket Planet',genre:'Puzzle adventure',platform:'Mobile',budget:8000,icon:'◎',desc:'Solve charming cosmic puzzles on a tiny planet.'}].filter(p=>p.platform!=='Mobile'||state.research.includes('platforms')).map(p=>`<article class="content-card"><div class="card-icon">${p.icon}</div><h3>${p.name}</h3><span class="card-tag">${p.genre}</span><p>${p.desc}</p><div class="card-meta"><span>${p.platform} · ${fmt(p.budget)} budget</span><span>${state.team.length} teammates</span></div><button class="card-action" data-project="${p.name}" data-genre="${p.genre}" data-platform="${p.platform}" data-budget="${p.budget}">Start this game →</button></article>`).join('')}</div>`}${state.games.length?`<div class="wide-panel" style="margin-top:14px"><h2>Released games</h2>${state.games.map(g=>`<div class="employee-row"><div class="card-icon">★</div><div class="employee-info"><strong>${escapeHtml(g.name)}</strong><small>${escapeHtml(g.genre)} · Released ${escapeHtml(g.released)}</small></div><span class="card-tag">${g.quality}% player rating</span></div>`).join('')}</div>`:''}`;
  const teamView=()=>`<div class="view-heading"><div><div class="eyebrow">GOOD PEOPLE MAKE GREAT GAMES</div><h1>Your team</h1><p>Build a balanced team and keep your creative energy flowing.</p></div><span class="card-tag">${state.team.length} TEAM MEMBERS</span></div><div class="wide-panel"><h2>Studio roster <span style="color:#96a199;font-size:10px;font-weight:400">· ${fmt(state.team.reduce((n,p)=>n+p.salary,0))}/day payroll</span></h2>${state.team.map((p,i)=>`<div class="employee-row"><div class="employee-avatar">${escapeHtml(p.initials||p.name.slice(0,2).toUpperCase())}</div><div class="employee-info"><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.role)} · ${i===state.team.length-1&&p.salary===0?'Founder':'Studio team'}</small></div><span class="employee-skill">✦ ${Math.round(p.skill)} skill</span><span class="salary">${p.salary?fmt(p.salary)+'/day':'Founder'}</span></div>`).join('')}</div><div class="view-heading" style="margin:20px 0 12px"><div><h2 style="font:600 16px 'Space Grotesk';margin:0">Meet your next teammate</h2><p style="margin-top:5px">A one-time signing bonus equal to one week of salary.</p></div></div><div class="content-grid">${[{role:'Designer',desc:'Shapes the feel and fun of every game.',cost:90*7,icon:'✿'},{role:'Programmer',desc:'Turns your big ideas into playable worlds.',cost:120*7,icon:'⌘'},{role:'Artist',desc:'Gives your games their own visual soul.',cost:85*7,icon:'◉'},{role:'Producer',desc:'Keeps your team focused and projects on track.',cost:105*7,icon:'◷'},{role:'Marketer',desc:'Helps the right players discover your games.',cost:95*7,icon:'↗'}].map(x=>`<article class="content-card"><div class="card-icon">${x.icon}</div><h3>${x.role}</h3><p>${x.desc}</p><div class="card-meta"><span>${fmt(x.cost)} signing bonus</span><span>${fmt(x.cost/7)}/day</span></div><button class="card-action" data-hire="${x.role}">Invite to studio →</button></article>`).join('')}</div>`;
  const officeView=()=>`<div class="view-heading"><div><div class="eyebrow">A PLACE TO DO YOUR BEST WORK</div><h1>Your office</h1><p>Make room for your team and the next big idea.</p></div><span class="card-tag">LEVEL ${state.officeLevel} STUDIO</span></div><div class="wide-panel"><div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:center"><div><div class="card-icon">⌂</div><h2 style="margin:12px 0 5px">${['The spare room','Creative loft','Downtown studio','Global headquarters'][state.officeLevel-1]||'Global headquarters'}</h2><p style="color:#87928b;font-size:10px;line-height:1.6">${['Every empire starts somewhere. A cozy home setup with room for a small dream team.','A bright, open space with room to think, make, and grow.','A polished creative studio where ambitious projects take shape.','Your own headquarters. A home for a world-class game company.'][state.officeLevel-1]}</p><div class="card-meta"><span>Team capacity</span><strong>${state.officeLevel*5} people</strong><span>Daily rent</span><strong>${fmt(state.officeLevel*24)}</strong></div>${state.officeLevel<4?`<button class="card-action" data-upgrade>Upgrade office · ${fmt(state.officeLevel===1?8500:state.officeLevel===2?22000:45000)} →</button>`:'<span class="card-tag">MAX LEVEL REACHED</span>'}</div><div style="min-height:180px;border-radius:10px;background:linear-gradient(145deg,#e9f4e9,#d4e8d8);display:grid;place-items:center;font-size:72px;color:#5d9072">⌂</div></div></div><div class="content-grid"><article class="content-card"><div class="card-icon">♧</div><h3>Team capacity</h3><p>Your office has room for a growing studio. Upgrade before hiring more than ${state.officeLevel*5} people.</p><div class="card-meta"><span>${state.team.length} / ${state.officeLevel*5} seats occupied</span></div></article><article class="content-card"><div class="card-icon">✦</div><h3>Studio reputation</h3><p>A comfortable workspace helps attract new talent and signals your ambition to the industry.</p><div class="card-meta"><span>${state.reputation} / 100 points</span></div></article></div>`;
  const researchView=()=>`<div class="view-heading"><div><div class="eyebrow">INVEST IN YOUR CRAFT</div><h1>Research & development</h1><p>Better tools and smarter processes make every project stronger.</p></div><span class="card-tag">${state.research.length} UPGRADES</span></div><div class="content-grid">${researchOptions.map(o=>{const done=state.research.includes(o.key);return `<article class="content-card"><div class="card-icon">${o.icon}</div><h3>${o.name}</h3><p>${o.desc}</p><div class="card-meta"><span>${o.effect}</span><span>${done?'UNLOCKED':fmt(getResearchCost(o))}</span></div><button class="card-action" data-research="${o.key}" ${done?'disabled':''}>${done?'✓ Researched':'Fund research →'}</button></article>`}).join('')}</div><div class="wide-panel" style="margin-top:14px"><h2>Your discoveries</h2><p style="font-size:10px;color:#87928b">${state.research.length?`You've invested in ${state.research.map(k=>researchOptions.find(o=>o.key===k)?.name).join(', ')}. These upgrades are permanent.`:'No research yet. Start with a workflow upgrade to help your whole team.'}</p></div>`;
  const marketView=()=>`<div class="view-heading"><div><div class="eyebrow">FIND YOUR PEOPLE</div><h1>Market & competitors</h1><p>Make some noise, reach new players, and keep an eye on the scene.</p></div><button class="card-action" data-campaign>Launch campaign · $2,500 ↗</button></div><div class="content-grid"><article class="content-card"><div class="card-icon">↗</div><h3>Community campaign</h3><p>Build buzz through creator previews, a dev diary, and a cozy little launch event.</p><div class="card-meta"><span>+4 reputation</span><span>-$2,500</span></div><button class="card-action" data-campaign>Launch campaign →</button></article><article class="content-card"><div class="card-icon">◉</div><h3>Your audience</h3><p>Every player who discovers your studio can become a fan of your next game.</p><div class="card-meta"><span>Studio reputation</span><strong>${state.reputation} / 100</strong></div><div class="progress-track"><span style="width:${state.reputation}%"></span></div></article><article class="content-card"><div class="card-icon">★</div><h3>Player community</h3><p>${Math.max(210,Math.round(state.reputation*75+state.games.length*1200)).toLocaleString()} players are keeping an eye on your studio.</p><div class="card-meta"><span>Fans grow with every release</span></div></article></div><div class="wide-panel" style="margin-top:14px"><h2>Studios to watch</h2>${state.competitors.map(c=>`<div class="competitor-row"><div class="employee-avatar">${c.initials}</div><div class="employee-info"><strong>${c.name}</strong><small>${c.genre}</small></div><span class="salary">${c.share}% genre share</span></div>`).join('')}</div>`;
  const views={projects:projectsView,team:teamView,office:officeView,research:researchView,market:marketView};
  function navigate(view){
    currentView=view;
    $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    $('#breadcrumbTitle').textContent=view==='overview'?'Overview':({projects:'Projects',team:'Team',office:'Office',research:'Research',market:'Market'}[view]||'Overview');
    if(view==='overview'){$('#pageWrap').hidden=false;$('#viewContainer').hidden=true;}else{$('#pageWrap').hidden=true;$('#viewContainer').hidden=false;$('#viewContainer').innerHTML=(views[view]||projectsView)();}
    $('#sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});
  }
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-view]');if(nav){navigate(nav.dataset.view);return;}
    const open=e.target.closest('[data-open]');if(open){navigate(open.dataset.open);return;}
    const project=e.target.closest('[data-project]');if(project){newProject(project.dataset.project,project.dataset.genre,project.dataset.platform,+project.dataset.budget);return;}
    const hireBtn=e.target.closest('[data-hire]');if(hireBtn){hire(hireBtn.dataset.hire);return;}
    const research=e.target.closest('[data-research]');if(research){buyResearch(research.dataset.research);return;}
    if(e.target.closest('[data-upgrade]')){upgradeOffice();return;}
    if(e.target.closest('[data-campaign]')){campaign();return;}
    if(e.target.closest('[data-action="work"]')){work();return;}
  });
  $('#advanceDay').addEventListener('click',()=>{tick();notify('A new day in the studio. Your team made progress!','◷');});
  $('#workProject').addEventListener('click',work);
  $('#menuToggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#howToPlay').addEventListener('click',()=>$('#modalBackdrop').hidden=false);
  $('#modalClose').addEventListener('click',()=>$('#modalBackdrop').hidden=true);
  $('#gotIt').addEventListener('click',()=>$('#modalBackdrop').hidden=true);
  $('#modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')e.currentTarget.hidden=true;});
  $('#viewActivity').addEventListener('click',()=>notify('You’re all caught up with studio news.','✓'));
  $('#notifications').addEventListener('click',()=>notify('No new notifications — enjoy the quiet before launch!','♧'));
  $('#soundToggle').addEventListener('click',e=>{state.sound=!state.sound;e.currentTarget.style.color=state.sound?'#7d8981':'#c3c9c4';notify(state.sound?'Studio sounds on.':'Studio sounds off.','♫');save();});
  $('#chartRange').addEventListener('change',e=>{const labels=e.target.value==='Last 7 days'?['Apr 8','Apr 9','Apr 10','Apr 11','Apr 12','Apr 13','Apr 14']:e.target.value==='Last 30 days'?['Mar 16','Mar 21','Mar 26','Mar 31','Apr 5','Apr 10','Apr 14']:['Jan','Mar','May','Jul','Sep','Nov','Dec'];$$('.chart-x-labels span').forEach((el,i)=>el.textContent=labels[i]);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){ $('#modalBackdrop').hidden=true;$('#sidebar').classList.remove('open');}});
  if(!state.activity.length){log('✦','green','<strong>Your studio is open!</strong> Mosslight is in development.');log('♧','purple','Your small but mighty team is ready to create.','Yesterday');log('↗','blue','The indie market is full of possibilities.','Yesterday');}
  update();
})();
