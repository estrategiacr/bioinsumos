// =====================================
// UTILIDADES Y PARSEADORES
// =====================================

function convertirLinkDriveAImagen(url) {
  if (!url) return "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=600"; // Imagen por defecto (Agro)
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return url; // Si no es link de drive, retorna el string crudo
  return `https://lh3.googleusercontent.com/d/$${match[1]}`;
}

// Función auxiliar robusta para parsear líneas de CSV separadas por tabulaciones (\t)
function parseCSVLine(line) {
  return line.split("\t").map(item => item.trim().replace(/^"|"$/g, ''));
}

// =====================================
// CONFIGURACIÓN GOOGLE SHEETS
// =====================================
const SHEET_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?";

// Endpoints CSV por Hojas (GIDs independientes)
const SHEET_CSV_BIOFABRICAS = `${SHEET_BASE}gid=0&single=true&output=csv`;
const SHEET_CSV_INNOVACIONES = `${SHEET_BASE}gid=615287650&single=true&output=csv`; // GID Asignado a Tabla 2
const SHEET_CSV_RECURSOS     = `${SHEET_BASE}gid=1587744224&single=true&output=csv`;

// =====================================
// EXTRACCIÓN DE BIOFÁBRICAS (TABLA 1)
// =====================================
async function fetchBiofabricas() {
  try {
    const response = await fetch(SHEET_CSV_BIOFABRICAS);
    const csv = await response.text();
    // Reemplazamos saltos de línea para evitar desalineación de registros
    const rows = csv.trim().split(/\r?\n/);
    
    return rows.slice(1).map(row => {
      const values = parseCSVLine(row);
      return {
        id: values[0],
        name: values[1],
        lat: parseFloat(values[2]),
        lng: parseFloat(values[3]),
        region: values[4],
        estado: values[5],
        descripcion: values[6] || "Sin descripción disponible.",
        imagen: convertirLinkDriveAImagen(values[7]),
        tags: values[8] ? values[8].split(";") : []
      };
    });
  } catch (error) {
    console.error("Error cargando Biofábricas de Google Sheets:", error);
    return [];
  }
}

// =====================================
// EXTRACCIÓN DE INNOVACIONES (TABLA 2)
// =====================================
async function fetchInnovaciones() {
  try {
    const response = await fetch(SHEET_CSV_INNOVACIONES);
    const csv = await response.text();
    const rows = csv.trim().split(/\r?\n/);
    
    return rows.slice(1).map(row => {
      const values = parseCSVLine(row);
      return {
        id: values[0],
        titulo: values[1],
        categoria: values[2],
        organizacion: values[3],
        descripcion: values[4],
        imagenUrl: convertirLinkDriveAImagen(values[5]),
        enlaceRecurso: values[6],
        destacado: values[7] === "SI"
      };
    });
  } catch (error) {
    console.error("Error cargando Innovaciones:", error);
    return [];
  }
}

// =====================================
// EXTRACCIÓN DE RECURSOS (PILAR 1)
// =====================================
async function fetchRecursos() {
  try {
    const response = await fetch(SHEET_CSV_RECURSOS);
    const csv = await response.text();
    const rows = csv.trim().split(/\r?\n/);
    
    return rows.slice(1).map(row => {
      const values = parseCSVLine(row);
      return {
        nombre: values[0],
        tipo: values[1],
        categoria: values[2],
        enlace: values[3]
      };
    });
  } catch (error) {
    return [];
  }
}