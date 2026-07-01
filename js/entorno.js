/* ==========================================================================
   CONTROLADOR LÓGICO: PILAR 4 - ENTORNO HABILITADOR
   Bioinsumos Costa Rica
   ========================================================================== */

   let recursosEntorno = [];
   let macroCategoriaActiva = "Regulaciones";
   
   // Mapeo estricto de subcategorías hacia las tres pestañas organizativas visuales
   const MAPEO_CATEGORIAS = {
       "Marco regulatorio": "Regulaciones",
       "Normativas": "Regulaciones",
       "Procedimientos": "Regulaciones",
       "Financiamiento": "Oportunidades",
       "Becas": "Oportunidades",
       "Convocatorias": "Actualidad",
       "Eventos": "Actualidad",
       "Noticias": "Actualidad"
   };
   
   // URL de publicación remota - Reemplaza con tu GID correspondiente del Pilar 4
   const SHEET_CSV_ENTORNO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=1192656643&single=true&output=csv";
   
   document.addEventListener("DOMContentLoaded", () => {
       inicializarMenuMovil();
       asociarEventosTabs();
       cargarDatosEntorno();
   });
   
   function inicializarMenuMovil() {
       const toggle = document.getElementById("menuToggle");
       const nav = document.getElementById("mainNav");
       if (toggle && nav) {
           toggle.addEventListener("click", () => nav.classList.toggle("open"));
       }
   }
   
   async function cargarDatosEntorno() {
       try {
           const respuesta = await fetch(SHEET_CSV_ENTORNO);
           if (!respuesta.ok) throw new Error("Error al conectar con la base de datos");
           
           const textoCSV = await respuesta.text();
           const filas = textoCSV.split(/\r?\n/);
           
           recursosEntorno = filas.slice(1).map((fila, index) => {
               const cols = parsearLineaCSVStandard(fila);
               return {
                   id: cols[0] || `item-${index}`,
                   elemento: cols[1] || "", // "Indicadores", "Normativas", etc.
                   titulo: cols[2] || "Recurso informativo",
                   descripcion: cols[3] || "",
                   enlace: cols[4] || "#",
                   fecha: cols[5] || "",
                   metrica: cols[6] || "" // Exclusivo para tarjetas de indicadores
               };
           });
   
           renderizarIndicadores();
           renderizarMatrizRecursos();
   
       } catch (error) {
           console.error("Error cargando el Pilar 4:", error);
           document.getElementById("resourcesGrid").innerHTML = `<p style="padding:2rem; color:red;">Error de sincronización con el Entorno Habilitador.</p>`;
       }
   }
   
   function renderizarIndicadores() {
       const contenedor = document.getElementById("indicadoresGrid");
       contenedor.innerHTML = "";
   
       // Filtramos únicamente las filas destinadas a alimentar los KPI sectoriales
       const indicadores = recursosEntorno.filter(item => item.elemento.trim() === "Indicadores sectoriales");
   
       indicadores.forEach(ind => {
           const card = document.createElement("div");
           card.className = "indicador-card";
           card.innerHTML = `
               <div class="ind-icon"><i class="fa-solid fa-chart-line"></i></div>
               <div class="ind-data">
                   <h3>${ind.metrica}</h3>
                   <p>${ind.titulo}</p>
               </div>
           `;
           contenedor.appendChild(card);
       });
   }
   
   function renderizarMatrizRecursos() {
       const contenedor = document.getElementById("resourcesGrid");
       const busqueda = document.getElementById("entornoSearch").value.toLowerCase();
       contenedor.innerHTML = "";
   
       const filtrados = recursosEntorno.filter(item => {
           const catAsignada = MAPEO_CATEGORIAS[item.elemento] || "";
           const cumpleTab = (catAsignada === macroCategoriaActiva);
           const cumpleTexto = (
               item.titulo.toLowerCase().includes(busqueda) || 
               item.descripcion.toLowerCase().includes(busqueda) ||
               item.elemento.toLowerCase().includes(busqueda)
           );
           return cumpleTab && cumpleTexto;
       });
   
       if (filtrados.length === 0) {
           contenedor.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--muted); padding:3rem;">No se encontraron recursos disponibles en esta sección.</p>`;
           return;
       }
   
       filtrados.forEach(item => {
           const claseLimpia = item.elemento.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
           const card = document.createElement("div");
           card.className = `resource-card ${claseLimpia}`;
           
           // Define el ícono del botón dinámicamente si es un trámite/descarga o noticia externa
           const iconBtn = (macroCategoriaActiva === "Regulaciones") ? "fa-file-pdf" : "fa-arrow-up-right-from-square";
           const textoBtn = (macroCategoriaActiva === "Regulaciones") ? "Descargar documento" : "Ver detalles / Enlace";
   
           card.innerHTML = `
               <div>
                   <div class="res-header">
                       <span class="res-subtag">${item.elemento}</span>
                       <span class="res-date">${item.fecha}</span>
                   </div>
                   <h4>${item.titulo}</h4>
                   <p class="res-desc">${item.descripcion}</p>
               </div>
               <a href="${item.enlace}" target="_blank" class="res-action-btn">
                   <i class="fa-solid ${iconBtn}"></i> ${textoBtn}
               </a>
           `;
           contenedor.appendChild(card);
       });
   }
   
   function asociarEventosTabs() {
       const botones = document.querySelectorAll(".tab-btn");
       botones.forEach(btn => {
           btn.addEventListener("click", () => {
               botones.forEach(b => b.classList.remove("active"));
               btn.classList.add("active");
               macroCategoriaActiva = btn.getAttribute("data-categoria");
               renderizarMatrizRecursos();
           });
       });
   
       document.getElementById("entornoSearch").addEventListener("input", renderizarMatrizRecursos);
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