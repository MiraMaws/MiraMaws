/* Shorts rail — public YouTube search only. Official embed. Not TikTok. */
(function(){
  const QS=['funny meme shorts','world events meme funny short','dank meme 15 seconds','viral humor short','dodo bird funny short'];
  let ids=[], i=0, busy=false;

  function frame(){ return document.getElementById('reelFrame'); }
  function mount(id){
    const box=frame(); if(!box||!id) return;
    box.src='https://www.youtube.com/embed/'+id+'?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1';
    const lab=document.getElementById('reelLab');
    if(lab) lab.textContent='SHORT · '+id;
  }
  async function fill(){
    if(typeof findYtIds!=='function') return;
    const q=QS[Math.floor(Math.random()*QS.length)];
    const got=await findYtIds(q, 2, 20);
    (got||[]).forEach(id=>{ if(ids.indexOf(id)<0) ids.push(id); });
  }
  async function next(){
    if(busy) return; busy=true;
    try{
      if(i>=ids.length-2) await fill();
      if(!ids.length){ await fill(); }
      if(!ids.length) return;
      const id=ids[i%ids.length]; i++;
      mount(id);
    } finally { busy=false; }
  }
  window.initReel=function(){
    const n=document.getElementById('reelNext');
    const p=document.getElementById('reelPrev');
    const side=document.getElementById('reelSide');
    if(n) n.onclick=()=>next();
    if(p) p.onclick=()=>{ if(i>1){ i=Math.max(0,i-2); } next(); };
    if(side) side.addEventListener('wheel', e=>{
      e.preventDefault();
      if(e.deltaY>0) next(); else { if(i>1) i=Math.max(0,i-2); next(); }
    }, {passive:false});
    next();
    setInterval(()=>{ if(document.body.classList.contains('streetOn')) return; next(); }, 18000);
  };
})();
