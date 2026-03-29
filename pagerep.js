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

let selected=document.getElementById(id);

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
let activeBtn=document.querySelector(".page-btn.active");
let pageNum=activeBtn ? activeBtn.getAttribute("data-page") : "1";

document.querySelectorAll(".content-section").forEach(function(sec){
sec.classList.remove("active");
});

let target=document.getElementById("page-"+pageNum);
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

let page=btn.getAttribute("data-page");

document.querySelectorAll(".content-section").forEach(function(sec){
sec.classList.remove("active");
});

document.getElementById("page-"+page).classList.add("active");

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

/* init chip states on load */
window.addEventListener("load", function(){
  ["chkFIFO","chkLRU","chkOPT"].forEach(function(id, i){
    var ids = ["chip-fifo","chip-lru","chip-opt"];
    var el = document.getElementById(id);
    if(el) syncChip(ids[i], el);
  });
});

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
  for(var i=0;i<ref.length;i++){
    var page=ref[i], hit=mem.includes(page), newPg=null;
    if(!hit){
      if(mem.length < frames){ mem.push(page); }
      else{
        var far=-1, ri=0;
        for(var j=0;j<mem.length;j++){
          var nx=ref.indexOf(mem[j],i+1);
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
    for(var f=0;f<frameCount;f++){
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

/* keep old runFIFO alias so nothing breaks */
function runFIFO(){ runSimulation(); }


// ══════════════════════════════════
//  VIDEO LESSON
// ══════════════════════════════════

var videos = [
  { id:"LKkiraa6RV4", title:"Page Replacement Algorithms — Overview",  channel:"Gate Smashers", tag:"General" },
  { id:"BmMIFoVFKJs", title:"FIFO Page Replacement Explained",          channel:"Neso Academy",  tag:"fifo"    },
  { id:"4eTSFSJL6Ss", title:"LRU — Least Recently Used",                channel:"Gate Smashers", tag:"lru"     },
  { id:"T-3dRlNEtKk", title:"Optimal Page Replacement",                 channel:"Neso Academy",  tag:"opt"     },
  { id:"qlH4-oHnBb8", title:"Belady Anomaly in FIFO",                   channel:"Simple Snippets",tag:"fifo"   },
  { id:"2Z8mi-T3sHg", title:"Page Fault Handling Step by Step",         channel:"Neso Academy",  tag:"General" }
];

var currentView = "side";
var currentVideoIdx = 0;

function thumb(id){ return "https://img.youtube.com/vi/"+id+"/mqdefault.jpg"; }

function tagClass(t){
  if(t==="fifo") return "fifo";
  if(t==="lru")  return "lru";
  if(t==="opt")  return "opt";
  return "";
}

/* build all three view lists once when video tool opens */
function buildVideoUI(){
  buildSidePlaylist();
  buildFocusPills();
  buildBrowseGrid();
  loadVideo(0, false);
}

function buildSidePlaylist(){
  var c = document.getElementById("sidePlaylist");
  if(!c) return;
  c.innerHTML = "";
  videos.forEach(function(v, i){
    var d = document.createElement("div");
    d.className = "playlist-item" + (i===0?" active":"");
    d.innerHTML =
      '<img src="'+thumb(v.id)+'" alt="" onerror="this.style.display=\'none\'"/>' +
      '<div class="pi-info"><div class="pi-title">'+v.title+'</div><div class="pi-ch">'+v.channel+'</div></div>' +
      '<span class="pi-tag '+tagClass(v.tag)+'">'+v.tag+'</span>';
    d.onclick = function(){ loadVideo(i, true); };
    c.appendChild(d);
  });
}

function buildFocusPills(){
  var c = document.getElementById("focusCompact");
  if(!c) return;
  c.innerHTML = "";
  videos.forEach(function(v, i){
    var d = document.createElement("div");
    d.className = "focus-pill" + (i===0?" active":"");
    d.innerHTML =
      '<img src="'+thumb(v.id)+'" alt="" onerror="this.style.display=\'none\'"/>' +
      v.title.substring(0,28)+(v.title.length>28?"…":"");
    d.onclick = function(){ loadVideo(i, true); };
    c.appendChild(d);
  });
}

function buildBrowseGrid(){
  var c = document.getElementById("browseGrid");
  if(!c) return;
  c.innerHTML = "";
  videos.forEach(function(v, i){
    var d = document.createElement("div");
    d.className = "browse-card" + (i===0?" active":"");
    d.innerHTML =
      '<div class="bc-thumb">' +
        '<img src="'+thumb(v.id)+'" alt="" onerror="this.style.background=\'#dde\'"/>' +
        '<div class="bc-play-overlay"><i class="fas fa-play-circle"></i></div>' +
        '<span class="bc-tag">'+v.tag+'</span>' +
      '</div>' +
      '<div class="bc-body"><div class="bc-title">'+v.title+'</div>' +
      '<div class="bc-channel"><i class="fab fa-youtube"></i>'+v.channel+'</div></div>';
    d.onclick = function(){ loadVideo(i, true); };
    c.appendChild(d);
  });
}

function loadVideo(idx, autoplay){
  currentVideoIdx = idx;
  var v = videos[idx];
  var src = "https://www.youtube.com/embed/"+v.id+"?rel=0&modestbranding=1"+(autoplay?"&autoplay=1":"");

  /* update all players */
  var mp = document.getElementById("mainPlayer");
  var fp = document.getElementById("focusPlayer");
  if(mp) mp.src = src;
  if(fp) fp.src = src;

  /* now playing bars */
  ["npTitle","npTitleFocus"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.textContent = v.title;
  });
  ["npChannel","npChannelFocus"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.textContent = v.channel;
  });

  /* highlight active in all views */
  highlightActive("sidePlaylist",   "playlist-item", idx);
  highlightActive("focusCompact",   "focus-pill",    idx);
  highlightActive("browseGrid",     "browse-card",   idx);
}

function highlightActive(containerId, cls, idx){
  var c = document.getElementById(containerId);
  if(!c) return;
  var items = c.querySelectorAll("."+cls);
  items.forEach(function(el,i){ el.classList.toggle("active", i===idx); });
}

/* view switcher */
function setView(v){
  currentView = v;
  document.getElementById("viewSide").style.display     = (v==="side")     ? "" : "none";
  document.getElementById("viewFocus").style.display    = (v==="focus")    ? "" : "none";
  document.getElementById("viewPlaylist").style.display = (v==="playlist") ? "" : "none";

  document.getElementById("vbSide").classList.toggle("active",     v==="side");
  document.getElementById("vbFocus").classList.toggle("active",    v==="focus");
  document.getElementById("vbPlaylist").classList.toggle("active", v==="playlist");

  /* sync current video to newly visible player */
  loadVideo(currentVideoIdx, false);
}

/* init when tool-video is opened */
var _videoBuilt = false;
var _origOpenTool = openTool;
openTool = function(id){
  _origOpenTool(id);
  if(id === "tool-video" && !_videoBuilt){
    _videoBuilt = true;
    buildVideoUI();
  }
};
