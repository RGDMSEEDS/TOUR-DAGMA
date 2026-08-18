/* Tour DAGMA — service worker (reabrir offline) */
var CACHE = "tour-dagma-v1";
var SHELL = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch(err){ return; }
  if(url.origin !== self.location.origin) return; /* fontes externas: deixa passar */
  e.respondWith(
    caches.match(req, {ignoreSearch:true}).then(function(cached){
      var net = fetch(req).then(function(res){
        if(res && res.status === 200){
          var cl = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, cl); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || net;
    })
  );
});
