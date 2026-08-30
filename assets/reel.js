/* Shorts rail — public YouTube. Phone 9:16. Request hd720. Sound after first tap. */
(function(){
  let ids=[], i=0, busy=false, seen={}, lastId='', soundOn=false;

  function frame(){ return document.getElementById('reelFrame'); }
  function srcFor(id){
    const mute=soundOn?0:1;
    return 'https://www.youtube.com/embed/'+id+'?autoplay=1&mute='+mute+'&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&vq=hd720';
  }
  function mount(id){
    const box=frame(); if(!box||!id) return;
    lastId=id;
    box.src=srcFor(id);
    const lab=document.getElementById('reelLab');
    if(lab) lab.textContent='TREND · '+id;
  }
  function push(list){
    (list||[]).forEach(id=>{
      if(!id || seen[id]) return;
      seen[id]=1; ids.push(id);
    });
  }
  async function fill(){
    try{ if(typeof findYtTrend==='function') push(await findYtTrend()); }catch(e){}
    if(typeof findYtIds==='function'){
      const qs=['trending shorts today','viral meme shorts','world news shorts'];
      try{ push(await findYtIds(qs[Date.now()%qs.length], 2, 60)); }catch(e){}
    }
    if(ids.length>80) ids=ids.slice(-60);
  }
  async function next(){
    if(busy) return; busy=true;
    try{
      if(i>=ids.length-1) await fill();
      if(!ids.length) await fill();
      if(!ids.length) return;
      mount(ids[i%ids.length]); i++;
    } finally { busy=false; }
  }
  window.initReel=function(){
    const n=document.getElementById('reelNext');
    const p=document.getElementById('reelPrev');
    const side=document.getElementById('reelSide');
    if(n) n.onclick=()=>next();
    if(p) p.onclick=()=>{ i=Math.max(0,i-2); next(); };
    if(side) side.addEventListener('wheel', e=>{
      e.preventDefault();
      if(e.deltaY>0) next(); else { i=Math.max(0,i-2); next(); }
    }, {passive:false});
    document.addEventListener('pointerdown', ()=>{
      if(soundOn) return;
      soundOn=true;
      if(lastId){ const box=frame(); if(box) box.src=srcFor(lastId); }
    }, {once:true});
    next();
    setInterval(()=>{ if(document.body.classList.contains('streetOn')) return; next(); }, 12000);
    setInterval(fill, 10*60*1000);
  };
})();
