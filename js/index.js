document.addEventListener("DOMContentLoaded", () => {
    initPlatform();
  });
  
  // Almacenamiento local en memoria de los datos cargados para búsquedas rápidas
  let localBiofabricas = [];
  let localInnovaciones = [];
  
  async function initPlatform() {
    // 1. Cargar la data desde las utilidades de data.js
    localBiofabricas = await fetchBiofabricas();
    localInnovaciones = await fetchInnovaciones();
  
    // 2. Renderizar Elementos de la Home
    renderKPIs(localBiofabricas, localInnovaciones);
    renderFeaturedInnovations(localInnovaciones);
  
    // 3. Inicializar los Listeners del Buscador Global
    initGlobalSearch();
  }
  
  /**
   * Genera contadores de impacto real basados en la data de Google Sheets
   */
  function renderKPIs(biofabricas, innovaciones) {
    const container = document.getElementById("heroStats");
    if (!container) return;
  
    // Calculamos métricas en base a las filas de datos reales
    const totalBiofabricas = biofabricas.length;
    const totalInnovaciones = innovaciones.length;
    
    // Conteo de recursos técnicos estimados presentes en las bases de datos
    const totalRecursos = innovaciones.filter(i => i.categoria.toLowerCase().includes("conocimiento") || i.enlaceRecurso).length + 12; 
  
    container.innerHTML = `
      <div class="stat">
        <strong>${totalBiofabricas}</strong>
        <span>Biofábricas Mapeadas</span>
      </div>
      <div class="stat">
        <strong>${totalInnovaciones}</strong>
        <span>Innovaciones Registradas</span>
      </div>
      <div class="stat">
        <strong>${totalRecursos}</strong>
        <span>Recursos Técnicos</span>
      </div>
      <div class="stat">
        <strong>7</strong>
        <span>Centros de Investigación</span>
      </div>
    `;
  }
  
  /**
   * Renderiza el catálogo de Innovaciones Destacadas (Pilar 2)
   */
  function renderFeaturedInnovations(innovaciones) {
    const grid = document.getElementById("featuredInnovationsGrid");
    if (!grid) return;
  
    // Filtrar solo las destacadas (Donde la columna del excel diga "SI")
    const destacadas = innovaciones.filter(item => item.destacado).slice(0, 3);
  
    if (destacadas.length === 0) {
      grid.innerHTML = `<p class="no-data">Próximamente más innovaciones nacionales validadas.</p>`;
      return;
    }
  
    grid.innerHTML = destacadas.map(item => `
      <div class="card innovation-card">
        <div class="innovation-img-wrap">
          <img src="${item.imagenUrl}" alt="${item.titulo}">
          <span class="innovation-badge">${item.categoria}</span>
        </div>
        <div class="innovation-body">
          <h4>${item.titulo}</h4>
          <p class="organization-text"><i class="fa-solid fa-building"></i> ${item.organizacion}</p>
          <p class="desc-text">${item.descripcion}</p>
          ${item.enlaceRecurso ? `<a href="${item.enlaceRecurso}" target="_blank" class="secondary-btn card-btn">Ver Recurso <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
        </div>
      </div>
    `).join('');
  }
  
  /**
   * Lógica del Buscador Transversal Inteligente (El núcleo del Pilar 1)
   */
  function initGlobalSearch() {
    const input = document.getElementById("globalSearchInput");
    const btn = document.getElementById("globalSearchBtn");
    const section = document.getElementById("searchResultsSection");
    const grid = document.getElementById("searchResultsGrid");
    const closeBtn = document.getElementById("closeSearchBtn");
  
    if (!input || !btn || !section || !grid) return;
  
    const ejecutarBusqueda = () => {
      const query = input.value.trim().toLowerCase();
      if (query === "") {
        section.classList.add("d-none");
        return;
      }
  
      grid.innerHTML = "";
      let resultadosHTML = "";
  
      // A. Buscar en Biofábricas (Mapeando por nombre, descripción, región o tags)
      const biofabricasFiltradas = localBiofabricas.filter(b => 
        b.name.toLowerCase().includes(query) || 
        b.descripcion.toLowerCase().includes(query) ||
        b.region.toLowerCase().includes(query) ||
        b.tags.some(t => t.toLowerCase().includes(query))
      );
  
      // B. Buscar en Catálogo Técnico / Innovaciones / Manuales (Por título, descripción, organización o categoría)
      const innovacionesFiltradas = localInnovaciones.filter(i => 
        i.titulo.toLowerCase().includes(query) || 
        i.descripcion.toLowerCase().includes(query) || 
        i.organizacion.toLowerCase().includes(query) ||
        i.categoria.toLowerCase().includes(query)
      );
  
      // Inyectar resultados de Biofábricas
      biofabricasFiltradas.forEach(b => {
        resultadosHTML += `
          <div class="search-result-card result-biofabrica">
            <div class="result-tag"><i class="fa-solid fa-industry"></i> Biofábrica (Pilar 2)</div>
            <h4>${b.name}</h4>
            <p class="location"><i class="fa-solid fa-map-pin"></i> Ubicación: ${b.region} (${b.estado})</p>
            <p>${b.descripcion.substring(0, 140)}...</p>
            <a href="ecosistema.html?id=${b.id}" class="result-link">Ver en el mapa interactivo →</a>
          </div>
        `;
      });
  
      // Inyectar resultados de Innovaciones, Libros, Videos, Enlaces Técnicos
      innovacionesFiltradas.forEach(i => {
        let icon = "fa-book";
        if(i.categoria.toLowerCase().includes("video") || i.categoria.toLowerCase().includes("webinar")) icon = "fa-video";
        if(i.categoria.toLowerCase().includes("normativa")) icon = "fa-gavel";
  
        resultadosHTML += `
          <div class="search-result-card result-tech">
            <div class="result-tag"><i class="fa-solid ${icon}"></i> ${i.categoria} (Pilar 1)</div>
            <h4>${i.titulo}</h4>
            <p class="author"><i class="fa-solid fa-landmark"></i> Fuente: ${i.organizacion}</p>
            <p>${i.descripcion}</p>
            ${i.enlaceRecurso ? `<a href="${i.enlaceRecurso}" target="_blank" class="result-link download">Acceder al recurso <i class="fa-solid fa-download"></i></a>` : ''}
          </div>
        `;
      });
  
      if (resultadosHTML === "") {
        grid.innerHTML = `
          <div class="no-results-box">
            <i class="fa-regular fa-folder-open"></i>
            <p>No se encontraron manuales, experiencias ni biofábricas asociadas al término <strong>"${input.value}"</strong>.</p>
          </div>`;
      } else {
        grid.innerHTML = resultadosHTML;
      }
  
      // Mostrar sección de resultados y hacer scroll suave hacia ella
      section.classList.remove("d-none");
      section.scrollIntoView({ behavior: "smooth" });
    };
  
    btn.addEventListener("click", ejecutarBusqueda);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") ejecutarBusqueda();
    });
  
    closeBtn.addEventListener("click", () => {
      section.classList.add("d-none");
      input.value = "";
    });
  }