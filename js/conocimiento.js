/* ==========================================================================
   CONTROLADOR LÓGICO: PILAR 1 - GESTIÓN DEL CONOCIMIENTO
   ========================================================================== */

   let repositorioRecursos = [];
   let recursosFiltrados = [];
   
   // Estado de paginación interna
   const FILAS_POR_PAGINA = 6;
   let paginaActual = 1;
   let categoriaActiva = "Todos";
   
   // Cambiar por tu URL correspondiente de la pestaña Conocimiento de Google Sheets
   const SHEET_CSV_CONOCIMIENTO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=0&single=true&output=csv";
   
   document.addEventListener("DOMContentLoaded", () => {
       configurarComponentesUI();
       cargarRepositorioConocimiento();
   });
   
   /**
    * Parsea celdas de forma segura previniendo saltos por comas internas
    */
   function parsearFilaCSV(linea) {
       const arr = [];
       let enComillas = false;
       let celda = "";
       
       // Si la hoja usa punto y coma, cambiar el char en el condicional correspondiente
       const separador = lineasTienenPuntoYComa(linea) ? ';' : ',';
   
       for (let i = 0; i < linea.length; i++) {
           const c = linea[i];
           if (c === '"') {
               enComillas = !enComillas;
           } else if (c === separador && !enComillas) {
               arr.push(celda.trim().replace(/^"|"$/g, ''));
               celda = "";
           } else {
               celda += c;
           }
       }
       arr.push(celda.trim().replace(/^"|"$/g, ''));
       return arr;
   }
   
   function lineasTienenPuntoYComa(txt) {
       return txt.includes(';');
   }
   
   /**
    * Fetch y mapeo analítico del repositorio
    */
   async function cargarRepositorioConocimiento() {
       try {
           const res = await fetch(SHEET_CSV_CONOCIMIENTO);
           const csvTexto = await res.text();
           const lineas = csvTexto.split(/\r?\n/).filter(l => l.trim() !== "");
   
           if (lineas.length <= 1) {
               mostrarMensajeVacio();
               return;
           }
   
           // Estructura esperada de columnas: id; titulo; institucion; categoria; resumen; descripcionLarga; imagen; tags; urlDescarga
           repositorioRecursos = lineas.slice(1).map(fila => {
               const campos = parsearFilaCSV(fila);
               return {
                   id: campos[0] || Math.random().toString(),
                   titulo: campos[1] || "Recurso técnico sin título",
                   institucion: campos[2] || "MAG / IICA",
                   categoria: campos[3] || "Ficha Técnica",
                   resumen: campos[4] || "No hay un resumen corto disponible.",
                   descripcionLarga: campos[5] || "No se ha cargado un desglose extendido para este recurso.",
                   imagen: campos[6] || "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?q=80&w=600",
                   tags: campos[7] ? campos[7].split(",").map(t => t.trim()) : ["Bioinsumo"],
                   urlDescarga: campos[8] || "#"
               };
           });
   
           ejecutarFiltradoLogico();
   
       } catch (err) {
           console.error("Error al conectar con la base de conocimiento:", err);
           document.getElementById("resourcesGridContainer").innerHTML = 
               `<p style="grid-column:1/-1; text-align:center; color:var(--text-light); padding:3rem;">No se pudo conectar al repositorio de Google Sheets. Verifique la publicación técnica del documento.</p>`;
       }
   }
   
   /**
    * Aplica filtros de texto y categorías cruzados (Escritorio + Móvil)
    */
   function ejecutarFiltradoLogico() {
       const esCelular = document.querySelector(".mobile-knowledge-dock").getBoundingClientRect().height > 0;
       const inputBuscador = esCelular 
           ? document.getElementById("mobileKnowledgeSearch") 
           : document.getElementById("knowledgeSearch");
   
       const query = inputBuscador ? inputBuscador.value.toLowerCase().trim() : "";
   
       recursosFiltrados = repositorioRecursos.filter(rec => {
           const cumpleCategoria = (categoriaActiva === "Todos" || rec.categoria.toLowerCase() === categoriaActiva.toLowerCase());
           const cumpleBusqueda = (query === "") ||
                                  rec.titulo.toLowerCase().includes(query) ||
                                  rec.resumen.toLowerCase().includes(query) ||
                                  rec.institucion.toLowerCase().includes(query) ||
                                  rec.tags.some(t => t.toLowerCase().includes(query));
           return cumpleCategoria && cumpleBusqueda;
       });
   
       document.getElementById("resourcesCount").textContent = recursosFiltrados.length;
       
       // Regresar a la primera página tras un filtro
       paginaActual = 1;
       renderizarBloqueRecursos();
   }
   
   /**
    * Segmenta los recursos según la paginación activa y los inyecta en el Grid
    */
   function renderizarBloqueRecursos() {
       const grid = document.getElementById("resourcesGridContainer");
       if (!grid) return;
   
       if (recursosFiltrados.length === 0) {
           grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-light); padding:4rem 1rem;">No se encontraron recursos técnicos que coincidan con los filtros seleccionados.</p>`;
           document.getElementById("paginationWrapper").classList.add("hidden");
           return;
       }
   
       document.getElementById("paginationWrapper").classList.remove("hidden");
   
       // Cálculo matemático de fragmentos de página
       const indiceInicial = (paginaActual - 1) * FILAS_POR_PAGINA;
       const indiceFinal = indiceInicial + FILAS_POR_PAGINA;
       const recursosPagina = recursosFiltrados.slice(indiceInicial, indiceFinal);
       const totalPaginas = Math.ceil(recursosFiltrados.length / FILAS_POR_PAGINA);
   
       // Inyección de HTML limpio
       grid.innerHTML = recursosPagina.map(item => {
           const tagsHTML = item.tags.map(t => `<span class="tag-pill">${t}</span>`).join("");
           return `
               <article class="resource-item-card">
                   <div class="card-image-header">
                       <img src="${item.imagen}" alt="${item.titulo}" loading="lazy">
                       <span class="resource-badge">${item.categoria}</span>
                   </div>
                   <div class="card-body-content">
                       <span class="resource-institution">🏢 ${item.institucion}</span>
                       <h3 class="resource-title">${item.titulo}</h3>
                       <p class="resource-excerpt">${item.resumen}</p>
                       <div class="card-tags-wrap">${tagsHTML}</div>
                   </div>
                   <div class="card-action-footer">
                       <button class="btn-open-resource" onclick="abrirFichaDetallada('${item.id}')">
                           <i class="fa-solid fa-book-open-reader"></i> Estudiar Recurso
                       </button>
                   </div>
               </article>
           `;
       }).join("");
   
       // Actualizar controles de interfaz
       document.getElementById("pageIndicator").textContent = `Página ${paginaActual} de ${totalPaginas || 1}`;
       document.getElementById("btnPrevPage").disabled = (paginaActual === 1);
       document.getElementById("btnNextPage").disabled = (paginaActual === totalPaginas || totalPaginas === 0);
   }
   
   /**
    * Abre el Modal Extendiendo la Información técnica del renglón seleccionado
    */
   window.abrirFichaDetallada = function(id) {
       const item = repositorioRecursos.find(r => r.id == id);
       if (!item) return;
   
       const wrapper = document.getElementById("modalDynamicContent");
       const modal = document.getElementById("resourceDetailModal");
   
       wrapper.innerHTML = `
           <div class="modal-visual-side">
               <img src="${item.imagen}" alt="${item.titulo}">
           </div>
           <div class="modal-info-side">
               <span class="modal-meta-row">📄 ${item.categoria} · ${item.institucion}</span>
               <h2>${item.titulo}</h2>
               <p class="modal-long-desc">${item.descripcionLarga}</p>
               <a href="${item.urlDescarga}" target="_blank" class="modal-download-link">
                   <i class="fa-solid fa-file-arrow-down"></i> Descargar Documentación Oficial
               </a>
           </div>
       `;
   
       modal.classList.remove("hidden");
       document.body.style.overflow = "hidden"; // Deshabilita scroll del fondo
   };
   
   function configurarComponentesUI() {
       // Sincronización de Buscadores (Escritorio + Móvil)
       const searchEscritorio = document.getElementById("knowledgeSearch");
       const searchMovil = document.getElementById("mobileKnowledgeSearch");
   
       [searchEscritorio, searchMovil].forEach(input => {
           if (input) {
               input.addEventListener("input", (e) => {
                   if (searchEscritorio) searchEscritorio.value = e.target.value;
                   if (searchMovil) searchMovil.value = e.target.value;
                   ejecutarFiltradoLogico();
               });
           }
       });
   
       // Control de Filtros por Clases de Categoría (Escritorio)
       document.querySelectorAll(".tab-btn").forEach(btn => {
           btn.addEventListener("click", () => {
               document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
               btn.classList.add("active");
               categoriaActiva = btn.getAttribute("data-category");
               
               // Sincronizar dock móvil
               document.querySelectorAll(".mobile-dock-btn").forEach(mb => {
                   mb.classList.toggle("active", mb.getAttribute("data-category") === categoriaActiva);
               });
   
               ejecutarFiltradoLogico();
           });
       });
   
       // Control de Filtros en Dock Móvil
       document.querySelectorAll(".mobile-dock-btn").forEach(btn => {
           btn.addEventListener("click", () => {
               document.querySelectorAll(".mobile-dock-btn").forEach(b => b.classList.remove("active"));
               btn.classList.add("active");
               categoriaActiva = btn.getAttribute("data-category");
   
               // Sincronizar pestañas de escritorio
               document.querySelectorAll(".tab-btn").forEach(tb => {
                   tb.classList.toggle("active", tb.getAttribute("data-category") === categoriaActiva);
               });
   
               ejecutarFiltradoLogico();
           });
       });
   
       // Eventos de Paginación
       document.getElementById("btnPrevPage").addEventListener("click", () => {
           if (paginaActual > 1) {
               paginaActual--;
               renderizarBloqueRecursos();
               window.scrollTo({ top: 300, behavior: 'smooth' });
           }
       });
   
       document.getElementById("btnNextPage").addEventListener("click", () => {
           const totalPaginas = Math.ceil(recursosFiltrados.length / FILAS_POR_PAGINA);
           if (paginaActual < totalPaginas) {
               paginaActual++;
               renderizarBloqueRecursos();
               window.scrollTo({ top: 300, behavior: 'smooth' });
           }
       });
   
       // Cierre del Modal
       const modal = document.getElementById("resourceDetailModal");
       document.getElementById("closeModalBtn").addEventListener("click", () => {
           modal.classList.add("hidden");
           document.body.style.overflow = "";
       });
   
       // Cerrar si hace clic fuera de la tarjeta blanca del modal
       modal.addEventListener("click", (e) => {
           if (e.target === modal) {
               modal.classList.add("hidden");
               document.body.style.overflow = "";
           }
       });
   }
   
   function mostrarMensajeVacio() {
       document.getElementById("resourcesGridContainer").innerHTML = 
           `<p style="grid-column:1/-1; text-align:center; color:var(--text-light); padding:3rem;">No hay recursos disponibles en el repositorio.</p>`;
   }