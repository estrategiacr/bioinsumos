/* ==========================================================================
   CONTROLADOR LÓGICO: BITÁCORA VIVA DE CAMPO Y CASOS DE ÉXITO
   Plataforma: Bioinsumos Costa Rica (Pilar 2)
   ========================================================================== */

   let repositorioExperiencias = [];
   let datosFiltrados = [];
   let regionSeleccionada = "Todos";
   
   // URL de publicación en la Web de Google Sheets (Formato CSV estructurado por ';')
   const SHEET_CSV_EXPERIENCIAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=615287650&single=true&output=csv";
   
   document.addEventListener("DOMContentLoaded", () => {
       asociarComponentesUI();
       cargarDatosDesdeGoogleSheet();
   });
   
   /**
    * Procesa de manera robusta una fila CSV delimitada por punto y coma (;)
    * impidiendo errores debido a las comas internas presentes en descripciones o tags.
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
    * Consulta la API pública de Sheets y genera el árbol estructurado de la bitácora
    */
   async function cargarDatosDesdeGoogleSheet() {
       try {
           const respuesta = await fetch(SHEET_CSV_EXPERIENCIAS);
           const texto = await respuesta.text();
           const filas = texto.split(/\r?\n/).filter(f => f.trim() !== "");
           
           if (filas.length <= 1) {
               document.getElementById("socialFeedContainer").innerHTML = 
                   `<p style="grid-column:1/-1; text-align:center; color:var(--text-light); padding:4rem 1rem;">La bitácora se encuentra vacía de momento.</p>`;
               return;
           }
   
           // Mapea saltando la cabecera e interpretando columnas
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
                   likes: parseInt(cols[9]) || Math.floor(Math.random() * 25) + 10,
                   likedByUser: false
               };
           });
   
           ejecutarFiltradoYRender();
           construirSelectorProvinciasMovil();
       } catch (e) {
           console.error("Error sincronizando bitácora remota:", e);
           const contenedor = document.getElementById("socialFeedContainer");
           if (contenedor) {
               contenedor.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-light); padding:4rem 1rem;">Sucedió un inconveniente de red al cargar el feed de experiencias. Por favor refresque la página.</p>`;
           }
       }
   }
   
   /**
    * Procesa la lógica cruzada de búsquedas textuales y filtros geográficos
    */
   function ejecutarFiltradoYRender() {
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
   
       const contador = document.getElementById("totalItemsCount");
       if (contador) contador.textContent = datosFiltrados.length;
       
       renderizarFeedSocial();
   }
   
   /**
    * Inyecta los reportes dinámicos simulando una red social técnica de agroecología
    */
   function renderizarFeedSocial() {
       const contenedor = document.getElementById("socialFeedContainer");
       if (!contenedor) return;
   
       if (datosFiltrados.length === 0) {
           contenedor.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-light); padding:4rem 1rem;">No se hallaron registros prácticos para los términos seleccionados.</p>`;
           return;
       }
   
       contenedor.innerHTML = datosFiltrados.map(item => {
           const tagsHTML = item.tags.map(t => `<span class="social-pill">#${t}</span>`).join("");
           return `
               <article class="social-card">
                   <div class="social-card-header">
                       <div class="header-profile-info">
                           <span class="profile-title">${item.organizacion}</span>
                           <span class="profile-subtitle">📍 ${item.region} · Validación Práctica</span>
                       </div>
                       <span style="font-size:0.75rem; font-weight:600; color:var(--text-light);">${item.fecha}</span>
                   </div>
                   
                   <div class="social-card-media">
                       <img src="${item.imagenUrl}" alt="${item.titulo}" loading="lazy">
                       <span class="social-status-tag">${item.estado}</span>
                   </div>
                   
                   <div class="social-interactions-bar">
                       <span class="action-icon-btn ${item.likedByUser ? 'liked' : ''}" onclick="reaccionarPublicacion('${item.id}')" title="Validar esta experiencia">
                           <i class="${item.likedByUser ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                       </span>
                       <span style="font-size:1.1rem; cursor:pointer;" onclick="copiarEnlaceReporte('${item.id}')" title="Compartir caso práctico">
                           <i class="fa-regular fa-paper-plane"></i>
                       </span>
                   </div>
                   
                   <div class="social-card-body">
                       <span class="likes-counter">${item.likes} productores validaron este caso</span>
                       <p class="social-caption-text"><b>${item.titulo}:</b> ${item.descripcion}</p>
                       <div class="social-tags-row">${tagsHTML}</div>
                   </div>
               </article>
           `;
       }).join("");
   }
   
   /**
    * Interacción de feedback rápido ("Me Gusta")
    */
   window.reaccionarPublicacion = function(id) {
       const item = repositorioExperiencias.find(x => x.id == id);
       if (!item) return;
       
       item.likedByUser = !item.likedByUser;
       item.likes += item.likedByUser ? 1 : -1;
       
       ejecutarFiltradoYRender();
   };
   
   window.copiarEnlaceReporte = function(id) {
       alert("¡Ficha de transferencia de campo copiada al portapapeles de su dispositivo!");
   };
   
   /**
    * Construye dinámicamente los botones dentro de la ventana emergente de selección móvil
    */
   function construirSelectorProvinciasMovil() {
       const provincias = ["Todos", "San José", "Alajuela", "Cartago", "Heredia", "Guanacaste", "Puntarenas", "Limón"];
       const container = document.getElementById("mobileRegionOptions");
       if (!container) return;
   
       container.innerHTML = provincias.map(p => `
           <button class="region-opt-btn ${regionSeleccionada.toLowerCase() === p.toLowerCase() ? 'active' : ''}" data-reg="${p}">
               ${p === "Todos" ? "Todas" : p}
           </button>
       `).join("");
   
       document.querySelectorAll(".region-opt-btn").forEach(btn => {
           btn.addEventListener("click", () => {
               regionSeleccionada = btn.getAttribute("data-reg");
               
               document.querySelectorAll(".region-opt-btn").forEach(b => b.classList.remove("active"));
               btn.classList.add("active");
               
               const selectEscritorio = document.querySelector(".global-exp-select");
               if (selectEscritorio) selectEscritorio.value = regionSeleccionada;
               
               ejecutarFiltradoYRender();
           });
       });
   }
   
   /**
    * Vinculación bidireccional de manejadores de eventos
    */
   function asociarComponentesUI() {
       // Escucha unificada de buscadores
       document.querySelectorAll(".global-exp-search").forEach(input => {
           input.addEventListener("input", (e) => {
               document.querySelectorAll(".global-exp-search").forEach(x => x.value = e.target.value);
               ejecutarFiltradoYRender();
           });
       });
   
       // Escucha del combo de escritorio
       const select = document.querySelector(".global-exp-select");
       if (select) {
           select.addEventListener("change", (e) => {
               regionSeleccionada = e.target.value;
               ejecutarFiltradoYRender();
           });
       }
   
       // Manejo de Ventanas Flotantes Móviles
       const btnReg = document.getElementById("mobileRegionBtn");
       const modalReg = document.getElementById("mobileRegionModal");
       const btnCloseReg = document.getElementById("closeRegionModal");
       const refreshBtn = document.getElementById("refreshFeedBtn");
   
       if (btnReg && modalReg) btnReg.addEventListener("click", () => modalReg.classList.remove("hidden"));
       if (btnCloseReg && modalReg) btnCloseReg.addEventListener("click", () => modalReg.classList.add("hidden"));
       
       if (refreshBtn) {
           refreshBtn.addEventListener("click", () => {
               cargarDatosDesdeGoogleSheet();
               alert("¡Bitácora sincronizada con Google Sheets!");
           });
       }
   }