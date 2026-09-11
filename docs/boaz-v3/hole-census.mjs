import { readFileSync } from 'node:fs';
// Usage: node hole-census.mjs "<path to product .moz>"
// NOTE: from v1-59 the Boaz Top (2A) and front toe (2E) are stored as flat blanks and the
// drill cuts their notches from the v1-58 reference. Holes are measured from the raw blank,
// so a bore that reads 40 deep near a 19 notch is 21 past the real edge. Read the outline first.
// Counts every OperationHole by role (cam, bolt run, shelf ladder, pilots, dowels) so a
// hardware pack can be checked against what the file actually drills.
const F=process.argv[2]; if(!F){console.error('usage: node hole-census.mjs <product.moz>');process.exit(1);}
const t=readFileSync(F,'latin1');
const attr=(s,k)=>((s.match(new RegExp(`\\s${k}="([^"]*)"`))||[,''])[1]);
const parts=[];
for (const chunk of t.split(/(?=<CabProdPart\b)/).slice(1)) {
  const h=chunk.slice(0,chunk.indexOf('>')+1);
  parts.push({code:attr(h,'ReportName'),name:attr(h,'Name').replace(/&quot;/g,'"'),
    L:+attr(h,'L'),W:+attr(h,'W'),qty:+attr(h,'Quan')||1,
    ops:[...chunk.matchAll(/<OperationHole\b([^>]*)>/g)].map(m=>({
      d:+attr(m[1],'Diameter'),dp:+attr(m[1],'Depth'),
      hba:attr(m[1],'HBoreAngle'),X:+attr(m[1],'X'),Y:+attr(m[1],'Y')}))});
}
// Shelf-pin ladder detector: >=8 same-diameter d5 face holes on one part sharing
// exactly two Y values, spaced 32mm in X (the 32mm system pitch).
function ladderSet(p){
  const s=new Set();
  const d5=p.ops.map((o,i)=>({o,i})).filter(({o})=>o.d===5&&o.hba==='');
  const byY=new Map();
  for(const r of d5){ const k=r.o.Y.toFixed(1); (byY.get(k)||byY.set(k,[]).get(k)).push(r); }
  for(const [,rows] of byY){
    if(rows.length<4) continue;
    const xs=rows.map(r=>r.o.X).sort((a,b)=>a-b);
    let run=1;
    for(let i=1;i<xs.length;i++){
      if(Math.abs(xs[i]-xs[i-1]-32)<0.6) run++; else run=1;
      if(run>=3) for(const r of rows) s.add(r.i);
    }
  }
  return s;
}
let cam=0,cam9=0,bolt=0,shelf=0,d8thru=0,d8dowel=0,d3thru=0,d3edge=0,d3face=0,d5thru=0,d35=0,d3edge3=0;
const bolt34=[],bolt43=[];
const detail={};
for(const p of parts){
  const lad=ladderSet(p);
  for(let i=0;i<p.ops.length;i++){
    const o=p.ops[i], edge=o.hba!=='';
    const q=p.qty;
    if(o.d===15&&!edge){ if(o.dp===15)cam+=q; else cam9+=q; }
    else if(o.d===5&&!edge){
      if(o.dp>=19) d5thru+=q;
      else if(lad.has(i)) shelf+=q;
      else bolt+=q;
    }
    else if(o.d===8&&!edge){ d8thru+=q; }
    else if(o.d===8&&edge){ d8dowel+=q; }
    else if(o.d===3&&!edge){ if(o.dp>=19) d3thru+=q; else d3face+=q; }
    else if(o.d===3&&edge){ if(o.dp===3) d3edge3+=q; else d3edge+=q; }
    else if(o.d===35) d35+=q;
  }
}
console.log({cam15x15:cam, socket15x9:cam9, connectingBolt_d5:bolt, shelfPin_d5:shelf,
  d5_through:d5thru, d8_through:d8thru, d8_edge:d8dowel, d3_through:d3thru,
  d3_face_pilot:d3face, d3_edge_pilot:d3edge, d3_edge_3deep:d3edge3, d35_through:d35});
// edge-bore depth census (bolt clearance vs dowel)
const eb=new Map();
for(const p of parts) for(const o of p.ops) if(o.d===8&&o.hba!=='') {
  const k=`d8 x ${o.dp}`; eb.set(k,(eb.get(k)||0)+p.qty);
}
console.log('\nd8 EDGE bores by depth:',Object.fromEntries(eb));

console.log('\n=== per-part bolt/cam/clearance ===');
for(const p of parts){
  const lad=ladderSet(p);
  let b=0,c=0,cl=0,sh=0;
  p.ops.forEach((o,i)=>{const e=o.hba!=='';
    if(o.d===5&&!e&&o.dp<19){ lad.has(i)?sh++:b++; }
    if(o.d===15&&!e&&o.dp===15)c++;
    if(o.d===8&&e&&(o.dp===34||o.dp===40))cl++;});
  if(b||c||cl) console.log(`${p.code.padEnd(3)} q${p.qty}  bolt=${b} cam=${c} clear=${cl} shelf=${sh}  ${p.name}`);
}
