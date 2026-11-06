(function(root){
  const categories={portrait:'ПОРТРЕТ',love:'LOVE STORY',family:'СЕМЬЯ',story:'ИСТОРИИ'};
  function validate(value){
    if(!Array.isArray(value)||value.length>100)throw new Error('Некорректный список историй');
    const ids=new Set();
    return value.map(s=>{
      if(!s||!/^\d{3}$/.test(s.issue)||ids.has(s.issue)||!categories[s.type])throw new Error('Некорректная история');
      ids.add(s.issue);
      if(!Array.isArray(s.images)||s.images.length<1||s.images.length>30)throw new Error('В истории должно быть от 1 до 30 фото');
      const images=s.images.map(src=>{
        if(typeof src!=='string'||!(/^(assets\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp))$/.test(src)||/^cloud\/[a-zA-Z0-9_/-]+\.jpg$/.test(src)||/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(src)))throw new Error('Недопустимый формат фотографии');
        return src;
      });
      const clean={issue:s.issue,type:s.type,tag:categories[s.type],images,demo:!!s.demo};
      for(const key of ['title','sub','note','caption','body']){
        clean[key]=String(s[key]||'').trim();
        if(clean[key].length>10000)throw new Error('Слишком длинный текст');
      }
      if(!clean.title)throw new Error('Укажите название истории');
      return clean;
    });
  }
  const api={validate,categories};
  if(typeof module!=='undefined')module.exports=api;
  else root.NamiyaContent=api;
})(typeof window!=='undefined'?window:globalThis);
