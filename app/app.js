(function(){
'use strict';
var $=function(id){return document.getElementById(id);},C=window.CatTalk;
var names={MEOW:'Meow',PURR:'Purr',HISS:'Hiss',clap:'Double clap',mac:'Mac startup',on:'Speaker on',off:'Speaker off',OTHER:'Unrecognized sound'};
var defaults={mac:'A new adventure!',on:'Music!',off:'The music went away.',clap:'Max is awake!',OTHER:'What was that?'};
var ctx,stream,input,analyser,timer,playback,lipFrame,speechTimer,tailTimer,run=0,active=false,busy=false,pending=null,lastMeow=0,lastEvents={},speechStarted=0;
var templates={},rules={},routine={breakfast:7,dinner:18,bedtime:21};
try{var saved=JSON.parse(localStorage.getItem('maxtalk-v03')||localStorage.getItem('cattalk-v02')||'null');if(saved){
Object.keys(saved.templates||{}).forEach(function(k){var v=saved.templates[k];if(['mac','on','off'].indexOf(k)>=0&&Array.isArray(v)&&v.length===16&&v.every(function(x){return typeof x==='number'&&isFinite(x);}))templates[k]=v;});
Object.keys(saved.rules||{}).forEach(function(k){var r=saved.rules[k];if(names[k]&&r&&['ignore','translate','cat','text','voice'].indexOf(r.action)>=0)rules[k]={action:r.action,intent:C.intents.indexOf(r.intent)>=0?r.intent:'HELLO',text:typeof r.text==='string'?r.text.slice(0,160):'Hello, Max!'};});
Object.keys(routine).forEach(function(k){var v=(saved.routine||{})[k];if(Number.isInteger(v)&&v>=0&&v<24)routine[k]=v;});
}}catch(e){}
Object.keys(routine).forEach(function(k){$(k).value=routine[k];});
['intent','reply-intent'].forEach(function(id){C.intents.forEach(function(t){var o=document.createElement('option');o.textContent=t;$(id).appendChild(o);});});
function status(t){$('status').textContent=t;}
function mouth(level){$('mouth-open').setAttribute('visibility',level>0.015?'visible':'hidden');$('mouth-closed').setAttribute('visibility',level>0.015?'hidden':'visible');$('mouth-open').setAttribute('height',level>0.09?'8':'4');}
function ui(){ $('mode').textContent=pending?'● CHOOSE':busy?'● BUSY':active?'● LISTENING':'● STANDBY';$('listen').disabled=active||busy||!!pending;['speak','read','train'].forEach(function(id){$(id).disabled=busy||!!pending;});Array.prototype.forEach.call($('demo').children,function(b){b.disabled=busy||!!pending;});}
function persist(){try{localStorage.setItem('maxtalk-v03',JSON.stringify({templates:templates,rules:rules,routine:routine}));return true;}catch(e){$('detail').textContent='Storage unavailable. Choices last only this session.';return false;}}
function renderRules(){ $('trained').textContent=Object.keys(templates).length+' / 3 familiar sounds taught.';$('rules').textContent='';
Object.keys(names).forEach(function(k){var row=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button');row.className='rule-row';label.textContent=names[k]+' / '+(rules[k]?rules[k].action:'ask first time');button.textContent='EDIT';button.onclick=function(){if(busy||pending)return;ask(k,true);};row.appendChild(label);row.appendChild(button);$('rules').appendChild(row);});}
function release(){clearInterval(timer);timer=null;if(input){input.disconnect();input=null;}if(stream){stream.getTracks().forEach(function(t){t.onended=null;t.stop();});stream=null;}$('level').value=0;}
function cancelAudio(){if(playback){playback.onended=null;try{playback.stop();}catch(e){}playback=null;}clearTimeout(speechTimer);clearTimeout(tailTimer);cancelAnimationFrame(lipFrame);mouth(0);if(window.speechSynthesis)window.speechSynthesis.cancel();}
function stop(){run++;active=false;busy=false;release();cancelAudio();pending=null;$('decision').hidden=true;status('PAUSED / PRESS START');ui();}
function fail(e,token){if(token!==run)return;stop();status('AUDIO NEEDS ATTENTION');$('detail').textContent=e.name==='NotAllowedError'?'Allow the microphone for this site, then press START.':e.message||'Audio interrupted. Press START to reconnect.';}
function audio(){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('Audio is unavailable in this browser.');if(!ctx||ctx.state==='closed')ctx=new AC();return ctx.resume();}
function finish(token){if(token!==run)return;cancelAnimationFrame(lipFrame);mouth(0);clearTimeout(speechTimer);tailTimer=setTimeout(function(){if(token!==run)return;busy=false;ui();if(active)capture(token);else status('MAX IS READY');},500);}
function catVoice(intent,token){try{audio().then(function(){if(token!==run)return;var data=C.synth(intent,ctx.sampleRate),buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.getChannelData(0).set(data);playback=ctx.createBufferSource();playback.buffer=buffer;var out=ctx.createAnalyser();out.fftSize=256;playback.connect(out);out.connect(ctx.destination);var wave=new Float32Array(256);
function animate(){if(token!==run)return;out.getFloatTimeDomainData(wave);var p=0;for(var i=0;i<wave.length;i++)p+=wave[i]*wave[i];mouth(Math.sqrt(p/wave.length));lipFrame=requestAnimationFrame(animate);}
playback.onended=function(){playback=null;out.disconnect();finish(token);};playback.start();animate();status('MAX IS SPEAKING');}).catch(function(e){fail(e,token);});}catch(e){fail(e,token);}}
function english(text,token){var voices=window.speechSynthesis?window.speechSynthesis.getVoices().filter(function(v){return v.localService&&v.lang.indexOf('en')===0;}):[];
if(!voices.length){$('detail').textContent='No local English voice is ready. Max’s message is on screen.';finish(token);return;}
var utterance=new SpeechSynthesisUtterance(text),ended=false;utterance.voice=voices[0];utterance.rate=0.9;
function done(){if(ended||token!==run)return;ended=true;finish(token);}
utterance.onstart=function(){speechStarted=Date.now();status('MAX IS SPEAKING');function animate(){if(token!==run||ended)return;mouth(Math.sin((Date.now()-speechStarted)/65)>0?0.10:0);lipFrame=requestAnimationFrame(animate);}animate();};
utterance.onboundary=function(){speechStarted=Date.now();};utterance.onend=done;utterance.onerror=function(){if(token===run)$('detail').textContent='Voice unavailable. Max’s message is on screen.';done();};
speechTimer=setTimeout(function(){if(token!==run)return;window.speechSynthesis.cancel();$('detail').textContent='Read-aloud ended. Max’s message is on screen.';done();},25000);
window.speechSynthesis.speak(utterance);}
function contextual(k){var now=Date.now(),repeat=k==='MEOW'&&now-lastMeow<20000;if(k==='MEOW')lastMeow=now;return defaults[k]||C.response(k,new Date().getHours(),repeat,routine).replace(/whiskers/gi,'Max').replace(/whisker duty/g,'night duty');}
function perform(k,rule){release();busy=true;ui();var token=run;
if(rule.action==='ignore'){busy=false;ui();if(active)capture(token);else status('SOUND IGNORED');return;}
var text=rule.action==='translate'?contextual(k):rule.action==='cat'?rule.intent:rule.text;
$('result').textContent=text;$('detail').textContent=names[k]+' / remembered response';
if(rule.action==='cat')catVoice(rule.intent,token);else if(rule.action==='text')finish(token);else english(text,token);}
function ask(k,editing){run++;release();pending={id:k,editing:!!editing};$('decision').hidden=false;$('decision-description').textContent=(editing?'Change the response to: ':'I think I heard: ')+names[k]+'.';$('choice').value='';$('response-options').hidden=true;$('action').value=(k==='MEOW'||k==='PURR'||k==='HISS')?'translate':'cat';$('reply-text').value=defaults[k]||'Hello, Max!';status('NEW SOUND / YOUR CHOICE');ui();$('decision').scrollIntoView({block:'center'});$('choice').focus();}
function detected(k,simulated){if(!names[k])return;var now=Date.now();if(!simulated&&now-(lastEvents[k]||0)<4000)return;lastEvents[k]=now;$('heard').textContent=names[k].toUpperCase();if(!rules[k])ask(k,false);else if(rules[k].action!=='ignore')perform(k,rules[k]);else status('IGNORED / '+names[k].toUpperCase());}
function average(frames){var v=new Array(16).fill(0);frames.forEach(function(f){f.forEach(function(n,i){v[i]+=n;});});var n=Math.sqrt(v.reduce(function(s,x){return s+x*x;},0))||1;return v.map(function(x){return x/n;});}
function identify(frames,votes,pulses){if(C.doubleClap(pulses))return 'clap';var hit=C.match(average(frames),templates);if(hit)return hit;var keys=Object.keys(votes).sort(function(a,b){return votes[b]-votes[a];});return keys.length&&votes[keys[0]]/frames.length>.55?keys[0]:'OTHER';}
function capture(token,training){if(token!==run)return;
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){fail(new Error('Microphone unavailable. Use the HTTPS address in Safari.'),token);return;}
status('CONNECTING MICROPHONE');
navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:false,autoGainControl:false},video:false}).then(function(s){if(token!==run){s.getTracks().forEach(function(t){t.stop();});return;}stream=s;s.getTracks().forEach(function(t){t.onended=function(){fail(new Error('Microphone disconnected. Press START.'),token);};});
return ctx.resume().then(function(){if(token!==run)return;input=ctx.createMediaStreamSource(s);analyser=ctx.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=0;input.connect(analyser);var wave=new Float32Array(2048),spec=new Float32Array(1024),frames=[],votes={},pulses=[],pulse=null,first=0,last=0,start=Date.now();
status(training?'PLAY THE SOUND NOW / 3 SECONDS':'LISTENING FOR MAX + THE ROOM');ui();
timer=setInterval(function(){if(token!==run)return;if(ctx.state!=='running'){fail(new Error('Audio paused by the device. Press START again.'),token);return;}
analyser.getFloatTimeDomainData(wave);analyser.getFloatFrequencyData(spec);var now=Date.now(),f=C.features(wave,spec,ctx.sampleRate),loud=f.rms>Number($('sensitivity').value);$('level').value=f.rms;
if(loud){if(!first)first=now;last=now;frames.push(f.vector);var kind=C.classify(f,Number($('sensitivity').value));votes[kind]=(votes[kind]||0)+1;if(!pulse){pulse={start:now,end:now};pulses.push(pulse);}pulse.end=now;}else pulse=null;
if(training){if(now-start>=3000){release();busy=false;if(frames.length>=4){templates[training]=average(frames);persist();renderRules();status('SOUND LEARNED');}else status('TOO QUIET / TRY AGAIN');ui();if(active)capture(token);}return;}
if(frames.length&&((!loud&&now-last>700)||now-first>=3000)){var event=frames.length>=2?identify(frames,votes,pulses):null;frames=[];votes={};pulses=[];pulse=null;first=0;if(event)detected(event,false);}
},50);});}).catch(function(e){fail(e,token);});}
$('listen').onclick=function(){if(active||busy||pending)return;active=true;var token=++run;ui();try{audio().then(function(){if(token===run)capture(token);}).catch(function(e){fail(e,token);});}catch(e){fail(e,token);}};
$('stop').onclick=stop;
function manual(isEnglish){if(busy||pending)return;release();busy=true;var token=++run;ui();if(isEnglish)english($('result').textContent,token);else{$('result').textContent=$('intent').value;$('detail').textContent='A little message for Max.';catVoice($('intent').value,token);}}
$('speak').onclick=function(){manual(false);};$('read').onclick=function(){manual(true);};
$('train').onclick=function(){if(busy||pending)return;release();busy=true;var token=++run;ui();try{audio().then(function(){if(token===run)capture(token,$('trigger').value);}).catch(function(e){fail(e,token);});}catch(e){fail(e,token);}};
function options(){ $('response-options').hidden=$('choice').value!=='respond';$('cat-choice').hidden=$('action').value!=='cat';$('text-choice').hidden=['text','voice'].indexOf($('action').value)<0;}
$('choice').onchange=options;$('action').onchange=options;
$('remember').onclick=function(){if(!pending)return;if(!$('choice').value){status('CHOOSE IGNORE OR A RESPONSE');return;}var action=$('choice').value==='ignore'?'ignore':$('action').value,text=$('reply-text').value.trim();if((action==='text'||action==='voice')&&!text){status('ENTER A MESSAGE');return;}var k=pending.id,editing=pending.editing;rules[k]={action:action,intent:$('reply-intent').value,text:text};persist();renderRules();pending=null;$('decision').hidden=true;ui();if(editing){if(active)capture(run);else status('RESPONSE SAVED');}else perform(k,rules[k]);};
$('save').onclick=function(){var next={};for(var k in routine){var v=Number($(k).value);if($(k).value===''||!Number.isInteger(v)||v<0||v>23){status('USE WHOLE HOURS / 0 TO 23');return;}next[k]=v;}routine=next;if(persist())status('ROUTINE SAVED');};
Object.keys(names).forEach(function(k){var b=document.createElement('button');b.textContent=names[k];b.onclick=function(){if(!busy&&!pending)detected(k,true);};$('demo').appendChild(b);});
document.addEventListener('visibilitychange',function(){if(document.hidden)stop();});window.addEventListener('pagehide',stop);
$('diagnostics').textContent='Microphone: '+(navigator.mediaDevices?'available':'unavailable')+' / secure page: '+(window.isSecureContext?'yes':'no')+'. Unrecognized sounds share one response rule. Recognition needs real-room calibration.';
renderRules();ui();
}());
