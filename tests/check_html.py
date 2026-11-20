import re, os, sys
from html.parser import HTMLParser
from collections import Counter
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr','use','path','circle','rect','line','polyline','polygon'}
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.stack=[]; s.errors=[]; s.ids=[]; s.hrefs=[]; s.srcs=[]; s.line=0
    def handle_starttag(s,tag,attrs):
        a=dict(attrs); line=s.getpos()[0]
        if 'id' in a: s.ids.append(a['id'])
        if tag=='a' and 'href' in a and a['href'].startswith('#'): s.hrefs.append((a['href'][1:],line))
        for k in ('src','poster','srcset'):
            if k in a and a[k]: s.srcs.append((a[k],line))
        if tag in VOID or tag=='svg' and False: return
        if tag in VOID: return
        s.stack.append((tag,line))
    def handle_startendtag(s,tag,attrs): pass
    def handle_endtag(s,tag):
        if tag in VOID: return
        line=s.getpos()[0]
        if not s.stack: s.errors.append(f"line {line}: stray </{tag}>"); return
        # pop to matching
        idx=None
        for i in range(len(s.stack)-1,-1,-1):
            if s.stack[i][0]==tag: idx=i; break
        if idx is None: s.errors.append(f"line {line}: stray </{tag}> (no open)"); return
        if idx!=len(s.stack)-1:
            open_=[t for t,_ in s.stack[idx+1:]]
            s.errors.append(f"line {line}: </{tag}> closes while {open_} still open (opened line {s.stack[idx][1]})")
        del s.stack[idx:]
f=sys.argv[1]
p=P(); p.feed(open(f,encoding='utf-8').read())
print("== structure:", f)
for e in p.errors: print("  ERR", e)
for t,l in p.stack: print("  UNCLOSED", t, "line", l)
dups=[i for i,c in Counter(p.ids).items() if c>1]
print("  duplicate ids:", dups or "none")
ids=set(p.ids)
for h,l in p.hrefs:
    if h and h not in ids: print("  BROKEN in-page link #%s line %d"%(h,l))
missing=set()
for ref,l in p.srcs:
    for part in ref.split(','):
        r=part.strip().split(' ')[0]
        if not r or r.startswith(('http','data:','tel:')): continue
        if not os.path.exists(r): missing.add(r)
print("  missing asset refs:", sorted(missing) or "none")
print("  h1 count:", open(f,encoding='utf-8').read().count('<h1'))
