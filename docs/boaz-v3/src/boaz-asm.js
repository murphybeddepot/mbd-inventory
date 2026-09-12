/* Boaz assembly engine: places every part of the product file in the world, with real outline,
   holes on the verified faces, and hardware generated from the drilling. */
window.BoazAsm=(function(){
"use strict";
var T=window.THREE,B=window.Boaz3D;if(!T||!B)return null;
var FRAME={'0,0,0':[[1,0,0],[0,1,0],[0,0,1]],'0,270,0':[[0,0,1],[0,1,0],[-1,0,0]],'90,0,0':[[1,0,0],[0,0,1],[0,-1,0]],'90,270,0':[[0,0,1],[-1,0,0],[0,-1,0]]};
/* rows = world direction of local x, y, z. Verified against the placement table (world_i = anchor_i + M[i][j] local_j  <=>  frame[j][i] = M[i][j]). */
var INSTALL_FLIP={'3G':'x','3F':'x','3A':'x','3C':'x','2E':'x','2D':'x','6B':'x','5B':'x','4A':'x','4C':'x','4D':'x','2B':'x','2C':'x','3E':'x','1D':'x','1C':'x','6A':'y','5A':'y'};
var HB_EDGE={0:'X0',180:'XL',90:'Y0',270:'YW'};
var ASM=null;
function load(json){ASM=json;ASM.parts.forEach(function(p,i){p.idx=i;var F=FRAME[p.key].map(function(r){return r.slice();}),pos=p.anchor.slice(),ax=INSTALL_FLIP[p.code];
  if(ax){var keep={x:0,y:1,z:2}[ax],ext=[p.L,p.W,ASM.T];for(var i2=0;i2<3;i2++){if(i2===keep)continue;pos[0]+=F[i2][0]*ext[i2];pos[1]+=F[i2][1]*ext[i2];pos[2]+=F[i2][2]*ext[i2];F[i2]=F[i2].map(function(v){return -v;});}}
  p.F=F;p.pos=pos;});return ASM;}
function partsByCode(code){return ASM.parts.filter(function(p){return p.code===code;});}
function matrixOf(p){var F=p.F,m=new T.Matrix4();m.set(F[0][0],F[1][0],F[2][0],p.pos[0],F[0][1],F[1][1],F[2][1],p.pos[1],F[0][2],F[1][2],F[2][2],p.pos[2],0,0,0,1);return m;}
function toWorld(p,lx,ly,lz){var F=p.F;return new T.Vector3(p.pos[0]+F[0][0]*lx+F[1][0]*ly+F[2][0]*lz,p.pos[1]+F[0][1]*lx+F[1][1]*ly+F[2][1]*lz,p.pos[2]+F[0][2]*lx+F[1][2]*ly+F[2][2]*lz);}
function localDir(p,lx,ly,lz){var F=p.F;return new T.Vector3(F[0][0]*lx+F[1][0]*ly+F[2][0]*lz,F[0][1]*lx+F[1][1]*ly+F[2][1]*lz,F[0][2]*lx+F[1][2]*ly+F[2][2]*lz);}
/* shelf-pin ladders: >=3 holes on one row 32 apart */
function ladder(p){var s={};var f=p.faces.filter(function(h){return h.dia===5;});var byY={};f.forEach(function(h,i){var k=h.y.toFixed(1)+'|'+(h.far?1:0);(byY[k]=byY[k]||[]).push(h);});
  Object.keys(byY).forEach(function(k){var r=byY[k];if(r.length<4)return;r.sort(function(a,b){return a.x-b.x;});var run=1;for(var i=1;i<r.length;i++){if(Math.abs(r[i].x-r[i-1].x-32)<.6)run++;else run=1;if(run>=3){r.forEach(function(h){s[h.x+','+h.y+','+(h.far?1:0)]=1;});}}});return s;}
function isLadder(p,h){p._lad=p._lad||ladder(p);return !!p._lad[h.x+','+h.y+','+(h.far?1:0)];}
/* build one placed part */
function buildPart(p,opts){opts=opts||{};var Th=ASM.T;
  var shape=new T.Shape();p.outline.forEach(function(q,i){if(i)shape.lineTo(q[0],q[1]);else shape.moveTo(q[0],q[1]);});shape.closePath();
  var fh=p.faces.map(function(h){return{x:h.x,y:h.y,r:h.dia/2,depth:h.dep,from:h.far?"back":"front"};});
  var eh=p.edges.map(function(h){var e=HB_EDGE[h.hb]||'YW',x=e==='X0'?0:e==='XL'?p.L:h.x,y=e==='Y0'?0:e==='YW'?p.W:h.y;
    return{x:x,y:y,z:Th/2,axis:e[0]==='X'?'x':'y',dir:(e==='X0'||e==='Y0')?-1:1,r:h.dia/2};});
  var band=[];p.outline.forEach(function(q,i){if(!q[2])return;var n=p.outline[(i+1)%p.outline.length];
    if(Math.abs(q[1]-n[1])<.01){band.push(q[1]<.01?"bottom":(Math.abs(q[1]-p.W)<.01?"top":null));}
    else if(Math.abs(q[0]-n[0])<.01){band.push(q[0]<.01?"front":(Math.abs(q[0]-p.L)<.01?"back":null));}});
  var g=B.panel({L:p.L,H:p.W,t:Th,shape:shape,faceHoles:fh,edgeHoles:eh,band:band.filter(Boolean),ghost:opts.ghost});
  g.applyMatrix4(matrixOf(p));g.userData.part=p;g.userData.home=g.position.clone();g.userData.homeQ=g.quaternion.clone();return g;}
/* hardware from drilling */
function camsOf(p){return p.faces.filter(function(h){return h.dia===15&&h.dep>=14;});}
function pinsOf(p){return p.faces.filter(function(h){return h.dia===5&&h.dep<19&&!isLadder(p,h);});}
function edgeBoltsOf(p){return p.edges.filter(function(h){return h.dia===8&&h.dep===13;});}
function edgeDowelsOf(p){return p.edges.filter(function(h){return h.dia===8&&h.dep===16;});}
function nearestEdgeDir(p,h){var c=[[h.x,0,-1,0],[p.L-h.x,1,0,0],[h.y,0,0,-1],[p.W-h.y,0,1,0]].sort(function(a,b){return a[0]-b[0];})[0];return{lx:c[1],ly:c[2]};}
/* orient an object built about +y so +y aligns with world dir n, then place */
function alignY(obj,pos,n){obj.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),n.clone().normalize());obj.position.copy(pos);obj.userData.home=pos.clone();obj.userData.n=n.clone().normalize();return obj;}
function placeCams(p){var Th=ASM.T,out=[];camsOf(p).forEach(function(h){var lz=h.far?0:Th,n=localDir(p,0,0,h.far?-1:1),d=nearestEdgeDir(p,h),m=localDir(p,d.lx,d.ly,0);
  var c=B.cam15(12.5);var pos=toWorld(p,h.x,h.y,lz).addScaledVector(n,-13.8);alignY(c,pos,n);
  /* spin about its axis so the mouth (-x local) faces the edge the bolt comes from */
  var mouth=new T.Vector3(-1,0,0).applyQuaternion(c.quaternion),ang=Math.atan2(mouth.clone().cross(m).dot(n),mouth.dot(m));c.rotateY(ang);c.userData.n=n;c.userData.mouthDir=m;c.userData.kind="cam";c.userData.hole=h;out.push(c);});return out;}
function placePins(p,reachOverride){var Th=ASM.T,out=[];pinsOf(p).forEach(function(h){var lz=h.far?0:Th,n=localDir(p,0,0,h.far?-1:1);
  var b=B.camBolt(reachOverride||34,h.dep,2.5);alignY(b,toWorld(p,h.x,h.y,lz),n);b.userData.hole=h;b.userData.kind="pin";out.push(b);});return out;}
function placeEdgeBolts(p){var Th=ASM.T,out=[];edgeBoltsOf(p).forEach(function(h){var e=HB_EDGE[h.hb],x=e==='X0'?0:e==='XL'?p.L:h.x,y=e==='Y0'?0:e==='YW'?p.W:h.y;
  var n=localDir(p,e==='X0'?-1:e==='XL'?1:0,e==='Y0'?-1:e==='YW'?1:0,0);var b=B.camBolt(34,13,4);alignY(b,toWorld(p,x,y,Th/2),n);b.userData.kind="edge bolt";out.push(b);});return out;}
function placeDowels(p){var Th=ASM.T,out=[];edgeDowelsOf(p).forEach(function(h){var e=HB_EDGE[h.hb],x=e==='X0'?0:e==='XL'?p.L:h.x,y=e==='Y0'?0:e==='YW'?p.W:h.y;
  var n=localDir(p,e==='X0'?-1:e==='XL'?1:0,e==='Y0'?-1:e==='YW'?1:0,0);var d=B.dowel(8,30);alignY(d,toWorld(p,x,y,Th/2).addScaledVector(n,-16),n);d.userData.kind="dowel";out.push(d);});return out;}
/* screws standing in given face holes (head on the face, pointing in) */
function placeScrews(p,filter,len,r,headR,plain){var Th=ASM.T,out=[];p.faces.filter(filter).forEach(function(h){var lz=h.far?0:Th,n=localDir(p,0,0,h.far?-1:1);
  var s=B.screwCsk(len,r,headR,plain);alignY(s,toWorld(p,h.x,h.y,lz).addScaledVector(n,.3),n.clone().negate());s.userData.n=n;s.userData.kind="screw";out.push(s);});return out;}
/* display frames: rows = display coords from world (x,y,z) */
var DISPLAY={
  upright:function(v){return new T.Vector3(v.x,v.z,-v.y);},          /* Z up, front toward the viewer */
  lyingRightEnd:function(v){return new T.Vector3(v.z,1749-v.x,-v.y);},/* bed cabinet on its right end, bottom to the left */
  lyingLeftEnd:function(v){return new T.Vector3(2160-v.z,v.x,-v.y);}, /* on its left end, bottom to the right */
  bookcaseLying:function(v){return new T.Vector3(v.z,v.x,v.y);},     /* bookcase on its left end, open front toward -z */
  faceDown:function(v){return new T.Vector3(v.x,v.y,v.z);},          /* on its face: back edge up */
  faceUp:function(v){return new T.Vector3(v.x,-v.y,-v.z);}           /* on its back: front up */
};
function displayMatrix(name){var f=DISPLAY[name],o=f(new T.Vector3(0,0,0)),ex=f(new T.Vector3(1,0,0)).sub(o),ey=f(new T.Vector3(0,1,0)).sub(o),ez=f(new T.Vector3(0,0,1)).sub(o);
  var m=new T.Matrix4();m.set(ex.x,ey.x,ez.x,o.x,ex.y,ey.y,ez.y,o.y,ex.z,ey.z,ez.z,o.z,0,0,0,1);return m;}
return{load:load,parts:function(){return ASM.parts;},byCode:partsByCode,buildPart:buildPart,toWorld:toWorld,localDir:localDir,
  camsOf:camsOf,pinsOf:pinsOf,placeCams:placeCams,placePins:placePins,placeEdgeBolts:placeEdgeBolts,placeDowels:placeDowels,placeScrews:placeScrews,
  displayMatrix:displayMatrix,DISPLAY:DISPLAY,T:function(){return ASM.T;}};
})();
