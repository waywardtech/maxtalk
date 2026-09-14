(function (root) {
  'use strict';
  var intents = ['HELLO','COME HERE','I LOVE YOU','DINNER','WANT TO PLAY','GOOD CAT','NO/STOP','BEDTIME','WHERE ARE YOU?','WHAT ARE YOU DOING?'];
  var patterns = [[0,1],[3,0],[2,1,2],[0,0,1],[1,1,0],[2,1],[4],[2,3],[3,3],[1,0]];
  function response(kind, hour, repeated, routine) {
    routine = routine || {breakfast:7,dinner:18,bedtime:21};
    if (kind === 'OTHER') return 'Max missed that. Try a closer, clearer sound!';
    if (kind === 'HISS') return 'A little space, please. Max needs a break.';
    if (kind === 'PURR') return 'You may continue the cuddles. I approve.';
    if (repeated) return 'Perhaps you did not hear me the first time. Me. Now. Please.';
    if ((hour-routine.breakfast+24)%24 < 2) return 'Excuse me. Breakfast? My bowl is looking terribly lonely.';
    if ((hour-routine.dinner+24)%24 < 2) return 'Dinner o’clock! I have checked the bowl three times.';
    if ((hour-routine.bedtime+24)%24 < 2) return 'Come curl up with me. The moon is on night duty.';
    return ['Hello, human. I have important cat business.','A little attention over here, please!','I have inspected the room. It needs more cat.'][Math.floor(Math.random()*3)];
  }
  function features(wave, spectrum, rate) {
    var power=0, crossings=0, bands=new Array(16).fill(0), total=0, low=0, high=0, peak=0;
    for(var i=0;i<wave.length;i++){power+=wave[i]*wave[i]; if(i && (wave[i]>=0)!==(wave[i-1]>=0)) crossings++;}
    for(var j=1;j<spectrum.length;j++) {var hz=j*rate/(spectrum.length*2); if(hz>8000) break; var p=Math.pow(10,spectrum[j]/10); if(!isFinite(p)) p=0; total+=p; if(hz<300) low+=p; if(hz>2500) high+=p; peak=Math.max(peak,p); var b=Math.min(15,Math.floor(16*Math.log(1+hz/100)/Math.log(81))); bands[b]+=p;}
    var norm=Math.sqrt(bands.reduce(function(a,b){return a+b*b;},0))||1;
    return {rms:Math.sqrt(power/wave.length),zcr:crossings/wave.length,low:low/(total||1),high:high/(total||1),tonal:peak/(total||1),vector:bands.map(function(v){return v/norm;})};
  }
  function classify(f, threshold) {if(f.rms<(threshold||0.018)) return 'OTHER'; if(f.high>0.52 && f.zcr>0.12) return 'HISS'; if(f.low>0.65) return 'PURR'; if(f.tonal>0.10 && f.low<0.65 && f.high<0.52) return 'MEOW'; return 'OTHER';}
  function similarity(a,b){return a.reduce(function(s,v,i){return s+v*b[i];},0);}
  function match(vector, templates){var ranked=Object.keys(templates).map(function(k){return {id:k,score:similarity(vector,templates[k])};}).sort(function(a,b){return b.score-a.score;}); return ranked.length && ranked[0].score>0.94 && (ranked.length===1 || ranked[0].score-ranked[1].score>0.035) ? ranked[0].id : null;}
  function synth(intent, rate, random) {
    random=random||Math.random; var pat=patterns[Math.max(0,intents.indexOf(intent))], samples=[];
    pat.forEach(function(type){var duration=type===2?0.8:0.25+random()*0.25, phase=0, base=type===3?220:480+random()*180;
      for(var i=0;i<rate*duration;i++){var t=i/rate,u=t/duration; phase+=2*Math.PI*base*(1+0.3*Math.sin(u*Math.PI*1.5))/rate;
        var sound=type===4?(random()*2-1):type===2?Math.sin(2*Math.PI*95*t)*(0.5+0.5*Math.sin(2*Math.PI*26*t)):Math.sin(phase)+0.25*Math.sin(phase*2)+0.10*Math.sin(phase*3);
        samples.push(sound*0.22*Math.pow(Math.sin(Math.PI*u),0.7));}
      for(var j=0;j<rate*(0.09+random()*0.12);j++)samples.push(0);
    }); return new Float32Array(samples);
  }
  function doubleClap(pulses){return pulses.length===2 && pulses.every(function(p){return p.end-p.start<=200;}) && pulses[1].start-pulses[0].end>=100 && pulses[1].start-pulses[0].end<=650;}
  var api={intents:intents,response:response,features:features,classify:classify,match:match,synth:synth,doubleClap:doubleClap};
  if(typeof module!=='undefined')module.exports=api; else root.CatTalk=api;
}(this));
