(function(){
"use strict";
var B=window.Boaz3D;if(!B)return;var T=window.THREE;
var PART={L:476,H:178,t:19.05,thru:[74,175.6,277.2,378.8],thruZ:20,pinZ:[85,117,162],pinD:10.5,edgeBolt:[60,204,348],edgeDowel:[132,276,420]};
var TUBE={w:25.4,h:38,back:8,over:52,pinSet:12,pinR:6.5,pinH:25};
window.BOAZ_PART_1A=PART;window.BOAZ_TUBE=TUBE;
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||"#888";}
function panel1A(){return B.panel({L:PART.L,H:PART.H,band:["front"],
  faceHoles:PART.thru.map(function(d){return{x:d,y:PART.thruZ,r:4,depth:19.05};}).concat(PART.pinZ.map(function(y){return{x:PART.pinD,y:y,r:2.5,depth:13};})),
  edgeHoles:PART.edgeBolt.concat(PART.edgeDowel).map(function(d){return{x:d,y:PART.H,z:9.525,axis:"y",dir:1,r:4};})});}
function arm(behind,pinBack){
  var len=PART.L-TUBE.back+TUBE.over,a=B.pivotArm(len,TUBE.w,TUBE.h,pinBack?len-TUBE.pinSet:TUBE.pinSet,TUBE.pinR,TUBE.pinH);
  a.position.set(pinBack?TUBE.back:-TUBE.over,0,behind?-TUBE.w/2:PART.t+TUBE.w/2);
  PART.thru.forEach(function(d){var disc=new T.Mesh(new T.CircleGeometry(4,24),B.MAT.dark());disc.position.set(d-a.position.x,PART.thruZ,TUBE.w/2+.08);a.add(disc);});
  return a;
}
function bolt(d){var b=B.boltFlat(50.8,4,8,4.4);b.rotation.x=Math.PI/2;b.position.set(d,PART.thruZ,-.4);b.userData.base=b.position.clone();return b;}
function nut(d){var n=B.nylock(13,6.5);n.rotation.x=Math.PI/2;n.position.set(d,PART.thruZ,PART.t+TUBE.w);n.userData.base=n.position.clone();return n;}
window.BOAZ_1A={panel:panel1A,arm:arm,bolt:bolt,nut:nut};
})();
