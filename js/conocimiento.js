// =====================================
// VARIABLES Y SELECTORES
// =====================================
let recursos = [];
let recursosFiltrados = [];
let categoriaActual = "Todos";

const closeBtn = document.getElementById("closeModal");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const modal = document.getElementById("resourceModal");
const modalContent = document.getElementById("modalContent"); // Corregido el enlace para el Iframe

// =====================================
// MANEJO DEL MODAL MULTIMEDIA
// =====================================
function closeResourceModal() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
    modalContent.innerHTML = "";
    modal.classList.add("hidden");
}

if (closeBtn) closeBtn.addEventListener("click", closeResourceModal);

if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeResourceModal();
    });
}

const modalBox = document.querySelector(".modal-box");
if (modalBox) {
    modalBox.addEventListener("click", (e) => {
        e.stopPropagation();
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeResourceModal();
});

if (fullscreenBtn) fullscreenBtn.addEventListener("click", toggleFullscreen);

function toggleFullscreen() {
    const box = document.querySelector(".modal-box");
    if (!document.fullscreenElement) {
        box.requestFullscreen().catch(err => console.log(err));
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener("fullscreenchange", () => {
    if (fullscreenBtn) {
        fullscreenBtn.textContent = document.fullscreenElement ? "🡼" : "⛶";
    }
});

// =====================================
// INICIALIZAR CAPA DE CONOCIMIENTO
// =====================================
document.addEventListener("DOMContentLoaded", async () => {
    // Vincula con la función fetchInnovaciones o crea fetchRecursos en data.js si usas otra tabla
    recursos = await fetchRecursos(); 
    configurarBuscador();
    renderRecursos();
});

// =====================================
// LOGICA DE FILTROS Y EVENTOS
// =====================================
function configurarBuscador() {
    const input = document.getElementById("resourceSearch");
    const btn = document.getElementById("resourceSearchBtn");

    if (btn) btn.addEventListener("click", renderRecursos);
    if (input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") renderRecursos();
        });
    }

    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            categoriaActual = tab.dataset.cat;
            renderRecursos();
        });
    });
}

// =====================================
// RENDERIZADO DINÁMICO DE TARJETAS
// =====================================
function renderRecursos() {
    const grid = document.getElementById("recursosGrid");
    const total = document.getElementById("resourceCount");
    const searchInput = document.getElementById("resourceSearch");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    recursosFiltrados = recursos.filter(r => {
        // Validación de categoría (Pestañas)
        const matchCategoria = (categoriaActual === "Todos") || 
                               (r.categoria && r.categoria.toLowerCase().includes(categoriaActual.toLowerCase()));

        // Validación de texto en buscador
        const matchTexto = (query === "") || 
                           (r.titulo && r.titulo.toLowerCase().includes(query)) ||
                           (r.descripcion && r.descripcion.toLowerCase().includes(query)) ||
                           (r.organizacion && r.organizacion.toLowerCase().includes(query));

        return matchCategoria && matchTexto;
    });

    if (total) {
        total.innerHTML = `${recursosFiltrados.length} recursos encontrados`;
    }

    if (!grid) return;

    if (recursosFiltrados.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No se encontraron recursos</h3>
                <p>Intenta cambiar los términos de búsqueda o selecciona otra categoría.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = recursosFiltrados.map(renderCard).join("");
}

function renderCard(recurso) {
    // Discriminación inteligente por tipo o categoría para renderizar la tarjeta adecuada
    const enlace = recurso.enlaceRecurso || "";
    const esVideo = enlace.includes("youtube.com") || enlace.includes("youtu.be");

    if (esVideo) {
        return renderVideoCard(recurso, enlace);
    } else if (enlace.toLowerCase().includes(".pdf") || recurso.categoria.toLowerCase().includes("documento")) {
        return renderPDFCard(recurso, enlace);
    }
    return renderGenericCard(recurso, enlace);
}

function renderVideoCard(recurso, enlace) {
    const thumb = getYoutubeThumbnail(enlace);
    return `
        <article class="resource-card" onclick="openResource('video', '${enlace}')" style="cursor:pointer;">
            <img class="resource-preview" src="${thumb}" alt="${recurso.titulo}">
            <div class="resource-content">
                <span class="resource-category">🎥 Video</span>
                <h3 style="margin-top:0.5rem;">${recurso.titulo}</h3>
                <p>${recurso.organizacion}</p>
            </div>
        </article>
    `;
}

function renderPDFCard(recurso, enlace) {
    return `
        <article class="resource-card">
            <div class="resource-preview" style="background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:3.5rem;">📄</div>
            <div class="resource-content">
                <span class="resource-category">📚 Documento</span>
                <h3 style="margin-top:0.5rem;">${recurso.titulo}</h3>
                <p>${recurso.organizacion}</p>
                <button class="resource-btn" onclick="openResource('pdf', '${enlace}')">Ver documento</button>
            </div>
        </article>
    `;
}

function renderGenericCard(recurso, enlace) {
    return `
        <article class="resource-card">
            <div class="resource-preview" style="background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:3.5rem;">🔗</div>
            <div class="resource-content">
                <span class="resource-category">${recurso.categoria || 'Recurso'}</span>
                <h3 style="margin-top:0.5rem;">${recurso.titulo}</h3>
                <p>${recurso.organizacion}</p>
                <a class="resource-btn" href="${enlace}" target="_blank">Abrir enlace externo</a>
            </div>
        </article>
    `;
}

function getYoutubeThumbnail(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/i);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=600";
}

// =====================================
// CONTROL DE APERTURA (IFRAME EMBED)
// =====================================
function openResource(tipo, enlace) {
    if (!modalContent || !modal) return;

    if (tipo === "video") {
        const embed = getYoutubeEmbed(enlace);
        modalContent.innerHTML = `<iframe src="${embed}" allowfullscreen></iframe>`;
    } else {
        modalContent.innerHTML = `<iframe src="${enlace}"></iframe>`;
    }
    modal.classList.remove("hidden");
}

function getYoutubeEmbed(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^?&]+)/i);
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}