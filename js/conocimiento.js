let bibliotecaCompleta = [];
let itemsFiltrados = [];
let categoriaActual = "Todos";
let paginaActual = 1;
const ITEMS_POR_PAGINA = 6;

const SHEET_CSV_TECNICA      = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=1587744224&single=true&output=csv";
const SHEET_CSV_MULTIMEDIA   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=194535019&single=true&output=csv";
const SHEET_CSV_CAPACITACION = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=1587744224&single=true&output=csv";

const modal = document.getElementById("resourceModal");
const modalContent = document.getElementById("modalContent");
const modalTitle = document.getElementById("modalTitle");
const closeBtn = document.getElementById("closeModal");
const fullscreenBtn = document.getElementById("fullscreenBtn");

function parsearLineaCSV(linea) {
  const resultado = [];
  let dentroDeComillas = false;
  let entradaActual = "";
  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];
    if (char === '"') dentroDeComillas = !insideQuotes;
    else if (char === ',' && !dentroDeComillas) {
      resultado.push(entradaActual.trim().replace(/^"|"$/g, ''));
      entradaActual = "";
    } else entradaActual += char;
  }
  resultado.push(entradaActual.trim().replace(/^"|"$/g, ''));
  return resultado;
}

async function inicializarBiblioteca() {
  try {
    const [resTecnica, resMultimedia, resCapacitacion] = await Promise.all([
      fetch(SHEET_CSV_TECNICA).then(r => r.text()),
      fetch(SHEET_CSV_MULTIMEDIA).then(r => r.text()),
      fetch(SHEET_CSV_CAPACITACION).then(r => r.text())
    ]);

    bibliotecaCompleta = [
      ...procesarDatosHoja(resTecnica, "Tecnica"),
      ...procesarDatosHoja(resMultimedia, "Multimedia"),
      ...procesarDatosHoja(resCapacitacion, "Capacitacion")
    ];
    filtrarYCalcular();
  } catch (error) {
    console.error("Error cargando repositorio:", error);
  }
}

function procesarDatosHoja(csvTexto, tipoLista) {
  const filas = csvTexto.split(/\r?\n/).filter(r => r.trim() !== "");
  if (filas.length <= 1) return [];
  return filas.slice(1).map(row => {
    const values = parsearLineaCSV(row);
    return {
      titulo: values[0] || "Recurso sin título",
      tipo: values[1] || "Enlace",
      categoria: values[2] || "General",
      enlaceRecurso: values[3] || "",
      imagenUrl: values[4] || "", 
      listaOrigen: tipoLista
    };
  });
}

function filtrarYCalcular() {
  // Sincroniza las entradas de los dos buscadores (móvil y escritorio)
  const activeInput = document.querySelector(".mobile-floating-dock").getBoundingClientRect().height > 0 
    ? document.querySelector(".mobile-search-bar input")
    : document.querySelector(".search-box input");
    
  const query = activeInput ? activeInput.value.toLowerCase().trim() : "";

  itemsFiltrados = bibliotecaCompleta.filter(item => {
    const matchCategoria = (categoriaActual === "Todos") || (item.listaOrigen === categoriaActual);
    const matchTexto = (query === "") || item.titulo.toLowerCase().includes(query) || item.categoria.toLowerCase().includes(query);
    return matchCategoria && matchTexto;
  });
  paginaActual = 1;
  renderizarPantalla();
}

/* =========================================================
   RENDER DE TARJETAS CON EFECTO DE PORTADA DE DOCUMENTO
========================================================= */
function renderCardComponent(item) {
  const enlace = item.enlaceRecurso || "";
  const esVideo = enlace.includes("youtube.com") || enlace.includes("youtu.be");
  const esPDF = enlace.toLowerCase().includes(".pdf") || item.tipo.toLowerCase().includes("documento");
  let areaPreviewHTML = "";

  if (esVideo) {
    const match = enlace.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/i);
    const videoThumb = match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=400";
    areaPreviewHTML = `
      <div class="card-preview-area" onclick="openResource('video', '${enlace}', '${item.titulo}')" style="cursor:pointer;">
        <img src="${videoThumb}" alt="${item.titulo}">
        <span style="position:absolute; background:rgba(22,101,52,0.95); color:white; padding:0.3rem 0.6rem; border-radius:6px; font-size:0.65rem; font-weight:700;"><i class="fa-solid fa-circle-play"></i> VER MULTIMEDIA</span>
      </div>`;
  } else {
    if (item.imagenUrl && item.imagenUrl.trim() !== "") {
      areaPreviewHTML = `<div class="card-preview-area"><img src="${item.imagenUrl}" alt="${item.titulo}"></div>`;
    } else {
      // ESTRUCTURA DE PORTADA SIMULADA: Genera una vista de primera página de informe real
      areaPreviewHTML = `
        <div class="card-preview-area">
          <div class="pdf-mock-cover">
            <div style="font-size:0.6rem; color:var(--primary); font-weight:800; letter-spacing:0.05em;"><i class="fa-solid fa-ribbon"></i> PUBLICACIÓN OFICIAL</div>
            <div style="font-size:0.8rem; font-weight:700; color:var(--text); margin-top:0.5rem; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${item.titulo}</div>
            <div style="display:flex; justify-content:between; align-items:center; margin-top:auto; border-top:1px solid var(--border); padding-top:0.4rem;">
               <span style="font-size:0.6rem; color:var(--muted); font-weight:600;">Pilar 1 · Costa Rica</span>
               <i class="${esPDF ? 'fa-solid fa-file-pdf' : 'fa-solid fa-globe'}" style="color:var(--primary); font-size:1.1rem; margin-left:auto;"></i>
            </div>
          </div>
        </div>`;
    }
  }

  return `
    <article class="tech-card">
      <div>
        ${areaPreviewHTML}
        <h4 style="font-weight:700; color:var(--text); line-height:1.3; font-size:1rem;">${item.titulo}</h4>
      </div>
      <div style="margin-top:1rem;">
        <p style="font-size:0.75rem; color:var(--muted); font-weight:700; text-transform:uppercase;"><i class="fa-solid fa-tag"></i> ${item.categoria}</p>
        <button class="map-tab-btn active" style="width:100%; border-radius:10px; font-size:0.8rem; padding:0.5rem; justify-content:center; margin-top:0.5rem;" onclick="openResource('${esPDF ? 'pdf' : (esVideo ? 'video' : 'externo')}', '${enlace}', '${item.titulo}')">
          Leer / Ver Recurso
        </button>
      </div>
    </article>
  `;
}

function renderizarPantalla() {
  const grid = document.getElementById("recursosGrid");
  const countDisplay = document.getElementById("resourceCount");
  if (countDisplay) countDisplay.innerHTML = `Resultados: <b>${itemsFiltrados.length}</b> materiales encontrados`;

  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  grid.innerHTML = itemsFiltrados.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA).map(renderCardComponent).join("");
  renderizarControlesPaginacion();
}

function renderizarControlesPaginacion() {
  const container = document.getElementById("paginationControls");
  const totalPaginas = Math.ceil(itemsFiltrados.length / ITEMS_POR_PAGINA);
  if (totalPaginas <= 1) { container.innerHTML = ""; return; }

  let html = `<button class="pagination-btn" onclick="cambiarPagina(${paginaActual - 1})" ${paginaActual === 1 ? 'disabled' : ''}>&lt;</button>`;
  for (let i = 1; i <= totalPaginas; i++) {
    html += `<button class="pagination-btn ${paginaActual === i ? 'active' : ''}" onclick="cambiarPagina(${i})">${i}</button>`;
  }
  html += `<button class="pagination-btn" onclick="cambiarPagina(${paginaActual + 1})" ${paginaActual === totalPaginas ? 'disabled' : ''}>&gt;</button>`;
  container.innerHTML = html;
}

function cambiarPagina(p) { paginaActual = p; renderizarPantalla(); }

function openResource(tipo, enlace, titulo) {
  if (titulo && modalTitle) modalTitle.textContent = titulo;
  if (tipo === "externo") { window.open(enlace, '_blank'); return; }
  
  if (tipo === "video") {
    const match = enlace.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^?&]+)/i);
    modalContent.innerHTML = `<iframe src="https://www.youtube.com/embed/${match[1]}?autoplay=1" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  } else {
    modalContent.innerHTML = `<iframe src="${enlace}" style="width:100%; height:100%; border:none;"></iframe>`;
  }
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeResourceModal() {
  if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
  modalContent.innerHTML = "";
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function toggleFullscreen() {
  const box = document.getElementById("modalBox");
  if (!document.fullscreenElement) box.requestFullscreen().catch(()=>{});
  else document.exitFullscreen();
}

function asociarManejadoresInterfaz() {
  document.getElementById("menuToggle").addEventListener("click", () => document.getElementById("mainNav").classList.toggle("open"));

  // Enlazar los inputs tanto de la barra superior como de la flotante móvil
  document.querySelectorAll(".global-search-input").forEach(inp => {
    inp.addEventListener("input", (e) => {
      document.querySelectorAll(".global-search-input").forEach(other => other.value = e.target.value);
      filtrarYCalcular();
    });
  });

  // Listener unificado de pestañas
  document.querySelectorAll(".map-tab-btn").forEach(tab => {
    tab.addEventListener("click", () => {
      const cat = tab.getAttribute("data-cat");
      categoriaActual = cat;
      document.querySelectorAll(".map-tab-btn").forEach(t => {
        t.classList.toggle("active", t.getAttribute("data-cat") === cat);
      });
      filtrarYCalcular();
    });
  });
}

if (closeBtn) closeBtn.addEventListener("click", closeResourceModal);
if (fullscreenBtn) fullscreenBtn.addEventListener("click", toggleFullscreen);

document.addEventListener("DOMContentLoaded", () => {
  asociarManejadoresInterfaz();
  inicializarBiblioteca();
});