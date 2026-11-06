document.querySelectorAll('.upload-zone').forEach(zone=>{
  const input=zone.querySelector('input'),caption=zone.querySelector('[data-upload-caption]');
  const initial=caption.textContent;
  function update(){const files=[...input.files];caption.textContent=files.length===1?files[0].name:files.length?'Выбрано фотографий: '+files.length:initial;zone.classList.toggle('has-files',files.length>0);}
  input.addEventListener('change',update);
  input.form?.addEventListener('reset',()=>queueMicrotask(update));
  zone.addEventListener('dragover',event=>{event.preventDefault();if(!input.disabled)zone.classList.add('is-dragging');});
  zone.addEventListener('dragleave',event=>{if(!zone.contains(event.relatedTarget))zone.classList.remove('is-dragging');});
  zone.addEventListener('drop',event=>{
    event.preventDefault();zone.classList.remove('is-dragging');if(input.disabled||!event.dataTransfer?.files.length)return;
    const files=event.dataTransfer.files;
    if(!input.multiple&&files.length>1){caption.textContent='Для главного экрана выберите один снимок.';return;}
    input.files=files;input.dispatchEvent(new Event('change',{bubbles:true}));
  });
});
