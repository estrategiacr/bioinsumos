/* ==========================================================================
   CONTROLADOR LÓGICO: ECOSISTEMA NACIONAL Y MAPA DE BIOFÁBRICAS
   Bioinsumos Costa Rica - Pilar 3 (Articulación Sectorial)
   ========================================================================== */

   let actoresEcosistema = [];
   let actoresFiltrados = [];
   let filtroTipoActual = "Todos";
   
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
    * Normaliza enlaces de Google Drive usando el endpoint /thumbnail sin causar bloqueos
    */
   function convertirLinkDriveAImagen(url) {
     if (!url) return "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=600";
     let urlLimpia = url.trim().replace(/^"|"$/g, '');
   
     const regExpDrive = /\/d\/([a-zA-Z0-9_-]+)/;
     const matchDrive = urlLimpia.match(regExpDrive);
     if (matchDrive && matchDrive[1]) {
       return `https://docs.google.com/thumbnail?sz=w800&id=${matchDrive[1]}`;
     }
     
     const matchIdParam = urlLimpia.match(/[?&]id=([a-zA-Z0-9_-]+)/);
     if (matchIdParam && matchIdParam[1]) {
       return `https://docs.google.com/thumbnail?sz=w800&id=${matchIdParam[1]}`;
     }
     return urlLimpia;
   }
   
   /**
    * Configura Leaflet con mapas base claros e interactivos
    */
   function inicializarMapaNacional() {
     const mapContainer = document.getElementById("mapaEcosistema");
     if (!mapContainer) return;
   
     mapaEcosistema = L.map("mapaEcosistema", {
       center: [9.7489, -83.7534],
       zoom: 7.5,
       scrollWheelZoom: false
     });
   
     L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
       attribution: '&copy; OpenStreetMap &copy; CARTO',
       maxZoom: 19
     }).addTo(mapaEcosistema);
   
     grupoMarcadores = L.layerGroup().addTo(mapaEcosistema);
   }
   
   /**
    * Consulta y parseo adaptativo de Google Sheets
    */
   async function cargarDatosEcosistema() {
     try {
       const respuesta = await fetch(SHEET_CSV_ECOSISTEMA);
       const texto = await respuesta.text();
       const filas = texto.split(/\r?\n/).filter(f => f.trim() !== "");
   
       if (filas.length <= 1) {
         document.getElementById("directorioGrid").innerHTML = 
           `<p style="grid-column:1/-1; text-align:center; color:var(--muted); padding:3rem;">El ecosistema nacional no registra actores mapeados en este momento.</p>`;
         return;
       }
   
       actoresEcosistema = filas.slice(1).map((fila, index) => {
         const columnas = parsearLineaCSVStandard(fila);
         return {
           id: columnas[0] || `actor-${index}`,
           nombre: columnas[1] || "Actor sin identificar",
           tipo: columnas[2] || "Otros",
           provincia: columnas[3] || "San José",
           contacto: columnas[4] || "No especificado",
           latitud: parseFloat(columnas[5]) || null,
           longitud: parseFloat(columnas[6]) || null,
           imagenUrl: convertirLinkDriveAImagen(columnas[7]),
           descripcion: columnas[8] || "Sin descripción disponible en la ficha técnica sectorial."
         };
       });
   
       ejecutarProcesamientoRender();
     } catch (error) {
       console.error("Error en sincronización del Ecosistema Nacional:", error);
       document.getElementById("directorioGrid").innerHTML = 
         `<p style="grid-column:1/-1; text-align:center; color:var(--muted); padding:3rem;">Error de conexión con la base de datos de articulación.</p>`;
     }
   }
   
   function ejecutarProcesamientoRender() {
     actoresFiltrados = actoresEcosistema.filter(actor => {
       if (filtroTipoActual === "Todos") return true;
       return actor.tipo.toLowerCase().includes(filtroTipoActual.toLowerCase()) || 
              filtroTipoActual.toLowerCase().includes(actor.tipo.toLowerCase());
     });
   
     actualizarMarcadoresMapa();
     renderizarDirectorioTarjetas();
   }
   
   /**
    * Dibuja los pines tradicionales de gota usando Leaflet nativo,
    * adaptando colores con filtros y sincronizando clics con las fichas técnicas.
    */
   function actualizarMarcadoresMapa() {
     if (!mapaEcosistema || !grupoMarcadores) return;
     grupoMarcadores.clearLayers();
   
     actoresFiltrados.forEach(actor => {
       if (actor.latitud && actor.longitud) {
         
         // Crear marcador nativo tradicional (Punta / Gota clásica)
         const marcador = L.marker([actor.latitud, actor.longitud]);
   
         // Modificar el color de la gota tradicional usando filtros CSS según el tipo de actor
         let filtroCSS = "hue-rotate(0deg) saturate(100%)"; // Verde / Por defecto
         if (actor.tipo.toLowerCase().includes("universidad") || actor.tipo.toLowerCase().includes("investigación")) {
           filtroCSS = "hue-rotate(140deg) brightness(90%)"; // Azul estratégico
         } else if (actor.tipo.toLowerCase().includes("institución") || actor.tipo.toLowerCase().includes("laboratorio")) {
           filtroCSS = "hue-rotate(240deg) saturate(80%)"; // Morado/Púrpura institucional
         } else if (actor.tipo.toLowerCase().includes("empresa")) {
           filtroCSS = "hue-rotate(40deg) brightness(110%)"; // Naranja / Comercial
         }
   
         marcador.on('add', function() {
           if (marcador._icon) {
             marcador._icon.style.filter = filtroCSS;
           }
         });
   
         // LÓGICA DE CLIC EN EL MARCADOR (MÓVIL Y ESCRITORIO CONJUNTO)
         marcador.on('click', () => {
           mostrarDetalleFichaEntidad(actor);
         });
   
         grupoMarcadores.addLayer(marcador);
       }
     });
   }
   
   /**
    * Inyecta la ficha técnica en la barra lateral y gestiona de manera transparente 
    * las pestañas en móviles sin abrir popups invasivos dentro del mapa.
    */
   function mostrarDetalleFichaEntidad(actor) {
     const sidebar = document.getElementById("sidebarDynamicContent");
     if (!sidebar) return;
   
     // Inyectar estructura HTML enriquecida en la ficha lateral
     sidebar.innerHTML = `
       <div class="ficha-tecnica-activa">
         <img src="${actor.imagenUrl}" alt="${actor.nombre}" class="ficha-img">
         <span class="ficha-badge">${actor.tipo}</span>
         <h4>${actor.nombre}</h4>
         <p class="ficha-loc">📍 Región: <b>${actor.provincia}</b></p>
         <div class="ficha-divider"></div>
         <h5>Descripción Técnica</h5>
         <p class="ficha-desc">${actor.descripcion}</p>
         <div class="ficha-divider"></div>
         <h5>Canales de Articulación</h5>
         <p class="ficha-contacto"><i class="fa-solid fa-address-book"></i> Enlace: ${actor.contacto}</p>
       </div>
     `;
   
     // Evaluar si estamos en dispositivo móvil (si las pestañas están activas)
     const tabsMobile = document.querySelector(".workspace-tabs-mobile");
     if (tabsMobile && window.getComputedStyle(tabsMobile).display !== "none") {
       
       // 1. Activar visualmente la pestaña de detalles
       document.querySelectorAll(".map-tab-btn").forEach(b => b.classList.remove("active"));
       const tabDetalles = document.getElementById("tabDetallesMovil");
       if (tabDetalles) tabDetalles.classList.add("active");
   
       // 2. Swappear las clases del contenedor para revelar el panel y ocultar el mapa
       const mapWrapper = document.getElementById("mapWrapper");
       if (mapWrapper) mapWrapper.classList.add("show-details");
       
       // 3. Desplazar suavemente la pantalla hacia la ficha
       document.getElementById("mapWrapper").scrollIntoView({ behavior: 'smooth', block: 'start' });
     } else {
       // Si es escritorio, hacer scroll suave directo hacia el panel lateral para mejor enfoque
       document.getElementById("mapSidebar").scrollIntoView({ behavior: 'smooth', block: 'nearest' });
     }
   }
   
   /**
    * Renderiza el directorio inferior de actores
    */
   function renderizarDirectorioTarjetas() {
     const contenedorGrid = document.getElementById("directorioGrid");
     if (!contenedorGrid) return;
   
     if (actoresFiltrados.length === 0) {
       contenedorGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--muted); padding:4rem 1rem;">No se encontraron entidades registradas bajo esta categoría específica.</p>`;
       return;
     }
   
     contenedorGrid.innerHTML = actoresFiltrados.map(actor => {
       return `
         <div class="actor-card" id="card-${actor.id}">
           <div class="actor-card-media">
             <img src="${actor.imagenUrl}" alt="${actor.nombre}">
             <span class="actor-badge">${actor.tipo}</span>
           </div>
           <div class="actor-card-body">
             <h4>${actor.nombre}</h4>
             <span class="actor-location">📍 Ubicación: <b>${actor.provincia}</b></span>
             <p>${actor.descripcion}</p>
             <div class="actor-card-footer">
               <span class="actor-contact"><i class="fa-solid fa-address-book"></i> ${actor.contacto}</span>
               <button class="btn-locate" onclick="solicitarFocoDesdeTarjeta('${actor.id}', ${actor.latitud}, ${actor.longitude || actor.longitud})">
                 <i class="fa-solid fa-map-location-dot"></i> Ficha & Mapa
               </button>
             </div>
           </div>
         </div>
       `;
     }).join("");
   }
   
   /**
    * Vinculación bidireccional cuando pulsan "Ficha & Mapa" desde el directorio inferior
    */
   window.solicitarFocoDesdeTarjeta = function(id, lat, lng) {
     const actor = actoresEcosistema.find(a => a.id === id);
     if (!actor) return;
   
     // Renderizar la ficha técnica arriba
     mostrarDetalleFichaEntidad(actor);
   
     // Si tiene coordenadas válidas, centrar el mapa nativo detrás
     if (lat && lng && mapaEcosistema) {
       mapaEcosistema.setView([lat, lng], 13, { animate: true, duration: 1.2 });
       
       // Si el usuario vuelve al mapa en móvil, ya estará centrado en el punto
       const tabsMobile = document.querySelector(".workspace-tabs-mobile");
       if (!tabsMobile || window.getComputedStyle(tabsMobile).display === "none") {
         document.getElementById("mapWrapper").scrollIntoView({ behavior: 'smooth', block: 'center' });
       }
     }
   };
   
   /**
    * Inicialización y control de eventos de filtros y tabs
    */
   function asociarEventosFiltros() {
     const selector = document.getElementById("tipoActorSelect");
     if (selector) {
       selector.addEventListener("change", (e) => {
         filtroTipoActual = e.target.value;
         ejecutarProcesamientoRender();
       });
     }
   
     // Lógica de Pestañas Manuales para Móvil
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
           setTimeout(() => { if (mapaEcosistema) mapaEcosistema.invalidateSize(); }, 250);
         }
       });
     });
   }
   
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