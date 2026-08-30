/* THE TRENCHES — paper exchange. Not a licensed book. No deposits. */
(function(){
  const START=10000;
  const KEY='ww_trench';
  function load(){
    try{
      const j=JSON.parse(localStorage.getItem(KEY)||'null');
      if(j && typeof j.bank==='number') return j;
    }catch(e){}
    return {bank:START, pos:[], desk:{}};
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(T)); }catch(e){} }
  let T=load();
  let tab='poly';
  let poly=[];
  let sport=[];

  function el(id){ return document.getElementById(id); }
  function money(n){ return Math.round(n).toLocaleString(); }
  function pct(x){ const n=+x; if(!isFinite(n)) return '—'; return Math.round(n*100)+'%'; }

  function paintBank(){
    const b=el('trBank'); if(b) b.textContent=money(T.bank)+' desk';
  }

  function openReal(url){
    if(url) window.open(url,'_blank','noopener');
  }

  function fillPaper(id, q, side, px, src){
    px=Math.min(0.99, Math.max(0.01, +px||0.5));
    const qty=Math.max(1, Math.min(500, +el('trQty').value||10));
    const cost=qty*px;
    if(T.bank<cost){ if(window.say) say('TRENCHES · not enough desk credit'); return; }
    T.bank-=cost;
    T.pos.unshift({id, q, side, px, qty, src, t:Date.now(), open:true});
    save(); paintBank(); paintPos();
    if(window.say) say('TRENCHES · '+side+' '+qty+' @ '+pct(px)+' · '+q.slice(0,48));
  }

  function paintPos(){
    const host=el('trPos'); if(!host) return;
    host.innerHTML='';
    const h=document.createElement('b'); h.textContent='POSITIONS'; host.appendChild(h);
    (T.pos||[]).slice(0,16).forEach(p=>{
      const d=document.createElement('div'); d.className='trrow';
      d.textContent=(p.open?'OPEN ':'SETTLED ')+p.side+' '+p.qty+' @ '+pct(p.px)+' · '+(p.q||p.id);
      host.appendChild(d);
    });
    if(!T.pos.length){ const e=document.createElement('div'); e.className='sub'; e.textContent='No paper slips yet.'; host.appendChild(e); }
  }

  function card(host, row){
    const d=document.createElement('article'); d.className='trcard';
    const t=document.createElement('b'); t.textContent=row.q;
    const m=document.createElement('div'); m.className='trmeta';
    m.textContent=(row.meta||'')+' · YES '+pct(row.yes);
    const rowb=document.createElement('div'); rowb.className='trbtns';
    const y=document.createElement('button'); y.type='button'; y.textContent='PAPER YES';
    y.onclick=()=>fillPaper(row.id, row.q, 'YES', row.yes, row.src);
    const n=document.createElement('button'); n.type='button'; n.textContent='PAPER NO';
    n.onclick=()=>fillPaper(row.id, row.q, 'NO', 1-row.yes, row.src);
    rowb.appendChild(y); rowb.appendChild(n);
    if(row.url){
      const a=document.createElement('button'); a.type='button'; a.textContent='REAL BOOK ↗';
      a.onclick=()=>openReal(row.url);
      rowb.appendChild(a);
    }
    d.appendChild(t); d.appendChild(m); d.appendChild(rowb);
    host.appendChild(d);
  }

  function parsePrices(m){
    let yes=0.5;
    try{
      const p=typeof m.outcomePrices==='string'?JSON.parse(m.outcomePrices):m.outcomePrices;
      yes=parseFloat(p&&p[0]!=null?p[0]:0.5);
    }catch(e){}
    if(!isFinite(yes)) yes=0.5;
    return yes;
  }

  async function loadPoly(){
    const host=el('trList'); if(!host) return;
    host.textContent='Pulling public wires…';
    try{
      const r=await fetch('https://gamma-api.polymarket.com/events?limit=16&active=true&closed=false&order=volume24hr&ascending=false');
      const j=await r.json();
      const evs=Array.isArray(j)?j:(j.events||[]);
      poly=[];
      evs.forEach(ev=>{
        const mk=(ev.markets||[])[0]; if(!mk) return;
        const yes=parsePrices(mk);
        poly.push({
          id:'pm-'+ev.id, q:ev.title||mk.question||'event',
          yes, meta:'Polymarket · vol '+Math.round(ev.volume||mk.volume||0),
          src:'poly', url: ev.slug?('https://polymarket.com/event/'+ev.slug):'https://polymarket.com'
        });
      });
      paintList();
    }catch(e){
      host.textContent='Polymarket wire blocked in this browser. Sports + desk markets still live.';
      poly=[];
    }
  }

  async function loadSport(){
    sport=[];
    const urls=[
      ['NFL','https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'],
      ['NBA','https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'],
      ['EPL','https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard']
    ];
    for(const [lab,u] of urls){
      try{
        const r=await fetch(u); const j=await r.json();
        (j.events||[]).slice(0,6).forEach(ev=>{
          const comp=(ev.competitions&&ev.competitions[0])||{};
          const ts=comp.competitors||[];
          const home=ts.find(x=>x.homeAway==='home')||ts[0];
          const away=ts.find(x=>x.homeAway==='away')||ts[1];
          const hn=home&&home.team&&home.team.shortDisplayName||'Home';
          const an=away&&away.team&&away.team.shortDisplayName||'Away';
          const hs=+(home&&home.score||0), as=+(away&&away.score||0);
          let yes=0.5;
          if(hs||as) yes= hs===as?0.5 : hs>as?0.62:0.38;
          sport.push({
            id:'sp-'+ev.id, q:lab+' · '+an+' @ '+hn+'  (home wins)',
            yes, meta:(ev.status&&ev.status.type&&ev.status.type.shortDetail)||lab,
            src:'sport'
          });
        });
      }catch(e){}
    }
    paintList();
  }

  function deskRows(){
    const now=Date.now();
    const rows=[
      {id:'desk-btc', q:'BTC higher in 60 minutes (desk)', key:'BTC', yes:0.5},
      {id:'desk-eth', q:'ETH higher in 60 minutes (desk)', key:'ETH', yes:0.5},
      {id:'desk-gold', q:'GOLD higher in 60 minutes (desk)', key:'GOLD', yes:0.5}
    ];
    rows.forEach(r=>{
      const d=T.desk[r.id];
      if(d && d.px){
        const age=(now-d.t)/60000;
        r.meta='snap '+d.px+' · '+age.toFixed(0)+'m ago · settles 60m';
        r.yes=0.5;
      } else r.meta='opens on first paper fill · CoinGecko/Yahoo snap';
      r.src='desk';
    });
    return rows;
  }

  async function snapPx(key){
    try{
      if(key==='BTC'||key==='ETH'){
        const id=key==='BTC'?'bitcoin':'ethereum';
        const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+id+'&vs_currencies=usd');
        const j=await r.json();
        return +(j[id]&&j[id].usd);
      }
      const r=await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d');
      const j=await r.json();
      const m=j.chart&&j.chart.result&&j.chart.result[0];
      return +(m.meta.regularMarketPrice);
    }catch(e){ return 0; }
  }

  const _fill=fillPaper;
  fillPaper=async function(id,q,side,px,src){
    if(src==='desk' && !T.desk[id]){
      const key=id==='desk-btc'?'BTC':id==='desk-eth'?'ETH':'GOLD';
      const p=await snapPx(key);
      if(p) T.desk[id]={px:p, t:Date.now(), key};
      save();
    }
    _fill(id,q,side,px,src);
  };

  async function settleDesk(){
    const now=Date.now();
    for(const id of Object.keys(T.desk||{})){
      const d=T.desk[id]; if(!d||now-d.t<3600000) continue;
      const live=await snapPx(d.key);
      if(!live) continue;
      const up=live>=d.px;
      T.pos.forEach(p=>{
        if(p.id!==id || !p.open) return;
        const win=(p.side==='YES'&&up)||(p.side==='NO'&&!up);
        if(win) T.bank+=p.qty*1;
        p.open=false; p.note=up?'UP':'DOWN';
      });
      delete T.desk[id];
    }
    save(); paintBank(); paintPos();
  }

  function paintList(){
    const host=el('trList'); if(!host) return;
    host.innerHTML='';
    const rows=tab==='poly'?poly: tab==='sport'?sport: deskRows();
    if(!rows.length){ host.textContent=tab==='poly'?'No poly cards.':'No rows.'; return; }
    rows.forEach(r=>card(host,r));
  }

  function setTab(name){
    tab=name;
    document.querySelectorAll('#trTabs button').forEach(b=>b.classList.toggle('on', b.dataset.t===name));
    paintList();
    if(name==='poly' && !poly.length) loadPoly();
    if(name==='sport' && !sport.length) loadSport();
  }

  window.openTrenches=function(){
    document.body.classList.add('trenchOn');
    document.body.classList.remove('shopOn');
    paintBank(); paintPos();
    setTab(tab);
    settleDesk();
    if(!poly.length) loadPoly();
    if(!sport.length) loadSport();
  };
  window.closeTrenches=function(){ document.body.classList.remove('trenchOn'); };

  window.initTrenches=function(){
    const b=el('bTrench');
    if(b) b.onclick=()=>{
      if(document.body.classList.contains('trenchOn')) closeTrenches();
      else openTrenches();
    };
    el('trTabs') && el('trTabs').addEventListener('click', e=>{
      const t=e.target.closest('button'); if(!t||!t.dataset.t) return; setTab(t.dataset.t);
    });
    paintBank(); paintPos();
    setInterval(settleDesk, 60000);
  };
})();
