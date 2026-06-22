function activateCurrentMenu(){

    const current =
    window.location.pathname.split("/").pop();

    document
    .querySelectorAll(".main-nav a")
    .forEach(link=>{

        const href = link.getAttribute("href");

        if(href===current){

            link.classList.add("active");

        }

    });
}

document.addEventListener(
"DOMContentLoaded",
activateCurrentMenu
);