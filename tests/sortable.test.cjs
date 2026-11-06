const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 const handlers={},timers=new Map();let next=0,target=null,changes=[];const order=[];
 const container={querySelectorAll:()=>order,closest:()=>null,contains:el=>order.includes(el),addEventListener:(k,fn)=>handlers[k]=fn,removeEventListener:(k)=>delete handlers[k]};
 for(const id of ['a','b','c']){const item={id,classList:{add(){},remove(){}},closest:()=>item,querySelector:()=>handle,before(other){order.splice(order.indexOf(other),1);order.splice(order.indexOf(this),0,other);},after(other){order.splice(order.indexOf(other),1);order.splice(order.indexOf(this)+1,0,other);}};const handle={closest:s=>s==='.handle'?handle:item,setPointerCapture(){},releasePointerCapture(){}};item.handle=handle;order.push(item);}
 const context={window:{},document:{elementsFromPoint:()=>target?[target]:[],scrollingElement:{scrollTop:0}},innerHeight:800,setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../sortable.js'),'utf8'),context);
 context.window.NamiyaSort(container,{itemSelector:'.item',handleSelector:'.handle',onChange:items=>changes.push(items.map(item=>item.id).join(''))});
 return {handlers,order,changes,timers,setTarget:value=>target=value,event:(item,type='mouse')=>({target:item.handle,button:0,pointerId:1,pointerType:type,clientX:100,clientY:300,preventDefault(){}})};
}
test('mouse drag reorders cards and commits order on release',()=>{const s=setup();s.handlers.pointerdown(s.event(s.order[0]));s.setTarget(s.order[2]);s.handlers.pointermove(s.event(s.order[0]));assert.equal(s.changes.length,0);s.handlers.pointerup();assert.deepEqual(s.changes,['bca']);});
test('touch waits for long press before moving a photo',()=>{const s=setup();const event=s.event(s.order[0],'touch');s.handlers.pointerdown(event);s.setTarget(s.order[2]);s.handlers.pointermove(event);assert.equal(s.order.map(x=>x.id).join(''),'abc');[...s.timers.values()][0]();s.handlers.pointermove(event);s.handlers.pointerup();assert.deepEqual(s.changes,['bca']);});
test('keyboard arrows provide an accessible alternative to dragging',()=>{const s=setup();s.handlers.keydown({...s.event(s.order[1]),key:'ArrowLeft'});assert.deepEqual(s.changes,['bac']);});
