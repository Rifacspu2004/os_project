// MENU TOGGLE
function toggleMenu(){
  document.getElementById("side-menu").classList.toggle("active");
}

// TOOL PAGE SWITCHING
function openTool(id){
  // hide content sections so tool appears cleanly
  document.querySelectorAll(".content-section").forEach(function(sec){
    sec.classList.remove("active");
  });

  document.querySelectorAll(".tool-page").forEach(function(page){
    page.classList.remove("active");
  });

  let selected = document.getElementById(id);
  if(selected){
    selected.classList.add("active");
  }
}

// GO HOME — restore last active content page
function goHome(){
  document.querySelectorAll(".tool-page").forEach(function(page){
    page.classList.remove("active");
  });

  // find which page btn is active, default to page 1
  let activeBtn = document.querySelector(".page-btn.active");
  let pageNum = activeBtn ? activeBtn.getAttribute("data-page") : "1";

  document.querySelectorAll(".content-section").forEach(function(sec){
    sec.classList.remove("active");
  });

  let target = document.getElementById("page-" + pageNum);
  if(target) target.classList.add("active");

  window.scrollTo({top:0, behavior:"smooth"});
}

// TOP NAVIGATION
document.querySelectorAll(".page-btn").forEach(function(btn){
  btn.addEventListener("click",function(){
    
    document.querySelectorAll(".page-btn").forEach(function(b){
      b.classList.remove("active");
    });
    
    btn.classList.add("active");
    let page = btn.getAttribute("data-page");

    // Hide all normal content pages
    document.querySelectorAll(".content-section").forEach(function(sec){
      sec.classList.remove("active");
    });

    // Hide all tool pages so they don't overlap with normal pages!
    document.querySelectorAll(".tool-page").forEach(function(tool){
      tool.classList.remove("active");
    });

    // Show the requested page
    document.getElementById("page-" + page).classList.add("active");
  });
});

// ══════════════════════════════════
//  SIMULATOR — ALL IN ONE
// ══════════════════════════════════

/* keep chips in sync with checked state */
function syncChip(chipId, checkbox){
  var chip = document.getElementById(chipId);
  if(chip) chip.classList.toggle("on", checkbox.checked);
}

function clearSim(){
  document.getElementById("refString").value = "";
  document.getElementById("frames").value = "3";
  document.getElementById("sim-results").innerHTML = "";
  var err = document.getElementById("sim-error");
  err.textContent = ""; err.classList.remove("show");
}

function showSimError(msg){
  var el = document.getElementById("sim-error");
  el.textContent = msg; el.classList.add("show");
}

/* ── algorithms ── */
function calcFIFO(ref, frames){
  var mem=[], ptr=0, faults=0, steps=[];
  ref.forEach(function(page){
    var hit = mem.includes(page), newPg=null;
    if(!hit){
      if(mem.length < frames){ mem.push(page); }
      else{ mem[ptr]=page; ptr=(ptr+1)%frames; }
      faults++; newPg=page;
    }
    steps.push({page:page, mem:mem.slice(), hit:hit, newPage:newPg});
  });
  return {faults:faults, hits:ref.length-faults, steps:steps};
}

function calcLRU(ref, frames){
  var mem=[], faults=0, steps=[];
  ref.forEach(function(page){
    var idx=mem.indexOf(page), hit=idx!==-1, newPg=null;
    if(!hit){
      if(mem.length < frames){ mem.push(page); }
      else{ mem.shift(); mem.push(page); }
      faults++; newPg=page;
    } else { mem.splice(idx,1); mem.push(page); }
    steps.push({page:page, mem:mem.slice(), hit:hit, newPage:newPg});
  });
  return {faults:faults, hits:ref.length-faults, steps:steps};
}

function calcOptimal(ref, frames){
  var mem=[], faults=0, steps=[];
  for(var i=0; i<ref.length; i++){
    var page=ref[i], hit=mem.includes(page), newPg=null;
    if(!hit){
      if(mem.length < frames){ mem.push(page); }
      else{
        var far=-1, ri=0;
        for(var j=0; j<mem.length; j++){
          var nx=ref.indexOf(mem[j], i+1);
          if(nx===-1){ri=j;break;}
          if(nx>far){far=nx;ri=j;}
        }
        mem[ri]=page;
      }
      faults++; newPg=page;
    }
    steps.push({page:page, mem:mem.slice(), hit:hit, newPage:newPg});
  }
  return {faults:faults, hits:ref.length-faults, steps:steps};
}

/* ── render trace table ── */
function buildTrace(result, frameCount, colorCls){
  var html='<div class="trace-scroll"><div class="trace-table">';
  result.steps.forEach(function(s){
    html+='<div class="trace-step">';
    html+='<div class="ts-page">'+s.page+'</div>';
    html+='<div class="ts-frames">';
    for(var f=0; f<frameCount; f++){
      var pg = s.mem[f]!==undefined ? s.mem[f] : "—";
      var cls = s.mem[f]===undefined ? "empty" : (pg==s.newPage ? "new-page" : "");
      html+='<div class="ts-frame '+cls+'">'+pg+'</div>';
    }
    html+='</div>';
    html+='<div class="ts-status '+(s.hit?"hit":"fault")+'">'+(s.hit?"HIT":"MISS")+'</div>';
    html+='</div>';
  });
  html+='</div></div>';
  return html;
}

function runSimulation(){
  var err=document.getElementById("sim-error");
  err.textContent=""; err.classList.remove("show");

  var raw = document.getElementById("refString").value.trim();
  var fc  = parseInt(document.getElementById("frames").value);
  var doFIFO = document.getElementById("chkFIFO").checked;
  var doLRU  = document.getElementById("chkLRU").checked;
  var doOPT  = document.getElementById("chkOPT").checked;

  if(!raw){ showSimError("Please enter a reference string."); return; }
  if(!fc||fc<1||fc>10){ showSimError("Frames must be 1–10."); return; }
  if(!doFIFO&&!doLRU&&!doOPT){ showSimError("Select at least one algorithm."); return; }

  var ref = raw.split(/[\s,]+/).filter(Boolean);
  if(!ref.length){ showSimError("Invalid reference string."); return; }

  var results={};
  if(doFIFO) results.fifo = calcFIFO(ref,fc);
  if(doLRU)  results.lru  = calcLRU(ref,fc);
  if(doOPT)  results.opt  = calcOptimal(ref,fc);

  /* summary */
  var sumHTML='<div class="result-summary">';
  if(doFIFO) sumHTML+='<div class="summary-box fifo"><div class="sb-algo">FIFO</div><div class="sb-count">'+results.fifo.faults+'</div><div class="sb-label">Page Faults</div></div>';
  if(doLRU)  sumHTML+='<div class="summary-box lru"><div class="sb-algo">LRU</div><div class="sb-count">'+results.lru.faults+'</div><div class="sb-label">Page Faults</div></div>';
  if(doOPT)  sumHTML+='<div class="summary-box opt"><div class="sb-algo">Optimal</div><div class="sb-count">'+results.opt.faults+'</div><div class="sb-label">Page Faults</div></div>';
  sumHTML+='</div>';

  /* traces */
  var trHTML='';
  if(doFIFO){
    trHTML+='<div class="trace-section">';
    trHTML+='<div class="trace-title fifo">FIFO — First In First Out <span class="trace-badge">'+results.fifo.faults+' faults · '+results.fifo.hits+' hits</span></div>';
    trHTML+=buildTrace(results.fifo,fc,'fifo');
    trHTML+='</div>';
  }
  if(doLRU){
    trHTML+='<div class="trace-section">';
    trHTML+='<div class="trace-title lru">LRU — Least Recently Used <span class="trace-badge">'+results.lru.faults+' faults · '+results.lru.hits+' hits</span></div>';
    trHTML+=buildTrace(results.lru,fc,'lru');
    trHTML+='</div>';
  }
  if(doOPT){
    trHTML+='<div class="trace-section">';
    trHTML+='<div class="trace-title opt">Optimal Page Replacement <span class="trace-badge">'+results.opt.faults+' faults · '+results.opt.hits+' hits</span></div>';
    trHTML+=buildTrace(results.opt,fc,'opt');
    trHTML+='</div>';
  }

  document.getElementById("sim-results").innerHTML = sumHTML + trHTML;
  document.getElementById("sim-results").scrollIntoView({behavior:"smooth", block:"nearest"});
}

function runFIFO(){ runSimulation(); }

// ══════════════════════════════════
//  VIDEO LESSON — click to load embed
// ══════════════════════════════════

// Video function - opens YouTube directly
function loadEmbed(wrapId, phId, videoId) {
  window.open("https://www.youtube.com/watch?v=" + videoId, "_blank");
}