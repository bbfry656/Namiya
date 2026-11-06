const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {validate}=require('../content.js');
const source=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../stories.json'),'utf8'));
test('existing deep links survive migration and first demo contains six photos',()=>{
 const result=validate(source);assert.equal(result.length,6);assert.equal(result[0].images.length,6);
 assert.deepEqual(result.map(s=>s.issue),['001','002','003','004','005','006']);
});
test('new story preserves Russian copy, category, cover and ordered gallery',()=>{
 const item={issue:'007',title:'Вечер у реки',type:'love',images:['data:image/jpeg;base64,aGVsbG8=','assets/demo-2.jpg'],body:'Наш день',note:'Тёплый свет'};
 const result=validate([item])[0];assert.equal(result.tag,'LOVE STORY');assert.deepEqual(result.images,item.images);assert.equal(result.body,item.body);
});
test('rejects executable image sources, duplicate deep links and empty galleries',()=>{
 const example=source[0];
 assert.throws(()=>validate([{...example,images:['javascript:alert(1)']}])) ;
 assert.throws(()=>validate([{...example,images:['data:image/svg+xml;base64,aGVsbG8=']}])) ;
 assert.throws(()=>validate([example,example]));assert.throws(()=>validate([{...example,images:[]}])) ;
 assert.throws(()=>validate([{...example,type:'invalid'}]));
});
test('magazine cover metadata survives saving and remains separate from the photograph',()=>{
 const story={...source[0],coverStyle:'magazine',coverInk:'dark',coverBrand:'NAMIYA',coverHeadline:'Один день',coverSide:'Свет\nЛюди\nМоменты'};
 const result=validate([story])[0];assert.equal(result.coverStyle,'magazine');assert.equal(result.coverInk,'dark');assert.equal(result.coverSide,'Свет\nЛюди\nМоменты');assert.deepEqual(result.images,source[0].images);
 assert.throws(()=>validate([{...story,coverBrand:'x'.repeat(25)}]));
});
