/* ==========================================================================
   CONTROLADOR LÓGICO: PILAR 4 - ENTORNO HABILITADOR
   Bioinsumos Costa Rica - Sincronización Remota e Interactividad Unificada
   ========================================================================== */

   let recursosEcosistema = [];
   let recursosFiltrados = [];
   let filtroTipoActual = "Todos";
   
   // URL única del Google Sheets publicada en formato CSV
   const SHEET_CSV_ECOSISTEMA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=966344977&single=true&output=csv";
   
   let mapaEcosistema = null;
   let grupoMarcadores = null;
   
   document.addEventListener("DOMContentLoaded", () => {
     inicializarMenuMovil();
     inicializarMapaNacional();
     asociarEventosFiltrosYTabs();
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
    * Normaliza las URLs de Google Drive utilizando el endpoint /thumbnail.
    * Esto evade bloqueos estricto por directivas de rastreo en Microsoft Edge.
    */
   function convertirLinkDriveAImagen(url) {
     if (!url) return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600";
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
    * Monta la instancia base de Leaflet con los MARCADORES ESTÁNDAR NATIVOS (Punto-flecha)
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
    * Carga remota y parseo de datos
    */
   async function cargarDatosEcosistema() {
     try {
       const respuesta = await fetch(SHEET_CSV_ECOSISTEMA);
       const texto = await respuesta.text();
       const filas = texto.split(/\r?\n/).filter(f => f.trim() !== "");
   
       if (filas.length <= 1) {
         document.getElementById("directorioGrid").innerHTML = 
           `<p style="grid-column: 1/-1; text-align:center; color:var(--muted); padding:3rem;">No se registran datos para el Entorno Habilitador.</p>`;
         return;
       }
   
       recursosEcosistema = filas.slice(1).map((fila, index) => {
         const columnas = parsearLineaCSVStandard(fila);
         return {
           id: columnas[0] || `recurso-${index}`,
           nombre: columnas[1] || "Recurso Habilitador",
           tipo: columnas[2] || "Marco regulatorio", // Ajustado por defecto al Pilar 4
           provincia: columnas[3] || "San José",
           contacto: columnas[4] || "No especificado",
           latitud: parseFloat(columnas[5]) || null,
           longitud: parseFloat(columnas[6]) || null,
           imagenUrl: convertirLinkDriveAImagen(columnas[7]),
           descripcion: columnas[8] || "Sin descripción legal o técnica registrada."
         };
       });
   
       ejecutarProcesamientoRender();
   
     } catch (error) {
       console.error("Error cargando pilar 4:", error);
       document.getElementById("directorioGrid").innerHTML = 
         `<p style="grid-column: 1/-1; text-align:center; color:var(--muted); padding:3rem;">Error de red al sincronizar el Entorno Habilitador.</p>`;
     }
   }
   
   function ejecutarProcesamientoRender() {
     recursosFiltrados = recursosEcosistema.filter(rec => {
       return (filtroTipoActual === "Todos" || rec.tipo.toLowerCase() === filtroTipoActual.toLowerCase());
     });
   
     actualizarMarcadoresMapa();
     renderizarDirectorioTarjetas();
   }
   
   /**
    * Dibuja los MARCADORES ESTÁNDAR NATIVOS (Punto-Flecha) y maneja el evento Click de forma reactiva
    */
   function actualizarMarcadoresMapa() {
     if (!mapaEcosistema || !grupoMarcadores) return;
     grupoMarcadores.clearLayers();
   
     recursosFiltrados.forEach(recurso => {
       if (recurso.latitud && recurso.longitud) {
         // Usamos el marcador estándar por defecto (Icono punto/flecha nativo azul con sombra)
         const marcador = L.marker([recurso.latitud, recurso.longitud]);
   
         // Al hacer clic en el marcador, cargamos la información y controlamos las pestañas móviles
         marcador.on('click', () => {
           inyectarInformacionFicha(recurso);
           
           // EVALUACIÓN MÓVIL DIRECTA: Si las pestañas móviles están visibles, cambiar automáticamente a detalles
           const tabsMobile = document.querySelector(".workspace-tabs-mobile");
           if (tabsMobile && window.getComputedStyle(tabsMobile).display !== "none") {
             activarPestañaMovil("detalles");
           }
         });
   
         grupoMarcadores.addLayer(marcador);
       }
     });
   }
   
   /**
    * Inyecta dinámicamente la información estructurada en la Ficha Técnica lateral/móvil
    */
   function inyectarInformacionFicha(recurso) {
     const contenedorSidebar = document.getElementById("sidebarDynamicContent");
     if (!contenedorSidebar) return;
   
     contenedorSidebar.innerHTML = `
       <div class="sidebar-active-card">
         <img src="${recurso.imagenUrl}" alt="${recurso.nombre}">
         <h4>${recurso.nombre}</h4>
         <span class="badge">${recurso.tipo}</span>
         <p>${recurso.descripcion}</p>
         <div class="meta-item"><b>📍 Ámbito/Provincia:</b> ${recurso.provincia}</div>
         <div class="meta-item"><b>📞 Contacto/Enlace:</b> ${recurso.contacto}</div>
       </div>
     `;
   }
   
   /**
    * Renderizado de las tarjetas inferiores del catálogo institucional
    */
   function renderizarDirectorioTarjetas() {
     const contenedorGrid = document.getElementById("directorioGrid");
     if (!contenedorGrid) return;
   
     if (recursosFiltrados.length === 0) {
       contenedorGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--muted); padding:4rem 1rem;">No hay recursos disponibles para los filtros seleccionados.</p>`;
       return;
     }
   
     contenedorGrid.innerHTML = recursosFiltrados.map(recurso => {
       return `
         <div class="actor-card" id="card-${recurso.id}">
           <div class="actor-card-media">
             <img src="${recurso.imagenUrl}" alt="${recurso.nombre}">
             <span class="actor-badge">${recurso.tipo}</span>
           </div>
           <div class="actor-card-body">
             <h4>${recurso.nombre}</h4>
             <span class="actor-location">📍 Región: <b>${recurso.provincia}</b></span>
             <p>${recurso.descripcion}</p>
             <div class="actor-card-footer">
               <span class="actor-contact"><i class="fa-solid fa-circle-nodes"></i> ${recurso.contacto}</span>
               <button class="btn-locate" onclick="centrarFocoHabilitador(${recurso.latitud}, ${recurso.longitud}, '${recurso.id}')">
                 <i class="fa-solid fa-location-crosshairs"></i> Ubicar
               </button>
             </div>
           </div>
         </div>
       `;
     }).join("");
   }
   
   /**
    * Al presionar "Ubicar" desde una tarjeta inferior
    */
   window.centrarFocoHabilitador = function(lat, lng, idRecurso) {
     if (!mapaEcosistema || !lat || !lng) return;
   
     // 1. Buscar el objeto del recurso para cargar la ficha técnica de inmediato
     const recurso = recursosEcosistema.find(r => r.id === idRecurso);
     if (recurso) inyectarInformacionFicha(recurso);
   
     // 2. Mover la cámara del mapa
     mapaEcosistema.setView([lat, lng], 13, { animate: true, duration: 1 });
     
     // 3. Si está en móvil, activar la pestaña del mapa para ver la animación
     const tabsMobile = document.querySelector(".workspace-tabs-mobile");
     if (tabsMobile && window.getComputedStyle(tabsMobile).display !== "none") {
       activarPestañaMovil("mapa");
     }
   
     document.getElementById("mapaEcosistema").scrollIntoView({ behavior: 'smooth' });
   };
   
   /**
    * Abstracción de activación y conmutación de pestañas en entornos móviles
    */
   function activarPestañaMovil(targetTab) {
     const mapWrapper = document.getElementById("mapWrapper");
     const tabMapaBtn = document.getElementById("tabMapaBtn");
     const tabDetallesBtn = document.getElementById("tabDetallesBtn");
   
     if (targetTab === "detalles") {
       if (mapWrapper) mapWrapper.classList.add("show-details");
       if (tabMapaBtn) tabMapaBtn.classList.remove("active");
       if (tabDetallesBtn) tabDetallesBtn.classList.add("active");
     } else {
       if (mapWrapper) mapWrapper.classList.remove("show-details");
       if (tabDetallesBtn) tabDetallesBtn.classList.remove("active");
       if (tabMapaBtn) tabMapaBtn.classList.add("active");
       
       // Corregir renderizado asíncrono de Leaflet al recuperar contenedor oculto
       setTimeout(() => { if (mapaEcosistema) mapaEcosistema.invalidateSize(); }, 200);
     }
   }
   
   /**
    * Vinculación y escucha de selectores y botones de tabs móviles
    */
   function asociarEventosFiltrosYTabs() {
     const selectorEscritorio = document.getElementById("tipoActorSelect");
     if (selectorEscritorio) {
       selectorEscritorio.addEventListener("change", (e) => {
         filtroTipoActual = e.target.value;
         ejecutarProcesamientoRender();
       });
     }
   
     // Escucha manual de clicks en las dos pestañas de cabecera móvil
     document.querySelectorAll(".map-tab-btn").forEach(btn => {
       btn.addEventListener("click", () => {
         const tabDestino = btn.getAttribute("data-tab");
         activarPestañaMovil(tabDestino);
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