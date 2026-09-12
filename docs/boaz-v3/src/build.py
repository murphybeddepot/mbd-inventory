import re,sys
def css():
    h=open("boaz-step1.html",encoding="utf-8").read()
    return "\n".join(re.findall(r"<style>(.*?)</style>",h,re.S))
FONTS='<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap">'
THREE='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
def page(title,body,scripts):
    js="\n".join("<script>\n"+open(f,encoding="utf-8").read()+"\n</script>" for f in scripts)
    return "<title>%s</title>\n%s\n<style>\n%s\n</style>\n\n%s\n\n%s\n%s\n"%(title,FONTS,css(),body,THREE,js)
S=css()
b1=open("step1.body.html",encoding="utf-8").read();b2=open("step2.body.html",encoding="utf-8").read()
open("out-step1.html","w",encoding="utf-8").write(page("Boaz V3 Step 1",b1,["plan.js","boaz3d.js","parts1A.js","step1.scene.js"]))
open("out-step2.html","w",encoding="utf-8").write(page("Boaz V3 Step 2",b2,["plan.js","boaz3d.js","parts1A.js","step2.scene.js"]))
EXTRA_CSS=""".index{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px 14px;margin:24px 0 8px}
.index a{display:flex;gap:10px;align-items:baseline;text-decoration:none;color:var(--ink);font-size:13.5px;padding:5px 0;border-bottom:1px solid var(--rule-2)}
.index a b{font-family:"IBM Plex Mono",monospace;color:var(--edge);min-width:2ch;text-align:right}
.stepsec{margin-top:56px;padding-top:8px;border-top:2px solid var(--ink)}
.stepsec h2{margin-top:26px}"""
bb=open("book.body.html",encoding="utf-8").read()
asm=open("assembly.json",encoding="utf-8").read()
js3="\n".join("<script>\n"+open(f,encoding="utf-8").read()+"\n</script>" for f in ["boaz3d.js","boaz-asm.js","steps.js"])
book="<title>Boaz V3 Instructions</title>\n%s\n<style>\n%s\n%s\n</style>\n\n%s\n\n%s\n%s\n<script>window.ASSEMBLY=%s;</script>\n<script>\n%s\n</script>\n"%(FONTS,css(),EXTRA_CSS,bb,THREE,js3,asm,open("book.js",encoding="utf-8").read())
open("out-book.html","w",encoding="utf-8").write(book)
for f in ("out-step1.html","out-step2.html","out-book.html"):
    s=open(f,encoding="utf-8").read()
    w='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'+s.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','three.min.js')+'</body></html>'
    open("prev-"+f,"w",encoding="utf-8").write(w)
print("built")
