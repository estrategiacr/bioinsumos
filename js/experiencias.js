// ==========================================================================
// CONTROLADOR LOGICO DEL MODULO EXPERIENCIAS e INNOVACIÓN
// ==========================================================================

let biofabricas = [];
let innovaciones = [];
let mapaLeaflet = null;
let marcadoresGrupo = [];

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Consumir los datos desde data.js
    biofabricas = await fetchBiofabricas();
    innovaciones = await fetchInnovaciones();

    // 2. Inicializar Mapa e Interfaz
    inicializarMapaCR();
    configurarEventosFiltros();
    
    // 3. Renderizado inicial de datos
    filtrarYRenderizarBiofabricas();
    renderizarInnovacionesDestacadas();
});

// ==========================================================================
// CONFIGURACIÓN DEL MAPA INTERACTIVO (LEAFLET.JS)
// ==========================================================================
function inicializarMapaCR() {
    // Centrado geográfico estratégico de Costa Rica [Latitud, Longitud], Zoom 8
    mapaLeaflet = L.map('map', {
        scrollWheelZoom: false
    }).setView([9.7489, -83.7534], 8);

    // Capa de mapa estilizada (CartoDB Positron - limpia, clara y profesional)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(mapaLeaflet);
}

// ==========================================================================
// FILTROS Y EVENTOS
// ==========================================================================
function configurarEventosFiltros() {
    const filterRegion = document.getElementById("filterRegion");
    const searchBiofabrica = document.getElementById("searchBiofabrica");

    filterRegion?.addEventListener("change", filtrarYRenderizarBiofabricas);
    searchBiofabrica?.addEventListener("input", filtrarYRenderizarBiofabricas);
}

function filtrarYRenderizarBiofabricas() {
    const regionSeleccionada = document.getElementById("filterRegion").value;
    const busquedaTexto = document.getElementById("searchBiofabrica").value.toLowerCase().trim();

    // Limpiar marcadores existentes del ciclo anterior
    marcadoresGrupo.forEach(m => mapaLeaflet.removeLayer(m));
    marcadoresGrupo = [];

    const fabricasFiltradas = biofabricas.filter(f => {
        const matchRegion = (regionSeleccionada === "Todos" || f.region === regionSeleccionada);
        const matchTexto = (f.name.toLowerCase().includes(busquedaTexto) || f.descripcion.toLowerCase().includes(busquedaTexto));
        return matchRegion && matchTexto;
    });

    // Actualizar contador en panel lateral
    document.getElementById("biofabricasCount").textContent = fabricasFiltradas.length;

    // Pintar los marcadores en el mapa
    fabricasFiltradas.forEach(fabrica => {
        if (!isNaN(fabrica.lat) && !isNaN(fabrica.lng)) {
            const marcador = L.marker([fabrica.lat, fabrica.lng]).addTo(mapaLeaflet);
            
            // Evento Click abre ficha técnica en panel lateral derecho
            marcador.on('click', () => {
                mostrarFichaTecnica(fabrica);
            });
            
            // Tooltip rápido al pasar el ratón
            marcador.bindTooltip(fabrica.name, { direction: 'top', opacity: 0.9 });
            marcadoresGrupo.push(marcador);
        }
    });
}

// ==========================================================================
// CARD DINÁMICO INTERACTIVO (ASIDE - FICHA TÉCNICA)
// ==========================================================================
function mostrarFichaTecnica(fabrica) {
    const panel = document.getElementById("infoPanel");
    
    const tagsHTML = fabrica.tags.map(t => `<span class="bio-tag">${t}</span>`).join("");

    panel.innerHTML = `
        <div class="card-image-wrapper">
            <img src="${fabrica.imagen}" alt="${fabrica.name}" class="card-img">
            <span class="status-badge status-${fabrica.estado.toLowerCase()}">${fabrica.estado}</span>
        </div>
        <div class="card-body">
            <span class="card-region">📍 Región: ${fabrica.region}</span>
            <h3 class="card-title">${fabrica.name}</h3>
            <p class="card-desc">${fabrica.descripcion}</p>
            <div class="card-tags-container">
                ${tagsHTML}
            </div>
            <hr class="card-divider">
            <div class="card-meta">
                <span><strong>Coordenadas:</strong> ${fabrica.lat.toFixed(3)}, ${fabrica.lng.toFixed(3)}</span>
            </div>
        </div>
    `;
}

// ==========================================================================
// CUADRÍCULA DE INNOVACIONES (PROVENIENTES DE LA NUEVA TABLA 2)
// ==========================================================================
function renderizarInnovacionesDestacadas() {
    const grid = document.getElementById("innovationCards");
    // Filtrar solo los elementos marcados como destacados en la hoja de cálculo
    const destacadas = innovaciones.filter(i => i.destacado);

    if (destacadas.length === 0) {
        grid.innerHTML = `<p class="no-data">No hay innovaciones destacadas cargadas en este momento.</p>`;
        return;
    }

    grid.innerHTML = destacadas.map(inno => `
        <article class="innovation-item-card">
            <div class="inno-img-header">
                <img src="${inno.imagenUrl}" alt="${inno.titulo}">
                <span class="inno-badge">${inno.categoria}</span>
            </div>
            <div class="inno-content">
                <span class="inno-org">🏢 ${inno.organizacion}</span>
                <h3>${inno.titulo}</h3>
                <p>${inno.descripcion}</p>
                <a href="${inno.enlaceRecurso}" target="_blank" class="inno-btn-link">
                    Ver Documentación Técnico 📊
                </a>
            </div>
        </article>
    `).join("");
}