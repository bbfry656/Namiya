(()=>{
 let visitor;try{visitor=localStorage.getItem('namiya-visitor');if(!visitor){visitor=crypto.randomUUID();localStorage.setItem('namiya-visitor',visitor);}}catch{visitor=crypto.randomUUID();}
 let issue=null;
 const section=document.createElement('section');section.className='story-feedback';section.innerHTML='<h2>Оставьте тёплые слова</h2><button class="button like-story" type="button" aria-pressed="false">♡ Нравится · <span>0</span></button><p class="feedback-status" role="status"></p><div class="story-comments"></div><form class="comment-form"><label>Ваше имя<input name="author" autocomplete="name" required maxlength="80"></label><label>Instagram — необязательно<input name="instagram" maxlength="100" placeholder="@ваш_профиль"></label><label>Комментарий<textarea name="body" required maxlength="2000" rows="4"></textarea></label><p>Комментарий появится после одобрения фотографом. Имя и Instagram указаны автором и не подтверждены входом в аккаунт.</p><button class="button" type="submit">Отправить комментарий</button></form>';
 document.querySelector('.reader-end').before(section);
 const like=section.querySelector('.like-story'),status=section.querySelector('.feedback-status'),comments=section.querySelector('.story-comments'),form=section.querySelector('form');
 const key=()=> 'namiya-liked-'+issue;
 let liked=false;
 async function refresh(current){const data=await NamiyaCloud.feedback(current);if(current!==issue)return;like.querySelector('span').textContent=data?.likes||0;comments.replaceChildren();for(const comment of data?.comments||[]){const article=document.createElement('article'),heading=document.createElement('h3'),body=document.createElement('p');heading.textContent=comment.author;body.textContent=comment.body;article.append(heading,body);comments.append(article);}}
 window.addEventListener('namiya-story-open',event=>{
  issue=event.detail;status.textContent='';form.reset();comments.replaceChildren();like.querySelector('span').textContent='…';
  try{liked=localStorage.getItem(key())==='true';}catch{liked=false;}
  like.setAttribute('aria-pressed',String(liked));refresh(issue).catch(()=>status.textContent='Не удалось загрузить отклики. Попробуйте позже.');
 });
 like.addEventListener('click',async()=>{const current=issue,next=!liked;like.disabled=true;try{await NamiyaCloud.rpc('namiya_like',{p_issue:current,p_visitor:visitor,p_liked:next});if(current!==issue)return;liked=next;like.setAttribute('aria-pressed',String(liked));try{localStorage.setItem(key(),String(liked));}catch{}await refresh(current);}catch{status.textContent='Не удалось сохранить лайк. Попробуйте позже.';}finally{like.disabled=false;}});
 form.addEventListener('submit',async event=>{event.preventDefault();const current=issue,data=new FormData(form),button=form.querySelector('button');button.disabled=true;try{await NamiyaCloud.rpc('namiya_comment',{p_issue:current,p_visitor:visitor,p_author:String(data.get('author')).trim(),p_instagram:String(data.get('instagram')).trim(),p_body:String(data.get('body')).trim()});if(current===issue){form.reset();status.textContent='Спасибо! Комментарий отправлен фотографу и появится после одобрения.';}}catch{if(current===issue)status.textContent='Не удалось отправить. Проверьте соединение и попробуйте через минуту.';}finally{button.disabled=false;}});
})();
