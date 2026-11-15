/* Bus audio: Web Audio API engine loops + vehicle effects. */
(() => {
  'use strict';
  const PROFILES = {
    'q290-euro6': {
      base: 'Sound/Q290%20Euro6/',
      samples: [
        { file: '301idle.wav', ref: 592, points: [[0,0],[200,1],[592,1],[651,.7],[770,0]], throttle: .7 },
        { file: '301low.wav', ref: 770, points: [[192,1],[770,1],[1332,0]], throttle: .7 },
        { file: '301mid2.wav', ref: 1770, points: [[592,0],[651,.2],[770,.7],[1451,1],[3332,0]], throttle: .7 },
        { file: '301high2.wav', ref: 1800, points: [[1551,0],[1870,.7],[2451,1],[3332,1]], throttle: .7 },
        { file: '301high.wav', ref: 1800, points: [[551,0],[870,1],[1470,1.4],[1970,1],[3332,1]], throttle: .7 },
        { file: '301low2.wav', ref: 1332, points: [[770,0],[1051,.7],[1332,1],[1628,.7],[1924,0]], throttle: .6 }
      ]
    },
    'q290-euro4-5': {
      base: 'Sound/Euro4~5%20CNG%20Engine/',
      samples: [
        { file: 'GE11idle.22k.wav', ref: 600, points: [[0,0],[450,.35],[500,1],[525,.5],[770,0],[900,0]], throttle: .8 },
        { file: 'GE11mid.22k.wav', ref: 1200, points: [[150,0],[510,0],[600,1],[1000,1],[1700,1],[1900,1],[3000,0]], throttle: .35 },
        { file: 'GE11low.22k.wav', ref: 1600, points: [[700,0],[1200,1],[1900,2],[3000,0]], throttle: .7 },
        { file: 'GE11Vmid.22k.wav', ref: 2000, points: [[700,0],[1200,0],[1900,1],[3000,1]], throttle: .5 }
      ]
    }
  };
  const EFFECTS = {
    bell: 'Sound/stop.wav',
    frontOpen: 'Sound/D92_fdoor_opn.wav',
    frontClose: 'Sound/D92_fdoor_cls.wav',
    rearOpen: 'Sound/D92_bdoor_opn.wav',
    rearClose: 'Sound/D92_bdoor_cls.wav',
    retarderLoop: 'Sound/retarderfolyamat.wav',
    retarderOn: 'Sound/Retarder.wav',
    retarderOff: 'Sound/Retarder_aus.wav'
  };
  let ctx = null, master = null, active = [], profileId = null, ready = false, volume = .65, suspended = false;
  let effectBuffers = {}, retarderSource = null, retarderGain = null, retarderLevel = 0;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  function curve(points, x) {
    if (x <= points[0][0]) return points[0][1];
    for (let i=1;i<points.length;i++) if (x <= points[i][0]) {
      const [x0,y0]=points[i-1], [x1,y1]=points[i], t=(x-x0)/(x1-x0 || 1);
      return y0+(y1-y0)*t;
    }
    return points[points.length-1][1];
  }
  async function init() {
    if (ctx) { if (ctx.state === 'suspended') await ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('이 브라우저는 Web Audio API를 지원하지 않습니다.');
    ctx = new AC(); master = ctx.createGain(); master.gain.value = volume; master.connect(ctx.destination);
    await ctx.resume();
  }
  async function fetchBuffer(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error('음원 로드 실패: '+path+' ('+response.status+')');
    return ctx.decodeAudioData(await response.arrayBuffer());
  }
  async function loadEffects() {
    const entries = Object.entries(EFFECTS).filter(([key]) => !effectBuffers[key]);
    await Promise.all(entries.map(async ([key,path]) => { effectBuffers[key] = await fetchBuffer(path); }));
  }
  async function loadProfile(id) {
    if (!id || !PROFILES[id]) { stopEngine(); profileId=null; ready=false; return; }
    if (profileId === id && ready) return;
    await init(); stopEngine(); await loadEffects(); profileId=id;
    const profile=PROFILES[id];
    const loaded=await Promise.all(profile.samples.map(async s => {
      const buffer=await fetchBuffer(profile.base+encodeURIComponent(s.file));
      const source=ctx.createBufferSource(); source.buffer=buffer; source.loop=true;
      const gain=ctx.createGain(); gain.gain.value=0;
      source.connect(gain); gain.connect(master); source.start();
      return { ...s, source, gain };
    }));
    active=loaded; ready=true;
  }
  function stopEngine() {
    for (const s of active) { try { s.source.stop(); } catch (_) {} try { s.source.disconnect(); s.gain.disconnect(); } catch (_) {} }
    active=[]; ready=false;
  }
  function stopRetarder(fade=true) {
    if (!retarderSource) return;
    const now=ctx.currentTime;
    retarderGain.gain.cancelScheduledValues(now);
    retarderGain.gain.setTargetAtTime(0,now,fade?.05:.001);
    const src=retarderSource, gain=retarderGain;
    setTimeout(() => { try { src.stop(); src.disconnect(); gain.disconnect(); } catch (_) {} }, fade?250:0);
    retarderSource=null; retarderGain=null; retarderLevel=0;
  }
  function playEffect(key, volumeScale=1) {
    if (!ctx || !effectBuffers[key] || suspended) return;
    const src=ctx.createBufferSource(), gain=ctx.createGain();
    src.buffer=effectBuffers[key]; gain.gain.value=clamp(volumeScale,0,1);
    src.connect(gain); gain.connect(master); src.start();
    src.onended=()=>{ try { src.disconnect(); gain.disconnect(); } catch (_) {} };
  }
  function door(which, opening) { playEffect((which==='rear'?'rear':'front')+(opening?'Open':'Close'), .82); }
  function setRetarder(level) {
    if (!ctx || !effectBuffers.retarderLoop) return;
    const n=clamp(Number(level)||0,0,3);
    if (n===retarderLevel) return;
    if (n>0 && retarderLevel===0) {
      playEffect('retarderOn',.42);
      retarderSource=ctx.createBufferSource(); retarderSource.buffer=effectBuffers.retarderLoop; retarderSource.loop=true;
      retarderGain=ctx.createGain(); retarderGain.gain.value=0;
      retarderSource.connect(retarderGain); retarderGain.connect(master); retarderSource.start();
    } else if (n===0 && retarderLevel>0) {
      stopRetarder(true); playEffect('retarderOff',.38); return;
    }
    if (retarderGain) retarderGain.gain.setTargetAtTime(.12+n*.075,ctx.currentTime,.12);
    retarderLevel=n;
  }
  function update(rpm, throttle) {
    if (!ctx || !ready || suspended) return;
    const now=ctx.currentTime, r=Math.max(0,Number(rpm)||0), t=clamp(Number(throttle)||0,0,1);
    for (const s of active) {
      const rpmWeight=Math.max(0,curve(s.points,r));
      const throttleWeight=s.throttle+(1-s.throttle)*t;
      const target=clamp(rpmWeight*throttleWeight*.30,0,.72);
      const rate=clamp(r/s.ref,.72,1.55);
      s.source.playbackRate.setTargetAtTime(rate,now,.08);
      s.gain.gain.setTargetAtTime(target,now,.09);
    }
  }
  function setVolume(v) { volume=clamp(Number(v)||0,0,1); if(master) master.gain.setTargetAtTime(volume,ctx.currentTime,.04); }
  function pause(p) {
    suspended=!!p;
    if(master && ctx) master.gain.setTargetAtTime(suspended?0:volume,ctx.currentTime,.06);
    if (suspended) stopRetarder(false);
  }
  function stop() { stopEngine(); stopRetarder(false); profileId=null; }
  window.BusAudio = { unlock:init, loadProfile, update, setVolume, pause, stop, playBell:()=>playEffect('bell',.9), door, setRetarder, profiles:Object.keys(PROFILES) };
})();
