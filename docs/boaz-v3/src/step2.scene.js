(function(){
"use strict";
var B=window.Boaz3D;if(!B)return;var T=window.THREE;
var P1=window.BOAZ_PART_1A,TUBE=window.BOAZ_TUBE,K=window.BOAZ_1A;
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||"#888";}
/* 1D upper end, front datum (mirror of the file's back datum). x depth, y height from its bottom edge */
var UP={L:495,H:1980,t:19.05,cam:[60,204,348],camIn:34,dowel:[132,276,420],
  pins:[[10.5,16],[484.5,1855.8],[34,1913.3],[162,1913.3],[311,1913.3],[439,1913.3],[445.42,425.74],[466.39,681]],
  thru:[[393.4,1913.3],[50.8,1948.25],[152.4,1948.25],[254,1948.25]]};
var BR={L:453,H:175,x0:23,y0:50,px:[98.51,162.51,290.51,354.51],py:[100,156]};
var GAP=0;
function panel1D(){return B.panel({L:UP.L,H:UP.H,band:["front"],
  faceHoles:UP.cam.map(function(x){return{x:x,y:UP.camIn,r:7.5,depth:15};})
    .concat(UP.pins.map(function(p){return{x:p[0],y:p[1],r:2.5,depth:13};}))
    .concat(UP.thru.map(function(p){return{x:p[0],y:p[1],r:4,depth:19.05};})),
  edgeHoles:UP.dowel.concat(UP.cam).map(function(x){return{x:x,y:0,z:9.525,axis:"y",dir:-1,r:4};})});}
function brace(){var fh=[];BR.py.forEach(function(y){BR.px.forEach(function(x){fh.push({x:x,y:y,r:2.5,depth:19.05});});});return B.panel({L:BR.L,H:BR.H,faceHoles:fh});}
function cam(x){var c=B.cam15(12.5);c.rotation.set(Math.PI/2,Math.PI/2,0);c.position.set(x,P1.H+UP.camIn,P1.t-12.5);c.userData.base=c.position.clone();return c;}
function cbolt(x){var b=B.camBolt(34,13,4);b.position.set(x,P1.H,9.525);b.userData.base=b.position.clone();return b;}
function dowel(x){var d=B.dowel(8,30);d.position.set(x,P1.H-16,9.525);d.userData.base=d.position.clone();return d;}
function screw(x,y){var s=B.screwCsk(31.75,1.75,3.45,3.95);s.rotation.x=-Math.PI/2;s.position.set(BR.x0+x,BR.y0+y,2*P1.t+.4);s.userData.base=s.position.clone();return s;}

/* layout scene: both ends lying inside-face up. root rotated so local z (thickness) points up. */
function build(V,e,opts){
  opts=opts||{};var root=V.root,A={};root.rotation.x=-Math.PI/2;
  root.add(K.panel());A.arm=K.arm(false,false);root.add(A.arm);
  P1.thru.forEach(function(d){var b=K.bolt(d);root.add(b);var n=K.nut(d);root.add(n);});
  A.upper=new T.Group();A.upper.add(panel1D());UP.cam.forEach(function(x){var c=cam(x);A.upper.add(c);(A.cams=A.cams||[]).push(c);});
  A.upper.position.set(0,P1.H,0);root.add(A.upper);
  A.cbolts=P1.edgeBolt.map(function(x){var b=cbolt(x);root.add(b);return b;});
  A.dowels=P1.edgeDowel.map(function(x){var d=dowel(x);root.add(d);return d;});
  if(!opts.noBrace){A.brace=brace();A.brace.position.set(BR.x0,BR.y0,P1.t);root.add(A.brace);
    A.screws=[];BR.py.forEach(function(y){BR.px.forEach(function(x){var s=screw(x,y);root.add(s);A.screws.push(s);});});}
  set(A,e);
  return A;
}
function set(A,e){
  /* e = {joint:0..1 (1 = apart), hw:0..1 (bolts/dowels/cams exploded), brace:0..1, cam:0..1 (turned)} */
  var j=e.joint||0,h=e.hw||0,b=e.brace||0,c=e.cam||0;
  A.upper.position.set(0,P1.H+120*j,0);
  A.cams.forEach(function(cm){cm.position.copy(cm.userData.base).add(new T.Vector3(0,0,80*h));cm.rotation.set(Math.PI/2,Math.PI/2+Math.PI*c,0);});
  A.cbolts.forEach(function(x){x.position.copy(x.userData.base).add(new T.Vector3(0,70*h,0));});
  A.dowels.forEach(function(x){x.position.copy(x.userData.base).add(new T.Vector3(0,70*h,0));});
  if(A.brace){A.brace.position.set(BR.x0,BR.y0,P1.t+95*b);A.screws.forEach(function(s){s.position.copy(s.userData.base).add(new T.Vector3(0,0,95*b+45*b));});}
}
/* world-space box helper for the rotated root: local (x,y,z) -> world (x, z, -y) */
function wbox(x0,x1,y0,y1,z0,z1){return new T.Box3(new T.Vector3(x0,z0,-y1),new T.Vector3(x1,z1,-y0));}
var C={ink:cssVar("--ink"),ink2:cssVar("--ink-2"),face:cssVar("--face"),edge:cssVar("--edge"),ok:cssVar("--ok"),flag:cssVar("--flag"),bg:cssVar("--panel")};
function W(x,y,z){return new T.Vector3(x,z,-y);}
var DIR=new T.Vector3(-1,1.05,.95);

/* A: joint detail, exploded */
var el=document.querySelector('[data-render="joint"]');
if(el)B.snapshot(el,function(V){var A=build(V,{joint:1,hw:1},{noBrace:true});return{A:A,dir:DIR,mx:.08,my:.1,groundY:-.4,box:wbox(-20,510,110,360,0,110)};},function(svg,V,S){
  B.text(svg,30,62,"1A + 1D",42,C.ink);
  B.marker(svg,V,W(UP.cam[1],P1.H+120+UP.camIn,P1.t+80),"1",-60,-70,C.face,C.bg);
  B.marker(svg,V,W(P1.edgeBolt[2],P1.H+70+34,9.5),"2",90,-30,C.edge,C.bg);
  B.marker(svg,V,W(P1.edgeDowel[1],P1.H-16+70+30,9.5),"3",-70,-50,C.edge,C.bg);
  B.marker(svg,V,W(UP.dowel[2],P1.H+120,9.5),"4",90,20,C.edge,C.bg);
  B.marker(svg,V,W(0,P1.H+120+120,P1.t),"5",-80,20,C.ink,C.bg);
},{w:1700,aspect:4/3});
/* B: layout with brace, exploded */
el=document.querySelector('[data-render="layout"]');
if(el)B.snapshot(el,function(V){var A=build(V,{brace:1});return{A:A,dir:DIR,mx:.06,my:.1,groundY:-.4,box:wbox(-70,540,-10,700,0,180)};},function(svg,V,S){
  B.text(svg,30,62,"1A + 1D + 1C",42,C.ink);
  B.marker(svg,V,W(BR.x0+BR.L*.5,BR.y0+BR.H,2*P1.t+95),"6",0,-90,C.ink2,C.bg);
  B.marker(svg,V,W(BR.x0+BR.px[3],BR.y0+BR.py[1],2*P1.t+140+31),"7",90,-40,C.ink2,C.bg);
  B.marker(svg,V,W(P1.L,P1.H*.5,P1.t),"8",90,50,C.ink,C.bg);
  B.marker(svg,V,W(UP.cam[0],P1.H+UP.camIn,P1.t),"9",-90,50,C.face,C.bg);
},{w:1700,aspect:4/3});
/* checks */
var checks={
  proud:function(V){var A=build(V,{},{noBrace:true});A.dowels[0].position.copy(A.dowels[0].userData.base);var d=B.dowel(8,30);d.position.set(P1.edgeBolt[0],P1.H-13,9.525);V.root.add(d);A.cbolts[0].visible=false;A.upper.visible=false;return{A:A,dir:DIR,mx:.12,my:.12,groundY:-.4,box:wbox(20,220,150,240,0,60)};},
  fronts:function(V){var A=build(V,{});return{A:A,dir:new T.Vector3(-.9,1.3,.5),mx:.1,my:.12,groundY:-.4,box:wbox(380,560,120,260,0,60)};}
};
Object.keys(checks).forEach(function(k){var c=document.querySelector('[data-render="'+k+'"]');if(!c)return;
  B.snapshot(c,checks[k],function(svg,V){var lab={proud:"dowel in the 13 bore: 3 mm proud",fronts:"1D runs 19 past 1A at the back"}[k];B.text(svg,V.W/2,V.H-20,lab,24,k==="proud"?C.flag:C.ok,600,"middle");},{w:1000,aspect:5/3});});
/* animation */
var an=document.querySelector('[data-render="anim"]');
if(an){
  var V=B.view(an,{w:1300,aspect:4/3}),A=build(V,{joint:1,hw:0,brace:1});V.fit(DIR,.06,.1,-.4,wbox(-70,540,-10,700,0,180));
  an.appendChild(V.renderer.domElement);an.classList.add("ready");
  var svg=B.overlay(an,V.W,V.H),tag=B.text(svg,0,0,"",30,C.ok,600,"middle"),anote=document.getElementById("anote");
  var steps=[[0,"Bolts and dowels in the top edge"],[.2,"1D down onto 1A"],[.45,"Half turn on each cam"],[.65,"Brace over the seam"],[.85,"Eight 1¼″ screws"]];
  function ph(t,a,b){return Math.max(0,Math.min(1,(t-a)/(b-a)));}function ez(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
  function frame(t){var a=ez(ph(t,.02,.18)),j=ez(ph(t,.2,.42)),c=ez(ph(t,.46,.62)),b=ez(ph(t,.65,.82)),s=ez(ph(t,.84,.98));
    set(A,{hw:1-a,joint:1-j,cam:c,brace:1});
    A.brace.position.set(BR.x0,BR.y0,P1.t+95*(1-b));A.screws.forEach(function(sc){sc.position.copy(sc.userData.base).add(new T.Vector3(0,0,95*(1-b)+45*(1-s)));});
    if(anote)anote.textContent=t<.2?"⌀8 bolts into the three 13-deep bores, dowels into the three 16-deep bores.":t<.45?"Front edges in line. Lower 1D so the bolts run into its edge and the dowels find their bores.":t<.65?"#3 Phillips: turn each cam clockwise just past half a turn.":t<.85?"Bottom brace over the seam, back edge on the back edge of 1A, above the pivot arm.":"Eight 1¼″ screws through the brace pilots, four into each end.";
    var p=V.px(W(UP.cam[2],P1.H+UP.camIn+40,P1.t+14));tag.setAttribute("x",p[0]);tag.setAttribute("y",p[1]);tag.textContent=(t>.46&&t<.64)?"↻ 180°":"";
    V.render();}
  var rng=document.getElementById("rng-step2"),stepEl=document.querySelector('[data-step="step2"]'),btn=document.querySelector('[data-play="step2"]');
  function label(t){var s=steps[0][1];steps.forEach(function(p){if(t>=p[0])s=p[1];});return s;}
  function setT(t){frame(t);if(stepEl)stepEl.textContent=label(t);if(rng)rng.value=Math.round(t*1000);}
  var raf=null,DUR=9000,reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function stop(){if(raf){cancelAnimationFrame(raf);raf=null;}}
  function play(){stop();var t0=performance.now();(function loop(now){var t=Math.min(1,(now-t0)/DUR);setT(t);if(t<1)raf=requestAnimationFrame(loop);else raf=null;})(performance.now());}
  if(btn)btn.addEventListener("click",function(){if(reduce){setT(1);return;}play();});
  if(rng)rng.addEventListener("input",function(){stop();setT(rng.value/1000);});
  setT(1);
}
/* 2D plans */
var pl=document.querySelector('svg[data-plan="1D"]');
if(pl&&window.drawPlan)window.drawPlan(pl,{L:UP.L,H:UP.H,scale:.24,landscape:true,band:["front"],
  holes:UP.cam.map(function(x){return{x:x,y:UP.camIn,r:7.5,kind:"cam"};}).concat(UP.pins.map(function(p){return{x:p[0],y:p[1],r:2.5,kind:"pin"};})).concat(UP.thru.map(function(p){return{x:p[0],y:p[1],r:4,kind:"thru"};})),
  edge:UP.dowel.map(function(x){return{x:x,side:"bottom",kind:"dowel"};}).concat(UP.cam.map(function(x){return{x:x,side:"bottom",kind:"run"};})),caption:"495 × 1980 · inside face up · bottom edge at the left"});
var pc=document.querySelector('svg[data-plan="1C"]');
if(pc&&window.drawPlan){var ph2=[];BR.py.forEach(function(y){BR.px.forEach(function(x){ph2.push({x:x,y:y,r:2.5,kind:"thru"});});});window.drawPlan(pc,{L:BR.L,H:BR.H,scale:.5,holes:ph2,caption:"453 × 175 · eight ⌀5 pilots, 28 either side of the seam"});}
})();
