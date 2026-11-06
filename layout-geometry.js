(function(root){
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||0));
 function frame(value={}){const w=clamp(value.w||350,220,800);return {x:clamp(value.x,0,1000-w),y:clamp(value.y,0,12000),w};}
 const api={frame,move:(value,dx,dy)=>frame({...value,x:value.x+dx,y:value.y+dy}),resize:(value,dw)=>frame({...value,w:value.w+dw})};
 if(typeof module!=='undefined')module.exports=api;else root.NamiyaLayoutGeometry=api;
})(typeof window!=='undefined'?window:globalThis);
