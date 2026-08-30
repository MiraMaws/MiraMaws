/* White Wings desk EXCHANGE — paper spot only. No bets. No deposits. */
(function(){
  const START=10000;
  const KEY='ww_x';
  const PAIRS=[
    {id:'BTC', label:'BITCOIN', kind:'cg', cg:'bitcoin'},
    {id:'ETH', label:'ETHER', kind:'cg', cg:'ethereum'},
    {id:'SOL', label:'SOLANA', kind:'cg', cg:'solana'},
    {id:'GOLD', label:'GOLD', kind:'yh', yh:'GC=F'},
    {id:'SLVR', label:'SILVER', kind:'yh', yh:'SI=F'}
  ];
  function load(){
    try{
      const j=JSON.parse(localStorage.getItem(KEY)||'null');
      if(j && typeof j.bank==='number') return j;
    }catch(e){}
    return {bank:START, hold:{}, log:[]};
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(X)); }catch(e){} }
  let X=load();
  const px={};

  function el(id){ return document.getElementById(id); }
  function money(n){ return (Math.round(n*100)/100).toLocaleString(undefined,{maximumFractionDigits:2}); }

  function paintBank(){
    const b=el('trBank'); if(b) b.textContent=money(X.bank)+' desk';
  }

  function spend(){
    const n=+((el('trQty')&&el('trQty').value)||100);
    return Math.max(1, Math.min(50000, n));
  }

  function buy(id){
    const p=px[id]; if(!p){ if(window.say) say('EXCHANGE · no quote'); return; }
    const usd=spend();
    if(X.bank<usd){ if(window.say) say('EXCHANGE · not enough desk'); return; }
    X.bank-=usd;
    X.hold[id]=(X.hold[id]||0)+usd/p;
    X.log.unshift({t:Date.now(), side:'BUY', id, usd, p});
    X.log=X.log.slice(0,40);
    save(); paint();
    if(window.say) say('EXCHANGE · buy '+id+' $'+money(usd)+' @ '+money(p));
  }
  function sell(id){
    const p=px[id]; if(!p) return;
    const usd=spend();
    const have=X.hold[id]||0;
    const units=usd/p;
    if(have<units){ if(window.say) say('EXCHANGE · not enough '+id); return; }
    X.hold[id]=have-units;
    X.bank+=usd;
    X.log.unshift({t:Date.now(), side:'SELL', id, usd, p});
    X.log=X.log.slice(0,40);
    save(); paint();
    if(window.say) say('EXCHANGE · sell '+id+' $'+money(usd)+' @ '+money(p));
  }

  function paintList(){
    const host=el('trList'); if(!host) return;
    host.innerHTML='';
    PAIRS.forEach(a=>{
      const d=document.createElement('article'); d.className='trcard';
      const t=document.createElement('b'); t.textContent=a.label+' · '+(px[a.id]?('$'+money(px[a.id])):'…');
      const m=document.createElement('div'); m.className='trmeta';
      m.textContent='held '+(X.hold[a.id]?money(X.hold[a.id]):'0')+' · mark '+(px[a.id]&&X.hold[a.id]?('$'+money(X.hold[a.id]*px[a.id])):'$0');
      const row=document.createElement('div'); row.className='trbtns';
      const b=document.createElement('button'); b.type='button'; b.textContent='BUY'; b.onclick=()=>buy(a.id);
      const s=document.createElement('button'); s.type='button'; s.textContent='SELL'; s.onclick=()=>sell(a.id);
      row.appendChild(b); row.appendChild(s);
      d.appendChild(t); d.appendChild(m); d.appendChild(row);
      host.appendChild(d);
    });
  }
  function paintPos(){
    const host=el('trPos'); if(!host) return;
    host.innerHTML='';
    const h=document.createElement('b'); h.textContent='TICKS'; host.appendChild(h);
    (X.log||[]).slice(0,12).forEach(p=>{
      const d=document.createElement('div'); d.className='trrow';
      d.textContent=p.side+' '+p.id+' $'+money(p.usd)+' @ '+money(p.p);
      host.appendChild(d);
    });
    if(!X.log.length){ const e=document.createElement('div'); e.className='sub'; e.textContent='No fills yet.'; host.appendChild(e); }
  }
  function paint(){ paintBank(); paintList(); paintPos(); }

  async function quotes(){
    try{
      const ids=PAIRS.filter(a=>a.kind==='cg').map(a=>a.cg).join(',');
      const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+ids+'&vs_currencies=usd');
      const j=await r.json();
      PAIRS.forEach(a=>{ if(a.kind==='cg' && j[a.cg] && j[a.cg].usd) px[a.id]=+j[a.cg].usd; });
    }catch(e){}
    for(const a of PAIRS.filter(x=>x.kind==='yh')){
      try{
        const r=await fetch('https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(a.yh)+'?interval=1m&range=1d');
        const j=await r.json();
        const m=j.chart&&j.chart.result&&j.chart.result[0];
        const p=m&&m.meta&&m.meta.regularMarketPrice;
        if(p) px[a.id]=+p;
      }catch(e){}
    }
    paint();
  }

  window.openTrenches=function(){
    document.body.classList.add('trenchOn');
    document.body.classList.remove('shopOn');
    paint(); quotes();
  };
  window.closeTrenches=function(){ document.body.classList.remove('trenchOn'); };
  window.initTrenches=function(){
    const b=el('bTrench');
    if(b) b.onclick=()=>{
      if(document.body.classList.contains('trenchOn')) closeTrenches();
      else openTrenches();
    };
    paint();
    setInterval(quotes, 60000);
  };
})();
