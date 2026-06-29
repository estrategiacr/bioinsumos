/* =========================================================
   ESTADO GLOBAL Y VARIABLES
========================================================= */
let recursos = [];
let recursosFiltrados = [];
let categoriaActual = "Todos";

// URL exacta de tu hoja publicada para el Pilar 1 (Recursos)
const SHEET_CSV_RECURSOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=1587744224&single=true&output=csv";

const modal = document.getElementById("resourceModal");
const modalContent = document.getElementById("modalContent");
const modalTitle = document.getElementById("modalTitle");
const closeBtn = document.getElementById("closeModal");
const fullscreenBtn = document.getElementById("fullscreenBtn");

/* =========================================================
   SPLIT INTELIGENTE PARA CSV (Evita roturas por comillas)
========================================================= */
function parsearLineaCSV(linea) {
  const resultado = [];
  let dentroDeComillas = false;
  let entradaActual = "";

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];
    if (char === '"') {
      dentroDeComillas = !dentroDeComillas;
    } else if (char === ',' && !dentroDeComillas) {
      resultado.push(entradaActual.trim().replace(/^"|"$/g, ''));
      entradaActual = "";
    } else {
      entradaActual += char;
    }
  }
  resultado.push(entradaActual.trim().replace(/^"|"$/g, ''));
  return resultado;
}

/* =========================================================
   EXTRACCIÓN ASÍNCRONA DESDE GOOGLE SHEETS
========================================================= */
async function fetchRecursos() {
  try {
    const response = await fetch(SHEET_CSV_RECURSOS);
    const csv = await response.text();
    const rows = csv.split(/\r?\n/).filter(row => row.trim() !== "");
    
    // Mapeo basado en tu estructura (nombre, tipo, categoria, enlace)
    recursos = rows.slice(1).map(row => {
      const values = parsearLineaCSV(row);
      return {
        titulo: values[0] || "Recurso sin título",
        tipo: values[1] || "Enlace",
        categoria: values[2] || "General",
        enlaceRecurso: values[3] || "",
        organizacion: "Bioinsumos CR" // Valor por defecto institucional
      };
    });
    renderRecursos();
  } catch (error) {
    console.error("Error al sincronizar catálogo de Bioinsumos:", error);
    document.getElementById("recursosGrid").innerHTML = "<p>No se pudo cargar la biblioteca en este momento.</p>";
  }
}

/* =========================================================
   LÓGICA INTERACTIVA Y RENDERIZADO (3 BLOQUES)
========================================================= */
function configurarBuscador() {
  const input = document.getElementById("resourceSearch");
  const btn = document.getElementById("resourceSearchBtn");
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });
  }

  if (btn) btn.addEventListener("click", renderRecursos);
  if (input) {
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") renderRecursos(); });
    input.addEventListener("input", renderRecursos); // Búsqueda reactiva instantánea
  }

  document.querySelectorAll(".map-tab-btn").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".map-tab-btn").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      categoriaActual = tab.getAttribute("data-cat");
      renderRecursos();
    });
  });
}

function renderRecursos() {
  const grid = document.getElementById("recursosGrid");
  const total = document.getElementById("resourceCount");
  const searchInput = document.getElementById("resourceSearch");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

  recursosFiltrados = recursos.filter(r => {
    const matchCategoria = (categoriaActual === "Todos") || 
                           (r.categoria && r.categoria.toLowerCase().includes(categoriaActual.toLowerCase()));

    const matchTexto = (query === "") || 
                       (r.titulo && r.titulo.toLowerCase().includes(query)) ||
                       (r.tipo && r.tipo.toLowerCase().includes(query));

    return matchCategoria && matchTexto;
  });

  if (total) total.innerHTML = `${recursosFiltrados.length} recursos disponibles en el Pilar 1`;
  if (!grid) return;

  if (recursosFiltrados.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--muted);">
        <i class="fa-solid fa-magnifying-glass" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
        <h3>No se encontraron coincidencias</h3>
        <p>Intente modificando los términos del buscador.</p>
      </div>`;
    return;
  }

  grid.innerHTML = recursosFiltrados.map(renderCard).join("");
}

function renderCard(recurso) {
  const enlace = recurso.enlaceRecurso || "";
  const esVideo = enlace.includes("youtube.com") || enlace.includes("youtu.be");
  const esPDF = enlace.toLowerCase().includes(".pdf") || recurso.tipo.toLowerCase().includes("documento");

  if (esVideo) {
    const match = enlace.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/i);
    const thumb = match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=600";

    return `
      <article class="tech-card" style="cursor:pointer;" onclick="openResource('video', '${enlace}', '${recurso.titulo}')">
        <div style="position:relative; border-radius:12px; overflow:hidden; aspect-ratio:16/9; background:#000; margin-bottom:1rem;">
          <img src="${thumb}" alt="${recurso.titulo}" style="width:100%; height:100%; object-fit:cover;">
          <span style="position:absolute; bottom:8px; right:8px; background:rgba(22,101,52,0.9); color:white; padding:0.2rem 0.5rem; border-radius:4px; font-size:0.75rem;"><i class="fa-solid fa-video"></i> Video</span>
        </div>
        <h4 style="font-weight:700; color:var(--text); line-height:1.3;">${recurso.titulo}</h4>
        <p style="font-size:0.85rem; color:var(--primary); margin-top:0.5rem; font-weight:600;"><i class="fa-solid fa-tag"></i> ${recurso.categoria}</p>
      </article>
    `;
  }

  return `
    <article class="tech-card" style="display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="border-radius:12px; background:var(--surface-2); aspect-ratio:16/9; display:flex; align-items:center; justify-content:center; font-size:2.5rem; color:var(--primary); margin-bottom:1rem; border:1px solid var(--border);">
          <i class="${esPDF ? 'fa-solid fa-file-pdf' : 'fa-solid fa-globe'}"></i>
        </div>
        <h4 style="font-weight:700; color:var(--text); line-height:1.3;">${recurso.titulo}</h4>
      </div>
      <button class="map-tab-btn active" style="width:100%; margin-top:1.5rem; border-radius:10px; font-size:0.9rem;" onclick="openResource('${esPDF ? 'pdf' : 'externo'}', '${enlace}', '${recurso.titulo}')">
        ${esPDF ? '<i class="fa-solid fa-book-open"></i> Ver Documento' : '<i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir Enlace'}
      </button>
    </article>
  `;
}

/* =========================================================
   CONTROL DEL MODAL (Ajuste Celular e Iframe)
========================================================= */
function openResource(tipo, enlace, titulo) {
  if (!modalContent || !modal) return;
  if (titulo && modalTitle) modalTitle.textContent = titulo;

  if (tipo === "externo") {
    window.open(enlace, '_blank');
    return;
  }

  if (tipo === "video") {
    const match = enlace.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^?&]+)/i);
    const embedUrl = match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : "";
    modalContent.innerHTML = `<iframe src="${embedUrl}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  } else if (tipo === "pdf") {
    modalContent.innerHTML = `<iframe src="${enlace}" style="width:100%; height:100%; border:none;"></iframe>`;
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Congela fondo para vista móvil limpia
}

function closeResourceModal() {
  if (document.fullscreenElement) document.exitFullscreen().catch(e => console.log(e));
  if (modalContent) modalContent.innerHTML = "";
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function toggleFullscreen() {
  const box = document.querySelector(".modal-box");
  if (!document.fullscreenElement) {
    if (box.requestFullscreen) box.requestFullscreen();
    else if (box.webkitRequestFullscreen) box.webkitRequestFullscreen(); // Safari iOS/móviles
  } else {
    document.exitFullscreen();
  }
}

if (closeBtn) closeBtn.addEventListener("click", closeResourceModal);
if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeResourceModal(); });
if (fullscreenBtn) fullscreenBtn.addEventListener("click", toggleFullscreen);

document.addEventListener("DOMContentLoaded", () => {
  configurarBuscador();
  fetchRecursos();
});