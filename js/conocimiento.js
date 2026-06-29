/* ==========================================================================
   CONTROLADOR LOGICO: BITÁCORA VIVA DE CAMPO Y CASOS DE ÉXITO
   ========================================================================== */

   let repositorioExperiencias = [];
   let datosFiltrados = [];
   let regionSeleccionada = "Todos";
   
   const SHEET_CSV_EXPERIENCIAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=615287650&single=true&output=csv";
   
   document.addEventListener("DOMContentLoaded", () => {
       asociarComponentesUI();
       cargarDatosDesdeGoogleSheet();
   });
   
   /* Separador seguro de comas dentro de cadenas CSV */
   function parsearLineaCSV(linea) {
       const resultado = [];
       let dentroDeComillas = false;
       let entradaActual = "";
       for (let i = 0; i < linea.length; i++) {
           const char = linea[i];
           if (char === '"') dentroDeComillas = !dentroDeComillas;
           else if (char === ',' && !dentroDeComillas) {
               resultado.push(entradaActual.trim().replace(/^"|"$/g, ''));
               entradaActual = "";
           } else entradaActual += char;
       }
       resultado.push(entradaActual.trim().replace(/^"|"$/g, ''));
       return resultado;
   }
   
   /* Descarga y mapeo de datos */
   async function cargarDatosDesdeGoogleSheet() {
       try {
           const respuesta = await fetch(SHEET_CSV_EXPERIENCIAS);
           const texto = await respuesta.text();
           const filas = texto.split(/\r?\n/).filter(f => f.trim() !== "");
           
           if (filas.length <= 1) return;
   
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
                   likes: parseInt(cols[9]) || 12,
                   likedByUser: false
               };
           });
   
           ejecutarFiltradoYRender();
           construirSelectorProvinciasMovil();
       } catch (e) {
           console.error("Error cargando repositorio de experiencias:", e);
       }
   }
   
   /* Procesamiento reactivo de búsquedas y filtros */
   function ejecutarFiltradoYRender() {
       const activeSearch = document.querySelector(".mobile-floating-dock").getBoundingClientRect().height > 0
           ? document.querySelector(".mobile-search-bar input")
           : document.querySelector(".filter-wrapper .global-exp-search");
   
       const query = activeSearch ? activeSearch.value.toLowerCase().trim() : "";
   
       datosFiltrados = repositorioExperiencias.filter(item => {
           const matchRegion = (regionSeleccionada === "Todos" || item.region === regionSeleccionada);
           const matchTexto = (query === "") || 
                              item.titulo.toLowerCase().includes(query) || 
                              item.descripcion.toLowerCase().includes(query) ||
                              item.organizacion.toLowerCase().includes(query);
           return matchRegion && matchTexto;
       });
   
       document.getElementById("totalItemsCount").textContent = datosFiltrados.length;
       renderizarFeedSocial();
   }
   
   /* Generador de Tarjetas de Red Social */
   function renderizarFeedSocial() {
       const contenedor = document.getElementById("socialFeedContainer");
       if (!contenedor) return;
   
       if (datosFiltrados.length === 0) {
           contenedor.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-light); padding:4rem 1rem;">No se encontraron reportes o parcelas demostrativas con los filtros actuales.</p>`;
           return;
       }
   
       contenedor.innerHTML = datosFiltrados.map(item => {
           const tagsHTML = item.tags.map(t => `<span class="social-pill">#${t}</span>`).join("");
           return `
               <article class="social-card">
                   <div class="social-card-header">
                       <div class="header-profile-info">
                           <span class="profile-title">${item.organizacion}</span>
                           <span class="profile-subtitle">📍 ${item.region} · Parcela de campo</span>
                       </div>
                       <span style="font-size:0.75rem; font-weight:600; color:var(--text-light);">${item.fecha}</span>
                   </div>
                   <div class="social-card-media">
                       <img src="${item.imagenUrl}" alt="${item.titulo}">
                       <span class="social-status-tag">${item.estado}</span>
                   </div>
                   <div class="social-interactions-bar">
                       <span class="action-icon-btn ${item.likedByUser ? 'liked' : ''}" onclick="reaccionarPublicacion('${item.id}')">
                           <i class="${item.likedByUser ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                       </span>
                       <span style="font-size:1.1rem; cursor:pointer;" onclick="alert('Enlace del reporte copiado al portapapeles para transferencia tecnológica.')">
                           <i class="fa-regular fa-paper-plane"></i>
                       </span>
                   </div>
                   <div class="social-card-body">
                       <span class="likes-counter">${item.likes} productores validaron esto</span>
                       <p class="social-caption-text"><b>${item.titulo}:</b> ${item.descripcion}</p>
                       <div class="social-tags-row">${tagsHTML}</div>
                   </div>
               </article>
           `;
       }).join("");
   }
   
   /* Reacciones Dinámicas */
   window.reaccionarPublicacion = function(id) {
       const item = repositorioExperiencias.find(x => x.id == id);
       if (!item) return;
       item.likedByUser = !item.likedByUser;
       item.likes += item.likedByUser ? 1 : -1;
       ejecutarFiltradoYRender();
   };
   
   /* Construcción de Provincias en Dock Móvil */
   function construirSelectorProvinciasMovil() {
       const provincias = ["Todos", "San José", "Alajuela", "Cartago", "Heredia", "Guanacaste", "Puntarenas", "Limón"];
       const container = document.getElementById("mobileRegionOptions");
       if (!container) return;
   
       container.innerHTML = provincias.map(p => `
           <button class="region-opt-btn ${regionSeleccionada === p ? 'active' : ''}" data-reg="${p}">${p === "Todos" ? "Todas" : p}</button>
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
   
   function asociarComponentesUI() {
       // Inputs de búsqueda unificados
       document.querySelectorAll(".global-exp-search").forEach(input => {
           input.addEventListener("input", (e) => {
               document.querySelectorAll(".global-exp-search").forEach(x => x.value = e.target.value);
               ejecutarFiltradoYRender();
           });
       });
   
       // Select Tradicional Escritorio
       const select = document.querySelector(".global-exp-select");
       if (select) {
           select.addEventListener("change", (e) => {
               regionSeleccionada = e.target.value;
               ejecutarFiltradoYRender();
           });
       }
   
       // Eventos Modales e Interfaz Móvil
       const btnReg = document.getElementById("mobileRegionBtn");
       const modalReg = document.getElementById("mobileRegionModal");
       const btnCloseReg = document.getElementById("closeRegionModal");
       const refreshBtn = document.getElementById("refreshFeedBtn");
   
       if (btnReg && modalReg) btnReg.addEventListener("click", () => modalReg.classList.remove("hidden"));
       if (btnCloseReg && modalReg) btnCloseReg.addEventListener("click", () => modalReg.classList.add("hidden"));
       if (refreshBtn) {
           refreshBtn.addEventListener("click", () => {
               cargarDatosDesdeGoogleSheet();
               alert("¡Bitácora sincronizada con el servidor!");
           });
       }
   }