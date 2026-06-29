/* ==========================================================================
   CONTROLADOR LÓGICO: BITÁCORA VIVA DE CAMPO Y CASOS DE ÉXITO
   Plataforma: Bioinsumos Costa Rica (Pilar 2)
   ========================================================================== */

   let repositorioExperiencias = [];
   let datosFiltrados = [];
   let regionSeleccionada = "Todos";
   
   // URL de publicación en la Web de Google Sheets (Formato CSV)
   const SHEET_CSV_EXPERIENCIAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=615287650&single=true&output=csv";
   
   document.addEventListener("DOMContentLoaded", () => {
       asociarComponentesUI();
       cargarDatosDesdeGoogleSheet();
   });
   
   /**
    * Procesa una fila de texto CSV separada por punto y coma (;)
    * y respeta las comas internas que existan dentro de textos con comillas.
    */
   function parsearLineaCSV(linea) {
       const resultado = [];
       let dentroDeComillas = false;
       let entradaActual = "";
       
       for (let i = 0; i < linea.length; i++) {
           const char = linea[i];
           if (char === '"') {
               dentroDeComillas = !dentroDeComillas;
           } else if (char === ';' && !dentroDeComillas) {
               resultado.push(entradaActual.trim().replace(/^"|"$/g, ''));
               entradaActual = "";
           } else {
               entradaActual += char;
           }
       }
       resultado.push(entradaActual.trim().replace(/^"|"$/g, ''));
       return resultado;
   }
   
   /**
    * Realiza el Fetch asíncrono hacia Google Sheets y mapea las columnas del Pilar 2
    */
   async function cargarDatosDesdeGoogleSheet() {
       try {
           const respuesta = await fetch(SHEET_CSV_EXPERIENCIAS);
           const texto = await respuesta.text();
           // Separamos el texto por saltos de línea y quitamos renglones vacíos
           const filas = texto.split(/\r?\n/).filter(f => f.trim() !== "");
           
           if (filas.length <= 1) {
               document.getElementById("socialFeedContainer").innerHTML = 
                   `<p style="grid-column:1/-1; text-align:center; color:var(--text-light); padding:4rem 1rem;">La base de datos está vacía en este momento.</p>`;
               return;
           }
   
           // Saltamos el encabezado (filas[0]) y estructuramos los objetos
           repositorioExperiencias = filas.slice(1).map(row => {
               const cols = parsearLineaCSV(row);
               return {
                   id: cols[0] || Math.random().toString(),
                   titulo: cols[1] || "Caso práctico sin título",
                   organizacion: cols[2] || "Organización No Asignada",
                   region: cols[3] || "San José",
                   descripcion: cols[4] || "Sin detalles en la bitácora de campo.",
                   imagenUrl: cols[5] || "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=600",
                   estado: cols[6] || "Validada",
                   tags: cols[7] ? cols[7].split(",").map(t => t.trim()) : ["Bioinsumo"],
                   fecha: cols[8] || "Reciente",
                   likes: parseInt(cols[9]) || Math.floor(Math.random() * 30) + 5,
                   likedByUser: false
               };
           });
   
           ejecutarFiltradoYRender();
           construirSelectorProvinciasMovil();
       } catch (e) {
           console.error("Error cargando el repositorio de experiencias agrícolas:", e);
           const contenedor = document.getElementById("socialFeedContainer");
           if (contenedor) {
               contenedor.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-light); padding:4rem 1rem;">Error de conexión al sincronizar la bitácora de campo. Reintente en unos momentos.</p>`;
           }
       }
   }
   
   /**
    * Evalúa los criterios de búsqueda y región activa (Soporta vistas móviles y de escritorio)
    */
   function ejecutarFiltradoYRender() {
       // Detectamos de cuál buscador jalar la información dependiendo de si el dock móvil está visible
       const esCelular = document.querySelector(".mobile-floating-dock").getBoundingClientRect().height > 0;
       const activeSearch = esCelular
           ? document.querySelector(".mobile-search-bar input")
           : document.querySelector(".filter-wrapper .global-exp-search");
   
       const query = activeSearch ? activeSearch.value.toLowerCase().trim() : "";
   
       datosFiltrados = repositorioExperiencias.filter(item => {
           const matchRegion = (regionSeleccionada === "Todos" || item.region.toLowerCase() === regionSeleccionada.toLowerCase());
           const matchTexto = (query === "") || 
                              item.titulo.toLowerCase().includes(query) || 
                              item.descripcion.toLowerCase().includes(query) ||
                              item.organizacion.toLowerCase().includes(query) ||
                              item.tags.some(t => t.toLowerCase().includes(query));
           return matchRegion && matchTexto;
       });
   
       // Actualiza el indicador numérico de casos dinámicamente
       const contador = document.getElementById("totalItemsCount");
       if (contador) contador.textContent = datosFiltrados.length;
       
       renderizarFeedSocial();
   }
   
   /**
    * Construye e inyecta las tarjetas en el Grid con estilo editorial de red social
    */
   function renderizarFeedSocial() {
       const contenedor = document.getElementById("socialFeedContainer");
       if (!contenedor) return;
   
       if (datosFiltrados.length === 0) {
           contenedor.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-light); padding:4rem 1rem;">No se encontraron parcelas demostrativas o casos de éxito con los filtros actuales.</p>`;
           return;
       }
   
       contenedor.innerHTML = datosFiltrados.map(item => {
           const tagsHTML = item.tags.map(t => `<span class="social-pill">#${t}</span>`).join("");
           return `
               <article class="social-card">
                   <div class="social-card-header">
                       <div class="header-profile-info">
                           <span class="profile-title">${item.organizacion}</span>
                           <span class="profile-subtitle">📍 ${item.region} · Bitácora de Campo</span>
                       </div>
                       <span style="font-size:0.75rem; font-weight:600; color:var(--text-light);">${item.fecha}</span>
                   </div>
                   
                   <div class="social-card-media">
                       <img src="${item.imagenUrl}" alt="${item.titulo}" loading="lazy">
                       <span class="social-status-tag">${item.estado}</span>
                   </div>
                   
                   <div class="social-interactions-bar">
                       <span class="action-icon-btn ${item.likedByUser ? 'liked' : ''}" onclick="reaccionarPublicacion('${item.id}')" title="Validar experiencia">
                           <i class="${item.likedByUser ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                       </span>
                       <span style="font-size:1.1rem; cursor:pointer;" onclick="copiarEnlaceTransferencia('${item.id}')" title="Copiar enlace de transferencia">
                           <i class="fa-regular fa-paper-plane"></i>
                       </span>
                   </div>
                   
                   <div class="social-card-body">
                       <span class="likes-counter">${item.likes} productores validaron esta práctica</span>
                       <p class="social-caption-text"><b>${item.titulo}:</b> ${item.descripcion}</p>
                       <div class="social-tags-row">${tagsHTML}</div>
                   </div>
               </article>
           `;
       }).join("");
   }
   
   /**
    * Control de Interacciones: Simulación del "Me Gusta"
    */
   window.reaccionarPublicacion = function(id) {
       const item = repositorioExperiencias.find(x => x.id == id);
       if (!item) return;
       
       item.likedByUser = !item.likedByUser;
       item.likes += item.likedByUser ? 1 : -1;
       
       // Volvemos a renderizar manteniendo el estado actualizado
       ejecutarFiltradoYRender();
   };
   
   /**
    * Simulación de copia de enlace de transferencia tecnológica
    */
   window.copiarEnlaceTransferencia = function(id) {
       alert("¡Enlace de transferencia tecnológica copiado al portapapeles con éxito!");
   };
   
   /**
    * Genera de forma dinámica los botones de opción dentro del modal móvil de provincias
    */
   function construirSelectorProvinciasMovil() {
       const provincias = ["Todos", "San José", "Alajuela", "Cartago", "Heredia", "Guanacaste", "Puntarenas", "Limón"];
       const container = document.getElementById("mobileRegionOptions");
       if (!container) return;
   
       container.innerHTML = provincias.map(p => `
           <button class="region-opt-btn ${regionSeleccionada.toLowerCase() === p.toLowerCase() ? 'active' : ''}" data-reg="${p}">
               ${p === "Todos" ? "Todas las Provincias" : p}
           </button>
       `).join("");
   
       // Agregar evento clic a los botones del modal móvil
       document.querySelectorAll(".region-opt-btn").forEach(btn => {
           btn.addEventListener("click", () => {
               regionSeleccionada = btn.getAttribute("data-reg");
               
               // Refrescar clases active en botones móviles
               document.querySelectorAll(".region-opt-btn").forEach(b => b.classList.remove("active"));
               btn.classList.add("active");
               
               // Sincronizar el componente select de Escritorio para mantener la paridad de filtros
               const selectEscritorio = document.querySelector(".global-exp-select");
               if (selectEscritorio) selectEscritorio.value = regionSeleccionada;
               
               ejecutarFiltradoYRender();
           });
       });
   }
   
   /**
    * Vinculación y escucha de eventos de interfaz (Inputs, selects y ventanas emergentes)
    */
   function asociarComponentesUI() {
       // Sincronizar en tiempo real lo que se digite en el buscador de escritorio y móvil
       document.querySelectorAll(".global-exp-search").forEach(input => {
           input.addEventListener("input", (e) => {
               document.querySelectorAll(".global-exp-search").forEach(x => x.value = e.target.value);
               ejecutarFiltradoYRender();
           });
       });
   
       // Escucha del selector de Provincias tradicional en Escritorio
       const selectEscritorio = document.querySelector(".global-exp-select");
       if (selectEscritorio) {
           selectEscritorio.addEventListener("change", (e) => {
               regionSeleccionada = e.target.value;
               ejecutarFiltradoYRender();
           });
       }
   
       // Control de ventanas emergentes (Modal Móvil) y botón Actualizar del dock flotante inferior
       const btnReg = document.getElementById("mobileRegionBtn");
       const modalReg = document.getElementById("mobileRegionModal");
       const btnCloseReg = document.getElementById("closeRegionModal");
       const refreshBtn = document.getElementById("refreshFeedBtn");
   
       if (btnReg && modalReg) {
           btnReg.addEventListener("click", () => modalReg.classList.remove("hidden"));
       }
       if (btnCloseReg && modalReg) {
           btnCloseReg.addEventListener("click", () => modalReg.classList.add("hidden"));
       }
       
       if (refreshBtn) {
           refreshBtn.addEventListener("click", () => {
               cargarDatosDesdeGoogleSheet();
               // Efecto visual rápido para denotar acción
               refreshBtn.style.transform = "scale(0.95)";
               setTimeout(() => { refreshBtn.style.transform = "scale(1)"; }, 150);
           });
       }
   }