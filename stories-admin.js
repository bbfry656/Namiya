(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const grid=$('admin-stories'), editor=$('story-editor');
  const versions=new Map();
  const cloud=NamiyaCloud;
  let collection=[], baseline=null, editing=false, index=-1, images=[], uploading=false, dirty=false, publishing=false;
  const fields=['title','sub','note','caption','body'];
  const say=(text,error=false)=>{ $('stories-status').textContent=text; $('stories-status').dataset.error=String(error); };
  const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',action);return b;};
  function render(){
    grid.replaceChildren();grid.classList.toggle('is-editing',editing);
    $('edit-stories').textContent=editing?'Готово':'Редактировать';
    $('edit-stories').setAttribute('aria-pressed',String(editing));$('add-story').hidden=!editing;
    collection.forEach((s,i)=>{
      const card=document.createElement('article');card.className='story-card admin-story';
      const image=document.createElement('img');cloud.sign(s.images[0]).then(src=>image.src=src).catch(()=>{});image.alt=s.title;image.loading='lazy';
      const title=document.createElement('h3');title.textContent=s.title;
      const info=document.createElement('p');info.textContent=NamiyaContent.categories[s.type]+' · '+s.images.length+' фото · '+({draft:'Черновик',published:'Опубликовано',scheduled:'Отложено'}[versions.get(s.issue)?.status]||'Черновик');
      const open=button(editing?'Редактировать ↗':'Открыть редактор ↗',()=>openEditor(i));open.setAttribute('aria-label','Редактировать историю «'+s.title+'»');
      card.append(image,title,info,open);grid.append(card);
    });
    for(const id of ['save-draft','export-stories'])$(id).disabled=false;
  }
  function photoList(){
    const list=$('editor-photos');list.replaceChildren();
    images.forEach((src,i)=>{
      const item=document.createElement('div'),img=document.createElement('img');cloud.sign(src).then(value=>img.src=value).catch(()=>{});img.alt='Кадр '+(i+1);
      const title=document.createElement('p');title.textContent=i===0?'Обложка':'Кадр '+(i+1);
      const actions=document.createElement('div');actions.className='photo-actions';
      const move=(to)=>{[images[i],images[to]]=[images[to],images[i]];photoList();};
      if(i>0)actions.append(button('←',()=>move(i-1)),button('На обложку',()=>{images.splice(i,1);images.unshift(src);photoList();}));
      if(i<images.length-1)actions.append(button('→',()=>move(i+1)));
      actions.append(button('Убрать',()=>{images.splice(i,1);photoList();}));
      item.append(img,title,actions);list.append(item);
    });
  }
  function openEditor(i){
    index=i;const story=collection[i];const meta=story?versions.get(story.issue):null;
    $('story-editor-form').reset();
    fields.forEach(key=>$('story-'+key).value=story?.[key]||'');
    $('story-category').value=story?.type||'story';$('story-demo').checked=story?.demo||false;
    $('story-state').value=meta?.status||'draft';$('schedule-fields').hidden=$('story-state').value!=='scheduled';$('story-time').value=meta?.publish_at?new Date(new Date(meta.publish_at).getTime()+3*3600000).toISOString().slice(0,16):'';
    images=story?[...story.images]:[];photoList();$('editor-status').textContent='';
    $('editor-heading').textContent=story?'Редактировать историю':'Новая история';editor.showModal();$('story-title').focus();
  }
  $('edit-stories').addEventListener('click',()=>{editing=!editing;render();});
  $('add-story').addEventListener('click',()=>openEditor(-1));
  $('cancel-story').addEventListener('click',()=>{if(!uploading)editor.close();});
  editor.addEventListener('cancel',event=>{if(uploading)event.preventDefault();});
  $('story-photos').addEventListener('change',async()=>{
    const files=[...$('story-photos').files];if(!files.length)return;
    if(images.length+files.length>30){$('editor-status').textContent='В одной истории может быть до 30 фотографий.';return;}
    uploading=true;$('apply-story').disabled=true;$('story-photos').disabled=true;
    const added=[];
    try{
      for(const [i,file]of files.entries()){
        $('editor-status').textContent='Готовим фото '+(i+1)+' из '+files.length+'…';
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw new Error('Нужны JPG, PNG или WebP до 20 МБ.');
        const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
        try{
          const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
          const context=canvas.getContext('2d');context.fillStyle='#f3eddd';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
          added.push(canvas.toDataURL('image/jpeg',.82));
        }finally{bitmap.close();}
      }
      images.push(...added);photoList();$('editor-status').textContent='Фотографии добавлены. Выберите обложку и порядок кадров.';
    }catch(error){$('editor-status').textContent=error.message+' Эта загрузка не сохранена, попробуйте ещё раз.';}
    finally{uploading=false;$('apply-story').disabled=false;$('story-photos').disabled=false;$('story-photos').value='';}
  });
  $('story-editor-form').addEventListener('submit',async event=>{
    event.preventDefault();if(uploading)return;
    try{
      const issue=index>=0?collection[index].issue:String(Math.max(0,...collection.map(s=>Number(s.issue)))+1).padStart(3,'0');
      const story={issue,type:$('story-category').value,images:[...images],demo:$('story-demo').checked};
      fields.forEach(key=>story[key]=$('story-'+key).value);
      const next=collection.map(s=>({...s}));if(index<0)next.push(story);else next[index]=story;
      const validated=NamiyaContent.validate(next);
      if(new Blob([JSON.stringify(validated)]).size>8*1024*1024)throw new Error('Общий объём историй превышает 8 МБ. Уберите часть фото или используйте более компактные снимки.');
      const state=$('story-state').value;
      let publishAt=null;if(state==='scheduled'){
        if(!$('story-time').value)throw new Error('Укажите дату и время по Москве.');
        publishAt=new Date($('story-time').value+'+03:00').toISOString();
        if(new Date(publishAt)<=new Date())throw new Error('Выберите время в будущем.');
      }
      uploading=true;$('apply-story').disabled=true;$('editor-status').textContent='Сохраняем фотографии и историю…';
      const saved=await cloud.save(validated.find(s=>s.issue===issue),state,publishAt,versions.get(issue)?.updated_at);
      versions.set(issue,saved);if(index<0)collection.push(saved.payload);else collection[index]=saved.payload;
      dirty=false;render();editor.close();say(state==='scheduled'?'История сохранена. Она станет доступна '+new Date(publishAt).toLocaleString('ru-RU',{timeZone:'Europe/Moscow'})+' по Москве.':state==='draft'?'Черновик сохранён. Он доступен только администраторам.':'История опубликована! Обновление видно на сайте без ожидания GitHub.');
    }catch(error){$('editor-status').textContent=error.message;}finally{uploading=false;$('apply-story').disabled=false;}
  });
  // IndexedDB keeps photographs out of the much smaller localStorage quota.
  function database(){return new Promise((resolve,reject)=>{const request=indexedDB.open('namiya-editor',1);request.onupgradeneeded=()=>request.result.createObjectStore('drafts');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  async function draft(write){
    const db=await database();
    try{return await new Promise((resolve,reject)=>{
      const tx=db.transaction('drafts',write?'readwrite':'readonly'),store=tx.objectStore('drafts');
      const request=write?store.put({stories:collection,baseline,updated:new Date().toISOString()},'journal'):store.get('journal');
      let result;request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });}finally{db.close();}
  }
  $('save-draft').addEventListener('click',async()=>{try{await draft(true);dirty=false;$('restore-draft').disabled=false;say('Черновик сохранён в этом браузере. На сайте пока прежние истории.');}catch{say('Не удалось сохранить черновик. Скачайте истории, чтобы не потерять изменения.',true);}});
  $('restore-draft').addEventListener('click',async()=>{
    if(dirty&&!confirm('Открыть сохранённый черновик вместо текущих изменений?'))return;
    try{const saved=await draft(false);if(!saved)return say('Сохранённого черновика пока нет.');collection=NamiyaContent.validate(saved.stories);baseline=saved.baseline;dirty=false;render();say('Открыт черновик от '+new Date(saved.updated).toLocaleString('ru-RU')+'. На сайте ничего не изменилось.');}catch{say('Не удалось открыть черновик.',true);}
  });
  $('export-stories').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(collection,null,2)+'\n'],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='stories.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);say('Файл скачан. Сохраните его как резервную копию или загрузите в GitHub для публикации.');
  });
  $('story-state').addEventListener('change',()=>{$('schedule-fields').hidden=$('story-state').value!=='scheduled';});
  async function load(){
    try{const rows=await cloud.list();collection=NamiyaContent.validate(rows.map(r=>r.payload));rows.forEach(row=>versions.set(row.issue,row));render();say('Выберите «Редактировать», чтобы изменить истории или добавить новую.');}
    catch(error){say('Не удалось загрузить истории: '+error.message,true);}
    try{$('restore-draft').disabled=!(await draft(false));}catch{}
  }
  window.addEventListener('namiya-authenticated',load);
})();
