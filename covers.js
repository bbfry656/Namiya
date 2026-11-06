window.NamiyaCover={
 mount(frame,story){
  frame.querySelector('.magazine-overlay')?.remove();frame.classList.toggle('magazine-cover',story.coverStyle==='magazine');
  if(story.coverStyle!=='magazine')return;
  if(frame.classList.contains('reader-cover-frame')){const image=frame.querySelector('img');const format=()=>frame.classList.toggle('wide-cover',image.naturalWidth>image.naturalHeight*1.05);if(image.complete)format();else image.addEventListener('load',format,{once:true});}
  frame.dataset.coverInk=story.coverInk==='dark'?'dark':'light';
  const overlay=document.createElement('div');overlay.className='magazine-overlay';overlay.setAttribute('aria-hidden','true');
  const add=(className,text)=>{const node=document.createElement('span');node.className=className;node.textContent=text;overlay.append(node);return node;};
  const brand=add('magazine-brand',story.coverBrand||'NAMIYA');if(brand.textContent.length>10)brand.classList.add('long-brand');
  add('magazine-outline',story.tag||NamiyaContent.categories[story.type]||'ФОТОИСТОРИЯ');
  add('magazine-edition',story.coverEdition||'ВЫПУСК '+story.issue);
  add('magazine-side',story.coverSide||'');
  const lower=document.createElement('div');lower.className='magazine-lower';const title=document.createElement('strong'),subtitle=document.createElement('span');title.textContent=story.coverHeadline||story.title;subtitle.textContent=story.coverSubline||story.sub;lower.append(title,subtitle);overlay.append(lower);
  const barcode=add('magazine-barcode','NAMIYA / '+story.issue);frame.append(overlay);
 }
};
