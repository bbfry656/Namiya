const {test}=require('node:test'),assert=require('node:assert/strict');const {frame,move,resize}=require('../layout-geometry.js');
test('free placement clamps photos to page bounds without snapping them into a grid',()=>{assert.deepEqual(move(frame({x:137,y:253,w:340}),14,19),{x:151,y:272,w:340});assert.deepEqual(move(frame({x:100,y:100,w:350}),-500,-500),{x:0,y:0,w:350});});
test('resizing keeps a card inside the right edge and respects minimum width',()=>{assert.deepEqual(resize(frame({x:600,y:400,w:350}),300),{x:350,y:400,w:650});assert.equal(resize(frame({w:350}),-800).w,220);});
test('invalid saved coordinates are normalized before public rendering',()=>{const p=frame({x:Infinity,y:NaN,w:'bad'});assert.deepEqual(p,{x:780,y:0,w:220});});
