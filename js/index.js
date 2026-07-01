/* ==========================================================================
   CONTROLADOR DE INTERFACES INTERACTIVAS (INDEX / INICIO)
   Plataforma Integrada: Bioinsumos Costa Rica
   ========================================================================== */

   document.addEventListener("DOMContentLoaded", () => {
    inicializarMenuMovil();
    inicializarBuscadorGlobal();
    cargarInnovacionesDestacadas();
  });
  
  /**
   * Gestiona el despliegue responsivo del menú de navegación superior
   */
  function inicializarMenuMovil() {
    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.getElementById("mainNav");
  
    if (menuToggle && mainNav) {
      menuToggle.addEventListener("click", () => {
        mainNav.classList.toggle("open");
      });
      
      // Cierre adaptativo si se clica fuera del área del menú abierto
      document.addEventListener("click", (e) => {
        if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
          mainNav.classList.remove("open");
        }
      });
    }
  }
  
  /**
   * Procesa consultas contra el set de datos globales alojados en data.js
   */

  
  /**
   * Carga de forma dinámica elementos destacados o de interés nacional
   */
  function cargarInnovacionesDestacadas() {
    const gridDestacados = document.getElementById("featuredInnovationsGrid");
    if (!gridDestacados) return;
  
    // Mock dinámico en caso de no conectar directamente con bases remotas inmediatas
    const itemsDestacados = [
      { titulo: "Uso de Trichoderma harzianum", desc: "Casos aplicados con éxito en la reducción de patógenos del suelo en cultivos de hortalizas en la Zona Norte." },
      { titulo: "Biofábricas Territoriales", desc: "Modelos validados de producción artesanal controlada de microorganismos de montaña." }
    ];
  
    gridDestacados.innerHTML = "";
    itemsDestacados.forEach(item => {
      const card = document.createElement("div");
      card.className = "pillar-card";
      card.innerHTML = `
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🌱</div>
        <h3>${item.titulo}</h3>
        <p>${item.desc}</p>
      `;
      gridDestacados.appendChild(card);
    });
  }

  /* ==========================================================================
   CONTROLADOR DE INTERFACES INTERACTIVAS (INDEX / INICIO)
   Plataforma Integrada: Bioinsumos Costa Rica
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  inicializarMenuMovil();
  inicializarBuscadorGlobal();
  cargarInnovacionesDestacadas();
  renderKPIsInstitucionales(); // Nueva llamada activa para estadísticas animadas
});

/**
 * Gestiona el despliegue responsivo del menú de navegación superior
 */
function inicializarMenuMovil() {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });
    
    document.addEventListener("click", (e) => {
      if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
        mainNav.classList.remove("open");
      }
    });
  }
}

/**
 * Simulación o llamada asíncrona simulando el comportamiento de AgroIdeas
 * para extraer las métricas de impacto país vigentes de la Estrategia.
 */
/**
 * Consume los KPIs en tiempo real desde Google Sheets en formato CSV
 * y los mapea al formato estructurado de la plataforma.
 */
async function obtenerDatosMetricas() {
  const URL_SHEET_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=1232917699&single=true&output=csv";

  try {
    const respuesta = await fetch(URL_SHEET_CSV);
    if (!respuesta.ok) throw new Error(`Error al consultar la hoja: ${respuesta.status}`);
    
    const textoCSV = await respuesta.text();
    
    // Diccionario interno para asignar las etiquetas legibles basadas en la columna 'kpi'
    const diccionarioEtiquetas = {
      "biofabricas": "Biofábricas Validadas",
      "investigaciones": "Recursos Técnicos",
      "actores": "Productores Activos",
      "normativas": "Decretos y Marcos"
    };

    // Dividir por líneas y limpiar espacios o retornos de carro (\r)
    const lineas = textoCSV.split("\n").map(linea => linea.trim()).filter(linea => linea.length > 0);
    
    // Ignoramos la primera línea si es la cabecera (kpi,valor)
    const datosFiltrados = [];
    const inicioIndice = lineas[0].toLowerCase().includes("kpi") ? 1 : 0;

    for (let i = inicioIndice; i < lineas.length; i++) {
      // Separamos por la coma reglamentaria del CSV
      const columnas = lineas[i].split(",");
      if (columnas.length >= 2) {
        const kpiClave = columnas[0].trim().toLowerCase();
        const kpiValor = columnas[1].trim();

        datosFiltrados.push({
          clave: kpiClave,
          valor: kpiValor,
          // Si el KPI no está en el diccionario, usa el texto de la Sheet capitalizado
          etiqueta: diccionarioEtiquetas[kpiClave] || columnas[0].trim().charAt(0).toUpperCase() + columnas[0].trim().slice(1)
        });
      }
    }

    return datosFiltrados;

  } catch (error) {
    console.error("Error al procesar el fetch del CSV de Google Sheets:", error);
    // Fallback seguro en caso de caída de red o error de publicación
    return [
      { clave: "biofabricas", valor: "42", etiqueta: "Biofábricas Validadas" },
      { clave: "investigaciones", valor: "158", etiqueta: "Recursos Técnicos" },
      { clave: "actores", valor: "610", etiqueta: "Productores Activos" },
      { clave: "normativas", valor: "8", etiqueta: "Decretos y Marcos" }
    ];
  }
}

/**
 * Renderiza los KPIs en el Hero con efectos de movimiento escalonado (Staggered Animation)
 */
async function renderKPIsInstitucionales() {
  const contenedorStats = document.getElementById("heroStats");
  if (!contenedorStats) return;

  try {
    const listaMetricas = await obtenerDatosMetricas();
    contenedorStats.innerHTML = "";

    // Diccionario contextual para asignar iconos dinámicamente según la palabra clave
    const mapasIconos = [
      { key: "biofabrica", icon: "fa-solid fa-flask-vial" },
      { key: "investigacion", icon: "fa-solid fa-book-open" },
      { key: "recurso", icon: "fa-solid fa-file-shield" },
      { key: "actor", icon: "fa-solid fa-users-gear" },
      { key: "productor", icon: "fa-solid fa-tractor" },
      { key: "normativa", icon: "fa-solid fa-gavel" }
    ];

    listaMetricas.forEach((kpi, index) => {
      const tarjeta = document.createElement("div");
      tarjeta.className = "metric-card";
      
      // Sincronización exacta con el estilo AgroIdeas:
      // Modificamos la propiedad personalizada de CSS para escalonar la entrada (0.15s por tarjeta)
      tarjeta.style.setProperty('--card-delay', `${index * 0.15}s`);

      // Búsqueda inteligente del icono correspondiente
      const textoClave = String(kpi.clave).toLowerCase();
      const configuracionIcono = mapasIconos.find(item => textoClave.includes(item.key));
      const iconoFinal = configuracionIcono ? configuracionIcono.icon : "fa-solid fa-chart-bar";

      tarjeta.innerHTML = `
        <div class="metric-icon-wrap">
          <i class="${iconoFinal}"></i>
        </div>
        <div class="metric-info">
          <span class="metric-number">${kpi.valor}</span>
          <span class="metric-label">${kpi.etiqueta}</span>
        </div>
      `;

      contenedorStats.appendChild(tarjeta);
    });

  } catch (error) {
    console.error("Error al desplegar las métricas en el inicio:", error);
    contenedorStats.innerHTML = `<p style="color: rgba(255,255,255,0.6); font-size:0.85rem;">Estadísticas temporales no disponibles.</p>`;
  }
}

/**
 * Procesa consultas contra el set de datos globales alojados en data.js
 */
function inicializarBuscadorGlobal() {
  const searchInput = document.getElementById("globalSearchInput");
  const searchBtn = document.getElementById("globalSearchBtn");
  const resultsSection = document.getElementById("searchResultsSection");
  const resultsGrid = document.getElementById("searchResultsGrid");
  const closeResultsBtn = document.getElementById("closeSearchBtn");

  if (!searchInput || !searchBtn) return;

  function realizarBusqueda() {
    const termino = searchInput.value.trim().toLowerCase();
    if (termino === "") return;

    let coincidencias = [];
    if (typeof bibliotecaCompleta !== "undefined") {
      coincidencias = bibliotecaCompleta.filter(item => 
        item.titulo.toLowerCase().includes(termino) || 
        item.descripcion.toLowerCase().includes(termino)
      );
    }

    resultsGrid.innerHTML = "";
    if (coincidencias.length > 0) {
      coincidencias.forEach(item => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "pillar-card";
        tarjeta.innerHTML = `
          <h3>${item.titulo}</h3>
          <p>${item.descripcion.substring(0, 120)}...</p>
          <a href="conocimiento.html" style="color: var(--primary); font-weight: 700; font-size: 0.85rem; display:inline-block; margin-top:1rem;">Ver Recurso →</a>
        `;
        resultsGrid.appendChild(tarjeta);
      });
    } else {
      resultsGrid.innerHTML = `<p style="grid-column: 1/-1; color: var(--muted); text-align:center;">No se encontraron resultados específicos para "${searchInput.value}". Inténtelo con otro término.</p>`;
    }

    resultsSection.classList.remove("d-none");
    resultsSection.scrollIntoView({ behavior: "smooth" });
  }

  searchBtn.addEventListener("click", realizarBusqueda);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") realizarBusqueda();
  });

  if (closeResultsBtn) {
    closeResultsBtn.addEventListener("click", () => {
      resultsSection.classList.add("d-none");
      searchInput.value = "";
    });
  }
}

/**
 * Carga de forma dinámica elementos destacados o de interés nacional
 */
function cargarInnovacionesDestacadas() {
  const gridDestacados = document.getElementById("featuredInnovationsGrid");
  if (!gridDestacados) return;

  const itemsDestacados = [
    { titulo: "Uso de Trichoderma harzianum", desc: "Casos aplicados con éxito en la reducción de patógenos del suelo en cultivos de hortalizas en la Zona Norte." },
    { titulo: "Biofábricas Territoriales", desc: "Modelos validados de producción artesanal controlada de microorganismos de montaña." }
  ];

  gridDestacados.innerHTML = "";
  itemsDestacados.forEach(item => {
    const card = document.createElement("div");
    card.className = "pillar-card";
    card.innerHTML = `
      <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🌱</div>
      <h3>${item.titulo}</h3>
      <p>${item.desc}</p>
    `;
    gridDestacados.appendChild(card);
  });
}