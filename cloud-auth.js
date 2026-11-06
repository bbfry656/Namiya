(()=>{
 const login=document.getElementById('admin-login'),work=document.getElementById('admin-work'),status=document.getElementById('login-status');
 document.getElementById('login-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;status.textContent='Отправляем ссылку…';
  try{await NamiyaCloud.login(document.getElementById('admin-email').value.trim());status.textContent='Откройте самое новое письмо и нажмите кнопку «Confirm email address» или «Sign in». Ссылка одноразовая; обычная ссылка на адрес сайта не выполняет вход.';}
  catch(error){status.textContent='Не удалось отправить письмо: '+error.message;}
  finally{button.disabled=false;}
 });
 document.getElementById('logout').addEventListener('click',async()=>{try{await NamiyaCloud.logout();}finally{location.reload();}});
 NamiyaCloud.init().then(isAdmin=>{if(isAdmin){login.hidden=true;work.hidden=false;window.dispatchEvent(new Event('namiya-authenticated'));}else status.textContent='Войдите с почтой, которой владелец разрешил управление сайтом.';}).catch(error=>status.textContent=error.message);
 window.addEventListener('namiya-authenticated',async()=>{
  const list=document.getElementById('moderation-list');
  async function reload(){
   try{
    const rows=await NamiyaCloud.request('/rest/v1/namiya_comments?select=id,issue,author,instagram,body,created_at&approved=eq.false&order=created_at.asc');list.replaceChildren();
    if(!rows.length){list.textContent='Нет комментариев на проверке.';return;}
    for(const row of rows){
     const item=document.createElement('article'),heading=document.createElement('h3'),text=document.createElement('p');heading.textContent=row.author+' · история '+row.issue;text.textContent=row.body;
     item.append(heading,text);
     if(row.instagram){const profile=document.createElement('p');profile.textContent='Указанный Instagram: '+row.instagram;item.append(profile);}
     const approve=document.createElement('button');approve.type='button';approve.textContent='Одобрить';approve.addEventListener('click',async()=>{approve.disabled=true;try{await NamiyaCloud.request('/rest/v1/namiya_comments?id=eq.'+row.id,NamiyaCloud.json('PATCH',{approved:true}));await reload();}catch(error){approve.disabled=false;alert(error.message);}});item.append(approve);
     const reject=document.createElement('button');reject.type='button';reject.textContent='Отклонить';reject.addEventListener('click',async()=>{reject.disabled=true;try{await NamiyaCloud.request('/rest/v1/namiya_comments?id=eq.'+row.id,{method:'DELETE'});await reload();}catch(error){reject.disabled=false;alert(error.message);}});item.append(reject);list.append(item);
    }
   }catch(error){list.textContent='Не удалось загрузить комментарии: '+error.message;}
  }
  reload();
 });
})();
