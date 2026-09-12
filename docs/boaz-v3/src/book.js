/* Builds the step sections from BOAZ_STEPS and renders them with BoazAsm. */
(function(){
"use strict";
var T=window.THREE,B=window.Boaz3D,A=window.BoazAsm,STEPS=window.BOAZ_STEPS;if(!T||!B||!A||!STEPS)return;
A.load(window.ASSEMBLY);
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||"#888";}
function C(){return{ink:cssVar("--ink"),ink2:cssVar("--ink-2"),face:cssVar("--face"),edge:cssVar("--edge"),ok:cssVar("--ok"),flag:cssVar("--flag"),bg:cssVar("--panel")};}
/* instances: code@i sorted by anchor x, then z, then y */
var byCode={};A.parts().forEach(function(p){(byCode[p.code]=byCode[p.code]||[]).push(p);});
Object.keys(byCode).forEach(function(k){byCode[k].sort(function(a,b){return (a.anchor[0]-b.anchor[0])||(a.anchor[2]-b.anchor[2])||(a.anchor[1]-b.anchor[1]);});byCode[k].forEach(function(p,i){p.inst=i;p.id=k+"@"+i;});});
function resolve(ref){var m=/^([0-9][A-Z])(?:@(\d+))?$/.exec(ref);if(!m)return[];var list=byCode[m[1]]||[];return m[2]===undefined?list:list.filter(function(p){return p.inst===+m[2];});}
function lookup(map,p){if(!map)return null;return map[p.id]!==undefined?map[p.id]:(map[p.code]!==undefined?map[p.code]:null);}
function screwSel(sel){return function(h){if(sel==="d5")return h.dia===5;if(sel==="d3")return h.dia===3;if(sel==="d8")return h.dia===8;return false;};}
function boxCentre(o){return new T.Box3().setFromObject(o).getCenter(new T.Vector3());}
function turnPart(g,axis,p){var c0=boxCentre(g),ax=A.localDir(p,axis==="x"?1:0,axis==="y"?1:0,axis==="z"?1:0).normalize();g.rotateOnWorldAxis(ax,Math.PI);g.updateMatrixWorld(true);var c1=boxCentre(g);g.position.add(c0.sub(c1));}

/* build a step scene into V.root; returns handles for explode/animation */
function buildScene(V,st,opts){
  opts=opts||{};var M=A.displayMatrix(st.display),Rinv=new T.Matrix3().setFromMatrix4(M).transpose();
  var world=new T.Group(),items=[];
  var parts=[];st.parts.forEach(function(r){resolve(r).forEach(function(p){if(parts.indexOf(p)<0)parts.push(p);});});
  parts.forEach(function(p){var g=A.buildPart(p);world.add(g);
    var ex=lookup(st.explode,p),grp=lookup(st.group,p)||0;
    var off=ex?new T.Vector3(ex[0],ex[1],ex[2]).applyMatrix3(Rinv):new T.Vector3();
    if(opts.turn&&lookup(opts.turn,p))turnPart(g,lookup(opts.turn,p),p);
    items.push({obj:g,home:g.position.clone(),off:off,grp:grp,part:p});
    var hw=st.hw||{},hwOff=function(o){return{obj:o,home:o.position.clone(),off:off.clone(),n:o.userData.n||null,grp:grp,hwGrp:st.hwGroup||0,hwAmt:st.hwExplode||0};};
    var inSet=function(list){return list&&list.some(function(r){return resolve(r).indexOf(p)>=0;});};
    if(inSet(hw.cams))A.placeCams(p).forEach(function(o){world.add(o);items.push(hwOff(o));});
    if(inSet(hw.pins))A.placePins(p,p.code==="1D"||p.code==="1E"?null:null).forEach(function(o){world.add(o);items.push(hwOff(o));});
    if(inSet(hw.edgeBolts))A.placeEdgeBolts(p).forEach(function(o){world.add(o);items.push(hwOff(o));});
    if(inSet(hw.dowels))A.placeDowels(p).forEach(function(o){world.add(o);items.push(hwOff(o));});
    (hw.screws||[]).forEach(function(sc){if(resolve(sc.code).indexOf(p)<0)return;A.placeScrews(p,screwSel(sc.sel),sc.len,sc.r,sc.headR,sc.plain).forEach(function(o){world.add(o);var it=hwOff(o);it.n=o.userData.n;items.push(it);});});
  });
  if(st.extras)EXTRAS[st.extras](world,items,st,parts);
  world.applyMatrix4(M);V.root.add(world);
  var S={items:items,dir:new T.Vector3(st.dir[0],st.dir[1],st.dir[2]),mx:st.mx,my:st.my,groundY:undefined,M:M,parts:parts};
  setExplode(S,1,1);return S;
}
function setExplode(S,e,eh){S.items.forEach(function(it){var p=it.home.clone().addScaledVector(it.off,e);if(it.n&&it.hwAmt)p.addScaledVector(it.n,it.hwAmt*eh);it.obj.position.copy(p);});}
/* animation: groups 1..G in sequence; hardware group hwGrp within */
function animate(S,st,t){var G=1;S.items.forEach(function(it){G=Math.max(G,it.grp||0,it.hwGrp||0);});
  S.items.forEach(function(it){var g=it.grp||0,p=it.home.clone();
    if(g>0){var a=Math.max(0,Math.min(1,(t*G-(g-1))));a=a<.5?2*a*a:1-Math.pow(-2*a+2,2)/2;p.addScaledVector(it.off,1-a);}
    if(it.n&&it.hwAmt){var hg=it.hwGrp||0,b=hg>0?Math.max(0,Math.min(1,(t*G-(hg-1)))):1;b=b<.5?2*b*b:1-Math.pow(-2*b+2,2)/2;p.addScaledVector(it.n,it.hwAmt*(1-b));}
    it.obj.position.copy(p);
    if(it.obj.userData.mouthDir&&it.obj.userData.n){/* cams turn in the last slice */var c=Math.max(0,Math.min(1,(t*G-(G-1))));it.obj.rotation.y=(it.obj.userData.baseRotY===undefined?(it.obj.userData.baseRotY=it.obj.rotation.y):it.obj.userData.baseRotY)+Math.PI*c;}
  });}
var EXTRAS={
  brackets:function(world,items,st){var wall=B.wallSlab(2000,2400);wall.position.set(874,515,1200);wall.rotation.x=Math.PI/2;world.add(wall);
    [300,874,1450].forEach(function(x){var b=B.lBracket();b.rotation.y=Math.PI/2;b.position.set(x,468,2101.4);world.add(b);items.push({obj:b,home:b.position.clone(),off:new T.Vector3(),n:new T.Vector3(0,0,1),grp:0,hwGrp:1,hwAmt:st.hwExplode});});},
  plates:function(world,items,st,parts){parts.forEach(function(p){if(["4A","4B","4D","4E"].indexOf(p.code)<0)return;var sock=p.faces.filter(function(h){return h.dia===15&&h.dep<10;})[0];if(!sock)return;
    var Th=A.T(),lz=sock.far?0:Th,n=A.localDir(p,0,0,sock.far?-1:1),pos=A.toWorld(p,sock.x,sock.y,lz).addScaledVector(A.localDir(p,1,0,0),-16);
    var pl=B.hingePlate();pl.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),n);pl.position.copy(pos);world.add(pl);
    var ex=lookup(st.explode,p),off=ex?new T.Vector3(ex[0],ex[1],ex[2]).applyMatrix3(new T.Matrix3().setFromMatrix4(A.displayMatrix(st.display)).transpose()):new T.Vector3();
    items.push({obj:pl,home:pl.position.clone(),off:off,n:n,grp:lookup(st.group,p)||0,hwGrp:1,hwAmt:st.n===17?st.hwExplode:0});});},
  hinge:function(world,items,st){var h=B.pianoHinge(1829);h.rotation.y=Math.PI/2;h.position.set(425,.6,1017.5);world.add(h);items.push({obj:h,home:h.position.clone(),off:new T.Vector3(),n:new T.Vector3(0,1,0),grp:0,hwGrp:1,hwAmt:st.hwExplode});},
  magnetsLarge:function(world,items,st){[790,960].forEach(function(x,i){var m=B.magnet(40,10,15);m.position.set(x,9.5,233);world.add(m);items.push({obj:m,home:m.position.clone(),off:new T.Vector3(),n:new T.Vector3(0,0,1),grp:0,hwGrp:1,hwAmt:st.hwExplode});
    var pl=B.magnet(15,40,2);pl.position.set(x,-1.2,255);world.add(pl);items.push({obj:pl,home:pl.position.clone(),off:new T.Vector3(),n:new T.Vector3(0,-1,0),grp:0,hwGrp:1,hwAmt:st.hwExplode});});},
  magnetsSmall:function(world,items,st){var m=B.magnet(4,40,15);m.position.set(848,-8,1000);world.add(m);items.push({obj:m,home:m.position.clone(),off:new T.Vector3(),n:new T.Vector3(-1,0,0),grp:0,hwGrp:1,hwAmt:st.hwExplode});
    var pl=B.magnet(2,15,40);pl.position.set(851.2,-8,1000);world.add(pl);items.push({obj:pl,home:pl.position.clone(),off:new T.Vector3(),n:new T.Vector3(1,0,0),grp:0,hwGrp:1,hwAmt:st.hwExplode});},
  shelfPins:function(world,items,st,parts){var ends=parts.filter(function(p){return p.code==="3A"||p.code==="3B";}),shelves=parts.filter(function(p){return p.code==="7A";});
    shelves.forEach(function(sh){var zb=sh.anchor[2];ends.forEach(function(e){var Th=A.T();var lad=e.faces.filter(function(h){return h.dia===5&&A.pinsOf(e).indexOf(h)<0;});
      var best=null,bd=1e9;lad.forEach(function(h){var w=A.toWorld(e,h.x,h.y,h.far?0:Th);var d=Math.abs(w.z-(zb-2.4));if(d<bd){bd=d;best=h;}});
      lad.forEach(function(h){if(!best||Math.abs(h.x-best.x)>.5)return;var n=A.localDir(e,0,0,h.far?-1:1),pin=B.shelfPin();pin.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),n);pin.position.copy(A.toWorld(e,h.x,h.y,h.far?0:Th));world.add(pin);
        items.push({obj:pin,home:pin.position.clone(),off:new T.Vector3(),n:n,grp:0,hwGrp:0,hwAmt:0});});});});}
};
function markerPoint(S,mk){var v;if(mk[0]==="W")v=new T.Vector3(mk[1],mk[2],mk[3]);else{var p=resolve(mk[0])[0];if(!p)return null;v=A.toWorld(p,mk[1],mk[2],mk[3]);
    var it=S.items.filter(function(i){return i.part===p;})[0];if(it)v.add(it.off);}
  return v.applyMatrix4(S.M);}
function drawMarkers(svg,V,S,st){var c=C();(st.markers||[]).forEach(function(mk){if(!mk[4])return;var pt=markerPoint(S,mk);if(!pt)return;B.marker(svg,V,pt,mk[4],mk[5],mk[6],c[mk[7]]||c.ink,c.bg);});}

function hasHardware(st){var hw=st.hw||{};return !!((hw.cams&&hw.cams.length)||(hw.pins&&hw.pins.length)||(hw.edgeBolts&&hw.edgeBolts.length)||(hw.dowels&&hw.dowels.length)||(hw.screws&&hw.screws.length)||st.extras);}
/* the hardware item to zoom on: prefer a cam, then a pin, then a screw, then anything with a normal */
function focusItem(S){var hw=S.items.filter(function(i){return i.n;});if(!hw.length)return null;
  var pick=hw.filter(function(i){return i.obj.userData.mouthDir;})[0]||hw.filter(function(i){return i.obj.userData.hole;})[0]||hw[Math.floor(hw.length/2)];return pick;}
function detailBox(S,it,r){var c=it.home.clone().applyMatrix4(S.M);return new T.Box3(c.clone().add(new T.Vector3(-r,-r*.7,-r)),c.clone().add(new T.Vector3(r,r,r)));}
/* ---- page ---- */
function esc(s){return String(s);}
function stepHTML(st){var i,h='';
  h+='<section class="stepsec" id="step-'+st.n+'"><div class="sheet"><div class="sheet-top"><p class="stepnum">Boaz V3 &middot; Step '+st.n+' of 31</p><h1>'+st.title+'</h1><p class="lede">'+st.lede+'</p></div><dl class="tb">';
  h+='<div><dt>Parts</dt><dd>'+st.parts.map(function(r){return r.replace(/@\d+/,"");}).filter(function(v,i,a){return a.indexOf(v)===i;}).join(" &middot; ")+'</dd></div>';
  h+='<div><dt>Hardware</dt><dd>'+(st.hardware.length?st.hardware.map(function(x){return x[0]+" &times; "+x[1];}).join("<br>"):"none")+'</dd></div>';
  h+='<div><dt>People</dt><dd>'+st.people+'</dd></div><div><dt>Tools</dt><dd>'+(st.tools.length?st.tools.join(" &middot; "):"none")+'</dd></div></dl></div>';
  h+='<h2>Do this</h2><ol class="steps">'+st.steps.map(function(s){return "<li>"+s+"</li>";}).join("")+'</ol>';
  if(st.parts.length){h+='<h2>Drawing</h2><figure class="fig"><div class="render" data-draw="'+st.n+'" style="aspect-ratio:4/3"><span class="fallback">Drawing needs WebGL.</span></div></figure>';
    if(st.key&&st.key.length)h+='<div class="key-wrap">'+st.key.map(function(k,i){return '<div class="kitem"><b>'+(i+1)+'</b><span>'+k+'</span></div>';}).join("")+'</div>';
    if(hasHardware(st))h+='<figure class="fig" style="margin-top:22px"><div class="render" data-detail="'+st.n+'" style="aspect-ratio:3/2"><span class="fallback">Drawing needs WebGL.</span></div><figcaption>Close-up: the fastener going in, at one of its holes.</figcaption></figure>';
    if(Object.keys(st.explode||{}).length||st.hwExplode){h+='<h2>Animation</h2><figure class="anim" style="border:1px solid var(--rule);background:var(--panel)"><figcaption>Step '+st.n+' &mdash; '+st.title+'</figcaption><div class="stage" style="padding:6px 18px 0"><div class="render" data-anim="'+st.n+'" style="aspect-ratio:4/3;max-width:820px;margin:0 auto"><span class="fallback">Press Replay to load the animation.</span></div></div><div class="ctl"><button type="button" data-play="'+st.n+'">Replay</button><input type="range" id="rng-'+st.n+'" min="0" max="1000" value="1000" aria-label="Scrub step '+st.n+'"><span class="step" data-step="'+st.n+'"></span></div></figure>';}}
  if(st.wrong&&st.wrong.length){h+='<h2>Right and wrong</h2><div class="checks">'+st.wrong.map(function(w,i){return '<div class="check '+(w.kind==="ok"?"ok":"bad")+'"><p class="lbl">'+(w.kind==="ok"?"&#10003; ":"&#10007; ")+w.t+'</p>'+(w.turn?'<div class="render sm" data-wrong="'+st.n+'-'+i+'"></div>':'')+'<p>'+w.x+'</p></div>';}).join("")+'</div>';}
  if(st.notes&&st.notes.length)h+='<h2>Notes for the illustrator</h2><ul class="notes">'+st.notes.map(function(n){return "<li>"+n+"</li>";}).join("")+'</ul>';
  h+='</section>';return h;}
var host=document.getElementById("book");
if(host){host.innerHTML=STEPS.map(stepHTML).join("");
  var idx=document.getElementById("index");if(idx)idx.innerHTML+=STEPS.map(function(st){return '<a href="#step-'+st.n+'"><b>'+st.n+'</b>'+st.title+'</a>';}).join("");}
/* drawings */
STEPS.forEach(function(st){var el=document.querySelector('[data-draw="'+st.n+'"]');if(!el)return;
  try{B.snapshot(el,function(V){return buildScene(V,st);},function(svg,V,S){B.text(svg,30,58,"Step "+st.n,40,C().ink);drawMarkers(svg,V,S,st);},{w:1500,aspect:4/3});}catch(e){el.querySelector(".fallback").textContent="Drawing failed: "+e.message;}
  var dl=document.querySelector('[data-detail="'+st.n+'"]');
  if(dl){try{B.snapshot(dl,function(V){var S=buildScene(V,st);S.items.forEach(function(i){if(i.n)i.hwAmt=Math.max(i.hwAmt||0,40);});setExplode(S,0,1);var it=focusItem(S);if(it){S.box=detailBox(S,it,110);S.mx=.05;S.my=.05;}return S;},null,{w:1400,aspect:3/2});}catch(e){dl.querySelector(".fallback").textContent="Close-up failed: "+e.message;}}
  (st.wrong||[]).forEach(function(w,i){if(!w.turn)return;var c=document.querySelector('[data-wrong="'+st.n+'-'+i+'"]');if(!c)return;
    try{B.snapshot(c,function(V){var S=buildScene(V,st,{turn:w.turn});setExplode(S,0,0);return S;},function(svg,V){B.verdict(svg,V,"bad");},{w:1000,aspect:5/3});}catch(e){}});
});
/* one live animation at a time */
var live=null;
function startAnim(st){var el=document.querySelector('[data-anim="'+st.n+'"]');if(!el)return;
  if(live){live.raf&&cancelAnimationFrame(live.raf);live.V.renderer.dispose();live.V.renderer.forceContextLoss();live.el.querySelector("canvas")&&live.el.querySelector("canvas").remove();live.el.classList.remove("ready");}
  var V=B.view(el,{w:1300,aspect:4/3}),S=buildScene(V,st);V.fit(S.dir,S.mx,S.my,S.groundY);el.appendChild(V.renderer.domElement);el.classList.add("ready");
  var rng=document.getElementById("rng-"+st.n),stepEl=document.querySelector('[data-step="'+st.n+'"]');
  live={el:el,V:V,S:S,raf:null};
  var F0={l:V.cam.left,r:V.cam.right,t:V.cam.top,b:V.cam.bottom},fi=focusItem(S),F1=fi?V.frustumFor(detailBox(S,fi,130),.05,.05):F0;
  var G=1;S.items.forEach(function(it){G=Math.max(G,it.grp||0,it.hwGrp||0);});var hg=st.hwGroup||0;
  function zoom(t){if(!fi||!hg)return;var a=(hg-1)/G,b=hg/G,w=(b-a)*.18,z=0;
    if(t>a&&t<b)z=Math.min(1,(t-a)/w,(b-t)/w);V.setFrustum(V.lerpF(F0,F1,Math.max(0,z)));}
  function set(t){animate(S,st,t);zoom(t);V.render();if(rng)rng.value=Math.round(t*1000);if(stepEl)stepEl.textContent=t>=1?"assembled":"assembling";}
  function play(){var t0=performance.now(),DUR=5000+1500*Object.keys(st.explode||{}).length/4;(function loop(now){var t=Math.min(1,(now-t0)/DUR);set(t);if(t<1)live.raf=requestAnimationFrame(loop);else live.raf=null;})(performance.now());}
  if(rng)rng.oninput=function(){if(live.raf)cancelAnimationFrame(live.raf);live.raf=null;set(rng.value/1000);};
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(reduce)set(1);else play();}
document.querySelectorAll("[data-play]").forEach(function(btn){btn.addEventListener("click",function(){var st=STEPS.filter(function(s){return String(s.n)===btn.getAttribute("data-play");})[0];if(st)startAnim(st);});});
window.BoazBook={buildScene:buildScene,setExplode:setExplode};
})();
