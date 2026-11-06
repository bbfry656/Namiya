(()=>{
 const form=document.getElementById('photo-form'),input=document.getElementById('photo'),button=document.getElementById('publish'),status=document.getElementById('status');let data=null;
 input.addEventListener('change',async()=>{
  data=null;button.disabled=true;const file=input.files[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024){status.textContent='Выберите JPG, PNG или WebP до 20 МБ.';return;}
  input.disabled=true;status.textContent='Готовим фотографию…';let image;
  try{image=await createImageBitmap(file,{imageOrientation:'from-image'});const ratio=Math.min(1,2400/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);const context=canvas.getContext('2d');context.fillStyle='#16324b';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);data=canvas.toDataURL('image/jpeg',.88);form.querySelector('.hero-photo').style.backgroundImage=`url("${data}")`;button.disabled=false;status.textContent='Предпросмотр готов. Нажмите «Сохранить главное фото».';}
  catch{status.textContent='Не удалось прочитать фотографию.';}finally{image?.close();input.disabled=false;}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!data)return;button.disabled=true;input.disabled=true;status.textContent='Сохраняем главное фото…';
  try{const path=await NamiyaCloud.upload(data,'hero/'+crypto.randomUUID()+'.jpg');await NamiyaCloud.request('/rest/v1/namiya_settings?on_conflict=id',{...NamiyaCloud.json('POST',{id:'hero',path:path.slice(6)}),headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'}});data=null;status.textContent='Главное фото сохранено! Оно уже доступно на сайте.';window.dispatchEvent(new Event('namiya-hero-saved'));}
  catch(error){status.textContent='Не удалось сохранить: '+error.message;}finally{input.disabled=false;button.disabled=!data;}
 });
 window.addEventListener('namiya-authenticated',async()=>{try{const rows=await NamiyaCloud.request('/rest/v1/namiya_settings?select=path&id=eq.hero');if(rows.length){const src=await NamiyaCloud.sign('cloud/'+rows[0].path);form.querySelector('.hero-photo').style.backgroundImage=`url("${src}")`;}}catch{}});
})();
