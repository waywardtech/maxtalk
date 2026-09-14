const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
function harness(){
 let now=10000,next=1,loud=false,requests=0,stopped=0,defer=null;const tasks=new Map(),elements={},storage={};
 function element(){return {value:'',textContent:'',hidden:false,disabled:false,children:[],appendChild(c){this.children.push(c);},setAttribute(){},scrollIntoView(){},focus(){}};}
 const document={getElementById(id){return elements[id]||(elements[id]=element());},createElement:element,addEventListener(){}};
 ['breakfast','dinner','bedtime','sensitivity','intent','reply-intent','action','choice','reply-text'].forEach(id=>document.getElementById(id));elements.sensitivity.value='.02';elements.intent.value='HELLO';elements['reply-intent'].value='HELLO';
 function timer(fn,delay,repeat){const id=next++;tasks.set(id,{fn,at:now+delay,delay,repeat});return id;}
 const track=()=>({onended:null,stop(){stopped++;}});
 const ctx={state:'running',sampleRate:16000,resume:()=>Promise.resolve(),createMediaStreamSource:()=>({connect(){},disconnect(){}}),createAnalyser:()=>({connect(){},disconnect(){},getFloatTimeDomainData(){},getFloatFrequencyData(){}})};
 const C=Object.assign({},require('../app/core.js'),{features:()=>({rms:loud?.1:0,vector:new Array(16).fill(.25)}),classify:()=> 'MEOW'});
 const sandbox={document,CatTalk:C,AudioContext:function(){return ctx;},navigator:{mediaDevices:{getUserMedia(){requests++;const t=track();const s={getTracks:()=>[t]};return defer?new Promise(resolve=>{defer.resolve=()=>resolve(s);}):Promise.resolve(s);}}},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>{storage[k]=v;}},Date:{now:()=>now},setInterval:(f,d)=>timer(f,d,true),clearInterval:id=>tasks.delete(id),setTimeout:(f,d)=>timer(f,d,false),clearTimeout:id=>tasks.delete(id),requestAnimationFrame:()=>0,cancelAnimationFrame(){},addEventListener(){},isSecureContext:true};
 sandbox.window=sandbox;sandbox.Date=function(){return new Date(now);};sandbox.Date.now=()=>now;vm.runInNewContext(fs.readFileSync('app/app.js','utf8'),sandbox);
 async function flush(){for(let i=0;i<8;i++)await Promise.resolve();}
 async function advance(ms){for(let end=now+ms;now<end;now+=50){for(const [id,t] of Array.from(tasks)){if(t.at<=now){if(t.repeat)t.at=now+t.delay;else tasks.delete(id);t.fn();}}await flush();}}
 return {e:elements,storage,flush,advance,loud(v){loud=v;},get requests(){return requests;},get stopped(){return stopped;},defer(){defer={};return defer;}};
}
(async()=>{
 const h=harness();h.e.listen.onclick();await h.flush();await h.advance(12000);assert.equal(h.requests,1,'Quiet listening remains connected beyond three seconds');
 h.loud(true);await h.advance(300);h.loud(false);await h.advance(900);assert.equal(h.e.decision.hidden,false);assert.ok(h.stopped>0,'Prompt releases microphone');
 h.e.choice.value='ignore';h.e.remember.onclick();await h.flush();assert.equal(h.e.decision.hidden,true);assert.equal(JSON.parse(h.storage['maxtalk-v03']).rules.MEOW.action,'ignore');
 await h.advance(4500);h.loud(true);await h.advance(300);h.loud(false);await h.advance(900);assert.equal(h.e.decision.hidden,true,'Ignored sound does not ask again');assert.equal(h.e.listen.disabled,true,'Active mode continues');h.e.stop.onclick();assert.equal(h.e.listen.disabled,false);
 const race=harness(),deferred=race.defer();race.e.listen.onclick();await race.flush();race.e.stop.onclick();deferred.resolve();await race.flush();assert.equal(race.stopped,1,'Late permission stream is stopped');assert.equal(race.e.listen.disabled,false);
 console.log('PASS: continuous listening, first detection prompt, saved ignore, listening resume, Stop and late-permission cancellation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
