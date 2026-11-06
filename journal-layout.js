window.NamiyaJournalLayout=(()=>{
 const grid=document.getElementById('story-grid'),geometry=NamiyaLayoutGeometry;
 let layout=null,drag=null,timer=null,resizeObserver=null,history=[],active=false;
 const desktop=()=>innerWidth>=750;
 const isFree=()=>layout?.mode==='free';
 const allStories=()=>document.querySelector('.filter.active')?.dataset.filter==='all';
 const nodes=()=>[...grid.querySelectorAll('.story-card[data-issue],.journal-layout-note')];
 function mark(){NamiyaSiteContent.setJournalLayout(layout);window.dispatchEvent(new Event('namiya-layout-changed'));}
 function snapshot(){history.push(JSON.stringify(layout));if(history.length>30)history.shift();}
 function position(node){return node.matches('[data-issue]')?layout.cards[node.dataset.issue]:layout.notes.find(note=>note.id===node.dataset.note);}
 function savePosition(node,frame){if(node.matches('[data-issue]'))layout.cards[node.dataset.issue]=frame;else Object.assign(layout.notes.find(note=>note.id===node.dataset.note),frame);}
 function height(){if(!isFree()||!desktop())return;let bottom=0;for(const node of nodes()){const p=position(node);if(p)bottom=Math.max(bottom,p.y/1000*grid.clientWidth+node.offsetHeight);}grid.style.height=Math.ceil(bottom+60)+'px';}
 function style(node){const p=position(node);if(!p)return;if(desktop()){node.style.left=p.x/10+'%';node.style.top=p.y/1000*grid.clientWidth+'px';node.style.width=p.w/10+'%';}else{node.style.removeProperty('left');node.style.removeProperty('top');node.style.removeProperty('width');}}
 function handle(node,type,label){let button=node.querySelector('.'+type);if(!button){button=document.createElement('button');button.type='button';button.className=type;button.textContent=type==='layout-resize'?'↘':'⠿';button.setAttribute('aria-label',label);node.append(button);}button.hidden=!window.NamiyaInlineEditing||!desktop();return button;}
 function apply(){
  resizeObserver?.disconnect();grid.querySelectorAll('.journal-layout-note').forEach(note=>note.remove());
  if(isFree()&&!allStories()){grid.classList.remove('journal-free');grid.style.removeProperty('height');for(const card of grid.querySelectorAll('.story-card')){for(const property of ['left','top','width'])card.style.removeProperty(property);card.querySelector('.layout-resize')?.remove();}return;}
  grid.classList.toggle('journal-free',!!isFree());grid.style.removeProperty('height');
  for(const card of grid.querySelectorAll('.story-card')){if(isFree()){if(!layout.cards[card.dataset.issue]){const i=[...grid.querySelectorAll('.story-card')].indexOf(card);layout.cards[card.dataset.issue]=geometry.frame({x:i%2?590:20,y:Math.floor(i/2)*720+(i%2?220:0),w:i%2?380:450});}style(card);handle(card,'layout-resize','Изменить размер истории');}else{card.style.removeProperty('left');card.style.removeProperty('top');card.style.removeProperty('width');card.querySelector('.layout-resize')?.remove();}}
  if(isFree())for(const note of layout.notes){
   const article=document.createElement('aside');article.className='journal-layout-note';article.dataset.note=note.id;const text=document.createElement('p');text.textContent=note.body;text.contentEditable=String(!!window.NamiyaInlineEditing);text.setAttribute('aria-label','Текст в композиции');text.addEventListener('input',()=>{note.body=text.innerText.slice(0,2000);mark();height();});article.append(text);handle(article,'layout-note-grip','Переместить текст');handle(article,'layout-resize','Изменить ширину текста');
   if(window.NamiyaInlineEditing){const remove=document.createElement('button');remove.type='button';remove.className='layout-note-remove close-control';remove.setAttribute('aria-label','Убрать текстовый блок');remove.addEventListener('click',()=>{snapshot();layout.notes=layout.notes.filter(n=>n.id!==note.id);apply();mark();});article.append(remove);}
   if(!desktop()){const before=[...grid.querySelectorAll('[data-issue]')].filter(card=>layout.cards[card.dataset.issue]?.y<=note.y).sort((a,b)=>layout.cards[b.dataset.issue].y-layout.cards[a.dataset.issue].y)[0];if(before)before.after(article);else grid.prepend(article);}else grid.append(article);style(article);
  }
  if(isFree()&&desktop()){resizeObserver=new ResizeObserver(height);nodes().forEach(node=>resizeObserver.observe(node));height();}
 }
 function down(event){
  if(!isFree()||!allStories()||!desktop()||!window.NamiyaInlineEditing)return;const button=event.target.closest('.story-grip,.layout-note-grip,.layout-resize');if(!button||event.button>0)return;
  const node=button.closest('[data-issue],[data-note]');if(!node)return;event.preventDefault();
  const begin=()=>{snapshot();drag={node,button,id:event.pointerId,x:event.clientX,y:event.clientY,start:{...position(node)},resize:button.classList.contains('layout-resize')};node.classList.add('is-dragging');button.setPointerCapture(event.pointerId);};
  if(event.pointerType==='mouse')begin();else timer=setTimeout(begin,350);
 }
 function move(event){if(!drag)return;event.preventDefault();const scale=1000/grid.clientWidth,dx=(event.clientX-drag.x)*scale,dy=(event.clientY-drag.y)*scale;const p=drag.resize?geometry.resize(drag.start,dx):geometry.move(drag.start,dx,dy);savePosition(drag.node,p);style(drag.node);height();}
 function end(){clearTimeout(timer);if(!drag)return;drag.node.classList.remove('is-dragging');try{drag.button.releasePointerCapture(drag.id);}catch{}drag=null;mark();}
 grid.addEventListener('pointerdown',down);grid.addEventListener('pointermove',move);grid.addEventListener('pointerup',end);grid.addEventListener('pointercancel',end);
 grid.addEventListener('keydown',event=>{
  if(!isFree()||!desktop()||!window.NamiyaInlineEditing)return;const button=event.target.closest('.story-grip,.layout-note-grip,.layout-resize');if(!button||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();event.stopImmediatePropagation();const node=button.closest('[data-issue],[data-note]');snapshot();const p=position(node),step=event.shiftKey?20:5,dx=event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,dy=event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0;savePosition(node,button.classList.contains('layout-resize')?geometry.resize(p,dx||dy):geometry.move(p,dx,dy));style(node);height();mark();
 },true);
 window.addEventListener('resize',()=>{if(isFree()){apply();window.dispatchEvent(new Event('namiya-layout-mode'));}});
 window.addEventListener('namiya-grid-rendered',apply);
 NamiyaSiteContent.ready.then(()=>{
  const stored=NamiyaSiteContent.getJournalLayout();if(stored?.mode==='free'){
   layout={mode:'free',cards:{},notes:[]};for(const [id,p]of Object.entries(stored.cards||{}))if(/^\d{3}$/.test(id))layout.cards[id]=geometry.frame(p);
   layout.notes=(stored.notes||[]).slice(0,20).map(n=>({...geometry.frame(n),id:String(n.id).replace(/[^a-zA-Z0-9-]/g,'').slice(0,60),body:String(n.body||'').slice(0,2000)}));
  }apply();
 });
 function attachToolbar(bar){
  const mode=document.createElement('button');mode.type='button';const add=document.createElement('button');add.type='button';add.textContent='＋ Текст';const undo=document.createElement('button');undo.type='button';undo.textContent='Отменить';const reset=document.createElement('button');reset.type='button';reset.textContent='Сбросить';bar.insertBefore(mode,bar.lastElementChild);bar.insertBefore(add,bar.lastElementChild);bar.insertBefore(undo,bar.lastElementChild);bar.insertBefore(reset,bar.lastElementChild);
  function update(){for(const b of [mode,add,undo,reset])b.hidden=!window.NamiyaInlineEditing;mode.textContent=isFree()?'Раскладка: свободная':'Свободная раскладка';add.disabled=!isFree()||!desktop();undo.disabled=!history.length;reset.disabled=!isFree();}
  mode.addEventListener('click',()=>{snapshot();if(isFree())layout=null;else layout={mode:'free',cards:{},notes:[]};apply();mark();update();window.dispatchEvent(new Event('namiya-layout-mode'));});
  add.addEventListener('click',()=>{if(!isFree())return;if(!allStories())document.querySelector('[data-filter="all"]').click();if(layout.notes.length>=20)return;snapshot();layout.notes.push({id:crypto.randomUUID(),x:580,y:Math.max(100,(window.scrollY-grid.getBoundingClientRect().top-window.scrollY+150)/grid.clientWidth*1000),w:350,body:'Текст, который связывает ваши истории.'});apply();mark();update();});
  undo.addEventListener('click',()=>{if(!history.length)return;layout=JSON.parse(history.pop());apply();mark();update();window.dispatchEvent(new Event('namiya-layout-mode'));});
  reset.addEventListener('click',()=>{if(!confirm('Вернуть обычную сетку? Изменение применится к сайту после сохранения.'))return;snapshot();layout=null;apply();mark();update();window.dispatchEvent(new Event('namiya-layout-mode'));});
  window.addEventListener('namiya-edit-mode',()=>{apply();update();});window.addEventListener('namiya-layout-changed',update);update();
 }
 return {attachToolbar,isFreeDesktop:()=>isFree()&&allStories()&&desktop()};
})();
