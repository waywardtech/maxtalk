var CACHE='cattalk-v03-2';
var ASSETS=['./','./index.html','./style.css','./core.js','./app.js','./offline.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k.indexOf('cattalk-')===0 && k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request).then(function(cached){return cached||fetch(e.request);}));});
self.addEventListener('message',function(e){
  if(e.data&&e.data.type==='ACTIVATE_UPDATE'){self.skipWaiting();return;}
  if(!e.data||e.data.type!=='CHECK_OFFLINE'||!e.ports[0])return;
  e.waitUntil(caches.open(CACHE).then(function(c){return Promise.all(ASSETS.map(function(path){return c.match(path);}));}).then(function(items){e.ports[0].postMessage({ready:items.every(function(item){return !!item;})});}));
});
