(function(){
"use strict";
var B=window.Boaz3D;if(!B)return;var T=window.THREE;var PART=window.BOAZ_PART_1A,TUBE=window.BOAZ_TUBE,K=window.BOAZ_1A;
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||"#888";}
var panel1A=K.panel,arm=K.arm,bolt=K.bolt,nut=K.nut;
function build(V,explode){
  var root=V.root,A={};root.add(panel1A());A.arm=arm(false,false);root.add(A.arm);
  A.bolts=PART.thru.map(function(d){var b=bolt(d);root.add(b);return b;});
  A.nuts=PART.thru.map(function(d){var n=nut(d);root.add(n);return n;});
  setExplode(A,explode);
  return{A:A,dir:new T.Vector3(-1,.95,1.15),mx:.15,my:.12,groundY:-.4};
}
function setExplode(A,e){
  A.arm.position.set(-TUBE.over,-46*e,PART.t+TUBE.w/2+56*e);
  A.bolts.forEach(function(b){b.position.copy(b.userData.base).add(new T.Vector3(0,205*e,-70*e));});
  A.nuts.forEach(function(n){n.position.copy(n.userData.base).add(new T.Vector3(0,-46*e,56*e+80*e));});
}
var el=document.querySelector('[data-render="exploded"]');
if(el)B.snapshot(el,function(V){return build(V,1);},function(svg,V){
  var C={ink:cssVar("--ink"),ink2:cssVar("--ink-2"),face:cssVar("--face"),edge:cssVar("--edge"),ok:cssVar("--ok"),bg:cssVar("--panel")};
  B.text(svg,30,62,"1A",46,C.ink);
  B.marker(svg,V,new T.Vector3(PART.pinD,PART.pinZ[2],PART.t),"1",-90,-40,C.face,C.bg);
  B.marker(svg,V,new T.Vector3(0,PART.H*.12,PART.t),"2",-90,30,C.ink,C.bg);
  B.marker(svg,V,new T.Vector3(PART.edgeDowel[2],PART.H,PART.t/2),"3",70,-70,C.edge,C.bg);
  B.marker(svg,V,new T.Vector3(PART.thru[2],PART.thruZ,PART.t),"4",80,-10,C.face,C.bg);
  B.marker(svg,V,new T.Vector3(PART.thru[0],PART.thruZ+205,-70+50),"5",-70,-60,C.ink2,C.bg);
  B.marker(svg,V,new T.Vector3(PART.thru[3],PART.thruZ-46,PART.t+TUBE.w+136+6.5),"6",80,40,C.ink2,C.bg);
  B.marker(svg,V,new T.Vector3(-TUBE.over+TUBE.pinSet,TUBE.h+TUBE.pinH-46,PART.t+56+TUBE.w/2),"7",-40,80,C.ok,C.bg);
},{w:1700,aspect:4/3});
/* close-up at hole 3: bolt through, nut going on */
var det=document.querySelector('[data-render="detail"]');
if(det)B.snapshot(det,function(V){var S=build(V,0);S.A.nuts[2].position.copy(S.A.nuts[2].userData.base).add(new T.Vector3(0,0,26));
  var c=new T.Vector3(PART.thru[2],PART.thruZ,PART.t+TUBE.w/2);return{A:S.A,dir:new T.Vector3(-1,.95,1.15),mx:.06,my:.06,groundY:-.4,box:new T.Box3(c.clone().add(new T.Vector3(-70,-40,-40)),c.clone().add(new T.Vector3(70,60,60)))};},null,{w:1500,aspect:3/2});
/* right / wrong */
var checks={
  ok:function(V){V.root.add(panel1A());V.root.add(arm(false,false));return{dir:new T.Vector3(-1,.95,1.15),mx:.08,my:.1,groundY:-.4};},
  back:function(V){V.root.add(panel1A());V.root.add(arm(false,true));return{dir:new T.Vector3(-1,.95,1.15),mx:.08,my:.1,groundY:-.4};},
  outside:function(V){V.root.add(panel1A());V.root.add(arm(true,false));PART.thru.forEach(function(d){var b=B.boltFlat(50.8,4,8,4.4);b.rotation.x=-Math.PI/2;b.position.set(d,PART.thruZ,PART.t+.4);V.root.add(b);});return{dir:new T.Vector3(-1,.95,-1.15),mx:.08,my:.1,groundY:-.4};},
  hand:function(V){[0,1].forEach(function(i){var g=new T.Group();g.add(panel1A());g.add(arm(false,false));g.scale.x=-1;g.position.x=PART.L*(i+1)+i*120;V.root.add(g);});return{dir:new T.Vector3(1,.95,1.15),mx:.06,my:.1,groundY:-.4};}
};
Object.keys(checks).forEach(function(k){var c=document.querySelector('[data-render="'+k+'"]');if(!c)return;
  B.snapshot(c,checks[k],function(svg,V){var lab={outside:"seen from outside the cabinet",hand:"1B  +  1B"}[k];if(lab)B.text(svg,V.W/2,V.H-20,lab,24,k==="hand"?cssVar("--flag"):cssVar("--ink-2"),600,"middle");B.verdict(svg,V,k==="ok"?"ok":"bad");},{w:1000,aspect:5/3});});
/* animation */
var an=document.querySelector('[data-render="anim"]');
if(an){
  var V=B.view(an,{w:1300,aspect:4/3}),S=build(V,1);V.fit(S.dir,S.mx,S.my,S.groundY);
  var F0={l:V.cam.left,r:V.cam.right,t:V.cam.top,b:V.cam.bottom},cz=new T.Vector3(PART.thru[2],PART.thruZ,PART.t+TUBE.w/2),
      F1=V.frustumFor(new T.Box3(cz.clone().add(new T.Vector3(-90,-60,-50)),cz.clone().add(new T.Vector3(90,80,70))),.05,.05);
  function zoom(t){var z=0;if(t>.5&&t<.98)z=Math.min(1,(t-.5)/.1);if(t>=.98)z=Math.max(0,1-(t-.98)/.02);V.setFrustum(V.lerpF(F0,F1,z));}
  an.appendChild(V.renderer.domElement);an.classList.add("ready");
  var svg=B.overlay(an,V.W,V.H),tag=B.text(svg,0,0,"",30,cssVar("--ok"),600,"middle"),anote=document.getElementById("anote");
  var steps=[[0,"Arm to the inside face"],[.26,"Bolts in from behind"],[.52,"Nylocks on by hand"],[.76,"Hex key + socket: pull flush"]];
  function ph(t,a,b){return Math.max(0,Math.min(1,(t-a)/(b-a)));}function ez(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
  function frame(t){var a=ez(ph(t,.02,.26)),b=ez(ph(t,.28,.5)),c=ez(ph(t,.54,.74)),d=ez(ph(t,.78,.96));
    S.A.arm.position.set(-TUBE.over,-46*(1-a),PART.t+TUBE.w/2+56*(1-a));
    S.A.bolts.forEach(function(bl){bl.position.copy(bl.userData.base).add(new T.Vector3(0,205*(1-b),-70*(1-b)-6*(1-d)*b));});
    S.A.nuts.forEach(function(n){n.position.copy(n.userData.base).add(new T.Vector3(0,0,80*(1-c)+2*(1-d)));n.rotation.z=c*Math.PI*4+d*Math.PI;});
    if(anote)anote.textContent=t<.26?"Tube flat to the panel, pin end past the front edge.":t<.52?"Bolts through the ⌀8 holes and the tube, from the outside face.":t<.76?"Start each nylock nut by hand.":"Hex key in the bolt, socket on the nut: tighten until the head sits flush in the outside face.";
    zoom(t);var p=V.px(new T.Vector3(PART.thru[2],PART.thruZ+30,PART.t+TUBE.w+8));tag.setAttribute("x",p[0]);tag.setAttribute("y",p[1]);tag.textContent=(t>.78&&t<.97)?"↻ tighten":(t>=.97?"✓ flush":"");
    V.render();}
  var rng=document.getElementById("rng-step1"),stepEl=document.querySelector('[data-step="step1"]'),btn=document.querySelector('[data-play="step1"]');
  function label(t){var s=steps[0][1];steps.forEach(function(p){if(t>=p[0])s=p[1];});return s;}
  function set(t){frame(t);if(stepEl)stepEl.textContent=label(t);if(rng)rng.value=Math.round(t*1000);}
  var raf=null,DUR=6500,reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function stop(){if(raf){cancelAnimationFrame(raf);raf=null;}}
  function play(){stop();var t0=performance.now();(function loop(now){var t=Math.min(1,(now-t0)/DUR);set(t);if(t<1)raf=requestAnimationFrame(loop);else raf=null;})(performance.now());}
  if(btn)btn.addEventListener("click",function(){if(reduce){set(1);return;}play();});
  if(rng)rng.addEventListener("input",function(){stop();set(rng.value/1000);});
  set(1);
}
/* 2D plans */
["1A","1B"].forEach(function(code){var pl=document.querySelector('svg[data-plan="'+code+'"]');if(!pl||!window.drawPlan)return;
  window.drawPlan(pl,{L:PART.L,H:PART.H,scale:.5,mirror:code==="1B",band:["front"],
    holes:PART.thru.map(function(d){return{x:d,y:PART.thruZ,r:4,kind:"thru"};}).concat(PART.pinZ.map(function(y){return{x:PART.pinD,y:y,r:2.5,kind:"pin"};})),
    edge:PART.edgeBolt.map(function(d){return{x:d,side:"top",kind:"bolt"};}).concat(PART.edgeDowel.map(function(d){return{x:d,side:"top",kind:"dowel"};})),
    top:"top edge · 3 bolt + 3 dowel bores",caption:"476 × 178 · inside face up"});});
})();
