/* Bus engine audio: Web Audio API loop mixer.
 * Profile data follows the Q290 Euro6 loopsound entries in Sound_Q290(Euro6).cfg.
 */
(() => {
  'use strict';
  const PROFILES = {
    'q290-euro6': {
      samples: [
        { file: '301idle.wav', ref: 592, points: [[0,0],[200,1],[592,1],[651,.7],[770,0]], throttle: .7 },
        { file: '301low.wav', ref: 770, points: [[192,1],[770,1],[1332,0]], throttle: .7 },
        { file: '301mid2.wav', ref: 1770, points: [[592,0],[651,.2],[770,.7],[1451,1],[3332,0]], throttle: .7 },
        { file: '301high2.wav', ref: 1800, points: [[1551,0],[1870,.7],[2451,1],[3332,1]], throttle: .7 },
        { file: '301high.wav', ref: 1800, points: [[551,0],[870,1],[1470,1.4],[1970,1],[3332,1]], throttle: .7 },
        { file: '301low2.wav', ref: 1332, points: [[770,0],[1051,.7],[1332,1],[1628,.7],[1924,0]], throttle: .6 }
      ]
    }
  };
  let ctx = null, master = null, active = [], profileId = null, ready = false, volume = .65, suspended = false;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  function curve(points, x) {
    if (x <= points[0][0]) return points[0][1];
    for (let i=1;i<points.length;i++) {
      if (x <= points[i][0]) {
        const [x0,y0]=points[i-1], [x1,y1]=points[i];
        const t=(x-x0)/(x1-x0 || 1);
        return y0+(y1-y0)*t;
      }
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
  async function loadProfile(id) {
    if (!id || !PROFILES[id]) { stop(); profileId = null; ready = false; return; }
    if (profileId === id && ready) return;
    await init(); stopSources(); profileId=id;
    const profile=PROFILES[id];
    const loaded=await Promise.all(profile.samples.map(async s => {
      const response=await fetch('Sound/Q290%20Euro6/'+encodeURIComponent(s.file));
      if (!response.ok) throw new Error('엔진 음원 로드 실패: '+s.file+' ('+response.status+')');
      const buffer=await ctx.decodeAudioData(await response.arrayBuffer());
      const source=ctx.createBufferSource(); source.buffer=buffer; source.loop=true;
      const gain=ctx.createGain(); gain.gain.value=0;
      source.connect(gain); gain.connect(master); source.start();
      return { ...s, source, gain };
    }));
    active=loaded; ready=true;
  }
  function stopSources() {
    for (const s of active) { try { s.source.stop(); } catch (_) {} try { s.source.disconnect(); s.gain.disconnect(); } catch (_) {} }
    active=[]; ready=false;
  }
  function stop() { stopSources(); profileId=null; }
  function update(rpm, throttle, dt) {
    if (!ctx || !ready || suspended) return;
    const now=ctx.currentTime, r=Math.max(0,Number(rpm)||0), t=clamp(Number(throttle)||0,0,1);
    for (const s of active) {
      const rpmWeight=Math.max(0,curve(s.points,r));
      const throttleWeight=s.throttle+(1-s.throttle)*t;
      const target=clamp(rpmWeight*throttleWeight*.34,0,0.72);
      const rate=clamp(r/s.ref,.55,1.65);
      s.source.playbackRate.setTargetAtTime(rate,now,.08);
      s.gain.gain.setTargetAtTime(target,now,.09);
    }
  }
  function setVolume(v) { volume=clamp(Number(v)||0,0,1); if(master) master.gain.setTargetAtTime(volume,ctx.currentTime,.04); }
  function pause(p) { suspended=!!p; if(master && ctx) master.gain.setTargetAtTime(suspended?0:volume,ctx.currentTime,.06); }
  window.BusAudio = { unlock:init, loadProfile, update, setVolume, pause, stop, profiles:Object.keys(PROFILES) };
})();
