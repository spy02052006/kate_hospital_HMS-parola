import asyncio, threading, functools, http.server, socketserver, datetime, urllib.parse
from playwright.async_api import async_playwright
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
httpd=socketserver.ThreadingTCPServer(("127.0.0.1",8851),functools.partial(Q,directory=ROOT))
threading.Thread(target=httpd.serve_forever,daemon=True).start()
URL="http://127.0.0.1:8851/index.html"
res=[]
def check(name,cond,extra=""):
    res.append((bool(cond),name)); print(("PASS " if cond else "FAIL ")+name+("" if cond else f"  -> {extra}"), flush=True)
FUTURE=(datetime.date.today()+datetime.timedelta(days=3)).isoformat()
async def fill_valid(pg):
    await pg.fill("#f-name","Ramesh Patil"); await pg.fill("#f-phone","+91 98765 43210")
    await pg.select_option("#f-dept","Women's Health"); await pg.fill("#f-date",FUTURE)
    await pg.check("#f-consent")
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        await_ctx=None
        # ---- A. Structure / contrast (static checks in the live DOM)
        ctx=await b.new_context(viewport={"width":1440,"height":900}); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(500)
        check("contact and FAQ are inside <main>",
              await pg.evaluate("()=>!!document.querySelector('main #contact') && !!document.querySelector('main #faq')"))
        check("button background is #15803D (5.02:1 contrast)",
              await pg.evaluate("()=>getComputedStyle(document.querySelector('.btn--green')).backgroundColor")=="rgb(21, 128, 61)")
        # ---- B. Doctor -> department mapping
        await pg.click('[data-doctor="Dr. Mahesh Kate"]'); await pg.wait_for_timeout(900)
        check("Dr. Mahesh maps to Women's Health", await pg.input_value("#f-dept")=="Women's Health", await pg.input_value("#f-dept"))
        await pg.click('[data-doctor="Dr. Atul Kate"]'); await pg.wait_for_timeout(900)
        check("Dr. Atul maps to General Medicine (overwrites previous)", await pg.input_value("#f-dept")=="General Medicine & Diabetes Care")
        # ---- C. Double review does not create a second reference
        await fill_valid(pg)
        await pg.click("#review-btn"); await pg.wait_for_timeout(150)
        ref1=await pg.inner_text("#ref-code")
        await pg.focus("#f-consent"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(150)
        ref2=await pg.inner_text("#ref-code")
        check("repeat submit keeps the same reference", ref1 and ref1==ref2, (ref1,ref2))
        # ---- D. Double-click on WhatsApp opens only one window
        await ctx.route("https://wa.me/**", lambda r: r.fulfill(status=200,content_type="text/html",body="<html>ok</html>"))
        popups=[]
        pg.on("popup", lambda pp: popups.append(pp))
        await pg.dblclick("#wa-btn"); await pg.wait_for_timeout(400)
        check("WhatsApp double-click opens one window", len(popups)==1, len(popups))
        check("opened chat contains reference and no phone number",
              bool(popups) and ref1 in urllib.parse.unquote(popups[0].url) and "98765" not in urllib.parse.unquote(popups[0].url))
        await ctx.close()

        # ---- E. Blocked pop-up: honest fallback, no false "ready" claim
        ctx=await b.new_context(viewport={"width":1440,"height":900}); pg=await ctx.new_page()
        await pg.add_init_script("window.open = function(){ return null; };")
        await pg.goto(URL); await pg.wait_for_timeout(300)
        await fill_valid(pg); await pg.click("#review-btn"); await pg.wait_for_timeout(150)
        await pg.click("#wa-btn"); await pg.wait_for_timeout(200)
        st=await pg.inner_text("#form-status")
        link=await pg.evaluate("()=>{const a=document.querySelector('#form-status a');return a?a.href:''}")
        check("blocked pop-up shows honest message", "blocked" in st and "not sent yet" in st, st)
        check("blocked pop-up offers direct WhatsApp link", link.startswith("https://wa.me/919075360600?text="), link[:50])
        await ctx.close()

        # ---- F. Honeypot hidden even when CSS fails to load
        ctx=await b.new_context(viewport={"width":1440,"height":900}); pg=await ctx.new_page()
        await ctx.route("**/css/styles.css", lambda r: r.abort())
        await pg.goto(URL); await pg.wait_for_timeout(300)
        vis=await pg.evaluate("()=>{const i=document.querySelector('input[name=website]');return !!i && i.offsetParent!==null}")
        check("honeypot stays hidden without CSS", vis is False, vis)
        await ctx.close()

        # ---- G. Old-Safari guard: missing MediaQueryList.addEventListener must not break the page
        ctx=await b.new_context(viewport={"width":1440,"height":900}); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
        await pg.add_init_script("if (window.MediaQueryList) { window.MediaQueryList.prototype.addEventListener = undefined; }")
        await pg.goto(URL); await pg.wait_for_timeout(300)
        await pg.click('[data-filter="cabins"]')
        vis=await pg.evaluate("()=>[...document.querySelectorAll('.facility-card')].filter(e=>!e.hidden).length")
        check("page still works when addEventListener is missing (filters run)", vis==3 and not errs, (vis,errs[:2]))
        await ctx.close()

        # ---- H. Regression: original behaviours
        ctx=await b.new_context(viewport={"width":1440,"height":900}); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
        await pg.goto(URL); await pg.wait_for_timeout(700)
        check("video autoplays muted", await pg.evaluate("()=>document.getElementById('hero-video').muted===true"))
        await pg.click("#video-sound"); await pg.wait_for_timeout(150)
        check("sound button unmutes", await pg.evaluate("()=>document.getElementById('hero-video').muted===false"))
        await pg.click("#video-sound")
        await pg.click('[data-gfilter="video"]')
        check("gallery video filter", await pg.evaluate("()=>[...document.querySelectorAll('.gallery-item')].filter(e=>!e.hidden).length")==1)
        await pg.click('[data-gfilter="all"]')
        await pg.click('[data-lightbox="assets/hospital.jpeg"]'); await pg.wait_for_timeout(300)
        check("lightbox loads design image (extension path)", await pg.evaluate("()=>{const i=document.querySelector('#lb-stage img');return !!i&&i.naturalWidth>0}"))
        await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(150)
        check("lightbox arrow key moves to next item (design view is 2 of 11, so next is 3 of 11)", "3 of 11" in await pg.inner_text("#lb-caption"), await pg.inner_text("#lb-caption"))
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(150)
        check("Escape closes lightbox and returns focus to trigger",
              await pg.evaluate("()=>!document.getElementById('lightbox').open && document.activeElement && document.activeElement.dataset.lightbox==='assets/hospital.jpeg'"))
        await pg.set_viewport_size({"width":390,"height":844}); await pg.wait_for_timeout(200)
        await pg.click(".nav__toggle"); await pg.wait_for_timeout(100)
        check("mobile menu opens", await pg.evaluate("()=>document.getElementById('primary-nav').classList.contains('is-open')"))
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(100)
        check("Escape closes mobile menu", await pg.evaluate("()=>!document.getElementById('primary-nav').classList.contains('is-open')"))
        check("no JS errors during regression run", not errs, errs[:3])
        await ctx.close()

        # ---- I. Reduced motion
        ctx=await b.new_context(viewport={"width":1440,"height":900}, reduced_motion="reduce"); pg=await ctx.new_page()
        await pg.goto(URL); await pg.wait_for_timeout(400)
        check("reduced motion: no video autoplay", await pg.evaluate("()=>document.getElementById('hero-video').paused===true"))
        await ctx.close()
        await b.close()
asyncio.run(main()); httpd.shutdown()
ok=sum(1 for c,_ in res if c); print(f"\nRESULT {ok}/{len(res)} passed")
