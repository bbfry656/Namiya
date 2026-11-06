window.NamiyaSort=(container,{itemSelector,handleSelector,onChange})=>{
 let item=null,timer=null,active=false,pointer=null,startX=0,startY=0,changed=false;
 const items=()=>[...container.querySelectorAll(itemSelector)];
 function finish(){clearTimeout(timer);timer=null;if(item){item.classList.remove('is-dragging');try{item.querySelector(handleSelector)?.releasePointerCapture(pointer);}catch{}}const moved=changed;item=null;active=false;pointer=null;changed=false;if(moved)onChange(items());}
 function down(event){const handle=event.target.closest(handleSelector);if(!handle||event.button>0)return;item=handle.closest(itemSelector);if(!item)return;pointer=event.pointerId;startX=event.clientX;startY=event.clientY;changed=false;
  const begin=()=>{active=true;item.classList.add('is-dragging');handle.setPointerCapture(pointer);};
  if(event.pointerType==='mouse')begin();else timer=setTimeout(begin,350);
 }
 function move(event){if(!item||event.pointerId!==pointer)return;if(!active){if(Math.hypot(event.clientX-startX,event.clientY-startY)>10)finish();return;}event.preventDefault();
  const target=document.elementsFromPoint(event.clientX,event.clientY).map(el=>el.closest(itemSelector)).find(el=>el&&el!==item&&container.contains(el));
  if(target){const ordered=items();if(ordered.indexOf(item)<ordered.indexOf(target))target.after(item);else target.before(item);changed=true;}
  const scroller=container.closest('.reader-scroll,dialog')||document.scrollingElement;const rect=scroller===document.scrollingElement?{top:0,bottom:innerHeight}:scroller.getBoundingClientRect();
  if(event.clientY<rect.top+65)scroller.scrollTop-=18;else if(event.clientY>rect.bottom-65)scroller.scrollTop+=18;
 }
 function key(event){const handle=event.target.closest(handleSelector);if(!handle||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const current=handle.closest(itemSelector),all=items(),index=all.indexOf(current),direction=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1,target=all[index+direction];if(!target)return;if(direction<0)target.before(current);else target.after(current);onChange(items());}
 container.addEventListener('pointerdown',down);container.addEventListener('pointermove',move);container.addEventListener('pointerup',finish);container.addEventListener('pointercancel',finish);container.addEventListener('keydown',key);
 return ()=>{finish();container.removeEventListener('pointerdown',down);container.removeEventListener('pointermove',move);container.removeEventListener('pointerup',finish);container.removeEventListener('pointercancel',finish);container.removeEventListener('keydown',key);};
};
