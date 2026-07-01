/* ==========================================================================
   CONTROLADOR LÓGICO: ECOSISTEMA NACIONAL Y MAPA DE BIOFÁBRICAS
   Bioinsumos Costa Rica - Pilar 3 (Articulación Sectorial)
   ========================================================================== */

   let actoresEcosistema = [];
   let actoresFiltrados = [];
   let filtroTipoActual = "Todos";
   
   // URL de la base de datos de Google Sheets publicada en formato CSV
   const SHEET_CSV_ECOSISTEMA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=966344977&single=true&output=csv";
   
   let mapaEcosistema = null;
   let grupoMarcadores = null;
   
   document.addEventListener("DOMContentLoaded", () => {
     inicializarMenuMovil();
     inicializarMapaNacional();
     asociarEventosFiltros();
     cargarDatosEcosistema();
   });
   
   function inicializarMenuMovil() {
     const toggle = document.getElementById("menuToggle");
     const nav = document.getElementById("mainNav");
     if (toggle && nav) {
       toggle.addEventListener("click", () => nav.classList.toggle("open"));
     }
   }
   
   /**
    * Transforma un enlace compartido de Google Drive en una URL de renderizado directo.
    * Se utiliza el endpoint /thumbnail con tamaño asignado, ya que evita bloqueos de 
    * políticas de rastreo y de cookies de terceros impuestos por navegadores como Edge.
    */
   function convertirLinkDriveAImagen(url) {
     if (!url) return "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=600";
     
     // Limpieza estricta de comillas o fragmentos residuales del parseo
     let urlLimpia = url.trim().replace(/^"|"$/g, '');
   
     // 1. Intentar capturar ID con el formato estándar /d/ID_DE_IMAGEN/
     const regExpDrive = /\/d\/([a-zA-Z0-9_-]+)/;
     const matchDrive = urlLimpia.match(regExpDrive);
     
     if (matchDrive && matchDrive[1]) {
       return `https://docs.google.com/thumbnail?sz=w800&id=${matchDrive[1]}`;
     }
     
     // 2. Intentar capturar ID si viene como parámetro estructurado (?id=ID_DE_IMAGEN)
     const matchIdParam = urlLimpia.match(/[?&]id=([a-zA-Z0-9_-]+)/);
     if (matchIdParam && matchIdParam[1]) {
       return `https://docs.google.com/thumbnail?sz=w800&id=${matchIdParam[1]}`;
     }
   
     // Si no es un enlace de Google Drive, retorna la URL limpia original
     return urlLimpia;
   }
   
   /**
    * Monta la instancia base de Leaflet centrada sobre la geografía de Costa Rica
    */
   function inicializarMapaNacional() {
     const mapContainer = document.getElementById("mapaEcosistema");
     if (!mapContainer) return;
   
     // Coordenadas céntricas aproximadas de Costa Rica [Lat, Lng]
     mapaEcosistema = L.map("mapaEcosistema", {
       center: [9.7489, -83.7534],
       zoom: 7.5,
       scrollWheelZoom: false
     });
   
     // Capa base topográfica clara estilizada
     L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
       attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
       subdomains: 'abcd',
       maxZoom: 19
     }).addTo(mapaEcosistema);
   
     // Inicializar grupo de marcadores clusterizados o simples
     grupoMarcadores = L.layerGroup().addTo(mapaEcosistema);
   }
   
   /**
    * Carga remota asíncrona de datos desde Google Sheets
    */
   async function cargarDatosEcosistema() {
     try {
       const respuesta = await fetch(SHEET_CSV_ECOSISTEMA);
       const texto = await respuesta.text();
       const filas = texto.split(/\r?\n/).filter(f => f.trim() !== "");
   
       if (filas.length <= 1) {
         document.getElementById("directorioGrid").innerHTML = 
           `<p style="grid-column: 1/-1; text-align:center; color:var(--muted); padding:3rem;">El ecosistema nacional no registra actores mapeados en este momento.</p>`;
         return;
       }
   
       // Mapear filas saltándose el encabezado
       actoresEcosistema = filas.slice(1).map((fila, index) => {
         const columnas = parsearLineaCSVStandard(fila);
   
         return {
           id: columnas[0] || `actor-${index}`,
           nombre: columnas[1] || "Actor sin identificar",
           tipo: columnas[2] || "Otros",
           provincia: columnas[3] || "San José",
           contacto: columnas[6] || "No especificado",
           latitud: parseFloat(columnas[7]) || null,
           longitud: parseFloat(columnas[8]) || null,
           imagenUrl: convertirLinkDriveAImagen(columnas[9]),
           descripcion: columnas[4] || "Sin descripción disponible en la ficha técnica."
         };
       });
   
       ejecutarProcesamientoRender();
   
     } catch (error) {
       console.error("Error en sincronización del Ecosistema Nacional:", error);
       document.getElementById("directorioGrid").innerHTML = 
         `<p style="grid-column: 1/-1; text-align:center; color:var(--muted); padding:3rem;">Error de red al conectar con el servidor cartográfico.</p>`;
     }
   }
   
   /**
    * Centraliza las operaciones de filtrado, renderizado en mapa y vista de tarjetas
    */
   function ejecutarProcesamientoRender() {
     // 1. Filtrar registros por tipo de actor seleccionado
     actoresFiltrados = actoresEcosistema.filter(actor => {
       return (filtroTipoActual === "Todos" || actor.tipo.toLowerCase() === filtroTipoActual.toLowerCase());
     });
   
     // 2. Re-renderizar componentes visuales sincronizados
     actualizarMarcadoresMapa();
     renderizarDirectorioTarjetas();
   }
   
   /**
    * Limpia y dibuja los pines de ubicación geográfica sobre el lienzo Leaflet
    */
   function actualizarMarcadoresMapa() {
     if (!mapaEcosistema || !grupoMarcadores) return;
   
     // Vaciar marcadores previos antes de dibujar el filtro actual
     grupoMarcadores.clearLayers();
   
     actoresFiltrados.forEach(actor => {
       if (actor.latitud && actor.longitud) {
         
         // Personalizar el color del pin según su tipo estratégico
         let markerColor = "#166534"; // Verde por defecto
         if (actor.tipo.includes("Biofábrica")) markerColor = "#22c55e";
         if (actor.tipo.includes("Universidad")) markerColor = "#3b82f6";
         if (actor.tipo.includes("Investigación")) markerColor = "#6d28d9";
   
         const customIcon = L.divIcon({
           className: 'custom-map-pin',
           html: `<div style="background-color: ${markerColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
           iconSize: [14, 14],
           iconAnchor: [7, 7]
         });
   
         const marcador = L.marker([actor.latitud, actor.longitud], { icon: customIcon });
   
         // Estructurar el globo emergente interactivo (Popup) al hacer clic en el pin
         // Eliminado loading="lazy" de la imagen del popup para evitar bloqueos preventivos
         const popupContenido = `
           <div class="map-popup-card" style="font-family:'Inter',sans-serif; max-width:220px;">
             <img src="${actor.imagenUrl}" alt="${actor.nombre}" style="width:100%; height:110px; object-fit:cover; border-radius:8px; margin-bottom:8px;">
             <h5 style="margin:0 0 4px 0; font-size:0.95rem; color:#0f172a; font-weight:700;">${actor.nombre}</h5>
             <span style="font-size:0.75rem; color:white; background:${markerColor}; padding:2px 6px; border-radius:100px; display:inline-block; margin-bottom:6px;">${actor.tipo}</span>
             <p style="margin:0; font-size:0.8rem; color:#64748b; line-height:1.3;">📍 ${actor.provincia}</p>
             <button onclick="enfocarTarjetaDirectorio('${actor.id}')" style="margin-top:8px; width:100%; border:none; background:#0f172a; color:white; padding:4px; border-radius:4px; font-size:0.75rem; cursor:pointer;">Ver detalles</button>
           </div>
         `;
   
         marcador.bindPopup(popupContenido);
         grupoMarcadores.addLayer(marcador);
       }
     });
   }
   
   /**
    * Renderiza el catálogo inferior de fichas del directorio sectorial
    */
   function renderizarDirectorioTarjetas() {
     const contenedorGrid = document.getElementById("directorioGrid");
     if (!contenedorGrid) return;
   
     if (actoresFiltrados.length === 0) {
       contenedorGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--muted); padding:4rem 1rem;">No se encontraron entidades registradas bajo esta categoría específica.</p>`;
       return;
     }
   
     // Mapear los bloques html de las tarjetas
     // Eliminado loading="lazy" de la imagen de la tarjeta para máxima compatibilidad con Edge
     contenedorGrid.innerHTML = actoresFiltrados.map(actor => {
       return `
         <div class="actor-card" id="card-${actor.id}" data-lat="${actor.latitud}" data-lng="${actor.longitud}">
           <div class="actor-card-media">
             <img src="${actor.imagenUrl}" alt="${actor.nombre}">
             <span class="actor-badge">${actor.tipo}</span>
           </div>
           <div class="actor-card-body">
             <h4>${actor.nombre}</h4>
             <span class="actor-location">📍 Provincias: <b>${actor.provincia}</b></span>
             <p>${actor.descripcion}</p>
             <div class="actor-card-footer">
               <span class="actor-contact"><i class="fa-solid fa-address-book"></i> ${actor.contacto}</span>
               <button class="btn-locate" onclick="centrarFocoMapa(${actor.latitud}, ${actor.longitud}, '${actor.id}')"><i class="fa-solid fa-map-location-dot"></i> Ubicar</button>
             </div>
           </div>
         </div>
       `;
     }).join("");
   }
   
   /**
    * Permite centrar la cámara del mapa Leaflet sobre una entidad al pulsar "Ubicar"
    */
   window.centrarFocoMapa = function(lat, lng, idActor) {
     if (!mapaEcosistema || !lat || !lng) return;
   
     mapaEcosistema.setView([lat, lng], 13, { animate: true, duration: 1 });
     
     // Buscar el marcador respectivo para abrirle el popup de manera automática
     grupoMarcadores.eachLayer(layer => {
       if (layer instanceof L.Marker) {
         const coord = layer.getLatLng();
         if (coord.lat === lat && coord.lng === lng) {
           layer.openPopup();
         }
       }
     });
   
     // Hacer scroll suave hacia el mapa en dispositivos pequeños si fuera requerido
     document.getElementById("mapWrapper").scrollIntoView({ behavior: 'smooth' });
   };
   
   /**
    * Callback de asistencia intermedia invocado desde el interior del Popup de Leaflet
    */
   window.enfocarTarjetaDirectorio = function(idActor) {
     const elementoTarjeta = document.getElementById(`card-${idActor}`);
     if (elementoTarjeta) {
       elementoTarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
       elementoTarjeta.style.outline = "2px solid var(--accent)";
       setTimeout(() => { elementoTarjeta.style.outline = "none"; }, 2000);
     }
   };
   
   /**
    * Vinculación de los filtros superiores de escritorio y tabs móviles
    */
   function asociarEventosFiltros() {
     const selectorEscritorio = document.getElementById("tipoActorSelect");
     if (selectorEscritorio) {
       selectorEscritorio.addEventListener("change", (e) => {
         filtroTipoActual = e.target.value;
         ejecutarProcesamientoRender();
       });
     }
   
     // Control de pestañas para la visualización adaptativa móvil (Estilo AgroIdeas)
     const tabButtons = document.querySelectorAll(".map-tab-btn");
     const mapWrapper = document.getElementById("mapWrapper");
   
     tabButtons.forEach(btn => {
       btn.addEventListener("click", () => {
         tabButtons.forEach(b => b.classList.remove("active"));
         btn.classList.add("active");
   
         const tabDestino = btn.getAttribute("data-tab");
         if (tabDestino === "detalles") {
           if (mapWrapper) mapWrapper.classList.add("show-details");
         } else {
           if (mapWrapper) mapWrapper.classList.remove("show-details");
           // Refrescar tamaño de Leaflet para prevenir fallas de renderizado visual
           setTimeout(() => { if (mapaEcosistema) mapaEcosistema.invalidateSize(); }, 200);
         }
       });
     });
   }
   
   /**
    * Parsea de manera limpia líneas CSV respetando celdas con comillas y comas internas
    */
   function parsearLineaCSVStandard(linea) {
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