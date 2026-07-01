/* ==========================================================================
   CONTROLADOR LÓGICO: ECOSISTEMA NACIONAL Y MAPA DE BIOFÁBRICAS
   Bioinsumos Costa Rica - Pilar 3 (Articulación Sectorial)
   ========================================================================== */

   let actoresEcosistema = [];
   let actoresFiltrados = [];
   let filtroTipoActual = "Todos";
   
   // URL remota del Google Sheets - Reemplaza con tu GID correspondiente del Pilar 3
   const SHEET_CSV_ECOSISTEMA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=966344977&single=true&output=csv";
   
   // Instancias del mapa de Leaflet
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
   
   // Inicialización de Leaflet centrado geográficamente en Costa Rica
   function inicializarMapaNacional() {
       mapaEcosistema = L.map('ecosistemaMapa', {
           center: [9.7489, -83.7534], // Coordenadas geográficas base de CR
           zoom: 7.5,
           minZoom: 6,
           maxZoom: 16
       });
   
       L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
           attribution: '&copy; OpenStreetMap &copy; CARTO'
       }).addTo(mapaEcosistema);
   
       grupoMarcadores = L.layerGroup().addTo(mapaEcosistema);
   }
   
   // Descarga asíncrona de datos desde el Google Sheets
   async function cargarDatosEcosistema() {
       try {
           const respuesta = await fetch(SHEET_CSV_ECOSISTEMA);
           if (!respuesta.ok) throw new Error("Fallo de conexión remota");
           
           const textoCVS = await respuesta.text();
           const filas = textoCVS.split(/\r?\n/);
           
           actoresEcosistema = filas.slice(1).map((fila, index) => {
               const cols = parsearLineaCSVStandard(fila);
               
               // Mapeo Estructurado de Columnas (Adecúalo al orden exacto de tu nueva pestaña)
               return {
                   id: cols[0] || `actor-${index}`,
                   nombre: cols[1] || "Actor no identificado",
                   tipo: cols[2] || "Productor", // Productor, Empresa, Universidad, Investigación, Institución
                   provincias: cols[3] || "San José",
                   proyectos: cols[4] || "Sin proyectos reportados actualmente.",
                   redes: cols[5] || "Comunidad General",
                   contacto: cols[6] || "No disponible",
                   lat: parseFloat(cols[7]) || 9.7489 + (Math.random() - 0.5) * 0.4, // Coordenadas de respaldo si vienen vacías
                   lng: parseFloat(cols[8]) || -83.7534 + (Math.random() - 0.5) * 0.4
               };
           });
   
           actoresFiltrados = [...actoresEcosistema];
           ejecutarProcesamientoRender();
   
       } catch (error) {
           console.error("Error cargando el Pilar 3:", error);
           document.getElementById("directorioGrid").innerHTML = `<p style="padding:2rem; color:red;">No se pudo sincronizar el Ecosistema Nacional. Verifique la publicación del Google Sheets.</p>`;
       }
   }
   
   // Filtra los datos según la búsqueda de texto y tipo de actor, luego actualiza la UI
   function ejecutarProcesamientoRender() {
       const busqueda = document.getElementById("directorioSearch").value.toLowerCase();
       
       actoresFiltrados = actoresEcosistema.filter(actor => {
           const cumpleTipo = (filtroTipoActual === "Todos" || actor.tipo === filtroTipoActual);
           const cumpleTexto = (
               actor.nombre.toLowerCase().includes(busqueda) ||
               actor.proyectos.toLowerCase().includes(busqueda) ||
               actor.redes.toLowerCase().includes(busqueda)
           );
           return cumpleTipo && cumpleTexto;
       });
   
       renderizarTarjetasDirectorio();
       renderizarMarcadoresMapa();
   }
   
   function renderizarTarjetasDirectorio() {
       const contenedor = document.getElementById("directorioGrid");
       contenedor.innerHTML = "";
   
       if (actoresFiltrados.length === 0) {
           contenedor.innerHTML = `<p class="sidebar-default-msg" style="grid-column: 1/-1;">No se encontraron actores con los criterios ingresados.</p>`;
           return;
       }
   
       actoresFiltrados.forEach(actor => {
           const card = document.createElement("div");
           card.className = "actor-grid-card";
           card.innerHTML = `
               <div class="card-header-info">
                   <span class="badge-tipo ${actor.tipo.toLowerCase()}">${actor.tipo}</span>
                   <h4>${actor.nombre}</h4>
                   <p class="card-desc">${actor.proyectos.substring(0, 110)}...</p>
               </div>
               <div class="card-footer-meta">
                   <div class="card-meta-line"><i class="fa-solid fa-location-dot"></i> ${actor.provincias}</div>
                   <div class="card-meta-line"><i class="fa-solid fa-circle-nodes"></i> ${actor.redes}</div>
                   <div class="card-meta-line"><i class="fa-solid fa-envelope"></i> ${actor.contacto}</div>
               </div>
           `;
           
           // Al hacer click en la tarjeta, enfoca el mapa y abre su ficha técnica
           card.addEventListener("click", () => {
               mapaEcosistema.setView([actor.lat, actor.lng], 12);
               desplegarFichaActor(actor);
               
               // Si está en móvil, hace scroll automático hacia arriba para ver el detalle
               if (window.innerWidth <= 900) {
                   const btnTabDetalle = document.querySelector('.map-tab-btn[data-tab="detalles"]');
                   if (btnTabDetalle) btnTabDetalle.click();
               }
           });
   
           contenedor.appendChild(card);
       });
   }
   
   function renderizarMarcadoresMapa() {
       grupoMarcadores.clearLayers();
   
       actoresFiltrados.forEach(actor => {
           // Marcador por defecto interactivo
           const marker = L.marker([actor.lat, actor.lng]);
           
           marker.bindTooltip(`<strong>${actor.nombre}</strong><br><small>${actor.tipo}</small>`, {
               direction: 'top',
               offset: [0, -10]
           });
   
           marker.on('click', () => {
               desplegarFichaActor(actor);
           });
   
           grupoMarcadores.addLayer(marker);
       });
   }
   
   // Inyecta la información en el panel lateral de auditoría (Sidebar)
   function desplegarFichaActor(actor) {
       document.getElementById("sidebarDefaultMsg").classList.add("hidden");
       const activeContent = document.getElementById("sidebarActiveContent");
       activeContent.classList.remove("hidden");
   
       activeContent.innerHTML = `
           <div class="actor-card-sidebar">
               <span class="badge-tipo ${actor.tipo.toLowerCase()}">${actor.tipo}</span>
               <h3>${actor.nombre}</h3>
               
               <div class="sidebar-meta-block">
                   <strong>Ubicación Geográfica</strong>
                   <p><i class="fa-solid fa-map-pin"></i> ${actor.provincias}, Costa Rica</p>
               </div>
   
               <div class="sidebar-meta-block">
                   <strong>Proyectos en Ejecución</strong>
                   <p>${actor.proyectos}</p>
               </div>
   
               <div class="sidebar-meta-block">
                   <strong>Redes y Comunidades de Práctica</strong>
                   <p><i class="fa-solid fa-hubspot"></i> ${actor.redes}</p>
               </div>
   
               <div class="sidebar-meta-block">
                   <strong>Canal Oficial de Contacto</strong>
                   <p><i class="fa-solid fa-address-book"></i> ${actor.contacto}</p>
               </div>
           </div>
       `;
   }
   
   function asociarEventosFiltros() {
       document.getElementById("directorioSearch").addEventListener("input", ejecutarProcesamientoRender);
       document.getElementById("directorioFilterTipo").addEventListener("change", (e) => {
           filtroTipoActual = e.target.value;
           ejecutarProcesamientoRender();
       });
   
       // Control de pestañas para la visualización adaptativa móvil
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
                   setTimeout(() => { mapaEcosistema.invalidateSize(); }, 200);
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