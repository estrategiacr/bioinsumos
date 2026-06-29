/* =========================================================
   ESTADO DE LA APLICACIÓN Y CONFIGURACIÓN DE ORIGENES
========================================================= */
let bibliotecaCompleta = [];
let itemsFiltrados = [];
let categoriaActual = "Todos";

// Paginación (6 elementos por bloque tal como en tu archivo base)
let paginaActual = 1;
const ITEMS_POR_PAGINA = 6;

// Tus tres fuentes de datos específicas (Google Sheets CSV)
const SHEET_CSV_TECNICA      = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=1587744224&single=true&output=csv";
const SHEET_CSV_MULTIMEDIA   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=194535019&single=true&output=csv";
const SHEET_CSV_CAPACITACION = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=1587744224&single=true&output=csv";

// Selectores del DOM
const modal = document.getElementById("resourceModal");
const modalContent = document.getElementById("modalContent");
const modalTitle = document.getElementById("modalTitle");
const closeBtn = document.getElementById("closeModal");
const fullscreenBtn = document.getElementById("fullscreenBtn");

/* =========================================================
   PARSER INTELIGENTE DE LÍNEAS CSV
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
   CARGA SIMULTÁNEA DE LAS TRES LISTAS REQUERIDAS
========================================================= */
async function inicializarBiblioteca() {
  try {
    const [resTecnica, resMultimedia, resCapacitacion] = await Promise.all([
      fetch(SHEET_CSV_TECNICA).then(r => r.text()),
      fetch(SHEET_CSV_MULTIMEDIA).then(r => r.text()),
      fetch(SHEET_CSV_CAPACITACION).then(r => r.text())
    ]);

    const datosTecnica = procesarDatosHoja(resTecnica, "Tecnica");
    const datosMultimedia = procesarDatosHoja(resMultimedia, "Multimedia");
    const datosCapacitacion = procesarDatosHoja(resCapacitacion, "Capacitacion");

    // Fusión limpia sin colisiones en un único repositorio indexado
    bibliotecaCompleta = [...datosTecnica, ...datosMultimedia, ...datosCapacitacion];
    
    filtrarYCalcular();
  } catch (error) {
    console.error("Error cargando hojas de datos sincronizadas:", error);
    document.getElementById("recursosGrid").innerHTML = "<p style='grid-column:1/-1; text-align:center;'>Error de sincronización con Google Sheets.</p>";
  }
}

function procesarDatosHoja(csvTexto, tipoLista) {
  const filas = csvTexto.split(/\r?\n/).filter(r => r.trim() !== "");
  if (filas.length <= 1) return [];

  return filas.slice(1).map(row => {
    const values = parsearLineaCSV(row);
    return {
      titulo: values[0] || "Recurso sin nombre",
      tipo: values[1] || "Enlace",
      categoria: values[2] || "General",
      enlaceRecurso: values[3] || "",
      // Mapeo inteligente de imagen: si existe la columna 4 la usa, si no, se deja vacía
      imagenUrl: values[4] || "", 
      listaOrigen: tipoLista
    };
  });
}

/* =========================================================
   PROCESAMIENTO DE FILTROS, BÚSQUEDA Y PAGINACIÓN
========================================================= */
function filtrarYCalcular() {
  const searchInput = document.getElementById("resourceSearch");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

  itemsFiltrados = bibliotecaCompleta.filter(item => {
    const matchCategoria = (categoriaActual === "Todos") || (item.listaOrigen === categoriaActual);
    const matchTexto = (query === "") || 
                       (item.titulo.toLowerCase().includes(query)) ||
                       (item.categoria.toLowerCase().includes(query));
    return matchCategoria && matchTexto;
  });

  paginaActual = 1; // Reinicia a la primera página ante cualquier cambio de criterio
  renderizarPantalla();
}

function renderizarPantalla() {
  const grid = document.getElementById("recursosGrid");
  const countDisplay = document.getElementById("resourceCount");

  if (countDisplay) {
    countDisplay.innerHTML = `Mostrando <b>${itemsFiltrados.length}</b> recursos del repositorio nacional`;
  }

  if (!grid) return;

  if (itemsFiltrados.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: var(--muted);">
        <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--primary);"></i>
        <h4>No se encontraron materiales</h4>
        <p>Pruebe limpiando el buscador o cambiando la categoría activa.</p>
      </div>`;
    document.getElementById("paginationControls").innerHTML = "";
    return;
  }

  // Segmentación matemática para cortes por página (Paginación activa)
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const indiceFin = indiceInicio + ITEMS_POR_PAGINA;
  const itemsPagina = itemsFiltrados.slice(indiceInicio, indiceFin);

  grid.innerHTML = itemsPagina.map(renderCardComponent).join("");
  renderizarControlesPaginacion();
}

/* =========================================================
   COMPONENTE TARJETA: SOPORTE DE VISTA PREVIA PDF E IMAGEN
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
        <span style="position:absolute; bottom:8px; right:8px; background:rgba(22,101,52,0.9); color:white; padding:0.25rem 0.6rem; border-radius:6px; font-size:0.7rem; font-weight:700;"><i class="fa-solid fa-play"></i> REPRODUCIR</span>
      </div>`;
  } else {
    // RESOLUCIÓN DE IMAGEN PARA PDF / ENLACES GENERALES
    // Si tienes una URL de imagen cargada en la columna correspondiente la usa, de lo contrario despliega un fondo sutil corporativo
    if (item.imagenUrl && item.imagenUrl.trim() !== "") {
      areaPreviewHTML = `
        <div class="card-preview-area">
          <img src="${item.imagenUrl}" alt="${item.titulo}">
        </div>`;
    } else {
      // Fallback estético si no hay imagen asignada en el Excel
      const iconClass = esPDF ? "fa-solid fa-file-pdf" : "fa-solid fa-arrow-up-right-from-square";
      const badgeText = esPDF ? "DOCUMENTO PDF" : "ENLACE EXTERNO";
      areaPreviewHTML = `
        <div class="card-preview-area" style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); flex-direction:column; gap:0.5rem; border:1px solid var(--border);">
          <i class="${iconClass}" style="font-size: 2.8rem; color: var(--primary);"></i>
          <span style="font-size:0.65rem; letter-spacing:0.05em; font-weight:700; color:var(--muted);">${badgeText}</span>
        </div>`;
    }
  }

  return `
    <article class="tech-card">
      <div>
        ${areaPreviewHTML}
        <h4 style="font-weight:700; color:var(--text); line-height:1.3; font-size:1.05rem; margin-top:0.2rem;">${item.titulo}</h4>
      </div>
      <div style="margin-top: 1.25rem;">
        <p style="font-size:0.8rem; color:var(--muted); font-weight:600; text-transform:uppercase; margin-bottom:0.75rem;"><i class="fa-solid fa-bookmark" style="color:var(--primary);"></i> ${item.categoria}</p>
        <button class="map-tab-btn active" style="width:100%; border-radius:10px; font-size:0.85rem; padding: 0.5rem 1rem;" onclick="openResource('${esPDF ? 'pdf' : (esVideo ? 'video' : 'externo')}', '${enlace}', '${item.titulo}')">
          ${esPDF ? '<i class="fa-solid fa-book-open"></i> Abrir Documento' : (esVideo ? '<i class="fa-solid fa-circle-play"></i> Ver Video' : '<i class="fa-solid fa-arrow-up-right-from-square"></i> Visitar Sitio')}
        </button>
      </div>
    </article>
  `;
}

/* =========================================================
   RENDERIZADOR DINÁMICO DE CONTROLES DE PAGINACIÓN
========================================================= */
function renderizarControlesPaginacion() {
  const container = document.getElementById("paginationControls");
  if (!container) return;

  const totalPaginas = Math.ceil(itemsFiltrados.length / ITEMS_POR_PAGINA);
  if (totalPaginas <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `
    <button class="pagination-btn" id="prevPageBtn" ${paginaActual === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
  `;

  for (let i = 1; i <= totalPaginas; i++) {
    html += `
      <button class="pagination-btn ${paginaActual === i ? 'active' : ''}" onclick="cambiarPagina(${i})">${i}</button>
    `;
  }

  html += `
    <button class="pagination-btn" id="nextPageBtn" ${paginaActual === totalPaginas ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
  `;

  container.innerHTML = html;

  // Listeners de flechas de navegación
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");

  if (prevBtn) prevBtn.addEventListener("click", () => { if (paginaActual > 1) cambiarPagina(paginaActual - 1); });
  if (nextBtn) nextBtn.addEventListener("click", () => { if (paginaActual < totalPaginas) cambiarPagina(paginaActual + 1); });
}

function cambiarPagina(numeroPagina) {
  paginaActual = numeroPagina;
  renderizarPantalla();
  // Hace un scroll suave al inicio de los resultados para mejorar la usabilidad
  document.getElementById("recursosGrid").scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* =========================================================
   MANEJO DEL MODAL MULTIMEDIA E INTERFACES MÓVILES
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
  document.body.style.overflow = "hidden";
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
    else if (box.webkitRequestFullscreen) box.webkitRequestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

/* =========================================================
   ASIGNACIÓN DE ESCUCHAS AUTOMÁTICAS
========================================================= */
function asociarManejadoresInterfaz() {
  const input = document.getElementById("resourceSearch");
  const btn = document.getElementById("resourceSearchBtn");
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => { mainNav.classList.toggle("open"); });
  }

  if (btn) btn.addEventListener("click", filtrarYCalcular);
  if (input) {
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") filtrarYCalcular(); });
    input.addEventListener("input", filtrarYCalcular);
  }

  document.querySelectorAll(".map-tab-btn").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".map-tab-btn").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      categoriaActual = tab.getAttribute("data-cat");
      filtrarYCalcular();
    });
  });
}

if (closeBtn) closeBtn.addEventListener("click", closeResourceModal);
if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeResourceModal(); });
if (fullscreenBtn) fullscreenBtn.addEventListener("click", toggleFullscreen);

document.addEventListener("DOMContentLoaded", () => {
  asociarManejadoresInterfaz();
  inicializarBiblioteca();
});