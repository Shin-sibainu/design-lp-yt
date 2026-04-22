// Hamburger menu toggle
(function(){
  const btn = document.querySelector('.nav-hamburger');
  const menu = document.querySelector('.nav-menu');
  if(!btn || !menu) return;
  btn.addEventListener('click',()=>{
    btn.classList.toggle('open');
    menu.classList.toggle('open');
  });
  // Close menu when a link is clicked
  menu.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click',()=>{
      btn.classList.remove('open');
      menu.classList.remove('open');
    });
  });
})();

// Smooth scroll with nav offset
(function(){
  const navH = document.querySelector('.nav')?.offsetHeight || 76;
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',(e)=>{
      const id = a.getAttribute('href');
      if(id === '#') return;
      const target = document.querySelector(id);
      if(!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({top:y, behavior:'smooth'});
    });
  });
})();

// Marquee: duplicate cards for seamless infinite scroll
document.querySelectorAll('.marquee-row').forEach(row => {
  const cards = Array.from(row.children);
  cards.forEach(c => row.appendChild(c.cloneNode(true)));
});

// FAQ toggle
document.querySelectorAll('.faq-item').forEach(item=>{
  item.querySelector('.faq-q').addEventListener('click',()=> item.classList.toggle('open'));
});

// Section fade-up on scroll — animate inner content only (not section bg)
(function(){
  const sections = document.querySelectorAll('section:not(.hero)');
  const revealEls = [];
  sections.forEach(sec => {
    if(sec.classList.contains('voices')){
      sec.querySelectorAll('.wrap, .marquee-wrap').forEach(el => revealEls.push(el));
    } else {
      const wrap = sec.querySelector('.wrap');
      if(wrap) revealEls.push(wrap);
    }
  });
  // Footer excluded — always visible (at page bottom IO may not fire reliably)

  revealEls.forEach(el => el.classList.add('reveal'));
  void document.body.offsetHeight;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  },{threshold:0.15, rootMargin:'0px 0px -120px 0px'});

  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      revealEls.forEach(el => io.observe(el));
    });
  });
})();

// Hero blob: gentle wobble + bouncy hover scale
(function(){
  const media = document.querySelector('.hero-media');
  const mask  = document.querySelector('.hero-photo-mask');
  const path  = document.getElementById('heroBlobPath');
  if(!media || !mask || !path) return;

  const base = [
    {ax:30,ay:230},
    {c1x:18,c1y:140, c2x:95,c2y:50,   ax:205,ay:34},
    {c1x:315,c1y:18, c2x:395,c2y:58,  ax:490,ay:46},
    {c1x:585,c1y:34, c2x:612,c2y:140, ax:606,ay:230},
    {c1x:600,c1y:320, c2x:618,c2y:400, ax:560,ay:470},
    {c1x:500,c1y:540, c2x:400,c2y:548, ax:320,ay:534},
    {c1x:230,c1y:520, c2x:135,c2y:548, ax:78,ay:490},
    {c1x:20,c1y:432,  c2x:42,c2y:320,  ax:30,ay:230}
  ];

  function allPoints(segs){
    const pts = [{obj:segs[0], key:'a'}];
    for(let i=1;i<segs.length;i++){
      pts.push({obj:segs[i], key:'c1'});
      pts.push({obj:segs[i], key:'c2'});
      pts.push({obj:segs[i], key:'a'});
    }
    return pts;
  }

  function cloneBase(){
    return base.map(s=>{
      const o = {ax:s.ax, ay:s.ay};
      if(s.c1x!==undefined){o.c1x=s.c1x;o.c1y=s.c1y;o.c2x=s.c2x;o.c2y=s.c2y;}
      return o;
    });
  }

  function buildD(segs){
    let d = `M${segs[0].ax.toFixed(1)},${segs[0].ay.toFixed(1)}`;
    for(let i=1;i<segs.length;i++){
      const s=segs[i];
      d+=` C${s.c1x.toFixed(1)},${s.c1y.toFixed(1)} ${s.c2x.toFixed(1)},${s.c2y.toFixed(1)} ${s.ax.toFixed(1)},${s.ay.toFixed(1)}`;
    }
    return d+'Z';
  }

  let hovering = false;
  let currentScale = 1, targetScale = 1, scaleVel = 0;
  const SCALE_STIFFNESS = 0.08;
  const SCALE_DAMPING   = 0.65;

  media.addEventListener('mouseenter',()=>{ hovering=true; targetScale=1.06; });
  media.addEventListener('mouseleave',()=>{ hovering=false; targetScale=1; });

  const WOBBLE_AMP = 8;
  const WOBBLE_SPEED = 0.4;

  let t0 = performance.now();

  function tick(now){
    const t = (now - t0) / 1000;
    const segs = cloneBase();
    const pts = allPoints(segs);

    for(let i=0;i<pts.length;i++){
      const p = pts[i];
      const bx = p.key==='a' ? p.obj.ax : (p.key==='c1' ? p.obj.c1x : p.obj.c2x);
      const by = p.key==='a' ? p.obj.ay : (p.key==='c1' ? p.obj.c1y : p.obj.c2y);

      const phase = i * 1.3;
      const finalX = bx + Math.sin(t * WOBBLE_SPEED * 2.1 + phase) * WOBBLE_AMP;
      const finalY = by + Math.cos(t * WOBBLE_SPEED * 1.7 + phase * 0.8) * WOBBLE_AMP;

      if(p.key==='a'){ p.obj.ax=finalX; p.obj.ay=finalY; }
      else if(p.key==='c1'){ p.obj.c1x=finalX; p.obj.c1y=finalY; }
      else { p.obj.c2x=finalX; p.obj.c2y=finalY; }
    }

    path.setAttribute('d', buildD(segs));

    const scaleDiff = targetScale - currentScale;
    scaleVel += scaleDiff * SCALE_STIFFNESS;
    scaleVel *= SCALE_DAMPING;
    currentScale += scaleVel;

    mask.style.setProperty('--ms', currentScale.toFixed(4));

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// Works blobs: wobble + bouncy hover scale (same feel as hero)
(function(){
  function parseSegs(d){
    const nums = d.replace(/[MCZ]/gi,'').trim().split(/[\s,]+/).map(Number);
    const segs = [{ax:nums[0], ay:nums[1]}];
    for(let i=2; i<nums.length; i+=6){
      segs.push({c1x:nums[i],c1y:nums[i+1], c2x:nums[i+2],c2y:nums[i+3], ax:nums[i+4],ay:nums[i+5]});
    }
    return segs;
  }
  function cloneSegs(s){ return s.map(o=>({...o})); }
  function buildD(segs){
    let d = `M${segs[0].ax.toFixed(1)},${segs[0].ay.toFixed(1)}`;
    for(let i=1;i<segs.length;i++){
      const s=segs[i];
      d+=` C${s.c1x.toFixed(1)},${s.c1y.toFixed(1)} ${s.c2x.toFixed(1)},${s.c2y.toFixed(1)} ${s.ax.toFixed(1)},${s.ay.toFixed(1)}`;
    }
    return d+'Z';
  }
  function allPts(segs){
    const pts=[{obj:segs[0],key:'a'}];
    for(let i=1;i<segs.length;i++){
      pts.push({obj:segs[i],key:'c1'},{obj:segs[i],key:'c2'},{obj:segs[i],key:'a'});
    }
    return pts;
  }

  const cards = document.querySelectorAll('.work-card');
  const blobs = [];

  cards.forEach((card, idx) => {
    const pathEl = document.getElementById('workBlobPath'+(idx+1));
    const svgEl = card.querySelector('.work-blob-wrap svg');
    if(!pathEl || !svgEl) return;
    const base = parseSegs(pathEl.getAttribute('d'));
    blobs.push({
      pathEl, svgEl, base,
      scale: 1, targetScale: 1, scaleVel: 0,
      phaseOffset: idx * 2.5
    });

    card.addEventListener('mouseenter', () => { blobs[idx].targetScale = 1.06; });
    card.addEventListener('mouseleave', () => { blobs[idx].targetScale = 1; });
  });

  const AMP = 4, SPD = 0.5;
  const STIFF = 0.08, DAMP = 0.65;
  const t0 = performance.now();

  function tick(now){
    const t = (now - t0) / 1000;
    blobs.forEach(b => {
      const segs = cloneSegs(b.base);
      const pts = allPts(segs);

      for(let i=0;i<pts.length;i++){
        const p = pts[i];
        const bx = p.key==='a'?p.obj.ax:(p.key==='c1'?p.obj.c1x:p.obj.c2x);
        const by = p.key==='a'?p.obj.ay:(p.key==='c1'?p.obj.c1y:p.obj.c2y);
        const ph = i*1.3 + b.phaseOffset;
        const fx = bx + Math.sin(t*SPD*2.1+ph)*AMP;
        const fy = by + Math.cos(t*SPD*1.7+ph*0.8)*AMP;
        if(p.key==='a'){p.obj.ax=fx;p.obj.ay=fy;}
        else if(p.key==='c1'){p.obj.c1x=fx;p.obj.c1y=fy;}
        else{p.obj.c2x=fx;p.obj.c2y=fy;}
      }
      b.pathEl.setAttribute('d', buildD(segs));

      b.scaleVel += (b.targetScale - b.scale) * STIFF;
      b.scaleVel *= DAMP;
      b.scale += b.scaleVel;
      b.svgEl.style.setProperty('--ws', b.scale.toFixed(4));
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
