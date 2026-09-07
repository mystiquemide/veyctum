// Veyctum Proof landing page. Built section by section; sections are added in
// approved gates and must not be restyled by later gates.

export const TRACK3_LANDING_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Veyctum Proof verifies whether an on-chain payment effect actually happened before the next action proceeds.">
<meta name="theme-color" content="#0a1929">
<link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg">
<title>Veyctum Proof | Payment effect verification</title>
<link rel="preload" href="/assets/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/jbmono-var.woff2" as="font" type="font/woff2" crossorigin>
<style>
@font-face{font-family:'Inter';font-style:normal;font-weight:100 900;font-display:swap;src:url('/assets/fonts/inter-var.woff2') format('woff2')}
@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:100 800;font-display:swap;src:url('/assets/fonts/jbmono-var.woff2') format('woff2')}
:root{color-scheme:dark;--navy:#0a1929;--navy-deep:#041734;--navy-deeper:#061220;--navy-panel:#0e2033;--sky:#80bbff;--action:#0068e0;--action-hover:#0075ff;--pass:#20df66;--warn:#f59e0b;--fail:#f87171;--text:#e9f0f6;--muted:#a7babe;--line:rgba(128,187,255,.22);--line-soft:rgba(128,187,255,.12);--radius:8px;--radius-lg:16px;--max:1160px;--nav-h:78px;--sans:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;--mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--navy);color:var(--text);font-family:var(--sans);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
a{color:inherit;text-decoration:none}
img{max-width:100%}
:focus-visible{outline:2px solid var(--sky);outline-offset:3px;border-radius:4px}
.shell{max-width:var(--max);margin:0 auto;padding:0 24px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:14px 24px;border-radius:var(--radius);border:1px solid transparent;font:600 15px/1 var(--sans);cursor:pointer;transition:background-color .2s ease,border-color .2s ease,color .2s ease}
.btn-primary{background:var(--action);color:#fff}
.btn-primary:hover{background:var(--action-hover)}
.btn-dark{background:var(--navy-deep);border-color:var(--line);color:var(--text)}
.btn-dark:hover{border-color:var(--sky)}
.btn-sm{padding:10px 16px;font-size:14px}
.nav{position:sticky;top:0;z-index:100;background:rgba(6,18,32,.97);border-bottom:1px solid var(--line-soft)}
.nav-inner{max-width:var(--max);margin:0 auto;padding:0 24px;height:var(--nav-h);display:flex;align-items:center;justify-content:space-between;gap:24px}
.brand{display:flex;align-items:center;gap:10px;font:700 16px/1 var(--sans);color:#fff}
.brand-mark{width:30px;height:30px;border-radius:var(--radius);background:var(--navy-deep);border:1px solid var(--sky);color:var(--sky);display:grid;place-items:center;font:800 15px/1 var(--sans)}
.nav-links{display:flex;align-items:center;gap:28px;font:500 14px/1 var(--sans);color:var(--muted)}
.nav-links a:hover{color:#fff}
.nav-links .btn{display:none}
.nav-toggle{display:none;flex-direction:column;justify-content:center;gap:5px;width:42px;height:42px;padding:10px;background:transparent;border:1px solid var(--line);border-radius:var(--radius);cursor:pointer}
.nav-toggle span{display:block;height:2px;background:var(--text);border-radius:1px}
.hero{position:relative;overflow:hidden;border-bottom:1px solid var(--line-soft)}
.hero-glow{position:absolute;left:50%;bottom:-46%;width:140%;height:110%;transform:translateX(-50%);background:radial-gradient(ellipse at center,rgba(0,117,255,.26) 0%,rgba(0,117,255,.07) 45%,rgba(0,117,255,0) 72%);pointer-events:none}
.hero-inner{position:relative;max-width:var(--max);margin:0 auto;padding:104px 24px 112px;display:grid;grid-template-columns:1.05fr .95fr;gap:64px;align-items:center}
.pill{display:inline-flex;align-items:center;gap:9px;padding:9px 15px;border-radius:9999px;border:1px solid var(--line);background:rgba(0,117,255,.10);font:500 13px/1 var(--mono);color:var(--sky)}
.pill-dot{width:8px;height:8px;border-radius:50%;background:var(--pass)}
.hero h1{margin:26px 0 0;font:800 clamp(40px,5.4vw,62px)/1.06 var(--sans);letter-spacing:-.03em;color:#fff}
.hero h1 .accent{color:var(--sky)}
.hero-sub{margin:24px 0 0;max-width:540px;font:400 18px/1.65 var(--sans);color:var(--muted)}
.hero-actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:36px}
.hero-visual{position:relative}
.hero-frame{border-radius:var(--radius-lg);border:1px solid var(--line);overflow:hidden;background:var(--navy-deeper)}
.hero-frame img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}
.status-card{position:absolute;left:18px;bottom:18px;display:flex;flex-direction:column;gap:7px;padding:16px 18px;border-radius:12px;border:1px solid var(--line);background:rgba(6,18,32,.94)}
.status-main{display:flex;align-items:center;gap:9px;font:600 14px/1 var(--sans);color:#fff}
.status-dot{width:9px;height:9px;border-radius:50%;background:var(--muted)}
.status-dot.live{background:var(--pass);animation:pulse 2.4s ease-in-out infinite}
.status-dot.off{background:var(--warn)}
.status-sub{font:400 12px/1.5 var(--mono);color:var(--muted)}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(32,223,102,.4)}50%{box-shadow:0 0 0 6px rgba(32,223,102,0)}}
@media(prefers-reduced-motion:reduce){.status-dot.live{animation:none}}
@media(max-width:900px){
.hero-inner{grid-template-columns:1fr;gap:48px;padding:72px 24px 80px}
.hero-visual{max-width:560px}
}
@media(max-width:768px){
.nav-links{position:absolute;top:var(--nav-h);left:0;right:0;flex-direction:column;align-items:flex-start;gap:0;background:rgba(6,18,32,.98);border-bottom:1px solid var(--line-soft);padding:10px 24px 18px;display:none}
.nav-links.open{display:flex}
.nav-links a{padding:14px 0;width:100%;font-size:15px}
.nav-links .btn{display:inline-flex;margin-top:12px}
.nav-toggle{display:inline-flex}
.nav-desktop-cta{display:none}
}
/* Gate 2: facts band, problem, how it works */
.facts-band{border-bottom:1px solid var(--line-soft);background:var(--navy-deeper)}
.facts-grid{display:grid;grid-template-columns:repeat(4,1fr)}
.fact{padding:22px 24px;border-left:1px solid var(--line-soft)}
.fact:first-child{border-left:0;padding-left:0}
.fact-k{display:block;font:500 11px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.fact-v{display:block;margin-top:8px;font:600 17px/1.3 var(--sans);color:#fff}
.section{padding:96px 0;border-bottom:1px solid var(--line-soft)}
.section-alt{background:var(--navy-deeper)}
.kicker{margin:0 0 18px;font:500 13px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--sky)}
.h2{margin:0;max-width:640px;font:800 clamp(30px,4vw,44px)/1.12 var(--sans);letter-spacing:-.02em;color:#fff}
.section-intro{margin:22px 0 0;max-width:560px;font:400 17px/1.65 var(--sans);color:var(--muted)}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:48px}
.duo-card{background:var(--navy-panel);border:1px solid var(--line);border-radius:var(--radius-lg);padding:28px}
.duo-head{display:flex;align-items:center;gap:12px}
.duo-head h3{margin:0;font:700 19px/1.3 var(--sans);color:#fff}
.dot-lg{width:12px;height:12px;border-radius:50%;flex:none}
.dot-pass{background:var(--pass)}
.dot-fail{background:var(--fail)}
.duo-card p{margin:16px 0 0;font:400 15px/1.65 var(--sans);color:var(--muted)}
.duo-note{margin:28px 0 0;font:500 14px/1.6 var(--mono);color:var(--sky)}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:48px}
.step-card{background:var(--navy-panel);border:1px solid var(--line);border-radius:var(--radius-lg);padding:26px}
.step-num{display:inline-block;font:700 13px/1 var(--mono);color:var(--sky);letter-spacing:.06em}
.step-card h3{margin:16px 0 0;font:700 19px/1.3 var(--sans);color:#fff}
.step-card p{margin:12px 0 0;font:400 15px/1.65 var(--sans);color:var(--muted)}
.terminal{margin:48px 0 0;border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden;background:#0d1626}
.term-bar{display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--line-soft);background:var(--navy-deep)}
.term-dots{display:inline-flex;gap:7px}
.term-dots i{width:11px;height:11px;border-radius:50%}
.term-dots i:nth-child(1){background:#ff5f56}
.term-dots i:nth-child(2){background:#ffbd2e}
.term-dots i:nth-child(3){background:#27c93f}
.term-title{font:400 12px/1 var(--mono);color:var(--muted)}
.term-body{margin:0;padding:22px 24px;overflow-x:auto;font:400 13.5px/1.9 var(--mono);color:var(--text)}
.t-green{color:var(--pass)}
.t-sky{color:var(--sky)}
.t-muted{color:var(--muted)}
.t-white{color:#fff}
@media(max-width:900px){
.facts-grid{grid-template-columns:repeat(2,1fr);row-gap:20px}
.fact{padding:0 0 0 20px}
.fact:nth-child(odd){border-left:0;padding-left:0}
.fact:nth-child(n+3){border-top:1px solid var(--line-soft);padding-top:20px}
.duo{grid-template-columns:1fr}
.steps{grid-template-columns:1fr}
.section{padding:72px 0}
}
@media(max-width:560px){
.facts-grid{grid-template-columns:1fr;row-gap:0}
.fact{border-left:0;padding:16px 0 0;border-top:1px solid var(--line-soft)}
.fact:first-child{border-top:0;padding-top:20px}
.duo-card{padding:22px}
.term-body{padding:18px 16px}
}
/* Gate 3: what you get, boundary, transparency */
.dot-sky{background:var(--sky)}
.results-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:48px}
.res-card{background:var(--navy-panel);border:1px solid var(--line);border-radius:var(--radius-lg);padding:26px}
.res-card p{margin:14px 0 0;font:400 15px/1.65 var(--sans);color:var(--muted)}
.boundary-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:48px;margin-top:48px;align-items:center}
.boundary-frame img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius-lg);border:1px solid var(--line)}
.bl-list{border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--navy-panel);padding:6px 24px}
.bl-group{font:500 11px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding:18px 0 6px}
.bl-row{display:flex;gap:12px;align-items:flex-start;padding:10px 0 18px;font:400 15px/1.55 var(--sans);color:var(--text)}
.bl-mark{flex:none;font:700 15px/1.5 var(--mono)}
.bl-yes .bl-mark{color:var(--pass)}
.bl-no .bl-mark{color:var(--fail)}
.tr-list{margin-top:48px;border-top:1px solid var(--line)}
.tr-row{display:grid;grid-template-columns:220px 1fr auto;gap:20px;align-items:baseline;padding:20px 0;border-bottom:1px solid var(--line-soft)}
.tr-name{font:600 16px/1.4 var(--sans);color:#fff}
.tr-desc{font:400 14px/1.6 var(--sans);color:var(--muted)}
.tr-link{font:500 13px/1.2 var(--mono);color:var(--sky);white-space:nowrap}
.tr-link:hover{text-decoration:underline;text-underline-offset:4px}
@media(max-width:900px){
.results-grid{grid-template-columns:1fr}
.boundary-grid{grid-template-columns:1fr;gap:32px}
.tr-row{grid-template-columns:1fr;gap:8px}
.tr-link{justify-self:start}
}
/* Gate 4: FAQ, CTA band, footer */
.faq-list{margin-top:48px;max-width:760px}
details.faq{border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--navy-panel);margin-bottom:12px}
details.faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px;font:600 16px/1.4 var(--sans);color:#fff}
details.faq summary::-webkit-details-marker{display:none}
.faq-x{flex:none;font:500 18px/1 var(--mono);color:var(--sky);transition:transform .2s ease}
details[open] .faq-x{transform:rotate(45deg)}
details.faq p{margin:0;padding:0 24px 22px;font:400 15px/1.65 var(--sans);color:var(--muted)}
.cta{position:relative;overflow:hidden;border-bottom:1px solid var(--line-soft)}
.cta-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.45}
.cta-shade{position:absolute;inset:0;background:rgba(6,18,32,.55)}
.cta-inner{position:relative;max-width:var(--max);margin:0 auto;padding:104px 24px}
.cta-inner h2{margin:0;max-width:640px;font:800 clamp(30px,4vw,44px)/1.12 var(--sans);letter-spacing:-.02em;color:#fff}
.cta-inner p{margin:22px 0 0;max-width:520px;font:400 17px/1.65 var(--sans);color:var(--text)}
.cta-inner .btn{margin-top:36px}
.footer{background:var(--navy-deeper);padding:56px 0 40px}
.footer-grid{display:grid;grid-template-columns:1.2fr 1fr 1.1fr;gap:48px}
.footer-brand{display:flex;align-items:center;gap:10px;font:700 16px/1 var(--sans);color:#fff}
.footer-tagline{margin:16px 0 0;max-width:320px;font:400 14px/1.6 var(--sans);color:var(--muted)}
.footer h4{margin:0 0 16px;font:600 12px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.footer ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.footer a{font:400 14px/1.5 var(--sans);color:var(--muted)}
.footer a:hover{color:#fff}
.footer-bottom{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;border-top:1px solid var(--line-soft);margin-top:48px;padding-top:24px;font:400 12px/1.6 var(--mono);color:var(--muted)}
.footer-bottom a{color:var(--muted)}
.footer-bottom a:hover{color:var(--sky)}
@media(max-width:900px){
.cta-inner{padding:80px 24px}
.footer-grid{grid-template-columns:1fr;gap:36px}
}
</style>
</head>
<body>
<header class="nav">
  <div class="nav-inner">
    <a class="brand" href="/"><span class="brand-mark">V</span>Veyctum Proof</a>
    <nav class="nav-links" id="navLinks" aria-label="Primary">
      <a href="#how">How it works</a>
      <a href="#results">What you get</a>
      <a href="#boundary">Boundary</a>
      <a href="#faq">FAQ</a>
      <a class="btn btn-primary btn-sm" href="/app">Verify a payment</a>
    </nav>
    <a class="btn btn-primary btn-sm nav-desktop-cta" href="/app">Verify a payment</a>
    <button class="nav-toggle" id="navToggle" type="button" aria-label="Toggle menu" aria-expanded="false" aria-controls="navLinks"><span></span><span></span><span></span></button>
  </div>
</header>
<main>
  <section class="hero">
    <div class="hero-glow" aria-hidden="true"></div>
    <div class="hero-inner">
      <div>
        <span class="pill"><span class="pill-dot" aria-hidden="true"></span>Live on Telegraph</span>
        <h1>A successful receipt is not a successful <span class="accent">payment.</span></h1>
        <p class="hero-sub">Veyctum Proof checks what a blockchain transaction actually did before your next step depends on it. One hash in. A verified payment effect out.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="/app">Verify a payment</a>
          <a class="btn btn-dark" href="#how">See how it works</a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-frame">
          <img src="/assets/img/hero-network.jpg" alt="Earth at night connected by glowing network lines" width="1600" height="1065">
        </div>
        <div class="status-card">
          <div class="status-main"><span class="status-dot" id="statusDot" aria-hidden="true"></span><span id="statusLabel">Telegraph Miner 9005</span></div>
          <div class="status-sub">Base + Ethereum · $0.01 USDC per lookup</div>
        </div>
      </div>
    </div>
  </section>

  <section class="facts-band" aria-label="Service facts">
    <div class="shell facts-grid">
      <div class="fact"><span class="fact-k">Telegraph Miner</span><span class="fact-v">9005</span></div>
      <div class="fact"><span class="fact-k">Intent</span><span class="fact-v">ONCHAIN_TX_LOOKUP</span></div>
      <div class="fact"><span class="fact-k">Networks</span><span class="fact-v">Base + Ethereum</span></div>
      <div class="fact"><span class="fact-k">Lookup cost</span><span class="fact-v">$0.01 USDC</span></div>
    </div>
  </section>

  <section class="section" id="problem">
    <div class="shell">
      <p class="kicker">The problem</p>
      <h2 class="h2">Receipts say it ran. They never say it paid.</h2>
      <p class="section-intro">A transaction can execute successfully and still move no money. An approval succeeds, a contract call succeeds, and the payment you expected simply never happens. Standard receipts cannot tell the difference.</p>
      <div class="duo">
        <div class="duo-card">
          <div class="duo-head"><span class="dot-lg dot-pass" aria-hidden="true"></span><h3>Execution succeeded</h3></div>
          <p>The transaction ran on chain without reverting. The status says success and everything looks correct.</p>
        </div>
        <div class="duo-card">
          <div class="duo-head"><span class="dot-lg dot-fail" aria-hidden="true"></span><h3>Payment effect missing</h3></div>
          <p>No supported USDC transfer exists in the transaction logs. The money never moved. The receipt still says success.</p>
        </div>
      </div>
      <p class="duo-note">Both cards can be true for the same transaction. Veyctum Proof exists because they often are.</p>
    </div>
  </section>

  <section class="section section-alt" id="how">
    <div class="shell">
      <p class="kicker">How it works</p>
      <h2 class="h2">From hash to verified effect in one request.</h2>
      <div class="steps">
        <div class="step-card">
          <span class="step-num">01</span>
          <h3>Submit the hash</h3>
          <p>Paste the transaction hash you already have. Nothing is signed and nothing is sent to the chain at this point.</p>
        </div>
        <div class="step-card">
          <span class="step-num">02</span>
          <h3>Pay the lookup</h3>
          <p>Your wallet signs one $0.01 USDC request on Base Sepolia. Telegraph forwards it to Miner 9005.</p>
        </div>
        <div class="step-card">
          <span class="step-num">03</span>
          <h3>Read the result</h3>
          <p>The Miner checks the transaction through two independent RPC providers and returns the observed effect with a Telegraph signal.</p>
        </div>
      </div>
      <figure class="terminal" role="img" aria-label="Ghost example of one verified lookup request and its result fields">
        <figcaption class="term-bar"><span class="term-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="term-title">verified lookup · ghost example</span></figcaption>
        <pre class="term-body"><code><span class="t-green">$</span> veyctum verify <span class="t-sky">0x3739...e16a7</span>

<span class="t-muted">payment</span>  <span class="t-sky">0.01 USDC · Base Sepolia</span>
<span class="t-muted">miner</span>    <span class="t-white">9005 · ONCHAIN_TX_LOOKUP</span>

<span class="t-muted">chain</span>    <span class="t-white">base</span>
<span class="t-muted">state</span>    <span class="t-green">OK</span>
<span class="t-muted">effect</span>   <span class="t-green">1 normalized USDC transfer</span>
<span class="t-muted">signal</span>   <span class="t-sky">0x8b78...4ef50</span></code></pre>
      </figure>
    </div>
  </section>

  <section class="section" id="results">
    <div class="shell">
      <p class="kicker">What you get</p>
      <h2 class="h2">Four facts that make the answer trustworthy.</h2>
      <div class="results-grid">
        <div class="res-card">
          <div class="duo-head"><span class="dot-lg dot-pass" aria-hidden="true"></span><h3>Transaction state</h3></div>
          <p>Success or failure, observed through two independent RPC providers. If they disagree, the check fails closed instead of guessing.</p>
        </div>
        <div class="res-card">
          <div class="duo-head"><span class="dot-lg dot-sky" aria-hidden="true"></span><h3>Called method</h3></div>
          <p>The decoded method name and selector, so you can see what the transaction actually invoked before trusting it.</p>
        </div>
        <div class="res-card">
          <div class="duo-head"><span class="dot-lg dot-pass" aria-hidden="true"></span><h3>Payment effect</h3></div>
          <p>Normalized Base USDC transfer effects decoded from the logs. An approval is never counted as a payment.</p>
        </div>
        <div class="res-card">
          <div class="duo-head"><span class="dot-lg dot-sky" aria-hidden="true"></span><h3>Telegraph signal</h3></div>
          <p>A signal hash backing the observation, so a downstream workflow can verify the result independently.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section-alt" id="boundary">
    <div class="shell">
      <p class="kicker">The boundary</p>
      <h2 class="h2">Verification is not custody.</h2>
      <div class="boundary-grid">
        <div class="boundary-frame">
          <img src="/assets/img/boundary-chip.jpg" alt="Macro photograph of a silicon chip on a dark circuit board" width="1600" height="1069">
        </div>
        <div>
          <div class="bl-list">
            <div class="bl-group">Veyctum Proof does</div>
            <div class="bl-row bl-yes"><span class="bl-mark" aria-hidden="true">+</span><span>Observe transaction facts through independent providers</span></div>
            <div class="bl-row bl-yes"><span class="bl-mark" aria-hidden="true">+</span><span>Decode supported Base USDC payment effects</span></div>
            <div class="bl-row bl-yes"><span class="bl-mark" aria-hidden="true">+</span><span>Return inspectable evidence with a Telegraph signal</span></div>
            <div class="bl-group">Veyctum Proof does not</div>
            <div class="bl-row bl-no"><span class="bl-mark" aria-hidden="true">×</span><span>Hold, custody, or settle any funds</span></div>
            <div class="bl-row bl-no"><span class="bl-mark" aria-hidden="true">×</span><span>Change the transaction you are verifying</span></div>
            <div class="bl-row bl-no"><span class="bl-mark" aria-hidden="true">×</span><span>Replace your escrow or policy logic</span></div>
          </div>
          <p class="duo-note">The only payment here is the $0.01 lookup fee. The transaction you verify is never touched.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="transparency">
    <div class="shell">
      <p class="kicker">Transparency</p>
      <h2 class="h2">Every claim has a URL.</h2>
      <p class="section-intro">The service publishes its own state. Do not take this page's word for it, check it.</p>
      <div class="tr-list">
        <div class="tr-row">
          <span class="tr-name">Live status</span>
          <span class="tr-desc">Window, mode, exclusions, and counted requests as JSON.</span>
          <a class="tr-link" href="/track3/status">/track3/status</a>
        </div>
        <div class="tr-row">
          <span class="tr-name">Request ledger</span>
          <span class="tr-desc">Append-only record of settled lookups. Anonymized, no wallet addresses.</span>
          <a class="tr-link" href="/track3/ledger.jsonl">/track3/ledger.jsonl</a>
        </div>
        <div class="tr-row">
          <span class="tr-name">Miner API</span>
          <span class="tr-desc">The public Veyctum Miner behind this app, with its manifest.</span>
          <a class="tr-link" href="https://veyctum.splitpot.xyz" target="_blank" rel="noreferrer">veyctum.splitpot.xyz</a>
        </div>
        <div class="tr-row">
          <span class="tr-name">Request rules</span>
          <span class="tr-desc">Exactly which traffic counts and which is excluded, in writing.</span>
          <a class="tr-link" href="https://github.com/mystiquemide/veyctum/blob/main/evidence/track3/RULES.md" target="_blank" rel="noreferrer">evidence/track3/RULES.md</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section section-alt" id="faq">
    <div class="shell">
      <p class="kicker">FAQ</p>
      <h2 class="h2">Questions people actually ask.</h2>
      <div class="faq-list">
        <details class="faq">
          <summary>What is the $0.01 for?<span class="faq-x" aria-hidden="true">+</span></summary>
          <p>Every verification is a real paid request through Telegraph. Your one cent pays Miner 9005 to resolve the transaction through independent providers. One lookup, one cent, no subscription.</p>
        </details>
        <details class="faq">
          <summary>Is my money safe?<span class="faq-x" aria-hidden="true">+</span></summary>
          <p>Veyctum Proof never holds funds. The only payment is your lookup fee. The transaction you verify is read, never modified, and nothing is custody, settled, or released on your behalf.</p>
        </details>
        <details class="faq">
          <summary>Why Base Sepolia?<span class="faq-x" aria-hidden="true">+</span></summary>
          <p>The lookup payment runs on Base Sepolia, the test network for Base. It keeps the payment itself real while staying cheap and safe to try from any wallet.</p>
        </details>
        <details class="faq">
          <summary>What counts as a payment effect?<span class="faq-x" aria-hidden="true">+</span></summary>
          <p>A supported USDC transfer on Base, decoded from the transaction logs. Approvals, contract calls, and other successful activity do not count. Execution success without a transfer effect is reported exactly as that.</p>
        </details>
        <details class="faq">
          <summary>Who runs this?<span class="faq-x" aria-hidden="true">+</span></summary>
          <p>An independent Telegraph Miner, ID 9005, operated by MystiqueMide. The source code, request rules, and public ledger are all inspectable from the links in the footer.</p>
        </details>
      </div>
    </div>
  </section>

  <section class="cta" aria-label="Start a verification">
    <img class="cta-bg" src="/assets/img/cta-waves.jpg" alt="" aria-hidden="true" width="1600" height="900">
    <div class="cta-shade" aria-hidden="true"></div>
    <div class="cta-inner">
      <h2>Check the effect before the action.</h2>
      <p>Open the verifier, connect a Base Sepolia wallet, and see what one transaction actually did.</p>
      <a class="btn btn-primary" href="/app">Start a verification</a>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="shell">
    <div class="footer-grid">
      <div>
        <div class="footer-brand"><span class="brand-mark" aria-hidden="true">V</span>Veyctum Proof</div>
        <p class="footer-tagline">Payment effect verification for autonomous workflows, powered by Telegraph Miner 9005.</p>
      </div>
      <div>
        <h4>Product</h4>
        <ul>
          <li><a href="/app">Verifier</a></li>
          <li><a href="/#how">How it works</a></li>
          <li><a href="/#faq">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h4>Public</h4>
        <ul>
          <li><a href="https://veyctum.splitpot.xyz" target="_blank" rel="noreferrer">Live Miner</a></li>
          <li><a href="/track3/status">Status JSON</a></li>
          <li><a href="/track3/ledger.jsonl">Request ledger</a></li>
          <li><a href="https://github.com/mystiquemide/veyctum" target="_blank" rel="noreferrer">Source</a></li>
          <li><a href="https://github.com/mystiquemide/veyctum/blob/main/evidence/track3/RULES.md" target="_blank" rel="noreferrer">Request rules</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Veyctum · Verification layer, not an escrow contract.</span>
      <a href="https://unsplash.com" target="_blank" rel="noreferrer">Photography from Unsplash</a>
    </div>
  </div>
</footer>
<script>
(function(){
var t=document.getElementById('navToggle'),l=document.getElementById('navLinks');
if(t&&l){t.addEventListener('click',function(){var o=l.classList.toggle('open');t.setAttribute('aria-expanded',o?'true':'false')})}
var dot=document.getElementById('statusDot'),label=document.getElementById('statusLabel');
fetch('/track3/status').then(function(r){if(!r.ok)throw new Error('status');return r.json()}).then(function(s){
if(s.mode==='live'){dot.classList.add('live')}else{dot.classList.add('off')}
if(s.miner_id!=null){label.textContent='Telegraph Miner '+s.miner_id}
}).catch(function(){});
})();
</script>
</body>
</html>`;
