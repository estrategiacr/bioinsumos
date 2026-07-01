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
    * Monta la instancia base de Leaflet centrada sobre la geografía de Costa Rica
    */
   function inicializarMapaNacional() {
     // Coordenadas céntricas del territorio de Costa Rica
     mapaEcosistema = L.map('mapaEcosistema', {
       center: [9.7489, -83.7534],
       zoom: 7.5,
       minZoom: 7,
       maxZoom: 14
     });
   
     L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
       attribution: '&copy; OpenStreetMap &copy; CARTO'
     }).addTo(mapaEcosistema);
   
     grupoMarcadores = L.layerGroup().addTo(mapaEcosistema);
   }
   
   /**
    * Carga remota asíncrona de datos desde el ecosistema en la nube
    */
   async function cargarDatosEcosistema() {
     try {
       const respuesta = await fetch(SHEET_CSV_ECOSISTEMA);
       if (!respuesta.ok) throw new Error("Fallo en red al consultar la Google Sheet.");
   
       const textoCSV = await respuesta.text();
       const lineas = textoCSV.split("\n").map(l => l.trim()).filter(l => l.length > 0);
   
       actoresEcosistema = [];
       
       // Saltamos la cabecera del documento CSV
       for (let i = 1; i < lineas.length; i++) {
         const columnas = parsearLineaCSVStandard(lineas[i]);
         if (columnas.length >= 7) {
           actoresEcosistema.push({
             nombre: columnas[1],
             tipo: columnas[2],
             provincia: columnas[3],
             canton: columnas[5],
             contacto: columnas[6],
             descripcion: columnas[4],
             imagen: columnas[9] || "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=600",
             lat: parseFloat(columnas[7]),
             lng: parseFloat(columnas[8])
           });
         }
       }
   
       ejecutarProcesamientoRender();
   
     } catch (err) {
       console.error("Error crítico de carga del ecosistema:", err);
     }
   }
   
   /**
    * Filtra el set de datos globales y dibuja los componentes tanto en el mapa como en la grilla inferior
    */
   function ejecutarProcesamientoRender() {
     actoresFiltrados = actoresEcosistema.filter(actor => {
       return filtroTipoActual === "Todos" || actor.tipo.toLowerCase() === filtroTipoActual.toLowerCase();
     });
   
     renderizarMarcadoresMapa();
     renderizarDirectorioGrid();
   }
   
   /**
    * Dibuja los pines espaciales en el lienzo de Leaflet e inyecta la interacción de fichas de AgroIdeas
    */
   function renderizarMarcadoresMapa() {
     grupoMarcadores.clearLayers();
   
     actoresFiltrados.forEach(actor => {
       if (isNaN(actor.lat) || !actor.lat) return;
   
       // Marcador por defecto estructurado con diseño nativo de Leaflet
       const marcador = L.marker([actor.lat, actor.lng]);
   
       // EVENTO CLICK: Despliega la información y cambia automáticamente de pestaña en móviles
       marcador.on('click', () => {
         desplegarFichaSidebar(actor);
         
         // LOGICA DE CAMBIO DE PESTAÑA AUTOMÁTICA EN CELULARES (Estilo AgroIdeas)
         const mapWrapper = document.getElementById("mapWrapper");
         if (window.innerWidth <= 900 && mapWrapper) {
           // Activamos la clase que oculta el mapa y fuerza la visualización del sidebar en móviles
           mapWrapper.classList.add("show-details");
   
           // Cambiamos el estado activo de los botones de pestañas superiores en celular
           document.querySelectorAll(".map-tab-btn").forEach(btn => {
             if (btn.getAttribute("data-tab") === "detalles") {
               btn.classList.add("active");
             } else {
               btn.classList.remove("active");
             }
           });
         }
       });
   
       grupoMarcadores.addLayer(marcador);
     });
   }
   
   /**
    * Inyecta dinámicamente la estructura de DOS COLUMNAS (Texto + Imagen) dentro de la ficha lateral
    */
   function desplegarFichaSidebar(actor) {
     const placeholder = document.getElementById("sidebarPlaceholder");
     const contenedorDinamico = document.getElementById("sidebarDynamicContent");
   
     if (!contenedorDinamico) return;
   
     if (placeholder) placeholder.classList.add("d-none");
     contenedorDinamico.classList.remove("d-none");
   
     // Creación del layout unificado de dos columnas (sidebar-info-layout)
     contenedorDinamico.innerHTML = `
       <div class="sidebar-info-layout">
         
         <div class="sidebar-text-col">
           <span class="badge-tipo ${actor.tipo.toLowerCase()}">${actor.tipo}</span>
           <h2>${actor.nombre}</h2>
           
           <div class="sidebar-meta-item">
             <i class="fa-solid fa-location-dot"></i>
             <span>${actor.canton}, ${actor.provincia}</span>
           </div>
           
           <div class="sidebar-meta-item">
             <i class="fa-solid fa-envelope"></i>
             <span>${actor.contacto}</span>
           </div>
           
           <p class="sidebar-desc">${actor.descripcion}</p>
         </div>
         
         <div class="sidebar-img-col">
           <img src="${actor.imagen}" alt="${actor.nombre}" onerror="this.src='https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=600';">
         </div>
   
       </div>
     `;
   }
   
   /**
    * Dibuja las tarjetas informativas fijas en la grilla inferior
    */
   function renderizarDirectorioGrid() {
     const grid = document.getElementById("directorioGrid");
     if (!grid) return;
   
     grid.innerHTML = "";
   
     if (actoresFiltrados.length === 0) {
       grid.innerHTML = `<p style="grid-column: 1/-1; color: var(--muted); text-align: center; padding: 2rem;">No existen registros mapeados bajo el sector seleccionado.</p>`;
       return;
     }
   
     actoresFiltrados.forEach(actor => {
       const card = document.createElement("div");
       card.className = "actor-card";
       card.innerHTML = `
         <span class="badge-tipo ${actor.tipo.toLowerCase()}" style="margin:0;">${actor.tipo}</span>
         <h3>${actor.nombre}</h3>
         <p><i class="fa-solid fa-location-dot" style="color:var(--primary); margin-right:5px;"></i> ${actor.canton}, ${actor.provincia}</p>
         <p style="font-size:0.9rem; margin-top:0.25rem;">${actor.descripcion.substring(0, 110)}...</p>
       `;
       grid.appendChild(card);
     });
   }
   
   function asociarEventosFiltros() {
     const selectFiltro = document.getElementById("filtroTipoEcosistema");
     if (selectFiltro) {
       selectFiltro.addEventListener("change", (e) => {
         filtroTipoActual = e.target.value;
         ejecutarProcesamientoRender();
       });
     }
   
     // MANEJADOR DE PESTAÑAS MANUALES EN MÓVILES (ESTILO AGROIDEAS)
     const tabButtons = document.querySelectorAll(".map-tab-btn");
     const mapWrapper = document.getElementById("mapWrapper");
   
     tabButtons.forEach(btn => {
       btn.addEventListener("click", () => {
         tabButtons.forEach(b => b.classList.remove("active"));
         btn.classList.add("active");
   
         const tabDestino = btn.getAttribute("data-tab");
         if (tabDestino === "detalles") {
           mapWrapper.classList.add("show-details");
         } else {
           mapWrapper.classList.remove("show-details");
           // Refrescar tamaño de Leaflet para prevenir fallas de renderizado visual
           setTimeout(() => { mapaEcosistema.invalidateSize(); }, 200);
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
       if (char === '\"') {
         dentroDeComillas = !dentroDeComillas;
       } else if (char === ',' && !dentroDeComillas) {
         resultado.push(entradaActual.trim().replace(/^\"|\"$/g, ''));
         entradaActual = "";
       } else {
         entradaActual += char;
       }
     }
     resultado.push(entradaActual.trim().replace(/^\"|\"$/g, ''));
     return resultado;
   }