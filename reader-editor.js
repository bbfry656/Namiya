(()=>{
 const reader=document.getElementById('reader'),spread=document.getElementById('reader-spread'),scroller=reader.querySelector('.reader-scroll');
 const controls=document.createElement('div');controls.className='reader-editor-controls admin';controls.hidden=true;
 controls.innerHTML='<div class="reader-edit-actions"><span>Редактирование истории</span><select aria-label="Категория истории" data-category><option value="portrait">Портреты</option><option value="love">Love Story</option><option value="family">Семья</option><option value="story">Истории</option></select><select aria-label="Публикация истории" data-state><option value="draft">Черновик</option><option value="published">Опубликовано</option><option value="scheduled">Отложить</option></select><input type="datetime-local" aria-label="Время публикации по Москве" data-time hidden><button class="button" type="button" data-save>Сохранить</button><button class="button" type="button" data-cancel>Отменить</button></div><p data-message role="status">Нажмите на текст, чтобы изменить. Зажмите ⠿ на фото, чтобы поменять порядок. Первый кадр — обложка.</p>';
 reader.querySelector('.reader-top').after(controls);
 const upload=document.createElement('label');upload.className='reader-photo-upload';upload.innerHTML='<span>＋ Добавить фотографии</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple aria-label="Добавить фотографии в историю">';controls.append(upload);
 const category=controls.querySelector('[data-category]'),state=controls.querySelector('[data-state]'),time=controls.querySelector('[data-time]'),message=controls.querySelector('[data-message]'),save=controls.querySelector('[data-save]'),file=upload.querySelector('input');
 const coverButton=document.createElement('button');coverButton.type='button';coverButton.className='button';coverButton.textContent='Обложка';controls.querySelector('.reader-edit-actions').insertBefore(coverButton,save);
 let current=null,record=null,story=null,generation=0,stopSort=null,processing=false,changed=false;
 coverButton.addEventListener('click',()=>{if(processing)return;if(changed){message.textContent='Сначала сохраните правки истории, затем настройте обложку.';return;}window.dispatchEvent(new CustomEvent('namiya-edit-story',{detail:{issue:current}}));});
 const fields={title:'reader-title',sub:'reader-subtitle',note:'reader-quote',caption:'reader-caption',body:'reader-body'};
 function editable(node,label){node.contentEditable='true';node.dataset.placeholder=label;node.setAttribute('aria-label',label);node.classList.add('reader-copy-editable');}
 function collect(){
  for(const [key,id]of Object.entries(fields)){let text=document.getElementById(id).innerText;if(key==='note')text=text.replace(/^«|»$/g,'');story[key]=text;}
  spread.querySelectorAll('.spread').forEach(page=>{const index=Number(page.dataset.frameIndex);story.frames[index]={title:page.querySelector('h3').innerText,body:page.querySelector('.spread-copy p').innerText};});
 }
 async function gallery(){
  stopSort?.();stopSort=null;const position=scroller.scrollTop;spread.replaceChildren();
  for(let i=0;i<story.images.length;i++){
   const page=document.createElement('section');page.className='spread editorial-spread';page.dataset.frameIndex=i;
   const photo=document.createElement('div');photo.className='editable-frame-photo';const image=document.createElement('img');image.src=await NamiyaCloud.sign(story.images[i]);image.alt='Кадр '+(i+1);image.draggable=false;
   const grip=document.createElement('button');grip.type='button';grip.className='photo-grip';grip.textContent='⠿';grip.setAttribute('aria-label','Переместить кадр '+(i+1)+'. Зажмите и перетащите или используйте стрелки.');
   const remove=document.createElement('button');remove.type='button';remove.className='frame-remove close-control';remove.setAttribute('aria-label','Убрать кадр '+(i+1));remove.addEventListener('click',()=>{if(processing)return;if(story.images.length===1){message.textContent='В истории должен остаться хотя бы один кадр.';return;}collect();story.images.splice(i,1);story.frames.splice(i,1);changed=true;gallery();});photo.append(image,grip,remove);
   const copy=document.createElement('div');copy.className='spread-copy';const folio=document.createElement('span');folio.className='page-no';folio.textContent=i===0?'ОБЛОЖКА':'КАДР '+(i+1);const title=document.createElement('h3'),body=document.createElement('p');title.textContent=story.frames[i]?.title||'';body.textContent=story.frames[i]?.body||'';editable(title,'Подпись к кадру');editable(body,'Описание кадра');copy.append(folio,title,body);page.append(photo,copy);spread.append(page);
  }
  document.getElementById('reader-cover-img').src=await NamiyaCloud.sign(story.images[0]);
  scroller.scrollTop=position;
  stopSort=NamiyaSort(spread,{itemSelector:'.spread',handleSelector:'.photo-grip',onChange:items=>{collect();const previous=story.images.slice(),frames=story.frames.slice();const order=items.map(item=>Number(item.dataset.frameIndex));story.images=order.map(i=>previous[i]);story.frames=order.map(i=>frames[i]);changed=true;gallery();}});
 }
 state.addEventListener('change',()=>{time.hidden=state.value!=='scheduled';changed=true;});
 controls.addEventListener('input',()=>{changed=true;});reader.addEventListener('input',event=>{if(event.target.closest('.reader-copy-editable'))changed=true;});
 window.addEventListener('namiya-story-open',async event=>{
  const seq=++generation;stopSort?.();controls.hidden=true;reader.classList.remove('reader-editing');current=event.detail;changed=false;
  for(const id of Object.values(fields)){const node=document.getElementById(id);node.contentEditable='false';node.classList.remove('reader-copy-editable');}
  if(!window.NamiyaInlineEditing)return;
  try{
   const rows=await NamiyaCloud.list();if(seq!==generation||!reader.classList.contains('open'))return;
   record=rows.find(row=>row.issue===current);if(!record)return;story=NamiyaContent.validate([record.payload])[0];
   category.value=story.type;state.value=record.status;time.hidden=state.value!=='scheduled';time.value=record.publish_at?new Date(new Date(record.publish_at).getTime()+10800000).toISOString().slice(0,16):'';
   for(const [key,id]of Object.entries(fields)){const node=document.getElementById(id);node.textContent=story[key];editable(node,({title:'Название истории',sub:'Короткое описание',note:'Вступление',caption:'Заголовок текста',body:'Текст истории'})[key]);}
   controls.hidden=false;reader.classList.add('reader-editing');message.textContent='Нажмите на текст, чтобы изменить. Зажмите ⠿ на фото, чтобы поменять порядок. Первый кадр — обложка.';await gallery();
  }catch{message.textContent='Не удалось подключить редактирование. Закройте историю и попробуйте ещё раз.';controls.hidden=false;}
 });
 file.addEventListener('change',async()=>{
  if(!story||processing)return;const files=[...file.files];if(story.images.length+files.length>30){message.textContent='В одной истории может быть до 30 фото.';return;}
  collect();processing=true;save.disabled=true;file.disabled=true;
  try{
   const added=[];for(const imageFile of files){if(!['image/jpeg','image/png','image/webp'].includes(imageFile.type)||imageFile.size>20*1024*1024)throw new Error('Выберите JPG, PNG или WebP до 20 МБ.');message.textContent='Готовим фотографии…';const bitmap=await createImageBitmap(imageFile,{imageOrientation:'from-image'});try{const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));const context=canvas.getContext('2d');context.fillStyle='#f3eddd';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);added.push(canvas.toDataURL('image/jpeg',.82));}finally{bitmap.close();}}
   story.images.push(...added);story.frames.push(...added.map(()=>({title:'',body:''})));changed=true;await gallery();message.textContent='Фото добавлены. Изменения ещё не опубликованы.';
  }catch(error){message.textContent=error.message;}finally{processing=false;save.disabled=false;file.disabled=false;file.value='';}
 });
 save.addEventListener('click',async()=>{
  if(processing||!story)return;collect();story.type=category.value;let publishAt=null;
  try{if(state.value==='scheduled'){if(!time.value)throw new Error('Укажите время по Москве.');publishAt=new Date(time.value+'+03:00').toISOString();if(new Date(publishAt)<=new Date())throw new Error('Укажите время в будущем.');}NamiyaContent.validate([story]);}catch(error){message.textContent=error.message;return;}
  processing=true;save.disabled=true;controls.inert=true;message.textContent='Сохраняем историю…';
  try{const saved=await NamiyaCloud.save(story,state.value,publishAt,record.updated_at);record=saved;story=NamiyaContent.validate([saved.payload])[0];changed=false;message.textContent='История сохранена.';window.dispatchEvent(new CustomEvent('namiya-story-saved',{detail:{issue:story.issue,status:state.value}}));}
  catch(error){message.textContent='Не удалось сохранить: '+error.message;}finally{processing=false;save.disabled=false;controls.inert=false;}
 });
 controls.querySelector('[data-cancel]').addEventListener('click',()=>{if(processing)return;if(changed&&!confirm('Закрыть историю без сохранения изменений?'))return;changed=false;window.dispatchEvent(new Event('namiya-close-reader'));});
 reader.addEventListener('click',event=>{if(!event.target.closest('#reader-close,#reader-back'))return;if(processing||changed&&!confirm('Закрыть историю без сохранения изменений?')){event.preventDefault();event.stopImmediatePropagation();}else changed=false;},true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('.photo-zoom[open]')&&reader.classList.contains('open')&&window.NamiyaInlineEditing){if(processing||changed&&!confirm('Закрыть историю без сохранения изменений?')){event.preventDefault();event.stopImmediatePropagation();}else changed=false;}},true);
 window.addEventListener('beforeunload',event=>{if(changed||processing){event.preventDefault();event.returnValue='';}});
 window.addEventListener('namiya-story-saved',async event=>{if(!story||event.detail?.issue!==current||processing||changed)return;try{const rows=await NamiyaCloud.list(),latest=rows.find(row=>row.issue===current);if(!latest)return;record=latest;story=NamiyaContent.validate([latest.payload])[0];NamiyaCover.mount(document.getElementById('reader-cover-frame'),story);}catch{}});
})();
