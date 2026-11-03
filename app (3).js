'use strict';
const $ = id => document.getElementById(id);
let mode='demo', provider=null, address=null, result=null, revealed=false, revision=0, busy=false;
const chainNames={'0x1':'Ethereum mainnet','0xaa36a7':'Sepolia testnet'};
function parseEth(value){
 const v=value.trim();
 if(!/^(0|[1-9]\d{0,59})(\.\d{1,18})?$/.test(v)) throw new Error('Enter a non-negative ETH amount with up to 18 decimals. No commas or exponents.');
 const [whole,frac='']=v.split('.'); const n=BigInt(whole)*10n**18n+BigInt(frac.padEnd(18,'0'));
 if(n>2n**256n-1n) throw new Error('Amount exceeds the supported range.');
 return n;
}
function formatEth(n){const s=n.toString().padStart(19,'0');return s.slice(0,-18)+(s.slice(-18).replace(/0+$/,'')?'.'+s.slice(-18).replace(/0+$/,''):'');}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),3200);}
function controls(){ $('check').disabled=busy; $('check').textContent=busy?'Checking snapshot…':mode==='demo'?'Run demo check ↗':'Check wallet balance ↗';$('connect').disabled=busy; }
function invalidate(){revision++;result=null;revealed=false;$('error').textContent='';$('resultIcon').textContent='≈';$('resultIcon').classList.remove('fail');$('resultKicker').textContent='READY WHEN YOU ARE';$('resultTitle').textContent='A little less oversharing.';$('resultDescription').textContent='Choose a threshold and run a check. Your result will appear here.';['requirement','block','checkedAt'].forEach(id=>$(id).textContent='—');$('source').textContent='Not checked';$('balanceText').textContent='Not displayed';$('reveal').textContent='Show balance on this screen';['copy','download','reveal'].forEach(id=>$(id).disabled=true);$('resultFoot').textContent='A threshold check is not proof of ownership or a private cryptographic proof.';}
function setMode(next){invalidate();mode=next;$('demoFields').hidden=mode!=='demo';$('liveFields').hidden=mode!=='live';$('modeBadge').textContent=mode==='demo'?'DEMO':'LIVE · READ ONLY';['demo','live'].forEach(m=>{$(m+'Tab').classList.toggle('active',m===mode);$(m+'Tab').setAttribute('aria-pressed',String(m===mode));});controls();}
function updateWallet(){ $('walletLabel').textContent=address?address.slice(0,6)+'…'+address.slice(-4):'No wallet connected';$('connect').textContent=address?'Disconnect':'Connect wallet'; }
function attachProvider(p){provider=p;if(p.on){p.on('accountsChanged',()=>{address=null;invalidate();updateWallet();});p.on('chainChanged',()=>{invalidate();});p.on('disconnect',()=>{address=null;invalidate();updateWallet();});}}
$('connect').addEventListener('click',async()=>{
 if(address){address=null;invalidate();updateWallet();return;}
 const token=++revision;
 try{
 $('error').textContent='';
 if(!window.ethereum)throw new Error('No browser wallet found. Try a normal browser tab with an Ethereum wallet extension. The embedded preview may not support wallets; demo mode works without one.');
 if(!provider)attachProvider(window.ethereum);
 const accounts=await provider.request({method:'eth_requestAccounts'});
 // Account-change events during connection can invalidate older snapshots; connection itself remains user initiated.
 if(mode!=='live')return;
 if(!accounts.length||!/^0x[0-9a-fA-F]{40}$/.test(accounts[0]))throw new Error('Your wallet did not return a valid account.');
 invalidate();address=accounts[0];updateWallet();
 }catch(e){$('error').textContent=e.code===4001?'Connection cancelled. No transaction or signature was requested.':e.message||'Could not connect wallet.';}
});
$('demoTab').onclick=()=>setMode('demo');$('liveTab').onclick=()=>setMode('live');
$('threshold').addEventListener('input',invalidate);$('scenario').addEventListener('change',invalidate);
document.querySelectorAll('[data-value]').forEach(b=>b.onclick=()=>{$('threshold').value=b.dataset.value;invalidate();});
$('check').onclick=async()=>{
 invalidate();const token=revision;const currentMode=mode;busy=true;controls();
 try{
 const thresholdWei=parseEth($('threshold').value);if(thresholdWei===0n)throw new Error('Choose a threshold greater than zero.');
 let balanceWei,chain='Demo · synthetic ETH',chainId=null,blockNumber=null,blockHash=null,blockTimestamp=null;
 if(currentMode==='demo'){balanceWei=parseEth($('scenario').value);await new Promise(r=>setTimeout(r,450));}
 else{
 if(!provider||!address)throw new Error('Connect your wallet first. No signature or transaction is needed.');
 const checkedAddress=address;
 chainId=await provider.request({method:'eth_chainId'});
 if(!chainNames[chainId])throw new Error('Switch your wallet to Ethereum mainnet or Sepolia, then try again. Other networks and ERC-20 tokens are not supported.');
 chain=chainNames[chainId];
 const accounts=await provider.request({method:'eth_accounts'});
 if(!accounts.some(a=>a.toLowerCase()===checkedAddress.toLowerCase()))throw new Error('Wallet access changed. Reconnect and try again.');
 const block=await provider.request({method:'eth_getBlockByNumber',params:['latest',false]});
 if(!block||!/^0x[\da-f]{64}$/i.test(block.hash)||!/^0x[\da-f]+$/i.test(block.number)||!/^0x[\da-f]+$/i.test(block.timestamp))throw new Error('The provider returned an invalid block.');
 const raw=await provider.request({method:'eth_getBalance',params:[checkedAddress,{blockHash:block.hash,requireCanonical:true}]});
 if(!/^0x[\da-f]+$/i.test(raw))throw new Error('The provider returned an invalid balance.');
 balanceWei=BigInt(raw);blockNumber=BigInt(block.number).toString();blockHash=block.hash;blockTimestamp=new Date(Number(BigInt(block.timestamp))*1000).toISOString();
 const finalChain=await provider.request({method:'eth_chainId'});
 if(finalChain!==chainId)throw new Error('Network changed during the check. Please try again.');
 }
 if(token!==revision||currentMode!==mode)return;
 result={mode:currentMode,thresholdEth:formatEth(thresholdWei),balanceWei,meetsRequirement:balanceWei>=thresholdWei,chain,chainId,blockNumber,blockHash,blockTimestamp,checkedAt:new Date().toISOString()};render();
 }catch(e){if(token===revision)$('error').textContent=(e.message||'Check failed.')+(currentMode==='live'?' No proof was generated. Your provider must support EIP-1898 block-hash queries.':'');}
 finally{busy=false;controls();}
};
function render(){const r=result;const pass=r.meetsRequirement;$('resultIcon').textContent=pass?'✓':'−';$('resultIcon').classList.toggle('fail',!pass);$('resultKicker').textContent=r.mode==='demo'?'SIMULATED RESULT':'RPC-REPORTED SNAPSHOT';$('resultTitle').textContent=pass?'Requirement met.':'Below the threshold.';$('resultDescription').textContent=(r.mode==='demo'?'The sample wallet':'The connected wallet')+(pass?' meets':' does not meet')+' your minimum balance requirement.';$('requirement').textContent='At least '+r.thresholdEth+' ETH';$('source').textContent=r.chain;$('block').textContent=r.blockNumber||'Synthetic · no onchain block';$('checkedAt').textContent=new Date(r.checkedAt).toLocaleString();$('balanceText').textContent='Omitted from summary';['copy','download','reveal'].forEach(id=>$(id).disabled=false);$('resultFoot').textContent=r.mode==='demo'?'Demo data only. This is not evidence of real funds.':'Unsigned RPC result. Not a cryptographic proof or ownership verification.';}
$('reveal').onclick=()=>{if(!result)return;revealed=!revealed;$('balanceText').textContent=revealed?formatEth(result.balanceWei)+' ETH':'Omitted from summary';$('reveal').textContent=revealed?'Hide exact balance':'Show balance on this screen';};
function report(){if(!result)throw new Error('Run a check first.');const r=result;return {schema:'balance-lab.summary.v1',evidenceType:r.mode==='demo'?'SIMULATED_NOT_A_PROOF':'UNSIGNED_RPC_SUMMARY_NOT_A_PROOF',asset:'native ETH',network:r.chain,chainId:r.chainId,requirement:{operator:'>=',amountEth:r.thresholdEth},meetsRequirement:r.meetsRequirement,blockNumber:r.blockNumber,blockHash:r.blockHash,blockTimestamp:r.blockTimestamp,checkedAt:r.checkedAt,excluded:['wallet address','exact balance','transaction history'],limitations:['Unsigned and editable; cannot independently verify this result.','No proof of ownership or zero-knowledge proof.','Snapshot only; balances can change and blocks can be reorganized.','Threshold and result disclose a bound on the balance.','Do not use for access, credit, rewards, or financial decisions.']};}
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(JSON.stringify(report(),null,2));toast('Unsigned summary copied.');}catch(e){toast('Clipboard unavailable. Use Download JSON instead.');}};
$('download').onclick=()=>{const blob=new Blob([JSON.stringify(report(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='balance-'+(result.mode==='demo'?'demo':'unsigned')+'-summary.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Summary downloaded. No address or exact balance included.');};
