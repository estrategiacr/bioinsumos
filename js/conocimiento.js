// =====================================
// VARIABLES
// =====================================

let recursos = [];
let recursosFiltrados = [];
let categoriaActual = "Todos";



const closeBtn =
document.getElementById("closeModal");

const fullscreenBtn =
document.getElementById("fullscreenBtn");

const modal =
    document.getElementById("resourceModal");

const modalContent =
    document.getElementById("modalContent");

console.log(document.getElementById("closeModal"));
console.log(document.getElementById("resourceModal"));
console.log(document.getElementById("fullscreenBtn"));

function closeResourceModal(){

    if(document.fullscreenElement){
        document.exitFullscreen();
    }

    modalContent.innerHTML = "";

    modal.classList.add("hidden");
}

closeBtn.addEventListener(
    "click",
    closeResourceModal
);

modal.addEventListener("click", (e)=>{

    if(e.target === modal){

        closeResourceModal();

    }

});

document
.querySelector(".modal-box")
.addEventListener("click",(e)=>{

    e.stopPropagation();

});

document.addEventListener(
    "keydown",
    (e)=>{

        if(e.key === "Escape"){

            closeResourceModal();

        }

    }
);

fullscreenBtn.addEventListener(
    "click",
    toggleFullscreen
);

function toggleFullscreen(){

    const modalBox =
    document.querySelector(".modal-box");

    if(!document.fullscreenElement){

        modalBox.requestFullscreen();

    }else{

        document.exitFullscreen();

    }

}

document.addEventListener(
    "fullscreenchange",
    ()=>{

        fullscreenBtn.textContent =
        document.fullscreenElement
            ? "🡼"
            : "⛶";

    }
);

// =====================================
// INICIALIZAR
// =====================================

document.addEventListener("DOMContentLoaded", async () => {

    recursos = await fetchRecursos();

    configurarBuscador();

    renderRecursos();
});

// =====================================
// BUSCADOR GLOBAL
// =====================================

function configurarBuscador(){

    const input =
    document.getElementById("resourceSearch");

    const btn =
    document.getElementById("resourceSearchBtn");

    btn?.addEventListener("click", renderRecursos);

    input?.addEventListener("keypress",(e)=>{

        if(e.key==="Enter"){
            renderRecursos();
        }

    });

    document
    .querySelectorAll(".tab")
    .forEach(tab=>{

        tab.addEventListener("click",()=>{

            document
            .querySelectorAll(".tab")
            .forEach(t=>t.classList.remove("active"));

            tab.classList.add("active");

            categoriaActual =
            tab.dataset.cat;

            renderRecursos();

        });

    });

}

// =====================================
// RENDER
// =====================================

function renderRecursos(){

    const grid =
    document.getElementById("recursosGrid");

    const total =
    document.getElementById("resourceCount");

    const query =
    document
    .getElementById("resourceSearch")
    ?.value
    ?.toLowerCase()
    ?.trim() || "";

    recursosFiltrados =
    recursos.filter(r=>{

        const matchCategoria =
        categoriaActual === "Todos"
        ||
        r.categoria === categoriaActual;

        const matchTexto =
        query === ""
        ||
        `
            ${r.nombre}
            ${r.tipo}
            ${r.categoria}
        `
        .toLowerCase()
        .includes(query);

        return matchCategoria && matchTexto;

    });

    if(total){

        total.innerHTML =
        `${recursosFiltrados.length} recursos encontrados`;

    }

    if(recursosFiltrados.length===0){

        grid.innerHTML = `
            <div class="empty-state">
                <h3>No se encontraron recursos</h3>
                <p>
                    Intenta otro término de búsqueda.
                </p>
            </div>
        `;

        return;
    }

    grid.innerHTML =
    recursosFiltrados
    .map(renderCard)
    .join("");

}

// =====================================
// CARD SEGÚN TIPO
// =====================================

function renderCard(recurso){

    const tipo =
    recurso.tipo?.toLowerCase();

    if(tipo==="video"){

        return renderVideoCard(recurso);

    }

    if(tipo==="pdf"){

        return renderPDFCard(recurso);

    }

    return renderGenericCard(recurso);

}

// =====================================
// VIDEO
// =====================================

function renderVideoCard(recurso){

    const thumb =
    getYoutubeThumbnail(recurso.enlace);

    return `

        <article
            class="resource-card"
            onclick="openResource(
                '${recurso.tipo}',
                '${recurso.enlace}'
            )"
        >

            <img
                class="resource-preview"
                src="${thumb}"
                alt="${recurso.nombre}"
            >

            <div class="resource-content">

                <span class="resource-type">
                    🎥 Video
                </span>

                <h3>
                    ${recurso.nombre}
                </h3>

                <p>
                    ${recurso.categoria}
                </p>

            </div>

        </article>

    `;

}

// =====================================
// PDF
// =====================================

function renderPDFCard(recurso){

    return `

        <article class="resource-card">

            <div class="pdf-mobile-preview">
                📄
            </div>

            <div class="resource-content">

                <span class="resource-type">
                    📚 Documento
                </span>

                <h3>
                    ${recurso.nombre}
                </h3>

                <p>
                    ${recurso.categoria}
                </p>

                <button
                    class="resource-btn"
                    onclick="openResource(
                        'pdf',
                        '${recurso.enlace}'
                    )"
                >
                    Ver documento
                </button>

            </div>

        </article>

    `;

}

// =====================================
// OTROS
// =====================================

function renderGenericCard(recurso){

    return `

        <article class="resource-card">

            <div class="resource-placeholder">
                📁
            </div>

            <div class="resource-content">

                <span class="resource-type">
                    ${recurso.tipo}
                </span>

                <h3>
                    ${recurso.nombre}
                </h3>

                <p>
                    ${recurso.categoria}
                </p>

                <a
                    class="resource-btn"
                    href="${recurso.enlace}"
                    target="_blank"
                >
                    Abrir recurso
                </a>

            </div>

        </article>

    `;

}

// =====================================
// YOUTUBE
// =====================================

function getYoutubeThumbnail(url){

    const match =
    url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/i
    );

    return match
      ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
      : "assets/images/video-placeholder.jpg";

}

// =====================================
// MODAL
// =====================================

function openResource(tipo,enlace){

    

    if(tipo.toLowerCase()==="video"){

        const embed =
        getYoutubeEmbed(enlace);

        content.innerHTML = `
            <iframe
                src="${embed}"
                allowfullscreen
            ></iframe>
        `;

    }else{

        content.innerHTML = `
            <iframe
                src="${enlace}"
            ></iframe>
        `;

    }

    modal.classList.remove("hidden");

}

function getYoutubeEmbed(url){

    const match =
    url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^?&]+)/i
    );

    return match
      ? `https://www.youtube.com/embed/${match[1]}`
      : "";

}

// document
// .getElementById("closeModal")
// ?.addEventListener("click",()=>{

//     document
//     .getElementById("resourceModal")
//     .classList.add("hidden");

//     document
//     .getElementById("modalContent")
//     .innerHTML="";

// });