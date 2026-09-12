/* Boaz3D — realistic panel + hardware renderer for the V3 instruction sheets. three r128. */
window.Boaz3D=(function(){
"use strict";
var T=window.THREE; if(!T) return null;
function col(h){return new T.Color(h).convertSRGBToLinear();}
var MAT={
  melamine:function(){return new T.MeshStandardMaterial({color:col(0xEBEAE4),roughness:.6,metalness:0});},
  band:function(){return new T.MeshStandardMaterial({color:col(0xFFFFFF),roughness:.28,metalness:0});},
  core:function(){return new T.MeshStandardMaterial({color:col(0x4A463F),roughness:.95,metalness:0,side:T.DoubleSide});},
  mouth:function(){return new T.MeshStandardMaterial({color:col(0x2A2723),roughness:1,metalness:0});},
  powder:function(){return new T.MeshStandardMaterial({color:col(0x24272B),roughness:.58,metalness:.22});},
  oxide:function(){return new T.MeshStandardMaterial({color:col(0x2B2E33),roughness:.38,metalness:.55});},
  zinc:function(){return new T.MeshStandardMaterial({color:col(0xD2D6DA),roughness:.3,metalness:.7});},
  nylon:function(){return new T.MeshStandardMaterial({color:col(0x36415A),roughness:.85,metalness:0});},
  wood:function(){return new T.MeshStandardMaterial({color:col(0xC8A46F),roughness:.82,metalness:0});},
  dark:function(){return new T.MeshStandardMaterial({color:col(0x0E0F10),roughness:.9,metalness:0});},
  ghost:function(){return new T.MeshStandardMaterial({color:col(0xF2F1EC),roughness:.5,transparent:true,opacity:.35});}
};
function mesh(g,m,o){var x=new T.Mesh(g,m);x.castShadow=!(o&&o.noShadow);x.receiveShadow=true;return x;}
function rrect(w,h,r){var s=new T.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.absarc(w/2-r,-h/2+r,r,-Math.PI/2,0,false);
  s.lineTo(w/2,h/2-r);s.absarc(w/2-r,h/2-r,r,0,Math.PI/2,false);s.lineTo(-w/2+r,h/2);s.absarc(-w/2+r,h/2-r,r,Math.PI/2,Math.PI,false);
  s.lineTo(-w/2,-h/2+r);s.absarc(-w/2+r,-h/2+r,r,Math.PI,Math.PI*1.5,false);return s;}
function hexShape(R){var s=new T.Shape();for(var i=0;i<6;i++){var a=Math.PI/6+i*Math.PI/3,x=Math.cos(a)*R,y=Math.sin(a)*R;if(i)s.lineTo(x,y);else s.moveTo(x,y);}s.closePath();return s;}

/* ---- panel: outline in the XY plane (x = length, y = height), extruded +z by t.
   faceHoles: [{x,y,r,depth}] cut through the outline; blind ones get a floor. depth>=t means through.
   edgeHoles: [{x,y,z,axis:'y'|'x',dir:+1|-1,r,depth}] drawn as liners on an edge face.
   band: array of 'front'|'back'|'top'|'bottom' edges (x=0 is front, x=L back, y=0 bottom). */
function panel(spec){
  var L=spec.L,H=spec.H,t=spec.t||19.05,g=new T.Group();
  var shape=spec.shape||(function(){var s=new T.Shape();s.moveTo(0,0);s.lineTo(L,0);s.lineTo(L,H);s.lineTo(0,H);s.closePath();return s;})();
  (spec.faceHoles||[]).forEach(function(h){var p=new T.Path();p.absarc(h.x,h.y,h.r,0,Math.PI*2,true);shape.holes.push(p);});
  var geo=new T.ExtrudeGeometry(shape,{depth:t,bevelEnabled:true,bevelThickness:.35,bevelSize:.35,bevelSegments:2,curveSegments:28});
  geo.translate(0,0,0); /* bevel pushes faces to -0.35 and t+0.35; accept */
  var body=mesh(geo,MAT.melamine());g.add(body);
  g.add(new T.LineSegments(new T.EdgesGeometry(geo,28),new T.LineBasicMaterial({color:col(0x4B5056),transparent:true,opacity:.55})));
  /* hole liners: wall + floor (+ cap on the far face for blind holes) */
  (spec.faceHoles||[]).forEach(function(h){
    var thru=h.depth>=t-0.01,d=thru?t+0.8:h.depth,z0=h.from==="back"?-0.4:t+0.4,dir=h.from==="back"?1:-1;
    var wall=new T.Mesh(new T.CylinderGeometry(h.r-.02,h.r-.02,d,28,1,true),MAT.core());
    wall.rotation.x=Math.PI/2;wall.position.set(h.x,h.y,z0+dir*d/2);wall.receiveShadow=true;g.add(wall);
    var ring=new T.Mesh(new T.RingGeometry(h.r-.05,h.r+.9,32),MAT.mouth());ring.position.set(h.x,h.y,h.from==="back"?-.42:t+.42);ring.lookAt(new T.Vector3(h.x,h.y,h.from==="back"?-100:t+100));ring.castShadow=false;g.add(ring);
    if(!thru){var fl=new T.Mesh(new T.CircleGeometry(h.r,28),MAT.mouth());fl.position.set(h.x,h.y,z0+dir*d);fl.rotation.y=dir>0?Math.PI:0;if(dir<0)fl.rotation.y=0;fl.lookAt(new T.Vector3(h.x,h.y,z0));g.add(fl);
      var cap=new T.Mesh(new T.CircleGeometry(h.r+.6,28),MAT.melamine());cap.position.set(h.x,h.y,h.from==="back"?t+.36:-.36);cap.lookAt(new T.Vector3(h.x,h.y,h.from==="back"?t+100:-100));g.add(cap);}
  });
  (spec.edgeHoles||[]).forEach(function(h){
    /* opening disc proud of the edge face + short dark wall so it reads as a bore */
    var n=new T.Vector3(h.axis==="x"?h.dir:0,h.axis==="y"?h.dir:0,0);
    var pos=new T.Vector3(h.x,h.y,h.z);
    var disc=new T.Mesh(new T.CircleGeometry(h.r,28),MAT.dark());disc.position.copy(pos).addScaledVector(n,.1);disc.lookAt(pos.clone().addScaledVector(n,10));disc.castShadow=false;g.add(disc);
    var ring=new T.Mesh(new T.RingGeometry(h.r,h.r+1,28),MAT.mouth());ring.position.copy(pos).addScaledVector(n,.08);ring.lookAt(pos.clone().addScaledVector(n,10));ring.castShadow=false;g.add(ring);
  });
  (spec.band||[]).forEach(function(e){
    var b;if(e==="front")b=new T.BoxGeometry(1,H,t),b.translate(-.5-.35,H/2,t/2);
    if(e==="back")b=new T.BoxGeometry(1,H,t),b.translate(L+.5+.35,H/2,t/2);
    if(e==="top")b=new T.BoxGeometry(L,1,t),b.translate(L/2,H+.5+.35,t/2);
    if(e==="bottom")b=new T.BoxGeometry(L,1,t),b.translate(L/2,-.5-.35,t/2);
    if(b){g.add(mesh(b,MAT.band()));g.add(new T.LineSegments(new T.EdgesGeometry(b,28),new T.LineBasicMaterial({color:col(0x4B5056),transparent:true,opacity:.55})));}
  });
  return g;
}

/* ---- hardware, each built about its own origin ---- */
function lathe(pts,seg,m){var g=new T.LatheGeometry(pts.map(function(p){return new T.Vector2(p[0],p[1]);}),seg||40);return mesh(g,m);}
function threadProfile(r,y0,y1,pitch,depth){var o=[],y=y0;while(y<y1-pitch){o.push([r-depth,y]);o.push([r,y+pitch/2]);y+=pitch;}o.push([r-depth,y1]);return o;}
/* flat socket head bolt along +y: head face at y=0, tip at y=len */
function boltFlat(len,r,headR,headL){
  var g=new T.Group(),p=[[0,0],[headR,0],[headR,.6],[r,headL]];
  var plainEnd=Math.max(headL+4,len-Math.min(28,len*.6));
  p.push([r,plainEnd]);p=p.concat(threadProfile(r,plainEnd,len-1.2,1.25,.45));p.push([r-1,len-.2],[0,len]);
  g.add(lathe(p,44,MAT.oxide()));
  var sock=new T.Mesh(new T.CylinderGeometry(2.9,2.9,3.6,6),MAT.dark());sock.position.y=1.7;g.add(sock); /* reads as the hex socket */
  return g;
}
/* nylock nut about +y: bearing face y=0 */
function nylock(af,h){
  var g=new T.Group(),R=af/Math.sqrt(3);
  var geo=new T.ExtrudeGeometry(hexShape(R),{depth:h-1.2,bevelEnabled:true,bevelThickness:.6,bevelSize:.6,bevelSegments:2});
  geo.rotateX(-Math.PI/2);geo.translate(0,.6,0);g.add(mesh(geo,MAT.oxide()));
  var collar=new T.Mesh(new T.CylinderGeometry(R*.78,R*.84,2.2,36),MAT.nylon());collar.position.y=h+.5;collar.castShadow=true;g.add(collar);
  var hole=new T.Mesh(new T.CircleGeometry(4.05,28),MAT.dark());hole.rotation.x=-Math.PI/2;hole.position.y=h+1.62;g.add(hole);
  return g;
}
/* Minifix 15 cam about +y: drum axis y, arrow/slot face at y=h */
function cam15(h){
  var g=new T.Group(),r=7.5;h=h||12.5;
  g.add(mesh(new T.CylinderGeometry(r,r,h,48),MAT.zinc()));
  g.children[0].position.y=h/2;
  var cross1=new T.Mesh(new T.BoxGeometry(6.2,.8,1.4),MAT.dark()),cross2=new T.Mesh(new T.BoxGeometry(1.4,.8,6.2),MAT.dark());cross1.position.y=h-.3;cross2.position.y=h-.3;g.add(cross1,cross2);
  var arrow=new T.Mesh(new T.ConeGeometry(1.4,2.4,3),MAT.dark());arrow.rotation.z=Math.PI/2;arrow.position.set(-5.2,h+.02,0);g.add(arrow);
  var slot=new T.Mesh(new T.BoxGeometry(3.2,5.2,8.2),MAT.dark());slot.position.set(-r+1.4,h*.42,0);g.add(slot); /* mouth toward -x */
  g.userData.mouth=new T.Vector3(-1,0,0);
  return g;
}
/* Minifix bolt with ⌀8 wood thread: collar at y=0, thread to -y, shank+head to +y (reach) */
function camBolt(reach,thread,threadR){
  var g=new T.Group(),p=[[0,-thread],[threadR-1.2,-thread]];
  p=p.concat(threadProfile(threadR,-thread+.5,-.5,1.6,.6).map(function(q){return [q[0],q[1]];}));
  p.push([threadR,-.3],[5.2,-.3],[5.2,2.2],[2.6,2.4],[2.6,reach-3.4],[3.6,reach-2.2],[3.6,reach-.6],[2.4,reach]);
  p.push([0,reach]);
  g.add(lathe(p,40,MAT.zinc()));
  var ph=new T.Mesh(new T.BoxGeometry(5.6,.8,1.1),MAT.dark()),ph2=new T.Mesh(new T.BoxGeometry(1.1,.8,5.6),MAT.dark());ph.position.y=2.2;ph2.position.y=2.2;g.add(ph,ph2);
  return g;
}
function dowel(d,len){var r=d/2;return lathe([[0,0],[r-1,0],[r,1],[r,len-1],[r-1,len],[0,len]],28,MAT.wood());}
/* countersunk #2 square-drive screw along +y, head face at y=0 */
function screwCsk(len,r,headR,plain){
  var g=new T.Group(),p=[[0,0],[headR,0],[headR,.4],[r,headL(headR,r)]];
  function headL(R,r){return (R-r)*1.15;}
  var s0=headL(headR,r)+(plain||0);p.push([r*.92,s0]);p=p.concat(threadProfile(r,s0,len-1.5,1.4,.5));p.push([r*.5,len-.4],[0,len]);
  g.add(lathe(p,36,MAT.oxide()));
  var sq=new T.Mesh(new T.BoxGeometry(2.4,1.6,2.4),MAT.dark());sq.position.y=.6;g.add(sq);
  return g;
}
/* pivot arm: rounded rectangular tube along +x from 0..len, section w (z) × h (y), pin at x=pinX pointing +y */
function pivotArm(len,w,h,pinX,pinR,pinH){
  var g=new T.Group(),sec=rrect(w,h,1.6),inner=rrect(w-4,h-4,.8);sec.holes.push(inner);
  var geo=new T.ExtrudeGeometry(sec,{depth:len,bevelEnabled:false,curveSegments:8});geo.rotateY(Math.PI/2); /* extrude along +x */
  var tube=mesh(geo,MAT.powder());tube.position.set(0,h/2,0);g.add(tube);
  /* end caps are open — real tube. pin welded on top */
  var pin=lathe([[0,0],[pinR,0],[pinR,pinH-1],[pinR-1,pinH],[0,pinH]],36,MAT.powder());pin.position.set(pinX,h,0);g.add(pin);
  var weld=new T.Mesh(new T.TorusGeometry(pinR+.6,.8,10,36),MAT.powder());weld.rotation.x=Math.PI/2;weld.position.set(pinX,h+.2,0);g.add(weld);
  return g;
}

function lBracket(){var g=new T.Group(),m=MAT.zinc();var a=mesh(new T.BoxGeometry(50,2.5,15),m);a.position.set(0,1.25,0);var b=mesh(new T.BoxGeometry(2.5,50,15),m);b.position.set(-23.75,25,0);g.add(a,b);
  [12.5,37.5].forEach(function(x){var h=new T.Mesh(new T.CircleGeometry(2.6,16),MAT.dark());h.rotation.x=-Math.PI/2;h.position.set(x-25,2.55,0);g.add(h);var v=new T.Mesh(new T.CircleGeometry(2.6,16),MAT.dark());v.rotation.y=-Math.PI/2;v.position.set(-25.05,x,0);g.add(v);});return g;}
function hingePlate(){var g=new T.Group();var geo=new T.ExtrudeGeometry(rrect(64,46,4),{depth:3,bevelEnabled:false});geo.rotateX(-Math.PI/2);var p=mesh(geo,MAT.powder());g.add(p);
  var big=new T.Mesh(new T.CircleGeometry(7.6,24),MAT.dark());big.rotation.x=-Math.PI/2;big.position.set(16,3.05,0);g.add(big);
  [[-22,-14],[-22,14],[22,-14],[22,14]].forEach(function(q){var h=new T.Mesh(new T.CircleGeometry(2.2,12),MAT.dark());h.rotation.x=-Math.PI/2;h.position.set(q[0]-8,3.05,q[1]);g.add(h);});return g;}
function pianoHinge(len){var g=new T.Group(),m=MAT.zinc();var a=mesh(new T.BoxGeometry(len,1.2,18),m);a.position.set(0,.6,-9.6);var b=mesh(new T.BoxGeometry(len,1.2,18),m);b.position.set(0,.6,9.6);
  var k=mesh(new T.CylinderGeometry(3,3,len,20),m);k.rotation.z=Math.PI/2;k.position.set(0,1.5,0);g.add(a,b,k);
  var n=Math.floor(len/50.8);for(var i=0;i<n;i++){var x=-len/2+25.4+i*50.8;[-13,13].forEach(function(z){var h=new T.Mesh(new T.CircleGeometry(2,12),MAT.dark());h.rotation.x=-Math.PI/2;h.position.set(x,1.25,z);g.add(h);});}return g;}
function shelfPin(){var g=new T.Group();g.add(lathe([[0,0],[2.5,0],[2.5,-10],[0,-10]],20,MAT.zinc()));var c=mesh(new T.CylinderGeometry(3.8,3.8,1.5,24),MAT.zinc());c.position.y=.75;g.add(c);var l=mesh(new T.BoxGeometry(7,1.8,7),MAT.zinc());l.position.set(0,2.4,-2);g.add(l);return g;}
function magnet(w,h,d){return mesh(new T.BoxGeometry(w,h,d),MAT.oxide());}
function wallSlab(w,h){var m=new T.MeshStandardMaterial({color:col(0xDCD9D2),roughness:1});var s=new T.Mesh(new T.BoxGeometry(w,h,40),m);s.receiveShadow=true;return s;}
/* ---- view ---- */
function view(container,opts){
  opts=opts||{};
  var W=opts.w||1600,Hh=Math.round(W/(opts.aspect||4/3));
  var renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:!!opts.snapshot});
  renderer.setPixelRatio(1);renderer.setSize(W,Hh,false);
  renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=false;
  var scene=new T.Scene();
  var hemi=new T.HemisphereLight(0xffffff,0x9a958c,.85);scene.add(hemi);
  var key=new T.DirectionalLight(0xffffff,.85);scene.add(key);var keySoft=new T.DirectionalLight(0xffffff,0);scene.add(keySoft);
  var fill=new T.DirectionalLight(0xffffff,.3);scene.add(fill);
  var rim=new T.DirectionalLight(0xffffff,.22);scene.add(rim);
  var ground=new T.Group();scene.add(ground);
  var cam=new T.OrthographicCamera(-1,1,1,-1,-6000,6000);
  var root=new T.Group();scene.add(root);
  function frustumFor(bb,mx,my){
    var inv=cam.matrixWorldInverse,mn=new T.Vector2(1e9,1e9),mxv=new T.Vector2(-1e9,-1e9);
    for(var i=0;i<8;i++){var v=new T.Vector3(i&1?bb.max.x:bb.min.x,i&2?bb.max.y:bb.min.y,i&4?bb.max.z:bb.min.z).applyMatrix4(inv);mn.x=Math.min(mn.x,v.x);mn.y=Math.min(mn.y,v.y);mxv.x=Math.max(mxv.x,v.x);mxv.y=Math.max(mxv.y,v.y);}
    var w=(mxv.x-mn.x)*(1+2*(mx||.12)),h=(mxv.y-mn.y)*(1+2*(my||.12)),cx=(mn.x+mxv.x)/2,cy=(mn.y+mxv.y)/2,asp=W/Hh;
    if(w/h<asp)w=h*asp;else h=w/asp;
    return{l:cx-w/2,r:cx+w/2,t:cy+h/2,b:cy-h/2};
  }
  function setFrustum(f){cam.left=f.l;cam.right=f.r;cam.top=f.t;cam.bottom=f.b;cam.updateProjectionMatrix();}
  function lerpF(a,b,t){return{l:a.l+(b.l-a.l)*t,r:a.r+(b.r-a.r)*t,t:a.t+(b.t-a.t)*t,b:a.b+(b.b-a.b)*t};}
  function fit(dir,mx,my,groundY,box){
    var all=new T.Box3().setFromObject(root),bb=box||all,c=bb.getCenter(new T.Vector3()),size=all.getSize(new T.Vector3());
    var d=dir.clone().normalize();cam.position.copy(c).addScaledVector(d,3000);cam.up.set(0,1,0);cam.lookAt(c);cam.updateMatrixWorld();
    setFrustum(frustumFor(bb,mx,my));
    /* lights relative to the view */
    key.position.copy(c).add(new T.Vector3(-.75,1.05,.55).multiplyScalar(Math.max(size.x,size.y,size.z)*1.4));key.target.position.copy(c);scene.add(key.target);keySoft.position.copy(key.position);keySoft.target.position.copy(c);scene.add(keySoft.target);
    fill.position.copy(c).add(new T.Vector3(.9,.35,.6).multiplyScalar(2000));fill.target.position.copy(c);scene.add(fill.target);
    rim.position.copy(c).add(new T.Vector3(.2,.5,-1).multiplyScalar(2000));rim.target.position.copy(c);scene.add(rim.target);
  }
  function px(v){var p=v.clone().project(cam);return[(p.x+1)/2*W,(1-p.y)/2*Hh];}
  return{renderer:renderer,scene:scene,root:root,cam:cam,fit:fit,frustumFor:frustumFor,setFrustum:setFrustum,lerpF:lerpF,px:px,W:W,H:Hh,render:function(){renderer.render(scene,cam);}};
}

/* ---- label overlay (numbered markers) ---- */
var NS="http://www.w3.org/2000/svg";
function overlay(container,W,H){var s=document.createElementNS(NS,"svg");s.setAttribute("viewBox","0 0 "+W+" "+H);container.appendChild(s);return s;}
function marker(svg,V,anchor,n,dx,dy,color,bg){
  var a=V.px(anchor),R=27,x=Math.max(R+8,Math.min(V.W-R-8,a[0]+dx)),y=Math.max(R+8,Math.min(V.H-R-8,a[1]+dy));
  var l=document.createElementNS(NS,"line");l.setAttribute("x1",a[0]);l.setAttribute("y1",a[1]);l.setAttribute("x2",x);l.setAttribute("y2",y);l.setAttribute("stroke",color);l.setAttribute("stroke-width",2.2);svg.appendChild(l);
  var d=document.createElementNS(NS,"circle");d.setAttribute("cx",a[0]);d.setAttribute("cy",a[1]);d.setAttribute("r",5);d.setAttribute("fill",color);svg.appendChild(d);
  var c=document.createElementNS(NS,"circle");c.setAttribute("cx",x);c.setAttribute("cy",y);c.setAttribute("r",R);c.setAttribute("fill",bg);c.setAttribute("stroke",color);c.setAttribute("stroke-width",3);svg.appendChild(c);
  var t=document.createElementNS(NS,"text");t.setAttribute("x",x);t.setAttribute("y",y+10);t.setAttribute("text-anchor","middle");t.setAttribute("font-family","Archivo,sans-serif");t.setAttribute("font-size",28);t.setAttribute("font-weight",800);t.setAttribute("fill",color);t.textContent=n;svg.appendChild(t);
}
function verdict(svg,V,kind){
  var W=V.W,H=V.H,red="#C8281E",green="#2E8B4A";
  if(kind==="bad"){
    var m=Math.min(W,H)*.16,sw=Math.min(W,H)*.032;
    [[m,m,W-m,H-m],[W-m,m,m,H-m]].forEach(function(p){
      var l=document.createElementNS(NS,"line");l.setAttribute("x1",p[0]);l.setAttribute("y1",p[1]);l.setAttribute("x2",p[2]);l.setAttribute("y2",p[3]);
      l.setAttribute("stroke",red);l.setAttribute("stroke-width",sw);l.setAttribute("stroke-linecap","round");l.setAttribute("opacity",.62);svg.appendChild(l);});
    var r=document.createElementNS(NS,"rect");r.setAttribute("x",4);r.setAttribute("y",4);r.setAttribute("width",W-8);r.setAttribute("height",H-8);r.setAttribute("fill","none");r.setAttribute("stroke",red);r.setAttribute("stroke-width",8);r.setAttribute("opacity",.8);svg.appendChild(r);
  } else {
    var s=Math.min(W,H)*.34,cx=W-s*.75,cy=H-s*.75;
    var c=document.createElementNS(NS,"circle");c.setAttribute("cx",cx);c.setAttribute("cy",cy);c.setAttribute("r",s*.5);c.setAttribute("fill",green);svg.appendChild(c);
    var t=document.createElementNS(NS,"path");t.setAttribute("d","M"+(cx-s*.24)+","+cy+" l"+(s*.16)+","+(s*.16)+" l"+(s*.32)+","+(-s*.34));
    t.setAttribute("fill","none");t.setAttribute("stroke","#fff");t.setAttribute("stroke-width",s*.11);t.setAttribute("stroke-linecap","round");t.setAttribute("stroke-linejoin","round");svg.appendChild(t);
  }
}
function leader(svg,V,from,to,color){var a=V.px(from),b=V.px(to),dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);if(L<14)return;
  var ux=dx/L,uy=dy/L,l=document.createElementNS(NS,"line");l.setAttribute("x1",a[0]);l.setAttribute("y1",a[1]);l.setAttribute("x2",b[0]-ux*10);l.setAttribute("y2",b[1]-uy*10);
  l.setAttribute("stroke",color);l.setAttribute("stroke-width",2.4);l.setAttribute("stroke-dasharray","9 7");l.setAttribute("opacity",.9);svg.appendChild(l);
  var h=document.createElementNS(NS,"path");h.setAttribute("d","M"+b[0]+","+b[1]+" l"+(-ux*16-uy*7)+","+(-uy*16+ux*7)+" l"+(uy*14)+","+(-ux*14)+" z");h.setAttribute("fill",color);svg.appendChild(h);}
function chip(svg,V,at,label,color,bg){var p=V.px(at),NS2=NS,w=label.length*15+16;
  var r=document.createElementNS(NS2,"rect");r.setAttribute("x",p[0]-w/2);r.setAttribute("y",p[1]-17);r.setAttribute("width",w);r.setAttribute("height",34);r.setAttribute("rx",5);r.setAttribute("fill",bg);r.setAttribute("stroke",color);r.setAttribute("stroke-width",2.5);svg.appendChild(r);
  var t=document.createElementNS(NS2,"text");t.setAttribute("x",p[0]);t.setAttribute("y",p[1]+9);t.setAttribute("text-anchor","middle");t.setAttribute("font-family","Archivo,sans-serif");t.setAttribute("font-size",25);t.setAttribute("font-weight",800);t.setAttribute("fill",color);t.textContent=label;svg.appendChild(t);}
function text(svg,x,y,s,size,color,weight,anchor){var t=document.createElementNS(NS,"text");t.setAttribute("x",x);t.setAttribute("y",y);t.setAttribute("font-family","Archivo,sans-serif");t.setAttribute("font-size",size);t.setAttribute("font-weight",weight||700);t.setAttribute("fill",color);if(anchor)t.setAttribute("text-anchor",anchor);t.textContent=s;svg.appendChild(t);return t;}

/* snapshot: render once to an <img>, release the context */
function snapshot(container,build,labels,opts){
  var V=view(container,Object.assign({snapshot:true},opts||{}));
  var S=build(V);V.fit(S.dir,S.mx,S.my,S.groundY,S.box);V.render();
  var img=container.querySelector("img")||document.createElement("img");img.alt="";img.src=V.renderer.domElement.toDataURL("image/png");
  if(!img.parentNode)container.appendChild(img);
  var old=container.querySelector("svg");if(old)old.remove();
  var svg=overlay(container,V.W,V.H);if(labels)labels(svg,V,S);
  container.classList.add("ready");
  V.renderer.dispose();V.renderer.forceContextLoss();
}
return{MAT:MAT,verdict:verdict,leader:leader,chip:chip,lBracket:lBracket,hingePlate:hingePlate,pianoHinge:pianoHinge,shelfPin:shelfPin,magnet:magnet,wallSlab:wallSlab,panel:panel,boltFlat:boltFlat,nylock:nylock,cam15:cam15,camBolt:camBolt,dowel:dowel,screwCsk:screwCsk,pivotArm:pivotArm,view:view,overlay:overlay,marker:marker,text:text,snapshot:snapshot};
})();
