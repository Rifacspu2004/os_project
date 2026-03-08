document.addEventListener("DOMContentLoaded", function () {

const pageButtons = document.querySelectorAll(".page-btn");
const contentSections = document.querySelectorAll(".content-section");

function showPage(pageNumber) {

contentSections.forEach(function(section) {
section.classList.remove("active");
});

const targetSection = document.getElementById("page-" + pageNumber);

if (targetSection) {

targetSection.classList.add("active");

/* scroll to top of the section */

window.scrollTo({
top: targetSection.offsetTop - 20,
behavior: "smooth"
});

}

pageButtons.forEach(function(button) {

button.classList.remove("active");

if (button.getAttribute("data-page") === pageNumber) {
button.classList.add("active");
}

});

}

pageButtons.forEach(function(button){

button.addEventListener("click", function(){

const pageNumber = this.getAttribute("data-page");

showPage(pageNumber);

});

});

/* show first page initially */

showPage("1");

});