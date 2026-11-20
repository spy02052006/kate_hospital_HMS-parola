import asyncio, threading, functools, http.server, socketserver
from playwright.async_api import async_playwright
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
httpd=socketserver.ThreadingTCPServer(("127.0.0.1",8852),functools.partial(Q,directory=ROOT))
threading.Thread(target=httpd.serve_forever,daemon=True).start()
WIDTHS=[320,360,375,390,430,640,768,900,1024,1180,1366,1440,1920]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        bad=[]
        for w in WIDTHS:
            pg=await b.new_page(viewport={"width":w,"height":800})
            await pg.goto("http://127.0.0.1:8852/index.html"); await pg.wait_for_timeout(250)
            ov=await pg.evaluate("()=>document.documentElement.scrollWidth - document.documentElement.clientWidth")
            overlap=await pg.evaluate("""()=>{const b=document.querySelector('.brand');const l=document.querySelector('.nav__links');
              if(getComputedStyle(l).display==='none') return false;
              const a=b.getBoundingClientRect(), n=l.getBoundingClientRect(); return a.right>n.left+1 && a.bottom>n.top && a.top<n.bottom}""")
            btns=await pg.evaluate("""()=>[...document.querySelectorAll('.btn')].filter(e=>e.offsetParent!==null).filter(e=>e.getBoundingClientRect().right>innerWidth+1).length""")
            status="ok" if ov<=0 and not overlap and btns==0 else "CHECK"
            if status!="ok": bad.append(w)
            print(f"{w:5d}px  overflow={ov:>3}px  header_overlap={overlap}  offscreen_buttons={btns}  {status}")
            await pg.close()
        await b.close()
        print("RESULT: all widths clean" if not bad else f"RESULT: issues at {bad}")
asyncio.run(main()); httpd.shutdown()
