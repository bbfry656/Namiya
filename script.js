let stories=[];
const grid=document.getElementById('story-grid');
const reader=document.getElementById('reader');
const scroll=document.querySelector('.reader-scroll');
let lastFocus=null;
let activeStory=null;
function render(filter='all'){
  grid.replaceChildren();
  stories.forEach((story,index)=>{
    if(filter!=='all'&&story.type!==filter)return;
    const safe = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    const card=document.createElement('article');
    card.className='story-card';card.tabIndex=0;card.setAttribute('role','button');
    card.dataset.issue=story.issue;
    card.setAttribute('aria-label','Открыть историю «'+story.title+'»');
    card.innerHTML=`<div class="image-wrap"><img src="${story.images[0]}" alt="${safe(story.title)}" loading="lazy"></div><div class="meta"><span>№ ${safe(story.issue)} / ${safe(story.tag)}${story.demo?' · ДЕМО':''}</span><span>ЧИТАТЬ ИСТОРИЮ ↗</span></div><h3>${safe(story.title)}</h3><p>${safe(story.sub)}</p>`;
    NamiyaCover.mount(card.querySelector('.image-wrap'),story);
    card.addEventListener('click',()=>openStory(index));
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openStory(index)}});
    grid.append(card);
  });
  window.dispatchEvent(new Event('namiya-grid-rendered'));
}
function openStory(index,updateHash=true){
  const s=stories[index];if(!s)return;
  if(!reader.classList.contains('open'))lastFocus=document.activeElement;
  activeStory=index;
  document.getElementById('reader-issue').textContent='ИСТОРИЯ '+s.issue;
  document.getElementById('reader-title').textContent=s.title;
  document.getElementById('reader-subtitle').textContent=s.sub;
  document.getElementById('reader-quote').textContent='«'+s.note+'»';
  document.getElementById('reader-cover-img').src=s.images[0];
  document.getElementById('reader-cover-img').alt='Обложка истории «'+s.title+'»';
  const coverFrame=document.getElementById('reader-cover-frame'),coverImage=document.getElementById('reader-cover-img');
  const coverRatio=()=>{if(coverImage.naturalHeight)coverFrame.style.setProperty('--cover-ratio',coverImage.naturalWidth/coverImage.naturalHeight);};coverImage.onload=coverRatio;coverRatio();NamiyaCover.mount(coverFrame,s);
  const spread=document.getElementById('reader-spread');spread.replaceChildren();
  s.images.forEach((image,imageIndex)=>{
  const page=document.createElement('section');page.className='spread editorial-spread';
  const img=document.createElement('img');img.src=image;img.alt=s.title+' — фотография '+(imageIndex+1);img.loading='lazy';
  const copy=document.createElement('div');copy.className='spread-copy';
  const folio=document.createElement('span');folio.className='page-no';folio.textContent='ФОТОГРАФИЯ · '+String(imageIndex+1).padStart(2,'0');
  page.dataset.frameIndex=imageIndex;
  const heading=document.createElement('h3');heading.textContent=s.frames?.[imageIndex]?.title||'';
  const description=document.createElement('p');description.textContent=s.frames?.[imageIndex]?.body||'';
  copy.append(folio,heading,description);page.append(img,copy);spread.append(page);
  });
  const outro=document.createElement('section');outro.className='editorial-note';
  outro.innerHTML='<span class="smallcaps">НА ПАМЯТЬ</span><p>У каждого дня есть своя история.<br><em>Пусть она останется с вами.</em></p><span class="smallcaps">03 / 03</span>';
  outro.querySelector('span:last-child').textContent=String(s.images.length+2).padStart(2,'0')+' / '+String(s.images.length+2).padStart(2,'0');
  spread.append(outro);
  document.getElementById('reader-progress').textContent='01 / '+String(s.images.length+2).padStart(2,'0');
  document.getElementById('reader-caption').textContent=s.caption;
  document.getElementById('reader-body').textContent=s.body||'';
  reader.classList.add('open');reader.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';scroll.scrollTop=0;
  document.getElementById('reader-close').focus();
  window.dispatchEvent(new CustomEvent('namiya-story-open',{detail:s.issue}));
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
  if(!reader.classList.contains('open')||document.querySelector('.photo-zoom[open]'))return;
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
  const total=(stories[activeStory]?.images.length||1)+2;
  document.getElementById('reader-progress').textContent=String(Math.min(total,1+Math.floor(fraction*(total-.01)))).padStart(2,'0')+' / '+String(total).padStart(2,'0');
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
  toggle.classList.toggle('close-control',open);
  toggle.textContent=open?'':'☰';
}
toggle.addEventListener('click',()=>setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&nav.classList.contains('open')&&!reader.classList.contains('open')){
    setMenu(false);toggle.focus();
  }
});
document.getElementById('year').textContent=new Date().getFullYear();
async function loadStories(){
try {
 const rows=await NamiyaCloud.publicList();
 stories=await Promise.all(NamiyaContent.validate(rows.map(row=>row.payload)).map(NamiyaCloud.resolve));render(document.querySelector('.filter.active')?.dataset.filter||'all');
 const demoNote=document.querySelector('.demo-note');
 demoNote.hidden=!stories.some(s=>s.demo);
 demoNote.textContent='* Истории с пометкой «демо» показывают пример оформления. Фотографии в демонстрационных подборках не являются кадрами одной реальной съёмки.';
const initial=location.hash.match(/^#story-(\d{3})$/);
if(initial){const i=stories.findIndex(s=>s.issue===initial[1]);if(i!==-1)openStory(i,false)}

} catch { grid.textContent='Не удалось загрузить истории. Обновите страницу чуть позже.'; }
}
loadStories();
setInterval(()=>{if(!document.hidden&&!reader.classList.contains('open')&&!window.NamiyaInlineEditing)loadStories();},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!reader.classList.contains('open')&&!window.NamiyaInlineEditing)loadStories();});
async function refreshAtPosition(){if(window.NamiyaInlineOrderDirty)return;const position=window.scrollY;await loadStories();window.scrollTo({top:position,behavior:'instant'});}
window.addEventListener('namiya-story-saved',refreshAtPosition);window.addEventListener('namiya-refresh-stories',refreshAtPosition);
window.addEventListener('namiya-close-reader',()=>closeStory());
function loadHero(){NamiyaCloud.request('/rest/v1/namiya_settings?select=path&id=eq.hero').then(async rows=>{if(rows.length){const image=await NamiyaCloud.sign('cloud/'+rows[0].path);document.querySelector('main>.hero .hero-photo').style.backgroundImage=`url("${image}")`;}}).catch(()=>{});}
loadHero();window.addEventListener('namiya-hero-saved',loadHero);
