import asyncio, threading, functools, http.server, socketserver, json
from playwright.async_api import async_playwright
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
httpd=socketserver.ThreadingTCPServer(("127.0.0.1",8853),functools.partial(Q,directory=ROOT))
threading.Thread(target=httpd.serve_forever,daemon=True).start()
AXE=open(os.path.join(os.path.dirname(__file__),"axe.min.js")).read()
async def scan(b,path,label):
    ctx=await b.new_context(viewport={"width":1440,"height":900}); pg=await ctx.new_page()
    await pg.goto(f"http://127.0.0.1:8853/{path}"); await pg.wait_for_timeout(500)
    await pg.add_script_tag(content=AXE)
    r=await pg.evaluate("async()=>{const r=await axe.run(document,{resultTypes:['violations']});return r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,help:v.help,sample:v.nodes.map(n=>n.target.join(' '))}))}")
    print(f"== {label}: {len(r)} violation type(s)")
    for v in r: print(f"  [{v['impact']}] {v['id']} x{v['n']}: {v['help']}  e.g. {[n for n in v["sample"]]}")
    await ctx.close()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        await scan(b,"index.html","index")
        await scan(b,"privacy.html","privacy")
        await scan(b,"terms.html","terms")
        await b.close()
asyncio.run(main()); httpd.shutdown()
