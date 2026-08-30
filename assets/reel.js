/* REELS — fast public YouTube, random unused IDs, sound after first tap. */
(function(){
  const QS=[
    'viral shorts today','trending meme shorts','funny short clip',
    'world news shorts','crazy fail shorts','animal shorts funny',
    'space shorts','tech shorts viral','sports highlights shorts'
  ];
  let deck=[], lastId='', soundOn=false, busy=false, primed=false;
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
    return 'https://www.youtube.com/embed/'+id+'?autoplay=1&mute='+(soundOn?0:1)+'&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&vq=hd720';
  }
  function mount(id){
    const box=frame(); if(!box||!id) return;
    lastId=id;
    box.src=srcFor(id);
    const lab=document.getElementById('reelLab');
    if(lab) lab.textContent='';
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
    const q=QS[Math.floor(Math.random()*QS.length)]+' '+Date.now().toString(36).slice(-3);
    try{
      const got=await findYtIds(QS[Math.floor(Math.random()*QS.length)], 2, 90);
      shuffle(got||[]).forEach(id=>{ if(id && !seen[id] && deck.indexOf(id)<0) deck.push(id); });
    }catch(e){}
  }
  async function fillDeep(){
    try{
      if(typeof findYtTrend==='function'){
        const t=await findYtTrend();
        shuffle(t||[]).forEach(id=>{ if(id && !seen[id] && deck.indexOf(id)<0) deck.push(id); });
      }
    }catch(e){}
    await fillFast();
  }
  async function next(){
    if(busy) return; busy=true;
    try{
      if(deck.length<2) await fillFast();
      if(!deck.length) await fillDeep();
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
  function armSound(){
    if(soundOn) return;
    soundOn=true;
    if(lastId){ const box=frame(); if(box) box.src=srcFor(lastId); }
    else next();
  }
  window.initReel=function(){
    const n=document.getElementById('reelNext');
    const p=document.getElementById('reelPrev');
    const side=document.getElementById('reelSide');
    if(n) n.onclick=()=>next();
    if(p) p.onclick=()=>next();
    if(side){
      side.addEventListener('wheel', e=>{
        e.preventDefault(); next();
      }, {passive:false});
      side.addEventListener('pointerdown', armSound);
    }
    document.addEventListener('pointerdown', armSound, {once:true});
    next();
    setInterval(()=>{ if(document.body.classList.contains('streetOn')) return; next(); }, 14000);
  };
})();
