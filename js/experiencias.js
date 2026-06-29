/* ==========================================================================
   CONTROLADOR LÓGICO: PILAR 2 - BITÁCORA VIVA DE EXPERIENCIAS
   Plataforma Integrada Sincronizada con Google Sheets
   ========================================================================== */

   let repositorioExperiencias = [];
   let datosFiltrados = [];
   let regionSeleccionada = "Todos";
   
   // URL Base unificada compartida de tu Google Sheets
   const SHEET_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?";
   const SHEET_CSV_EXPERIENCIAS = `${SHEET_BASE}gid=615287650&single=true&output=csv`;
   
   document.addEventListener("DOMContentLoaded", () => {
     asociarComponentesUI();
     cargarDatosDesdeGoogleSheet();
   });
   
   // =====================================
   // UTILIDADES Y PARSEADORES UNIFICADOS
   // =====================================
   
   function convertirLinkDriveAImagen(url) {
     if (!url) return "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=600";
     const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
     if (!match) return url;
     return `https://docs.google.com/uc?export=view&id=${match[1]}`;
   }
   
   /**
    * Split inteligente para CSV: Separa por COMAS (,), 
    * respetando textos largos o etiquetas agrupadas entre comillas.
    */
   function parsearLineaCSV(linea) {
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
   
   // =====================================
   // CARGA Y PROCESAMIENTO DE DATOS
   // =====================================
   
   async function cargarDatosDesdeGoogleSheet() {
     try {
       const respuesta = await fetch(SHEET_CSV_EXPERIENCIAS);
       const texto = await respuesta.text();
       const filas = texto.split(/\r?\n/).filter(f => f.trim() !== "");
       
       if (filas.length <= 1) {
         document.getElementById("socialFeedContainer").innerHTML = 
           `<p style="text-align:center; color:var(--muted); padding:4rem 1rem;">La bitácora de campo se encuentra vacía momentáneamente.</p>`;
         return;
       }
   
       // Mapeo adaptado al orden exacto de tus columnas del CSV (Tabla Innovaciones/Experiencias)
       repositorioExperiencias = filas.slice(1).map(row => {
         const cols = parsearLineaCSV(row);
         
         // Separación de tags guardados tradicionalmente por punto y coma (;) o comas
         let listaTags = ["Campo"];
         if (cols[8]) {
           listaTags = cols[8].includes(";") ? cols[8].split(";") : cols[8].split(",");
         } else if (cols[2]) {
           listaTags = [cols[2]]; // Categoria como tag de respaldo
         }
   
         return {
           id: cols[0] || Math.random().toString(),
           titulo: cols[1] || "Caso práctico sin título",
           categoria: cols[2] || "Innovación",
           organizacion: cols[3] || "Productor Independiente",
           region: cols[4] || "San José", // Región/Provincia mapeada dinámicamente
           descripcion: cols[4] || "Sin detalles en la bitácora de campo.", // Respaldo si varía el orden
           imagenUrl: convertirLinkDriveAImagen(cols[5]),
           estado: cols[7] === "SI" ? "Destacado" : "Validada", // Lógica basada en tu columna destacado
           tags: listaTags.map(t => t.trim()),
           fecha: "Registro de Campo"
         };
       });
   
       ejecutarFiltradoYRender();
       construirSelectorProvinciasMovil();
     } catch (e) {
       console.error("Error sincronizando bitácora remota:", e);
       document.getElementById("socialFeedContainer").innerHTML = 
         `<p style="text-align:center; color:var(--muted); padding:4rem 1rem;">Ocurrió un error al cargar el feed de bitácoras de campo.</p>`;
     }
   }
   
   function ejecutarFiltradoYRender() {
     const dock = document.querySelector(".mobile-floating-dock");
     const esCelular = window.getComputedStyle(dock).display !== "none";
     
     const activeSearch = esCelular
       ? document.querySelector(".mobile-search-bar input")
       : document.querySelector(".search-box input");
   
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
   
     const contador = document.getElementById("totalItemsDisplay");
     if (contador) contador.innerHTML = `Casos prácticos visualizados: <b>${datosFiltrados.length}</b>`;
     
     renderizarFeedSocial();
   }
   
   // Renderizado limpio de feed social tipo Facebook/Instagram (Sin botones extra)
   function renderizarFeedSocial() {
     const contenedor = document.getElementById("socialFeedContainer");
     if (!contenedor) return;
   
     if (datosFiltrados.length === 0) {
       contenedor.innerHTML = `<p style="text-align:center; color:var(--muted); padding:4rem 1rem;">No se hallaron registros prácticos para esta búsqueda.</p>`;
       return;
     }
   
     contenedor.innerHTML = datosFiltrados.map(item => {
       const tagsHTML = item.tags.map(t => `<span class="social-pill">#${t}</span>`).join(" ");
       return `
         <article class="social-card">
           <div class="social-card-header">
             <div class="header-profile-info">
               <span class="profile-title">${item.organizacion}</span>
               <span class="profile-subtitle">📍 ${item.region} · ${item.categoria}</span>
             </div>
             <span class="post-time-stamp">${item.fecha}</span>
           </div>
           
           <div class="social-card-media">
             <img src="${item.imagenUrl}" alt="${item.titulo}" loading="lazy">
             <span class="social-status-tag">${item.estado}</span>
           </div>
           
           <div class="social-card-body">
             <p class="social-caption-text">
               <b>${item.titulo}</b> — ${item.descripcion}
             </p>
             <div class="social-tags-row">${tagsHTML}</div>
           </div>
         </article>
       `;
     }).join("");
   }
   
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
   
   function asociarComponentesUI() {
     // Menú hamburguesa móvil básico
     const menuToggle = document.getElementById("menuToggle");
     if (menuToggle) {
       menuToggle.addEventListener("click", () => {
         document.getElementById("mainNav").classList.toggle("open");
       });
     }
   
     // Entrada de búsquedas coordinada
     document.querySelectorAll(".global-exp-search").forEach(input => {
       input.addEventListener("input", (e) => {
         document.querySelectorAll(".global-exp-search").forEach(x => x.value = e.target.value);
         ejecutarFiltradoYRender();
       });
     });
   
     // Selector geográfico de escritorio
     const select = document.querySelector(".global-exp-select");
     if (select) {
       select.addEventListener("change", (e) => {
         regionSeleccionada = e.target.value;
         ejecutarFiltradoYRender();
       });
     }
   
     // Modales y Controles del Dock Flotante Móvil
     const btnReg = document.getElementById("mobileRegionBtn");
     const modalReg = document.getElementById("mobileRegionModal");
     const btnCloseReg = document.getElementById("closeRegionModal");
     const refreshBtn = document.getElementById("refreshFeedBtn");
   
     if (btnReg && modalReg) btnReg.addEventListener("click", () => modalReg.classList.remove("hidden"));
     if (btnCloseReg && modalReg) btnCloseReg.addEventListener("click", () => modalReg.classList.add("hidden"));
     
     if (refreshBtn) {
       refreshBtn.addEventListener("click", () => {
         cargarDatosDesdeGoogleSheet();
       });
     }
   }