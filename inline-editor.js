(()=>{
 const loadScript=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.append(s);});
 const stylesheet=href=>{const path=new URL(href,location.href).pathname;if([...document.querySelectorAll('link[rel="stylesheet"]')].some(link=>new URL(link.href).pathname===path))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);};
 async function start(){
  if(!await NamiyaCloud.init())return;
  await NamiyaSiteContent.ready;
  const response=await fetch('admin.html?v=magazine-1',{cache:'no-store'});if(!response.ok)throw new Error('Не удалось открыть редактор.');
  const source=new DOMParser().parseFromString(await response.text(),'text/html');
  const root=document.createElement('div');root.className='admin inline-editor-root';
  const controls=source.getElementById('story-admin');controls.hidden=true;
  root.append(controls,source.getElementById('story-editor'));
  const heroDialog=document.createElement('dialog');heroDialog.id='inline-hero-dialog';heroDialog.setAttribute('aria-label','Главная фотография');
  const header=document.createElement('div');header.className='admin-heading';
  const heading=document.createElement('h2');heading.textContent='Главная фотография';
  const close=document.createElement('button');close.type='button';close.className='close-control';close.setAttribute('aria-label','Закрыть редактор фото');close.addEventListener('click',()=>heroDialog.close());header.append(heading,close);
  heroDialog.append(header,source.getElementById('photo-form'));root.append(heroDialog);document.body.append(root);
  stylesheet('admin.css?v=inline-1');stylesheet('covers.css?v=magazine-1');stylesheet('ui.css?v=editorial-1');
  // Hero preview selectors must stay inside the editor, never change the live hero before save.
  await loadScript('upload-ui.js?v=upload-1');await loadScript('hero-admin.js?v=inline-1');
  await loadScript('reader-editor.js?v=magazine-1');
  let ready=false;
  const bar=document.createElement('div');bar.className='inline-admin-bar';bar.setAttribute('role','region');bar.setAttribute('aria-label','Управление сайтом');
  const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Редактировать';toggle.setAttribute('aria-pressed','false');toggle.disabled=true;
  const drafts=document.createElement('button');drafts.type='button';drafts.textContent='Черновики';drafts.hidden=true;
  const save=document.createElement('button');save.type='button';save.textContent='Сохранить';save.hidden=true;
  const state=document.createElement('span');state.className='inline-status';state.setAttribute('role','status');state.textContent='Подключаем редактор…';bar.append(state,drafts,save,toggle);document.body.append(bar);
  NamiyaJournalLayout.attachToolbar(bar);
  let stopSorting=null,orderDirty=false,copyDirty=false;
  document.addEventListener('input',event=>{if(window.NamiyaInlineEditing&&event.target.closest('[data-site-field]')){copyDirty=true;state.textContent='Есть несохранённые изменения';}});
  window.addEventListener('namiya-layout-changed',()=>{copyDirty=true;state.textContent='Раскладка изменена — нажмите «Сохранить»';});
  document.addEventListener('click',event=>{if(window.NamiyaInlineEditing&&event.target.closest('[data-site-field]')?.closest('a'))event.preventDefault();},true);
  const add=document.createElement('button');add.type='button';add.className='inline-add-story';add.textContent='+';add.setAttribute('aria-label','Добавить фотоисторию');add.hidden=true;document.querySelector('.journal-heading').append(add);
  const heroButton=document.createElement('button');heroButton.type='button';heroButton.className='inline-hero-edit';heroButton.textContent='Заменить фото';heroButton.hidden=true;document.querySelector('main>.hero').append(heroButton);
  function showOverlay(dialog){const y=window.scrollY,overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.addEventListener('close',()=>{document.body.style.overflow=overflow;window.scrollTo({top:y,behavior:'instant'});},{once:true});dialog.showModal();}
  heroButton.addEventListener('click',()=>showOverlay(heroDialog));
  const open=issue=>window.dispatchEvent(new CustomEvent('namiya-edit-story',{detail:{issue}}));
  add.addEventListener('click',()=>open());
  function decorate(){
   document.querySelectorAll('#story-grid .story-card').forEach(card=>{
    card.classList.toggle('inline-editable',!!window.NamiyaInlineEditing);
    let label=card.querySelector('.inline-edit-label');if(!label){label=document.createElement('span');label.className='inline-edit-label';label.textContent='Открыть и изменить ↗';label.setAttribute('aria-hidden','true');card.append(label);}
    label.hidden=!window.NamiyaInlineEditing;
    let grip=card.querySelector('.story-grip');if(!grip){grip=document.createElement('button');grip.type='button';grip.className='story-grip';grip.textContent='⠿';grip.setAttribute('aria-label','Переместить историю. Зажмите и перетащите или используйте стрелки клавиатуры.');card.append(grip);}grip.hidden=!window.NamiyaInlineEditing;
    card.setAttribute('aria-label',(window.NamiyaInlineEditing?'Редактировать историю «':'Открыть историю «')+card.querySelector('h3').textContent+'»');
   });
   stopSorting?.();stopSorting=null;
   if(window.NamiyaInlineEditing&&!NamiyaJournalLayout.isFreeDesktop())stopSorting=NamiyaSort(document.getElementById('story-grid'),{itemSelector:'.story-card',handleSelector:'.story-grip',onChange:()=>{orderDirty=true;window.NamiyaInlineOrderDirty=true;state.textContent='Новый порядок — нажмите «Сохранить»';}});
  }
  save.addEventListener('click',async()=>{
   save.disabled=true;toggle.disabled=true;state.textContent='Сохраняем…';
   try{
    if(copyDirty)await NamiyaSiteContent.save();
    if(orderDirty){const full=(await NamiyaCloud.publicList()).map(r=>r.issue),visible=[...document.querySelectorAll('#story-grid [data-issue]')].map(el=>el.dataset.issue),set=new Set(visible);let i=0;const ordered=full.map(issue=>set.has(issue)?visible[i++]:issue);await NamiyaCloud.rpc('namiya_reorder',{p_issues:ordered});}
    copyDirty=orderDirty=false;window.NamiyaInlineOrderDirty=false;state.textContent='Изменения сохранены';window.dispatchEvent(new Event('namiya-authenticated'));window.dispatchEvent(new Event('namiya-refresh-stories'));
   }catch(error){state.textContent='Не удалось сохранить: '+error.message;}finally{save.disabled=false;toggle.disabled=false;}
  });
  toggle.addEventListener('click',()=>{
   if(window.NamiyaInlineEditing&&(copyDirty||orderDirty)){state.textContent='Сначала сохраните изменения кнопкой «Сохранить».';return;}
   window.NamiyaInlineEditing=!window.NamiyaInlineEditing;
   toggle.textContent=window.NamiyaInlineEditing?'Готово':'Редактировать';toggle.setAttribute('aria-pressed',String(window.NamiyaInlineEditing));
   add.hidden=heroButton.hidden=drafts.hidden=save.hidden=!window.NamiyaInlineEditing;
   NamiyaSiteContent.edit(window.NamiyaInlineEditing);
   window.dispatchEvent(new Event('namiya-edit-mode'));
   state.textContent=window.NamiyaInlineEditing?'Режим редактирования':'Вы администратор';decorate();
  });
  document.getElementById('story-grid').addEventListener('click',event=>{if(event.target.closest('.story-grip,.layout-resize,.layout-note-grip')){event.preventDefault();event.stopImmediatePropagation();}},true);
  document.getElementById('story-grid').addEventListener('keydown',event=>{if(event.target.closest('.story-grip,.layout-resize,.layout-note-grip')&&['Enter',' '].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();}},true);
  window.addEventListener('namiya-grid-rendered',decorate);
  window.addEventListener('namiya-layout-mode',decorate);
  window.addEventListener('namiya-editor-ready',()=>{ready=true;toggle.disabled=false;state.textContent='Вы администратор';});
  window.addEventListener('namiya-story-saved',()=>{state.textContent='История сохранена';window.dispatchEvent(new Event('namiya-authenticated'));});
  // Drafts stay in a separate overlay so private cards never move the public layout.
  const draftDialog=document.createElement('dialog');draftDialog.setAttribute('aria-label','Черновики и отложенные истории');root.append(draftDialog);
  drafts.addEventListener('click',async()=>{
   draftDialog.replaceChildren();const h=document.createElement('h2');h.textContent='Черновики и отложенные';const x=document.createElement('button');x.type='button';x.className='close-control';x.setAttribute('aria-label','Закрыть черновики');x.addEventListener('click',()=>draftDialog.close());const head=document.createElement('div');head.className='admin-heading';head.append(h,x);draftDialog.append(head);showOverlay(draftDialog);
   try{const rows=(await NamiyaCloud.list()).filter(r=>r.status==='draft'||r.status==='scheduled'&&new Date(r.publish_at)>new Date());if(!rows.length){const p=document.createElement('p');p.textContent='Пока нет черновиков.';draftDialog.append(p);}for(const row of rows){const b=document.createElement('button');b.type='button';b.className='button';b.textContent=row.payload.title+' · '+(row.status==='draft'?'Черновик':'Отложено');b.addEventListener('click',()=>{draftDialog.close();open(row.issue);});draftDialog.append(b);}}
   catch{const p=document.createElement('p');p.textContent='Не удалось загрузить черновики.';draftDialog.append(p);}
  });
  await loadScript('stories-admin.js?v=magazine-1');window.dispatchEvent(new Event('namiya-authenticated'));
  window.addEventListener('beforeunload',event=>{if(copyDirty||orderDirty){event.preventDefault();event.returnValue='';}});
 }
 start().catch(()=>{});
})();
