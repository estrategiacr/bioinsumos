/* ==========================================================================
   CONTROLADOR LÓGICO: REPOSITORIO DE EXPERIENCIAS DE CAMPO
   Bioinsumos Costa Rica - Sincronización Remota por Comas (CSV)
   ========================================================================== */

   let repositorioExperiencias = [];
   let datosFiltrados = [];
   let regionSeleccionada = "Todos";
   
   const SHEET_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?";
   const SHEET_CSV_EXPERIENCIAS = `${SHEET_BASE}gid=615287650&single=true&output=csv`;
   
   document.addEventListener("DOMContentLoaded", () => {
     asociarComponentesUI();
     cargarDatosDesdeGoogleSheet();
   });
   
   // =====================================
   // UTILIDADES DE PROCESAMIENTO
   // =====================================
   
   /**
    * Transforma un enlace compartido de Google Drive en una URL de renderizado directo.
    * Se utiliza el endpoint /thumbnail con tamaño asignado, ya que evita bloqueos de 
    * políticas de rastreo y de cookies de terceros impuestos por navegadores como Edge y Safari.
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
    * Split inteligente para CSV: Separa por comas (,), 
    * pero ignora las que estén dentro de bloques de texto protegidos por comillas.
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
   // EXTRACCIÓN DE INNOVACIONES / BITÁCORA
   // =====================================
   async function cargarDatosDesdeGoogleSheet() {
     try {
       const respuesta = await fetch(SHEET_CSV_EXPERIENCIAS);
       const texto = await respuesta.text();
       const filas = texto.split(/\r?\n/).filter(f => f.trim() !== "");
       
       if (filas.length <= 1) {
         document.getElementById("socialFeedContainer").innerHTML = 
           `<p style="text-align:center; color:var(--muted); padding:4rem 1rem;">La bitácora de campo se encuentra vacía.</p>`;
         return;
       }
   
       // Mapeo adaptativo real alineado al parseador de comas de la tabla remota
       repositorioExperiencias = filas.slice(1).map(row => {
         const cols = parsearLineaCSV(row);
         
         // Manejo inteligente de tags del registro
         let listaTags = ["Agroecología"];
         if (cols[7]) {
           listaTags = cols[7].includes(";") ? cols[7].split(";") : cols[7].split(",");
         } else if (cols[2]) {
           listaTags = [cols[2]];
         }
   
         return {
           id: cols[0] || Math.random().toString(),
           titulo: cols[1] || "Caso práctico sin título",
           organizacion: cols[2] || "Productor Independiente",
           region: cols[3] || "San José", 
           descripcion: cols[4] || "Sin detalles adicionales registrados en la bitácora de campo.",
           imagenUrl: convertirLinkDriveAImagen(cols[5]),
           tags: listaTags.map(t => t.trim()),
           fecha: cols[8] || "Fijado recientemente"
         };
       });
   
       ejecutarFiltradoYRender();
       construirSelectorProvinciasMovil();
     } catch (e) {
       console.error("Error cargando repositorio de bitácoras:", e);
       document.getElementById("socialFeedContainer").innerHTML = 
         `<p style="text-align:center; color:var(--muted); padding:4rem 1rem;">Error de sincronización con la base de datos de bioinsumos.</p>`;
     }
   }
   
   function ejecutarFiltradoYRender() {
     const dock = document.querySelector(".mobile-floating-dock");
     const esCelular = dock && window.getComputedStyle(dock).display !== "none";
     
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
     if (contador) contador.innerHTML = `Casos de campo registrados: <b>${datosFiltrados.length}</b>`;
     
     renderizarFeedSocial();
   }
   
   function renderizarFeedSocial() {
     const contenedor = document.getElementById("socialFeedContainer");
     if (!contenedor) return;
   
     if (datosFiltrados.length === 0) {
       contenedor.innerHTML = `<p style="text-align:center; color:var(--muted); padding:4rem 1rem;">No se hallaron registros prácticos para los filtros indicados.</p>`;
       return;
     }
   
     contenedor.innerHTML = datosFiltrados.map(item => {
       const tagsHTML = item.tags.map(t => `<span class="social-pill">#${t}</span>`).join(" ");
       return `
         <article class="social-card">
           <div class="social-card-header">
             <div class="header-profile-info">
               <span class="profile-title">${item.organizacion}</span>
               <span class="profile-subtitle">📍 ${item.region}</span>
             </div>
             <span class="post-time-stamp">${item.fecha}</span>
           </div>
           
           <div class="social-card-media">
             <img src="${item.imagenUrl}" alt="${item.titulo}">
           </div>
           
           <div class="social-card-body">
             <p class="social-caption-text">
               <b>${item.titulo}:</b> ${item.descripcion}
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
     const menuToggle = document.getElementById("menuToggle");
     if (menuToggle) {
       menuToggle.addEventListener("click", () => {
         document.getElementById("mainNav").classList.toggle("open");
       });
     }
   
     document.querySelectorAll(".global-exp-search").forEach(input => {
       input.addEventListener("input", (e) => {
         document.querySelectorAll(".global-exp-search").forEach(x => x.value = e.target.value);
         ejecutarFiltradoYRender();
       });
     });
   
     const select = document.querySelector(".global-exp-select");
     if (select) {
       select.addEventListener("change", (e) => {
         regionSeleccionada = e.target.value;
         ejecutarFiltradoYRender();
       });
     }
   
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