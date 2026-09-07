// Veyctum Proof verifier workspace. Ported wallet/x402 flow with the paid
// retry corrected to the backend contract: POST {tx_hash} with the
// payment-signature header. The backend builds the Telegraph forward payload.

export const TRACK3_APP_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Use Veyctum Proof to inspect the observed effect of an EVM transaction through Telegraph.">
<meta name="theme-color" content="#0a1929">
<meta property="og:type" content="website">
<meta property="og:title" content="Veyctum Proof | Verify">
<meta property="og:description" content="Check what an EVM transaction actually did through Telegraph Miner 9005. One hash in, a verified payment effect out.">
<meta property="og:url" content="https://proof.midelabs.xyz/app">
<link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg">
<title>Veyctum Proof | Verify</title>
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
:focus-visible{outline:2px solid var(--sky);outline-offset:3px;border-radius:4px}
.shell{max-width:var(--max);margin:0 auto;padding:0 24px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:14px 24px;border-radius:var(--radius);border:1px solid transparent;font:600 15px/1 var(--sans);cursor:pointer;transition:background-color .2s ease,border-color .2s ease,color .2s ease}
.btn-primary{background:var(--action);color:#fff}
.btn-primary:hover{background:var(--action-hover)}
.btn-dark{background:transparent;border-color:var(--line);color:var(--text)}
.btn-dark:hover{border-color:var(--sky)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn-sm{padding:10px 16px;font-size:14px}
.nav{position:sticky;top:0;z-index:100;background:rgba(6,18,32,.97);border-bottom:1px solid var(--line-soft)}
.nav-inner{max-width:var(--max);margin:0 auto;padding:0 24px;height:var(--nav-h);display:flex;align-items:center;justify-content:space-between;gap:24px}
.brand{display:flex;align-items:center;gap:10px;font:700 16px/1 var(--sans);color:#fff}
.brand-mark{width:30px;height:30px;border-radius:var(--radius);background:var(--navy-deep);border:1px solid var(--sky);color:var(--sky);display:grid;place-items:center;font:800 15px/1 var(--sans)}
.nav-links{display:flex;align-items:center;gap:26px;font:500 14px/1 var(--sans);color:var(--muted)}
.nav-links a:hover{color:#fff}
.head{border-bottom:1px solid var(--line-soft);padding:84px 0 60px}
.pill{display:inline-flex;align-items:center;gap:9px;padding:9px 15px;border-radius:9999px;border:1px solid var(--line);background:rgba(0,117,255,.10);font:500 13px/1 var(--mono);color:var(--sky)}
.pill-dot{width:8px;height:8px;border-radius:50%;background:var(--muted)}
.pill-dot.live{background:var(--pass);animation:pulse 2.4s ease-in-out infinite}
.pill-dot.off{background:var(--warn)}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(32,223,102,.4)}50%{box-shadow:0 0 0 6px rgba(32,223,102,0)}}
@media(prefers-reduced-motion:reduce){.pill-dot.live{animation:none}}
.head h1{margin:26px 0 0;font:800 clamp(32px,4.6vw,54px)/1.08 var(--sans);letter-spacing:-.03em;color:#fff;max-width:820px}
.head h1 .accent{color:var(--sky)}
.head-sub{margin:22px 0 0;max-width:620px;font:400 17px/1.65 var(--sans);color:var(--muted)}
.head-facts{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
.hf{display:inline-flex;align-items:center;gap:9px;padding:10px 16px;border-radius:12px;border:1px solid var(--line-soft);background:var(--navy-deeper);font:500 13px/1.3 var(--mono);color:var(--text)}
.hf b{color:var(--sky);font-weight:500}
.workspace{padding:64px 0}
.workspace-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:24px;width:100%}
.side h2{margin:0;font:800 26px/1.15 var(--sans);letter-spacing:-.02em;color:#fff}
.side>p{margin:14px 0 0;font:400 15px/1.65 var(--sans);color:var(--muted)}
.side-list{margin-top:28px;border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--navy-deeper);padding:4px 22px}
.side-item{display:flex;align-items:flex-start;gap:12px;padding:16px 0;border-bottom:1px solid var(--line-soft)}
.side-item:last-child{border-bottom:0}
.dot{flex:none;width:10px;height:10px;border-radius:50%;margin-top:5px}
.dot-pass{background:var(--pass)}
.dot-sky{background:var(--sky)}
.side-item b{display:block;font:600 15px/1.4 var(--sans);color:#fff}
.side-item span{display:block;margin-top:3px;font:400 13px/1.5 var(--sans);color:var(--muted)}
.panel{border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--navy-panel);padding:30px;align-self:start}
.panel-top{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-bottom:18px;border-bottom:1px solid var(--line-soft)}
.panel-title{font:600 15px/1 var(--sans);color:#fff}
.mode{display:inline-flex;align-items:center;gap:8px;font:500 12px/1 var(--mono);color:var(--muted)}
.mode .pill-dot{width:8px;height:8px}
.label{display:block;margin:26px 0 10px;font:500 12px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.input{width:100%;background:var(--navy-deeper);border:1px solid var(--line);border-radius:var(--radius);color:var(--text);padding:16px;font:400 15px/1.4 var(--mono)}
.input::placeholder{color:rgba(167,186,190,.55)}
.input:focus{border-color:var(--sky);outline:2px solid var(--sky);outline-offset:2px}
.wallet-row{display:flex;align-items:center;flex-wrap:wrap;gap:14px;margin-top:18px}
.wallet-status{font:400 13px/1.5 var(--mono);color:var(--muted)}
.verify-btn{width:100%;margin-top:24px}
.disclosure{margin:18px 0 0;font:400 13px/1.6 var(--sans);color:var(--muted)}
.disclosure b{color:var(--text);font-weight:600}
.status{margin:20px 0 0;min-height:20px;font:400 13px/1.55 var(--mono);color:var(--muted)}
.status.error{color:var(--fail)}
.status.success{color:var(--pass)}
.result{display:none;margin-top:28px;padding-top:26px;border-top:1px solid var(--line-soft)}
.result.show{display:block}
.result-head{display:flex;justify-content:space-between;align-items:center;gap:16px}
.result-kicker{font:500 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.result-state{font:700 16px/1.2 var(--mono)}
.result-state.ok{color:var(--pass)}
.result-state.bad{color:var(--fail)}
.result-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line-soft);border:1px solid var(--line-soft);border-radius:var(--radius);overflow:hidden;margin-top:20px}
.rcell{background:var(--navy-deeper);padding:16px 18px}
.rcell b{display:block;font:500 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.rcell code{display:block;margin-top:9px;font:400 12.5px/1.5 var(--mono);color:var(--text);word-break:break-all}
.result-note{margin:18px 0 0;font:400 13px/1.6 var(--sans);color:var(--muted)}
.footnote{border-top:1px solid var(--line-soft);padding:28px 0 44px;font:400 12px/1.7 var(--mono);color:var(--muted)}
.footnote a{color:var(--sky);text-decoration:underline;text-underline-offset:3px}
@media(max-width:900px){
.workspace{padding:48px 0}
.workspace-grid{grid-template-columns:1fr}
.head{padding:64px 0 48px}
.panel{padding:22px}
.result-grid{grid-template-columns:1fr}
}
@media(max-width:560px){
.nav-links{gap:18px;font-size:13px}
.head h1{font-size:34px}
}
</style>
</head>
<body>
<header class="nav">
  <div class="nav-inner">
    <a class="brand" href="/track3"><span class="brand-mark" aria-hidden="true">V</span>Veyctum Proof</a>
    <nav class="nav-links" aria-label="Verifier navigation">
      <a href="/track3">Overview</a>
      <a href="https://veyctum.splitpot.xyz" target="_blank" rel="noreferrer">Live Miner</a>
    </nav>
  </div>
</header>
<main>
  <section class="head">
    <div class="shell">
      <span class="pill"><span class="pill-dot" id="modeDot" aria-hidden="true"></span><span id="modeText">Checking service</span></span>
      <h1>Prove the effect before the <span class="accent">next action.</span></h1>
      <p class="head-sub">Inspect a transaction you already have. Veyctum Proof does not custody or move those funds. It asks Telegraph Miner 9005 for an observed result you can inspect.</p>
      <div class="head-facts">
        <span class="hf">NETWORK <b>Base Sepolia</b></span>
        <span class="hf">LOOKUP COST <b>$0.01 USDC</b></span>
        <span class="hf">RESULT <b>Effect plus signal</b></span>
      </div>
    </div>
  </section>
  <section class="workspace">
    <div class="shell workspace-grid">
      <aside class="side">
        <h2>What you receive</h2>
        <p>A plain-language answer backed by the facts that matter to a downstream decision.</p>
        <div class="side-list">
          <div class="side-item"><span class="dot dot-pass" aria-hidden="true"></span><div><b>Transaction state</b><span>Success or failure, fails closed on disagreement</span></div></div>
          <div class="side-item"><span class="dot dot-sky" aria-hidden="true"></span><div><b>Called method</b><span>Decoded selector and name</span></div></div>
          <div class="side-item"><span class="dot dot-pass" aria-hidden="true"></span><div><b>Payment effect</b><span>Supported Base USDC transfers</span></div></div>
          <div class="side-item"><span class="dot dot-sky" aria-hidden="true"></span><div><b>Telegraph signal</b><span>Independent verifiable receipt</span></div></div>
        </div>
      </aside>
      <div class="panel">
        <div class="panel-top">
          <span class="panel-title">Start a verification</span>
          <span class="mode" id="mode"><span class="pill-dot" aria-hidden="true"></span><span>Checking service</span></span>
        </div>
        <label class="label" for="tx">EVM transaction hash</label>
        <input class="input" id="tx" autocomplete="off" spellcheck="false" inputmode="text" placeholder="0x followed by 64 hexadecimal characters">
        <div class="wallet-row">
          <button class="btn btn-dark btn-sm" id="connect" type="button">Connect wallet</button>
          <span class="wallet-status" id="walletStatus">Base Sepolia wallet not connected</span>
        </div>
        <button class="btn btn-primary verify-btn" id="verify" type="button" disabled>Verify with Telegraph</button>
        <p class="disclosure"><b>Read-only check.</b> The referenced transaction is not changed. Your wallet signs one $0.01 USDC request on Base Sepolia to query Telegraph.</p>
        <p class="status" id="status" role="status" aria-live="polite">Enter a transaction hash to begin.</p>
        <div class="result" id="result">
          <div class="result-head">
            <span class="result-kicker">Observed result</span>
            <span class="result-state" id="resultState"></span>
          </div>
          <div class="result-grid">
            <div class="rcell"><b>Chain</b><code id="resultChain"></code></div>
            <div class="rcell"><b>Method</b><code id="resultMethod"></code></div>
            <div class="rcell"><b>Payment effect</b><code id="resultEffect"></code></div>
            <div class="rcell"><b>Telegraph signal</b><code id="resultSignal"></code></div>
          </div>
          <p class="result-note" id="resultNote"></p>
        </div>
      </div>
    </div>
  </section>
</main>
<footer class="footnote">
  <div class="shell">Veyctum Proof is a verification layer, not an escrow contract. <a href="https://github.com/mystiquemide/veyctum/blob/main/evidence/track3/RULES.md" target="_blank" rel="noreferrer">Read the request rules</a>.</div>
</footer>
<script>
(function(){
var ENGINE='/track3/engine';function $(id){return document.getElementById(id)}
var account=null;
function short(v){return v?v.slice(0,10)+'...'+v.slice(-8):'not returned'}
function b64json(v){if(!v)return null;try{var s=v.replaceAll('-','+').replaceAll('_','/');return JSON.parse(atob(s+'='.repeat((4-s.length%4)%4)))}catch(e){return null}}
function b64(v){return btoa(unescape(encodeURIComponent(v)))}
function setStatus(message,kind){var el=$('status');el.textContent=message;el.className='status '+(kind||'')}
function setWalletState(){if(account){$('walletStatus').textContent='Connected '+short(account);$('connect').textContent='Wallet connected';$('verify').disabled=false}else{$('walletStatus').textContent='Base Sepolia wallet not connected';$('connect').textContent='Connect wallet';$('verify').disabled=true}}
function friendlyError(data,fallback){var code=data&&data.error;switch(code){case 'EXCLUDED_PAYER':return 'This wallet is the operator wallet and is excluded from reporting.';case 'EXCLUDED_SESSION':return 'This session is excluded from reporting.';case 'TRACK3_DUPLICATE':return 'This session already verified that transaction. Each one counts once.';case 'TRACK3_COOLDOWN':return 'That was fast. Wait a moment, then try again.';case 'RATE_LIMITED':return 'Too many requests. Wait a second and try again.';case 'TRACK3_NOT_OPEN':return 'Verification is unavailable right now. Please try again later.';case 'INVALID_INPUT':return 'Enter a complete 32-byte transaction hash.';default:return fallback}}
async function ensureNetwork(){if(!window.ethereum){setStatus('Connect an EVM wallet to continue.','error');return false}var chain=await window.ethereum.request({method:'eth_chainId'});if(String(chain).toLowerCase()!=='0x14a34'){setStatus('Switch your wallet to Base Sepolia to continue.','error');return false}return true}
async function connect(){if(!window.ethereum){setStatus('Connect an EVM wallet to continue.','error');return}try{var accounts=await window.ethereum.request({method:'eth_requestAccounts'});account=accounts[0]||null;setWalletState();if(account&&!await ensureNetwork())return;if(account)setStatus('Wallet ready. Enter a transaction hash to continue.')}catch(e){setStatus('Wallet connection was cancelled. Nothing was charged.','error')}}
function showResult(data){var result=(data&&data.result)||data||{};var state=result.state||result.status||'RETURNED';var el=$('resultState');el.textContent=state;el.className='result-state '+(state==='OK'?'ok':state==='NO_SUPPORTED_TRANSFER'?'bad':'');$('resultChain').textContent=(result.chain||'unknown')+' / chain '+(result.chain_id!=null?result.chain_id:'unknown');$('resultMethod').textContent=(result.method&&(result.method.name||result.method.selector))||'Not decoded';$('resultEffect').textContent=result.effects&&result.effects.length?result.effects.map(function(x){return short(x.token)+' -> '+short(x.recipient)+' / '+x.raw_amount}).join('; '):'No supported transfer effect';$('resultSignal').textContent=short((data&&data.signal_hash)||(result&&result.signal_hash));$('resultNote').textContent=result.summary||result.answer||'Telegraph returned an observed transaction result.';$('result').classList.add('show')}
async function verify(){var tx=$('tx').value.trim();if(!/^0x[0-9a-fA-F]{64}$/.test(tx)){setStatus('Enter a complete 32-byte transaction hash.','error');return}if(!account){await connect();if(!account)return}if(!await ensureNetwork())return;$('verify').disabled=true;$('result').classList.remove('show');setStatus('Preparing the Telegraph request...');
try{
var first=await fetch(ENGINE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tx_hash:tx})});
if(first.status!==402){var early=await first.json().catch(function(){return null});throw new Error(friendlyError(early,'The verification could not be started. Please try again.'))}
var challenge=b64json(first.headers.get('payment-required'));
var requirement=challenge&&challenge.accepts&&challenge.accepts.find(function(x){return x.network==='eip155:84532'});
if(!requirement)throw new Error('No Base Sepolia payment option was returned. Please try again.');
var now=Math.floor(Date.now()/1000);
var nonce='0x'+Array.from(crypto.getRandomValues(new Uint8Array(32))).map(function(x){return x.toString(16).padStart(2,'0')}).join('');
var authorization={from:account,to:requirement.payTo,value:requirement.amount,validAfter:String(now-5),validBefore:String(now+(requirement.maxTimeoutSeconds||60)),nonce:nonce};
setStatus('Sign the one-cent USDC authorization in your wallet...');
var typed={types:{EIP712Domain:[{name:'name',type:'string'},{name:'version',type:'string'},{name:'chainId',type:'uint256'},{name:'verifyingContract',type:'address'}],TransferWithAuthorization:[{name:'from',type:'address'},{name:'to',type:'address'},{name:'value',type:'uint256'},{name:'validAfter',type:'uint256'},{name:'validBefore',type:'uint256'},{name:'nonce',type:'bytes32'}]},primaryType:'TransferWithAuthorization',domain:{name:(requirement.extra&&requirement.extra.name)||'USDC',version:(requirement.extra&&requirement.extra.version)||'2',chainId:84532,verifyingContract:requirement.asset},message:authorization};
var signature=await window.ethereum.request({method:'eth_signTypedData_v4',params:[account,JSON.stringify(typed)]});
setStatus('Verifying the settled response...');
var payment={x402Version:2,resource:challenge.resource,accepted:requirement,payload:{signature:signature,authorization:authorization},extensions:{}};
var paid=await fetch(ENGINE,{method:'POST',headers:{'content-type':'application/json','payment-signature':b64(JSON.stringify(payment))},body:JSON.stringify({tx_hash:tx})});
var data=await paid.json().catch(function(){return null});
if(!paid.ok)throw new Error(friendlyError(data,'The payment could not be settled. Nothing extra was charged.'));
showResult(data);setStatus('Settled result received from Telegraph.','success')
}catch(e){var msg=String(e&&e.message||'').toLowerCase();if(msg.indexOf('reject')>=0||msg.indexOf('cancel')>=0||msg.indexOf('denied')>=0){setStatus('The request was cancelled. Nothing was charged.','error')}else{setStatus(String(e&&e.message||'The verification could not be completed. Check your wallet network and try again.'),'error')}}finally{setWalletState()}}
$('connect').addEventListener('click',connect);
$('verify').addEventListener('click',verify);
if(window.ethereum&&window.ethereum.on)window.ethereum.on('accountsChanged',function(accounts){account=accounts[0]||null;setWalletState()});
function setMode(mode,reason){var dot=$('modeDot'),text=$('modeText'),badge=$('mode');var inner=badge.querySelector('span:last-child');
if(mode==='live'){dot.classList.add('live');dot.classList.remove('off');text.textContent='Service live';inner.textContent='Telegraph Miner 9005'}
else{dot.classList.add('off');dot.classList.remove('live');text.textContent=reason==='after_window'?'Window closed':'Unavailable';inner.textContent=reason==='after_window'?'Window closed':'Unavailable';setStatus('Verification is unavailable right now. Please try again later.','error')}}
fetch('/track3/status').then(function(r){return r.json()}).then(function(s){setMode(s.mode,s.reason)}).catch(function(){setMode('error','error')});
})();
</script>
</body>
</html>`;
