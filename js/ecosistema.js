// ====================================
// DATOS
// ====================================

let actores = [];
let proyectos = [];
let comunidades = [];
let biofabricas = [];

// ====================================
// INICIALIZAR
// ====================================

document.addEventListener(
    "DOMContentLoaded",
    initEcosistema
);

async function initEcosistema(){

    try{

        [
            actores,
            proyectos,
            comunidades,
            biofabricas
        ] = await Promise.all([

            fetchActores(),

            fetchProyectos(),

            fetchComunidades(),

            fetchBiofabricas()

        ]);

        renderKPIs();

        renderActores();

        renderProyectos();

        renderComunidades();

        renderRedes();

        initMap();

    }
    catch(error){

        console.error(error);

    }

}

// ====================================
// KPI HERO
// ====================================

function renderKPIs(){

    document.getElementById(
        "totalActores"
    ).textContent =
    actores.length;

    document.getElementById(
        "totalBiofabricas"
    ).textContent =
    biofabricas.length;

    document.getElementById(
        "totalProyectos"
    ).textContent =
    proyectos.length;

}

// ====================================
// DIRECTORIO
// ====================================

function renderActores(){

    const grid =
    document.getElementById(
        "actoresGrid"
    );

    grid.innerHTML =
    actores.map(actor=>`

        <article class="actor-card">

            <div class="actor-type">

                ${actor.tipo}

            </div>

            <h3>

                ${actor.nombre}

            </h3>

            <p>

                ${actor.descripcion}

            </p>

            <small>

                📍 ${actor.provincia}

            </small>

        </article>

    `).join("");

}

// ====================================
// BUSCADOR
// ====================================

document
.getElementById("actorSearch")
?.addEventListener(
    "input",
    filtrarActores
);

function filtrarActores(){

    const query =
    document
    .getElementById("actorSearch")
    .value
    .toLowerCase();

    const resultados =
    actores.filter(a=>{

        return `
            ${a.nombre}
            ${a.tipo}
            ${a.descripcion}
            ${a.provincia}
        `
        .toLowerCase()
        .includes(query);

    });

    const grid =
    document.getElementById(
        "actoresGrid"
    );

    grid.innerHTML =
    resultados.map(actor=>`

        <article class="actor-card">

            <div class="actor-type">

                ${actor.tipo}

            </div>

            <h3>

                ${actor.nombre}

            </h3>

            <p>

                ${actor.descripcion}

            </p>

        </article>

    `).join("");

}

// ====================================
// PROYECTOS
// ====================================

function renderProyectos(){

    const grid =
    document.getElementById(
        "proyectosGrid"
    );

    grid.innerHTML =
    proyectos.map(proyecto=>`

        <article class="project-card">

            <h3>

                ${proyecto.nombre}

            </h3>

            <p>

                ${proyecto.descripcion}

            </p>

            <span>

                ${proyecto.estado}

            </span>

        </article>

    `).join("");

}

// ====================================
// COMUNIDADES
// ====================================

function renderComunidades(){

    const grid =
    document.getElementById(
        "comunidadesGrid"
    );

    grid.innerHTML =
    comunidades.map(c=>`

        <article class="community-card">

            <h3>

                ${c.nombre}

            </h3>

            <p>

                ${c.descripcion}

            </p>

        </article>

    `).join("");

}

// ====================================
// REDES
// ====================================

function renderRedes(){

    const container =
    document.getElementById(
        "networkCards"
    );

    const redes = [

        {
            titulo:
            "Productores"
        },

        {
            titulo:
            "Biofábricas"
        },

        {
            titulo:
            "Universidades"
        },

        {
            titulo:
            "Instituciones"
        }

    ];

    container.innerHTML =
    redes.map(red=>`

        <article class="network-card">

            <h3>

                ${red.titulo}

            </h3>

            <p>

                Espacio de colaboración
                sectorial.

            </p>

        </article>

    `).join("");

}

// ====================================
// MAPA
// ====================================

function initMap(){

    const map =
    L.map("map")
    .setView(
        [9.93,-84.08],
        8
    );

    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
            "&copy; OpenStreetMap"
        }
    ).addTo(map);

    biofabricas.forEach(bio=>{

        L.marker([
            bio.lat,
            bio.lng
        ])

        .addTo(map)

        .bindPopup(`
            <strong>
                ${bio.name}
            </strong>
            <br>
            ${bio.region}
        `);

    });

}