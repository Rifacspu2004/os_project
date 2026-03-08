// MENU TOGGLE

function toggleMenu(){
document.getElementById("side-menu").classList.toggle("active");
document.querySelector(".container").classList.toggle("shift");

}


// TOOL PAGE SWITCHING

function openTool(id){

document.querySelectorAll(".tool-page").forEach(function(page){
page.classList.remove("active");
});

let selected=document.getElementById(id);

if(selected){
selected.classList.add("active");
}

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




// FIFO SIMULATOR

function runFIFO(){

let ref=document.getElementById("refString").value.split(" ");
let frames=parseInt(document.getElementById("frames").value);

let memory=[];
let faults=0;
let pointer=0;

for(let i=0;i<ref.length;i++){

let page=ref[i];

if(!memory.includes(page)){

if(memory.length<frames){
memory.push(page);
}else{
memory[pointer]=page;
pointer=(pointer+1)%frames;
}

faults++;

}

}

document.getElementById("result").innerHTML=
"Page Faults : "+faults;

}
