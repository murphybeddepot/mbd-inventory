// Emit assembly.json from a Boaz product .moz: every active part with outline, holes, and the
// world placement (anchor + M*local), using the placement table verified in build-fusion-script.mjs.
// 2A and 2E outlines come from the shaped reference (v1-58) because v1-59+ stores them flat.
import { readFileSync, writeFileSync } from 'node:fs';
const [src, shaped, out] = process.argv.slice(2);
const at=(s,k,d='')=>{const m=s.match(new RegExp(`\\b${k}="([^"]*)"`));return m?m[1]:d;};
const num=(s,k,d=0)=>{const v=parseFloat(at(s,k,''));return Number.isFinite(v)?v:d;};
const PL={'0,0,0':[[0,1],[1,1],[2,1]],'0,270,0':[[2,-1],[1,1],[0,1]],'90,0,0':[[0,1],[2,-1],[1,1]],'90,270,0':[[1,-1],[2,-1],[0,1]]};
function M(key){const map=PL[key];if(!map)return null;const m=[[0,0,0],[0,0,0],[0,0,0]];map.forEach(([a,s],i)=>{m[i][a]=s;});return m;}
function parse(t){const parts=[];
  for(const m of t.matchAll(/<CabProdPart\b([^>]*)>([\s\S]*?)<\/CabProdPart>/g)){const h=m[1],b=m[2];
    if(at(h,'Quan')==='0')continue;if(/If BN = 1/.test(at(h,'Q_EQ')))continue;
    const n=v=>((Math.round(num(h,v))%360)+360)%360;const key=`${n('A1')},${n('A2')},${n('A3')}`;
    const outline=[...b.matchAll(/<ShapePoint\b[^>]*>/g)].map(s=>[num(s[0],'X'),num(s[0],'Y'),at(s[0],'EBand','0')==='1'?1:0]);
    const faces=[],edges=[];
    for(const o of b.matchAll(/<OperationHole\b[^>]*>/g)){const s=o[0],dia=num(s,'Diameter'),dep=num(s,'Depth');if(!dia||!dep)continue;
      const hb=at(s,'HBoreAngle','');if(hb==='')faces.push({x:num(s,'X'),y:num(s,'Y'),dia,dep,far:at(s,'FlipSideOp')==='True'});else edges.push({x:num(s,'X'),y:num(s,'Y'),dia,dep,hb:+hb});}
    parts.push({code:at(h,'ReportName'),name:at(h,'Name').replace(/&quot;/g,'"'),L:num(h,'L'),W:num(h,'W'),key,M:M(key),anchor:[num(h,'X'),num(h,'Y'),num(h,'Z')],outline:outline.length>=3?outline:null,faces,edges});}
  return parts;}
const parts=parse(readFileSync(src,'latin1'));
if(shaped){const sp=parse(readFileSync(shaped,'latin1'));for(const p of parts){if(p.code==='2A'||p.code==='2E'){const r=sp.find(q=>q.code===p.code);if(r&&r.outline)p.outline=r.outline;}}}
for(const p of parts)if(!p.outline)p.outline=[[0,0,0],[p.L,0,0],[p.L,p.W,0],[0,p.W,0]];
const refused=parts.filter(p=>!p.M).map(p=>p.code+' '+p.key);
writeFileSync(out,JSON.stringify({source:src.split('/').pop(),T:19.05,parts},null,0));
console.log('parts',parts.length,'refused',refused.length?refused:'none');
const codes={};parts.forEach(p=>{codes[p.code]=(codes[p.code]||0)+1;});console.log(JSON.stringify(codes));
