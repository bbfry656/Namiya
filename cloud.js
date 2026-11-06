window.NamiyaCloud=(()=>{
 const url='https://wxvwpzkxgscezedykhbp.supabase.co',key='sb_publishable_zpIsrWqL5pc3tcsjBqRIGw_Ne_CIh-o';
 let session=null;try{session=JSON.parse(sessionStorage.getItem('namiya-session'));}catch{}
 async function request(path,options={}){
  if(session&&session.expires_at<Date.now()/1000+30){
   const r=await fetch(url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
   if(r.ok)setSession(await r.json());else{setSession(null);throw new Error('Войдите в админку ещё раз.');}
  }
  const headers={apikey:key,...(session?{Authorization:'Bearer '+session.access_token}:{}),...options.headers};
  const response=await fetch(url+path,{...options,headers,cache:'no-store'});
  if(!response.ok){const data=await response.json().catch(()=>({}));const error=new Error(data.msg||data.message||data.error_description||'Не удалось выполнить запрос ('+response.status+').');error.status=response.status;throw error;}
  if(response.status===204)return null;const text=await response.text();return text?JSON.parse(text):null;
 }
 function setSession(value){session=value?{...value,expires_at:value.expires_at||Date.now()/1000+value.expires_in}:null;try{if(session)sessionStorage.setItem('namiya-session',JSON.stringify(session));else sessionStorage.removeItem('namiya-session');}catch{ /* The current tab can still authenticate when browser storage is unavailable. */ }}
 async function init(){
  const hash=new URLSearchParams(location.hash.slice(1));
  const query=new URLSearchParams(location.search);
  if(hash.has('error')||hash.has('error_code')||query.has('error')){
   history.replaceState(null,'',location.pathname);
   throw new Error('Ссылка входа истекла или уже использована. Запросите новое письмо и нажмите в нём кнопку подтверждения.');
  }
  if(hash.has('access_token')){
   setSession({access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token'),expires_in:Number(hash.get('expires_in')||3600)});
   history.replaceState(null,'',location.pathname+location.search);
  }
  if(!session)return false;
  try{
   await request('/auth/v1/user');
   const isAdmin=await request('/rest/v1/rpc/namiya_is_admin',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
   if(!isAdmin)throw new Error('Почта подтверждена, но этому аккаунту не выданы права администратора. Войдите с разрешённой почтой.');
   return true;
  }catch(error){
   if(error.status===401||error.status===403){setSession(null);throw new Error('Сеанс входа истёк. Запросите новую ссылку.');}
   throw error;
  }
 }
 const json=(method,body)=>({method,headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(body)});
 const signed=new Map();
 async function sign(path){if(!path.startsWith('cloud/'))return path;const cached=signed.get(path);if(cached&&cached.until>Date.now())return cached.url;const data=await request('/storage/v1/object/sign/namiya/'+path.slice(6),json('POST',{expiresIn:3600}));const result=url+'/storage/v1'+data.signedURL;signed.set(path,{url:result,until:Date.now()+3000000});return result;}
 async function resolve(story){return {...story,images:await Promise.all(story.images.map(sign))};}
 async function list(){return await request('/rest/v1/namiya_stories?select=*&order=position.asc,issue.asc');}
 async function upload(data,path){const blob=await(await fetch(data)).blob();await request('/storage/v1/object/namiya/'+path,{method:'POST',headers:{'Content-Type':'image/jpeg'},body:blob});return 'cloud/'+path;}
 async function save(story,status,publishAt,version){
  const images=[];for(const image of story.images)images.push(image.startsWith('data:')?await upload(image,story.issue+'/'+crypto.randomUUID()+'.jpg'):image);
  const payload={...story,images};
  const body={issue:story.issue,payload,status,publish_at:status==='scheduled'?publishAt:null};
  const path='/rest/v1/namiya_stories'+(version?'?issue=eq.'+story.issue+'&updated_at=eq.'+encodeURIComponent(version):'');
  const rows=await request(path,json(version?'PATCH':'POST',body));
  if(!rows?.length)throw new Error('Историю уже изменили в другом окне. Обновите страницу.');return rows[0];
 }
 return {request,init,list,resolve,sign,upload,save,json,publicList:()=>request('/rest/v1/namiya_public_stories?select=*&order=position.asc,issue.asc'),
  login:email=>request('/auth/v1/otp?redirect_to='+encodeURIComponent('https://bbfry656.github.io/Namiya/admin.html'),json('POST',{email,create_user:true})),
  logout:async()=>{try{await request('/auth/v1/logout',{method:'POST'});}finally{setSession(null);}},
  feedback:issue=>request('/rest/v1/rpc/namiya_feedback',json('POST',{p_issue:issue})),
  rpc:(name,body)=>request('/rest/v1/rpc/'+name,json('POST',body))
 };
})();
