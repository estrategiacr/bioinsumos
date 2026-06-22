// =============================
// CONFIGURACIÓN DEL MAPA
// =============================
const bounds = L.latLngBounds(
  [8.0, -86.5],   // suroeste
  [11.5, -82.0]   // noreste
);

const map = L.map("map", {
  maxBounds: bounds,
  maxBoundsViscosity: 1.0,
  minZoom: 7,
  maxZoom: 18,
  zoomControl: true
}).setView([9.93, -84.08], 8);

const markers = [];

// =============================
// CAPA BASE
// =============================
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);


// =============================
// PANEL LATERAL
// =============================
const panel = document.getElementById("infoPanel");

// =============================
// RENDER PANEL
// =============================
function renderPanel(bio) {
  panel.innerHTML = `
    <img 
      src="${bio.imagen || 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800'}"
      alt="${bio.name}"
      onerror="this.src='https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800'"
    />

    <div class="card-content">
      <div class="card-header">
        <h3>${bio.name}</h3>
        <span class="status">${bio.estado}</span>
      </div>

      <p class="location">${bio.region}, Costa Rica</p>

      <p class="description">
        ${bio.descripcion}
      </p>

      <div class="tags">
        ${bio.tags
          .map(tag => `<span>${tag}</span>`)
          .join("")}
      </div>

      <div class="card-actions">
        <button>Documentos</button>
        <button>Videos</button>
        <button>Ficha técnica</button>
      </div>
    </div>
  `;
}

// =============================
// ICONO PERSONALIZADO
// =============================
const greenIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// =============================
// DATOS Google Sheets
// =============================
async function initMapData() {
  const biofabricas = await fetchBiofabricas();

  biofabricas.forEach((bio) => {
    const marker = L.marker([bio.lat, bio.lng], {
      icon: greenIcon
    }).addTo(markerLayer);

    marker.bindPopup(`
      <div class="map-popup">
        <div class="popup-header">
          <h4>${bio.name}</h4>
          <span class="popup-status">${bio.estado}</span>
        </div>
    
        <p class="popup-region">📍 ${bio.region}, Costa Rica</p>
    
        <p class="popup-desc">
          ${bio.descripcion}
        </p>
    
        <div class="popup-tags">
          ${bio.tags
            .slice(0, 2)
            .map(tag => `<span>${tag}</span>`)
            .join("")}
        </div>
    
        <div class="popup-cta">
          Haz clic para ver ficha →
        </div>
      </div>
    `);

    marker.on("click", () => {
      renderPanel(bio);

      map.flyTo(
        [bio.lat, bio.lng],
        10,
        { duration: 1 }
      );
    });

    markers.push({ marker, bio });
  });
}


// =============================
// BÚSQUEDA
// =============================
const markerLayer = L.layerGroup().addTo(map);

const searchInput = document.getElementById("searchBox");
const provinciaFilter = document.getElementById("provinciaFilter");
const estadoFilter = document.getElementById("estadoFilter");
const tipoFilter = document.getElementById("tipoFilter");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");

function searchBiofabrica() {
  const query = searchInput.value.toLowerCase().trim();
  const provincia = provinciaFilter.value;
  const estado = estadoFilter.value;
  const tipo = tipoFilter.value;

  const resultados = markers.filter(item => {
    const bio = item.bio;

    const textoCompleto = `
      ${bio.name}
      ${bio.region}
      ${bio.descripcion}
      ${bio.estado}
      ${bio.tags.join(" ")}
    `.toLowerCase();

    const matchTexto =
      query === "" ||
      textoCompleto.includes(query);

    const matchProvincia =
      provincia === "Todas las provincias" ||
      bio.region === provincia;

    const matchEstado =
      estado === "Todos los estados" ||
      bio.estado === estado;

    const matchTipo =
      tipo === "Todos los tipos" ||
      bio.tags.some(tag =>
        tag.toLowerCase().includes(tipo.toLowerCase())
      );

    return (
      matchTexto &&
      matchProvincia &&
      matchEstado &&
      matchTipo
    );
  });

  // ocultar todos
  markerLayer.clearLayers();

  if (resultados.length > 0) {
    const bounds = [];

    resultados.forEach(item => {
      item.marker.addTo(markerLayer);

      bounds.push([
        item.bio.lat,
        item.bio.lng
      ]);
    });

    map.fitBounds(bounds, {
      padding: [40, 40]
    });

    renderPanel(resultados[0].bio);
  } else {
    alert("No se encontraron resultados.");
  }
}

searchBtn.addEventListener("click", searchBiofabrica);

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchBiofabrica();
  }
});

// =============================
// RESET
// =============================
resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  provinciaFilter.selectedIndex = 0;
  estadoFilter.selectedIndex = 0;
  tipoFilter.selectedIndex = 0;

  markerLayer.clearLayers();

  markers.forEach(item => {
    item.marker.addTo(markerLayer);
  });

  map.flyTo([9.93, -84.08], 8, {
    duration: 1
  });
});

provinciaFilter.addEventListener("change", searchBiofabrica);
estadoFilter.addEventListener("change", searchBiofabrica);
tipoFilter.addEventListener("change", searchBiofabrica);


// =============================
// PANEL INICIAL
// =============================
resetBtn.click();

async function renderKPIs() {
  const heroStats = document.getElementById("heroStats");
  const kpis = await fetchKPIs();

  heroStats.innerHTML = kpis.map((kpi, index) => `
    <div class="stat fade-up" style="animation-delay:${index * 0.15}s">
      <strong class="counter" data-value="${kpi.valor}">
        0
      </strong>
      <span>${kpi.nombre}</span>
    </div>
  `).join("");

  animateCounters();
}

function animateCounters() {
  const counters = document.querySelectorAll(".counter");

  counters.forEach(counter => {
    const targetText = counter.dataset.value;
    const target = parseInt(
      targetText.replace(/\D/g, "")
    );

    const suffix = targetText.replace(/[0-9]/g, "");

    let current = 0;
    let currenttwo = 0;
    const increment = target / 200;

    const update = () => {
      currenttwo += increment;
      current = Math.ceil(currenttwo);

      if (current >= target) {
        counter.textContent = targetText;
        return;
      }

      counter.textContent = current + suffix;
      requestAnimationFrame(update);
    };

    update();
  });
}

// =============================
// RECURSOS
// =============================

let recursosVisibles = 6;
let recursosData = [];
let categoriaActual = "Todos";

// document
//   .getElementById("resourceSearch")
//   .addEventListener("input", () => {
//     recursosVisibles = 6;
//     renderRecursos();
//   });

  document
  .getElementById("resourceSearchBtn")
  .addEventListener("click", () => {
    recursosVisibles = 6;
    renderRecursos();
  });

  document
  .getElementById("resourceSearch")
  .addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      recursosVisibles = 6;
      renderRecursos();
    }
  });

function openResource(tipo, enlace) {
  const modal = document.getElementById("resourceModal");
  const content = document.getElementById("modalContent");

  if (tipo.toLowerCase().includes("video")) {
    const embed = getYoutubeEmbed(enlace);

    content.innerHTML = `
      <iframe
        src="${embed}"
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    `;
  } else {
    content.innerHTML = `
      <iframe
        src="${enlace}"
        title="PDF"
      ></iframe>
    `;
  }

  modal.classList.remove("hidden");
}

// document.getElementById("closeModal").addEventListener("click", () => {
//   document.getElementById("resourceModal").classList.add("hidden");
// });

function closeResourceModal() {
  const modal = document.getElementById("resourceModal");
  const content = document.getElementById("modalContent");

  // salir de pantalla completa si está activa
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }

  // detener video / pdf eliminando iframe
  content.innerHTML = "";

  // ocultar modal
  modal.classList.add("hidden");
}

document
  .getElementById("resourceModal")
  .addEventListener("click", (e) => {
    if (e.target.id === "resourceModal") {
      closeResourceModal();
    }
  });

document
  .getElementById("closeModal")
  .addEventListener("click", closeResourceModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeResourceModal();
    }
  });

function getYoutubeThumbnail(url) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/
  );

  return match
    ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
    : "";
}

function getYoutubeEmbed(url) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^?&/]+)/
  );

  return match
    ? `https://www.youtube.com/embed/${match[1]}?autoplay=1`
    : "";
}

// function getYoutubeEmbed(url) {
//   const match = url.match(
//     /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/
//   );

//   return match
//     ? `https://www.youtube.com/embed/${match[1]}`
//     : null;
// }

function renderVideoCard(recurso) {
  const thumb = getYoutubeThumbnail(recurso.enlace);

  return `
    <div class="resource-card" onclick="openResource('${recurso.tipo}','${recurso.enlace}')">
      <img class="resource-preview" src="${thumb}" alt="${recurso.nombre}" />

      <div class="resource-content">
        <h3>${recurso.nombre}</h3>
        <p>Video / Webinar</p>
      </div>
    </div>
  `;
}

// function renderVideoCard(recurso) {
//   const embed = getYoutubeEmbed(recurso.enlace);

//   return `
//     <div class="resource-card">
//       <iframe
//         src="${embed}"
//         title="${recurso.nombre}"
//         allowfullscreen
//       ></iframe>

//       <div class="resource-content">
//         <h3>${recurso.nombre}</h3>
//         <p>Video / Webinar</p>
//         <a href="${recurso.enlace}" target="_blank">
//           Ver video
//         </a>
//       </div>
//     </div>
//   `;
// }

// document
//   .getElementById("fullscreenBtn")
//   .addEventListener("click", () => {
//     const modal = document.querySelector(".modal-box");

//     if (modal.requestFullscreen) {
//       modal.requestFullscreen();
//     }
//   });

  document
  .getElementById("fullscreenBtn")
  .addEventListener("click", toggleFullscreen);

  function toggleFullscreen() {
    const modalBox = document.querySelector(".modal-box");

    if (!document.fullscreenElement) {
      modalBox.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  document.addEventListener("fullscreenchange", () => {
    const btn = document.getElementById("fullscreenBtn");
  
    btn.textContent = "⛶";
  });

  function renderPDFCard(recurso) {
    const isMobile = window.innerWidth <= 768;
  
    const preview = isMobile
      ? `
        <div class="resource-placeholder pdf-mobile-preview">
          📄
        </div>
      `
      : `
        <iframe
          class="pdf-preview"
          src="${recurso.enlace}#page=1&view=FitH"
          loading="lazy"
        ></iframe>
      `;
  
    return `
      <div class="resource-card">
        <div class="pdf-preview-wrap">
          ${preview}
        </div>
  
        <div class="resource-content">
          <h3>${recurso.nombre}</h3>
          <p>Documento PDF</p>
  
          <button
            class="resource-btn"
            onclick="openResource('pdf','${recurso.enlace}')"
          >
            Ampliar documento
          </button>
        </div>
      </div>
    `;
  }

// function renderPDFCard(recurso) {
//   return `
//     <div class="resource-card">
//       <iframe
//         src="${recurso.enlace}"
//         title="${recurso.nombre}"
//       ></iframe>

//       <div class="resource-content">
//         <h3>${recurso.nombre}</h3>
//         <p>Documento PDF</p>
//         <a href="${recurso.enlace}" target="_blank">
//           Abrir documento
//         </a>
//       </div>
//     </div>
//   `;
// }

function renderGenericCard(recurso) {
  return `
    <div class="resource-card">
      <div class="resource-placeholder">
        📁
      </div>

      <div class="resource-content">
        <h3>${recurso.nombre}</h3>
        <p>${recurso.tipo}</p>
        <a href="${recurso.enlace}" target="_blank">
          Abrir recurso
        </a>
      </div>
    </div>
  `;
}

async function renderRecursos() {
  const container = document.getElementById("recursosGrid");
  const btn = document.getElementById("loadMoreBtn");

  // cargar una sola vez
  if (recursosData.length === 0) {
    recursosData = await fetchRecursos();
  }

  // iniciar con todos
  let recursosFiltrados = [...recursosData];

  // filtro por categoría
  if (categoriaActual !== "Todos") {
    recursosFiltrados = recursosFiltrados.filter(r =>
      r.categoria === categoriaActual
    );
  }

  // filtro por búsqueda
  const query = document
    .getElementById("resourceSearch")
    .value
    .toLowerCase()
    .trim();

  if (query !== "") {
    recursosFiltrados = recursosFiltrados.filter(r =>
      `
        ${r.nombre}
        ${r.tipo}
        ${r.categoria || ""}
      `.toLowerCase().includes(query)
    );
  }

  // paginación
  const visibles = recursosFiltrados.slice(
    0,
    recursosVisibles
  );

  // render
  container.innerHTML = visibles.map(recurso => {
    if (recurso.tipo.toLowerCase() === "video") {
      return renderVideoCard(recurso);
    }

    if (recurso.tipo.toLowerCase() === "pdf") {
      return renderPDFCard(recurso);
    }

    return renderGenericCard(recurso);
  }).join("");

  // mostrar / ocultar botón
  btn.style.display =
    recursosVisibles >= recursosFiltrados.length
      ? "none"
      : "inline-block";
}

document
  .getElementById("loadMoreBtn")
  .addEventListener("click", () => {
    recursosVisibles += 6;
    renderRecursos();
  });

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      categoriaActual = tab.dataset.cat;
      recursosVisibles = 6;
  
      document
        .querySelectorAll(".tab")
        .forEach(t => t.classList.remove("active"));
  
      tab.classList.add("active");
  
      renderRecursos();
    });
  });

// =============================
// iNICIALIZAR
// =============================

initMapData();
renderKPIs();
renderRecursos();