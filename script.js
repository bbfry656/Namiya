const photos=["assets/demo-1.jpg", "assets/demo-2.jpg", "assets/demo-3.jpg", "assets/demo-4.jpg", "assets/demo-5.jpg", "assets/demo-6.jpg"];
const stories=[
{title:'Быть собой',type:'portrait',tag:'ПОРТРЕТ',sub:'Тишина, свет и немного магии',photo:0,issue:'001',caption:'В каждом взгляде — целая вселенная.',note:'Иногда достаточно одного мгновения, чтобы увидеть в себе что-то новое.'},
{title:'Только мы',type:'love',tag:'LOVE STORY',sub:'История о близости',photo:1,issue:'002',caption:'Самые важные слова иногда не нужны.',note:'Есть истории, в которых самые важные слова произносят взгляды.'},
{title:'Наш маленький мир',type:'family',tag:'СЕМЬЯ',sub:'Тёплые мгновения рядом',photo:2,issue:'003',caption:'Дом — это люди, которых мы любим.',note:'Память хранит не идеальные позы, а тепло знакомых рук.'},
{title:'Тихий свет',type:'portrait',tag:'ПОРТРЕТ',sub:'Портретная история',photo:3,issue:'004',caption:'Красота в простоте и искренности.',note:'Свет меняется. Настроение остаётся с нами.'},
{title:'Между строк',type:'story',tag:'ИСТОРИИ',sub:'Атмосфера одного дня',photo:4,issue:'005',caption:'Моменты, которые хочется остановить.',note:'Из самых простых дней получаются самые дорогие воспоминания.'},
{title:'Люди и чувства',type:'story',tag:'ИСТОРИИ',sub:'Авторская фотосерия',photo:5,issue:'006',caption:'О том, что остаётся внутри.',note:'Истории начинаются там, где мы позволяем себе быть настоящими.'}
];
const grid=document.getElementById('story-grid');
const reader=document.getElementById('reader');
const scroll=document.querySelector('.reader-scroll');
let lastFocus=null;
let activeStory=null;
function render(filter='all'){
  grid.replaceChildren();
  stories.forEach((story,index)=>{
    if(filter!=='all'&&story.type!==filter)return;
    const card=document.createElement('article');
    card.className='story-card';card.tabIndex=0;card.setAttribute('role','button');
    card.setAttribute('aria-label','Открыть историю «'+story.title+'»');
    card.innerHTML=`<div class="image-wrap"><img src="${photos[story.photo]}" alt="Демонстрационная фотография: ${story.tag.toLowerCase()}" loading="lazy"></div><div class="meta"><span>№ ${story.issue} / ${story.tag}</span><span>ЧИТАТЬ ИСТОРИЮ ↗</span></div><h3>${story.title}</h3><p>${story.sub}</p>`;
    card.addEventListener('click',()=>openStory(index));
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openStory(index)}});
    grid.append(card);
  });
}
function openStory(index,updateHash=true){
  const s=stories[index];if(!s)return;
  if(!reader.classList.contains('open'))lastFocus=document.activeElement;
  activeStory=index;
  document.getElementById('reader-issue').textContent='ИСТОРИЯ '+s.issue;
  document.getElementById('reader-title').textContent=s.title;
  document.getElementById('reader-subtitle').textContent=s.sub;
  document.getElementById('reader-quote').textContent='«'+s.note+'»';
  document.getElementById('reader-cover-img').src=photos[s.photo];
  document.getElementById('reader-cover-img').alt='Демонстрационная обложка истории «'+s.title+'»';
  const spread=document.getElementById('reader-spread');spread.replaceChildren();
  // A single coherent placeholder image per story until the photographer supplies a real series.
  const page=document.createElement('section');page.className='spread editorial-spread';
  const img=document.createElement('img');img.src=photos[s.photo];img.alt='Фрагмент обложки — демонстрационное изображение';
  const copy=document.createElement('div');copy.className='spread-copy';
  const folio=document.createElement('span');folio.className='page-no';folio.textContent='ФОТОИСТОРИЯ · 02';
  const heading=document.createElement('h3');heading.textContent=s.caption;
  const description=document.createElement('p');description.textContent='Скоро здесь появятся фотографии одной настоящей съёмки — с собственным ритмом, деталями и настроением.';
  copy.append(folio,heading,description);page.append(img,copy);spread.append(page);
  const outro=document.createElement('section');outro.className='editorial-note';
  outro.innerHTML='<span class="smallcaps">НА ПАМЯТЬ</span><p>У каждого дня есть своя история.<br><em>Пусть она останется с вами.</em></p><span class="smallcaps">03 / 03</span>';
  spread.append(outro);
  document.getElementById('reader-progress').textContent='01 / 03';
  reader.classList.add('open');reader.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';scroll.scrollTop=0;
  document.getElementById('reader-close').focus();
  if(updateHash)history.pushState({namiyaStory:true},'','#story-'+s.issue);
}
function closeStory(updateHash=true){
  if(updateHash&&history.state?.namiyaStory&&location.hash.startsWith('#story-')){
    history.back();
    return;
  }
  reader.classList.remove('open');reader.setAttribute('aria-hidden','true');document.body.style.overflow='';activeStory=null;
  if(updateHash&&location.hash.startsWith('#story-'))history.replaceState(null,'','#journal');
  lastFocus?.focus();
}
document.getElementById('reader-close').addEventListener('click',()=>closeStory());
document.getElementById('reader-back').addEventListener('click',()=>closeStory());
document.addEventListener('keydown',e=>{
  if(!reader.classList.contains('open'))return;
  if(e.key==='Escape')closeStory();
  if(e.key==='Tab'){
    const controls=[...reader.querySelectorAll('button')].filter(el=>el.offsetParent!==null);
    const first=controls[0],last=controls[controls.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});
scroll.addEventListener('scroll',()=>{
  if(!reader.classList.contains('open'))return;
  const fraction=scroll.scrollTop/Math.max(1,scroll.scrollHeight-scroll.clientHeight);
  document.getElementById('reader-progress').textContent=String(Math.min(3,1+Math.floor(fraction*2.99))).padStart(2,'0')+' / 03';
},{passive:true});
window.addEventListener('hashchange',()=>{
  const match=location.hash.match(/^#story-(\d{3})$/);
  if(match){const index=stories.findIndex(s=>s.issue===match[1]);if(index!==-1&&activeStory!==index)openStory(index,false)}
  else if(reader.classList.contains('open'))closeStory(false);
});
document.querySelectorAll('.filter').forEach(btn=>{
  btn.setAttribute('aria-pressed',String(btn.classList.contains('active')));
  btn.addEventListener('click',()=>{
  document.querySelectorAll('.filter').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false')});
  btn.classList.add('active');btn.setAttribute('aria-pressed','true');render(btn.dataset.filter);
  });
});
const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav');
function setMenu(open){
  nav.classList.toggle('open',open);
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');
  toggle.textContent=open?'✕':'☰';
}
toggle.addEventListener('click',()=>setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&nav.classList.contains('open')&&!reader.classList.contains('open')){
    setMenu(false);toggle.focus();
  }
});
document.getElementById('year').textContent=new Date().getFullYear();render();
const initial=location.hash.match(/^#story-(\d{3})$/);
if(initial){const i=stories.findIndex(s=>s.issue===initial[1]);if(i!==-1)openStory(i,false)}
