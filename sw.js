// Zombie Wasteland – Offline-Cache
const V='zw-v59-15';
const CORE=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png','icon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  // Google-Anmeldung & Cloud nie zwischenspeichern
  if(u.origin!==location.origin&&!u.hostname.endsWith('gstatic.com'))return;
  // Spiel selbst: erst Netz (für Updates), sonst Cache
  if(u.origin===location.origin&&(r.mode==='navigate'||u.pathname.endsWith('.html'))){
    // schneller Start: Netz bekommt 2,5 s – sonst sofort die gespeicherte Version (Update kommt beim nächsten Start)
    const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res});
    const cached=()=>caches.match(r).then(m=>m||caches.match('index.html'));
    e.respondWith(new Promise(res=>{let done=false;const to=setTimeout(()=>cached().then(m=>{if(m&&!done){done=true;res(m)}}),2500);
      net.then(x=>{if(!done){done=true;clearTimeout(to);res(x)}}).catch(()=>cached().then(m=>{if(!done){done=true;clearTimeout(to);res(m||Response.error())}}))}));return}
  // Rest (Icons, Schrift): erst Cache, dann Netz und merken
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res})));
});
