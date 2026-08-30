/* Live Celestrak orbits via satellite.js. Click a sat to track. */
(function(){
  let recs=[], picked=null;
  window.orbPins=[];
  window.satTrackPath=[];
  function parseTle(text){
    const lines=String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const out=[];
    for(let i=0;i<lines.length-2;i++){
      if(lines[i+1].indexOf('1 ')===0 && lines[i+2].indexOf('2 ')===0){
        out.push({name:lines[i].replace(/^0 /, ''), l1:lines[i+1], l2:lines[i+2]});
        i+=2;
      }
    }
    return out;
  }
  function geoOf(satrec, date){
    try{
      const pv=satellite.propagate(satrec, date);
      if(!pv||!pv.position) return null;
      const g=satellite.eciToGeodetic(pv.position, satellite.gstime(date));
      return {lat:satellite.degreesLat(g.latitude), lng:satellite.degreesLong(g.longitude), altKm:g.height};
    }catch(e){ return null; }
  }
  async function load(){
    if(typeof satellite==='undefined') return;
    const groups=['stations','visual','geo'];
    const texts=await Promise.all(groups.map(g=>
      fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP='+g+'&FORMAT=tle')
        .then(r=>r.ok?r.text():'').catch(()=>'')
    ));
    const seen={};
    recs=[];
    texts.join('\n');
    texts.forEach(t=>{
      parseTle(t).forEach(row=>{
        if(seen[row.name]) return;
        seen[row.name]=1;
        try{
          const rec=satellite.twoline2satrec(row.l1, row.l2);
          if(rec) recs.push({name:row.name, rec});
        }catch(e){}
      });
    });
    recs=recs.slice(0,80);
    tick();
  }
  function tick(){
    if(!recs.length) return;
    const now=new Date();
    window.orbPins=recs.map(s=>{
      const g=geoOf(s.rec, now);
      if(!g || !isFinite(g.lat)) return null;
      return {name:s.name, c:Math.round(g.altKm)+' km', lat:g.lat, lng:g.lng, pop:Math.round(g.altKm)+' km', kind:'orb', altKm:g.altKm};
    }).filter(Boolean);
    if(typeof paintPins==='function') paintPins();
    if(picked) track(picked);
    const n=document.getElementById('mSatN');
    if(n) n.textContent=String(window.orbPins.length);
  }
  function track(name){
    const s=recs.find(x=>x.name===name);
    if(!s) return;
    const path=[], t0=Date.now();
    for(let i=-45;i<=45;i+=2){
      const g=geoOf(s.rec, new Date(t0+i*60*1000));
      if(g) path.push([g.lat, g.lng, Math.min(0.32, Math.max(0.02, g.altKm/6371))]);
    }
    window.satTrackPath=path;
    if(typeof paintArcs==='function') paintArcs();
  }
  window.pickSat=function(name){
    picked=name;
    track(name);
    const chip=document.getElementById('satChip');
    if(chip) chip.textContent='SAT · '+name;
  };
  window.initSats=function(){ load(); setInterval(tick, 8000); };
})();
