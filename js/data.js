// =====================================
// UTILIDADES Y PARSEADORES
// =====================================

function convertirLinkDriveAImagen(url) {
  if (!url) return "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=600";
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return url;
  return `https://docs.google.com/uc?export=view&id=${match[1]}`;
}

/**
 * Split inteligente para CSV: Separa por comas, 
 * pero ignora las comas que estén dentro de textos entre comillas.
 */
function parsearLineaCSV(linea) {
  const resultado = [];
  let dentroDeComillas = false;
  let entradaActual = "";

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];

    if (char === '"') {
      dentroDeComillas = !dentroDeComillas; // Alternar estado
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
// CONFIGURACIÓN GOOGLE SHEETS
// =====================================
const SHEET_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?";

// Asegúrate de cambiar el GID de la Tabla 2 por el que te genere Google Sheets
const SHEET_CSV_BIOFABRICAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=0&single=true&output=csv";
const SHEET_CSV_INNOVACIONES = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=615287650&single=true&output=csv";


// =====================================
// EXTRACCIÓN DE BIOFÁBRICAS (TABLA 1)
// =====================================
async function fetchBiofabricas() {
  try {
    const response = await fetch(SHEET_CSV_BIOFABRICAS);
    const csv = await response.text();
    // Dividir por saltos de línea sin romper textos largos
    const rows = csv.split(/\r?\n/).filter(row => row.trim() !== "");
    
    return rows.slice(1).map(row => {
      const values = parsearLineaCSV(row);
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
    console.error("Error cargando Biofábricas:", error);
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
    const rows = csv.split(/\r?\n/).filter(row => row.trim() !== "");
    
    return rows.slice(1).map(row => {
      const values = parsearLineaCSV(row);
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