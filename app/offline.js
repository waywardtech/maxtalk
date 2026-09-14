(function () {
  'use strict';
  var badge=document.getElementById('offline');
  var retry=document.createElement('button');
  retry.textContent='Retry offline setup';retry.hidden=true;retry.type='button';badge.parentNode.appendChild(retry);
  function checkSavedCopy(){
    return navigator.serviceWorker.getRegistration('./').then(function(reg){
      if(!reg||!reg.active)return false;
      return new Promise(function(resolve){
        var channel=new MessageChannel(),timeout=setTimeout(function(){channel.port1.close();resolve(false);},3000);
        channel.port1.onmessage=function(e){clearTimeout(timeout);channel.port1.close();resolve(e.data&&e.data.ready===true);};
        reg.active.postMessage({type:'CHECK_OFFLINE'},[channel.port2]);
      });
    });
  }
  function setup(){
    retry.hidden=true;badge.textContent='Checking offline readiness…';
    if(!('serviceWorker' in navigator)||!window.isSecureContext){badge.textContent='Offline installation needs HTTPS in Safari or another supported browser.';return;}
    var timeout;
    var install=navigator.serviceWorker.register('./sw.js').then(function(reg){
      if(reg.waiting)reg.waiting.postMessage({type:'ACTIVATE_UPDATE'});
      return navigator.serviceWorker.ready;
    }).then(checkSavedCopy);
    Promise.race([install,new Promise(function(resolve,reject){timeout=setTimeout(function(){reject(new Error('Setup timed out'));},15000);})]).then(function(ready){
      clearTimeout(timeout);if(!ready)throw new Error('Offline copy is incomplete');badge.textContent='Ready offline';
    }).catch(function(){
      clearTimeout(timeout);
      checkSavedCopy().then(function(ready){badge.textContent=ready?'Ready offline · update when connected':'Offline copy unavailable. Connect to the hosted app and retry.';retry.hidden=ready;}).catch(function(){badge.textContent='Offline storage unavailable in this browser. Try Safari.';retry.hidden=false;});
    });
  }
  retry.onclick=setup;window.addEventListener('online',setup);setup();
}());
