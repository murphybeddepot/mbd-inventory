/* 2D plan drawings + hardware icons. A plan spec: {L,H,mirror,band:[edges],holes:[{x,y,r,kind:'thru'|'blind'|'pin'|'cam'}],edge:[{x,side:'top'|'bottom',kind:'bolt'|'dowel'|'run'}],labels:[{x,y,s,col,anchor}],caption}
   x = depth from the front edge, y = height from the bottom edge. */
(function(){
"use strict";
var NS="http://www.w3.org/2000/svg";
function E(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)if(a[k]!==undefined&&a[k]!==null)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
function T(x,y,s,a,p){var e=E("text",Object.assign({x:x,y:y},a||{}),p);e.textContent=s;return e;}
var PAPER="var(--paper)",INK="var(--ink)",INK3="var(--ink-3)",FACE="var(--face)",EDGE="var(--edge)",MEL="var(--mel)",INK2="var(--ink-2)",MONO='"IBM Plex Mono",monospace',ARCH='Archivo,sans-serif';
window.drawPlan=function(svg,P){
  var s=P.scale||.5,land=!!P.landscape,L=(land?P.H:P.L)*s,H=(land?P.L:P.H)*s,ox=16,oy=18,m=!!P.mirror;
  var X=land?function(d,h){return ox+h*s;}:function(d){return ox+(m?L-d*s:d*s);};
  var Y=land?function(h,d){return oy+d*s;}:function(h){return oy+H-h*s;};
  if(land){var X0=X,Y0=Y;X=function(d,h){return ox+h*s;};Y=function(h,d){return oy+d*s;};}
  svg.setAttribute("viewBox","0 0 "+(L+32)+" "+(H+46));
  E("rect",{x:ox,y:oy,width:L,height:H,fill:MEL,stroke:INK2,"stroke-width":1},svg);
  (P.band||[]).forEach(function(e){
    if(land){if(e==="front"){E("line",{x1:ox,y1:oy,x2:ox+L,y2:oy,stroke:INK,"stroke-width":1.2},svg);E("line",{x1:ox,y1:oy+2.4,x2:ox+L,y2:oy+2.4,stroke:INK,"stroke-width":1.2},svg);}return;}
    if(e==="front"||e==="back"){var bx=(e==="front")!==m?ox:ox+L,bo=((e==="front")!==m)?2.4:-2.4;
      E("line",{x1:bx,y1:oy,x2:bx,y2:oy+H,stroke:INK,"stroke-width":1.2},svg);E("line",{x1:bx+bo,y1:oy,x2:bx+bo,y2:oy+H,stroke:INK,"stroke-width":1.2},svg);}
    else{var by=e==="top"?oy:oy+H,bo2=e==="top"?2.4:-2.4;E("line",{x1:ox,y1:by,x2:ox+L,y2:by,stroke:INK,"stroke-width":1.2},svg);E("line",{x1:ox,y1:by+bo2,x2:ox+L,y2:by+bo2,stroke:INK,"stroke-width":1.2},svg);}
  });
  (P.holes||[]).forEach(function(h){
    var cx=land?X(h.x,h.y):X(h.x),cy=land?Y(h.y,h.x):Y(h.y),r=Math.max(1.6,h.r*s);
    if(h.kind==="thru"){E("circle",{cx:cx,cy:cy,r:r,fill:PAPER,stroke:FACE,"stroke-width":1.1},svg);E("line",{x1:cx-r-1,y1:cy,x2:cx+r+1,y2:cy,stroke:FACE,"stroke-width":.7},svg);E("line",{x1:cx,y1:cy-r-1,x2:cx,y2:cy+r+1,stroke:FACE,"stroke-width":.7},svg);}
    else if(h.kind==="cam"){E("circle",{cx:cx,cy:cy,r:r,fill:PAPER,stroke:FACE,"stroke-width":1.4},svg);E("circle",{cx:cx,cy:cy,r:r*.45,fill:FACE},svg);}
    else if(h.kind==="pin"){E("circle",{cx:cx,cy:cy,r:r,fill:FACE},svg);}
    else{E("circle",{cx:cx,cy:cy,r:r,fill:PAPER,stroke:FACE,"stroke-width":1.1},svg);}
  });
  (P.edge||[]).forEach(function(e){var cy=land?oy+e.x*s:(e.side==="bottom"?oy+H:oy),cx=land?(e.side==="bottom"?ox:ox+L):X(e.x);
    if(e.kind==="dowel")E("circle",{cx:cx,cy:cy,r:2.4,fill:PAPER,stroke:EDGE,"stroke-width":1.2},svg);
    else if(e.kind==="run")E("rect",{x:cx-2.4,y:cy-2.4,width:4.8,height:4.8,fill:EDGE},svg);
    else E("circle",{cx:cx,cy:cy,r:2.4,fill:EDGE},svg);});
  if(land)T(ox+L/2,oy+8,"FRONT",{"text-anchor":"middle","font-family":ARCH,"font-size":7,"letter-spacing":"1","font-weight":700,fill:INK},svg);
  else{var fx=m?ox+L-5:ox+5;T(fx,oy+H-6,"FRONT",{"text-anchor":m?"end":"start","font-family":ARCH,"font-size":7,"letter-spacing":"1","font-weight":700,fill:INK},svg);}
  (P.labels||[]).forEach(function(l){T(X(l.x),Y(l.y),l.s,{"text-anchor":l.anchor||"middle","font-family":MONO,"font-size":6.5,fill:l.col||INK3},svg);});
  if(P.caption)T(ox+L/2,oy+H+13,P.caption,{"text-anchor":"middle","font-family":MONO,"font-size":7,fill:INK3},svg);
  if(P.top)T(ox+L/2,oy-6,P.top,{"text-anchor":"middle","font-family":MONO,"font-size":6.5,fill:EDGE},svg);
};
var STEEL="var(--steel)",SLIT="var(--steel-lit)",SDK="var(--steel-dk)",FLAG="var(--flag)";
window.drawIcon=function(svg,k){
  svg.setAttribute("viewBox","0 0 54 26");
  if(k==="arm"){E("rect",{x:3,y:12,width:46,height:9,fill:"#2a2d31",stroke:SDK,"stroke-width":1},svg);E("rect",{x:41,y:4,width:5,height:8,fill:"#3a3e43",stroke:SDK,"stroke-width":1},svg);}
  if(k==="bolt"){E("path",{d:"M4,7 l0,12 l8,-3 l0,-6 z",fill:"#2a2d31",stroke:SDK,"stroke-width":1},svg);E("rect",{x:12,y:11,width:37,height:4,fill:"#2a2d31",stroke:SDK,"stroke-width":1},svg);for(var i=30;i<48;i+=3)E("line",{x1:i,y1:15,x2:i+1.5,y2:11,stroke:"#777","stroke-width":.7},svg);}
  if(k==="nut"){E("path",{d:"M19,13 L23,6 L31,6 L35,13 L31,20 L23,20 Z",fill:"#2a2d31",stroke:SDK,"stroke-width":1},svg);E("circle",{cx:27,cy:13,r:3,fill:"#111",stroke:SDK,"stroke-width":.8},svg);E("path",{d:"M23,6 L31,6 L33,9 L21,9 Z",fill:"#36415a",opacity:.9},svg);}
  if(k==="hex"){E("path",{d:"M10,20 l0,-13 l30,0",fill:"none",stroke:SDK,"stroke-width":4,"stroke-linecap":"round","stroke-linejoin":"round"},svg);}
  if(k==="socket"){E("path",{d:"M4,8 l26,0 l0,10 l-26,0 z M8,18 l6,0 l0,6 l-6,0 z",fill:STEEL,stroke:SDK,"stroke-width":1},svg);E("rect",{x:30,y:10,width:8,height:6,fill:SDK},svg);E("rect",{x:38,y:8,width:12,height:10,fill:SLIT,stroke:SDK,"stroke-width":1},svg);}
  if(k==="cam"){E("circle",{cx:27,cy:13,r:10,fill:SLIT,stroke:SDK,"stroke-width":1},svg);E("path",{d:"M17,13 A7,7 0 1 1 30,17",fill:"none",stroke:SDK,"stroke-width":2.4},svg);E("path",{d:"M14,13 l5,-3 l0,6 z",fill:SDK},svg);}
  if(k==="cambolt"){E("rect",{x:4,y:11,width:18,height:4,fill:SLIT,stroke:SDK,"stroke-width":1},svg);for(var j=6;j<20;j+=3)E("line",{x1:j,y1:15,x2:j+1.5,y2:11,stroke:SDK,"stroke-width":.7},svg);E("rect",{x:22,y:8,width:4,height:10,fill:SDK},svg);E("rect",{x:26,y:11.5,width:18,height:3,fill:SLIT,stroke:SDK,"stroke-width":1},svg);E("circle",{cx:46,cy:13,r:3.5,fill:SLIT,stroke:SDK,"stroke-width":1},svg);}
  if(k==="dowel"){E("rect",{x:8,y:10,width:38,height:6,rx:2,fill:"#c8a46f",stroke:"#8a6a3a","stroke-width":1},svg);for(var d=12;d<44;d+=4)E("line",{x1:d,y1:11,x2:d,y2:15,stroke:"#8a6a3a","stroke-width":.6,opacity:.6},svg);}
  if(k==="screw"){E("path",{d:"M6,9 l8,0 l3,4 l-3,4 l-8,0 z",fill:"#2a2d31",stroke:SDK,"stroke-width":1},svg);E("rect",{x:17,y:11.5,width:30,height:3,fill:"#2a2d31",stroke:SDK,"stroke-width":1},svg);for(var q=24;q<46;q+=3)E("line",{x1:q,y1:14.5,x2:q+1.5,y2:11.5,stroke:"#777","stroke-width":.7},svg);E("rect",{x:8,y:12,width:2.4,height:2.4,fill:"#000"},svg);}
  if(k==="phillips"){E("rect",{x:4,y:11,width:22,height:4,rx:2,fill:FLAG,opacity:.85},svg);E("rect",{x:26,y:12,width:24,height:2,fill:SDK},svg);E("path",{d:"M46,9 l6,4 l-6,4 z",fill:SDK},svg);}
  if(k==="mallet"){E("rect",{x:6,y:11,width:30,height:4,fill:"#8a6a3a"},svg);E("rect",{x:34,y:5,width:14,height:16,rx:3,fill:"#333"},svg);}
};
document.querySelectorAll("svg[data-icon]").forEach(function(s){window.drawIcon(s,s.getAttribute("data-icon"));});
})();
