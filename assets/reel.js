/* REELS — first tap unlocks sound. Play each clip to the end, then the next. */
(function(){
  const QS=[
    'viral shorts today','trending meme shorts','funny short clip',
    'world news shorts','crazy fail shorts','animal shorts funny',
    'space shorts','tech shorts viral','sports highlights shorts'
  ];
  let deck=[], lastId='', soundOn=false, busy=false;
  const SEEN_KEY='ww_reel_seen';
  function loadSeen(){
    try{ return JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'); }catch(e){ return []; }
  }
  let seenList=loadSeen();
  const seen={};
  seenList.forEach(id=>seen[id]=1);
  function saveSeen(){
    try{ localStorage.setItem(SEEN_KEY, JSON.stringify(seenList.slice(-240))); }catch(e){}
  }
  function frame(){ return document.getElementById('reelFrame'); }
  function srcFor(id){
    const origin=encodeURIComponent(location.origin);
    return 'https://www.youtube.com/embed/'+id+'?autoplay=1&mute=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&vq=hd720&origin='+origin;
  }
  function listen(box){
    try{
      const w=box.contentWindow;
      if(!w) return;
      w.postMessage(JSON.stringify({event:'listening', id:1}), '*');
      w.postMessage(JSON.stringify({event:'command', func:'addEventListener', args:['onStateChange']}), '*');
    }catch(e){}
  }
  function mount(id){
    const box=frame(); if(!box||!id) return;
    lastId=id;
    box.src=srcFor(id);
    box.onload=function(){ listen(box); };
  }
  function mark(id){
    if(!id||seen[id]) return;
    seen[id]=1; seenList.push(id); saveSeen();
  }
  function shuffle(a){
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      const t=a[i]; a[i]=a[j]; a[j]=t;
    }
    return a;
  }
  async function fillFast(){
    if(typeof findYtIds!=='function') return;
    try{
      const got=await findYtIds(QS[Math.floor(Math.random()*QS.length)], 2, 90);
      shuffle(got||[]).forEach(id=>{ if(id && !seen[id] && deck.indexOf(id)<0) deck.push(id); });
    }catch(e){}
  }
  async function next(){
    if(busy) return; busy=true;
    try{
      if(deck.length<2) await fillFast();
      if(!deck.length){
        seenList=[]; Object.keys(seen).forEach(k=>{ delete seen[k]; }); saveSeen();
        await fillFast();
      }
      const id=deck.shift();
      if(!id) return;
      mark(id);
      mount(id);
      if(deck.length<4) fillFast();
    } finally { busy=false; }
  }
  function go(){
    if(!soundOn){
      soundOn=true;
      const t=document.getElementById('reelTitle');
      if(t) t.textContent='REELS';
    }
    next();
  }
  window.addEventListener('message', function(e){
    if(!soundOn) return;
    const o=e.origin||'';
    if(o.indexOf('youtube.com')<0 && o.indexOf('youtube-nocookie.com')<0) return;
    let d=e.data;
    if(typeof d==='string'){ try{ d=JSON.parse(d); }catch(err){ return; } }
    if(!d) return;
    const ended=(d.event==='onStateChange' && (d.info===0 || d.info==='0'))
      || (d.info && d.info.playerState===0);
    if(ended) next();
  });
  window.initReel=function(){
    const n=document.getElementById('reelNext');
    const p=document.getElementById('reelPrev');
    const side=document.getElementById('reelSide');
    const t=document.getElementById('reelTitle');
    if(t) t.textContent='TAP · REELS';
    if(n) n.onclick=()=>go();
    if(p) p.onclick=()=>go();
    if(side){
      side.addEventListener('wheel', e=>{ e.preventDefault(); go(); }, {passive:false});
    }
    document.addEventListener('pointerdown', go, {once:true});
  };
})();
