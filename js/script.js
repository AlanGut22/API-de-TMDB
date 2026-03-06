// ===============================
// CONSTANTE DE LA SERIE ASIGNADA
// ===============================

const ID_SERIE_PERMITIDA = 751;
const NOMBRE_SERIE_PERMITIDA = "The World at War";

// ===============================
// ELEMENTOS DEL DOM
// ===============================

const btnBuscar = document.getElementById("btnBuscar");
const inputBusqueda = document.getElementById("searchInput");
const tipoConsulta = document.getElementById("tipoConsulta");

const contenedorResultados = document.getElementById("resultados");
const contenedorDetalles = document.getElementById("detalles");
const contenedorMensajes = document.getElementById("mensajes");

// ocultar detalles al inicio
contenedorDetalles.style.display = "none";

// ===============================
// EVENTOS
// ===============================

btnBuscar.addEventListener("click", iniciarBusqueda);

inputBusqueda.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        iniciarBusqueda();
    }
});

// ===============================
// FUNCIÓN PRINCIPAL
// ===============================

async function iniciarBusqueda() {

    const nombre = inputBusqueda.value.trim();
    const filtro = tipoConsulta.value;

    if (nombre === "") {
        mostrarMensaje("Escribe el nombre de la serie asignada");
        return;
    }

    mostrarMensaje("Buscando información...");

    try {

        const id = await obtenerID(nombre);

        if (!id) {
            mostrarMensaje("Solo se permite consultar la serie 'The World at War'");
            return;
        }

        // limpiar contenedores
        contenedorResultados.innerHTML = "";
        contenedorDetalles.innerHTML = "";
        contenedorDetalles.style.display = "none";

        if (filtro === "info") {
            obtenerInformacion(id);
        }

        if (filtro === "actores") {
            obtenerActores(id);
        }

        if (filtro === "recomendaciones") {
            obtenerRecomendaciones(id);
        }

        if (filtro === "videos") {
            obtenerVideos(id);
        }

        if (filtro === "imagenes") {
            obtenerImagenes(id);
        }

    } catch (error) {

        console.error(error);
        mostrarMensaje("Error al consultar la API");

    }

}

// ===============================
// OBTENER ID DE LA SERIE
// ===============================

async function obtenerID(nombre) {

    const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(nombre)}`;

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error("Error en la API");
    }

    const data = await respuesta.json();

    if (!data.results || data.results.length === 0) {
        return null;
    }

    const serie = data.results[0];

    if (
        serie.id !== ID_SERIE_PERMITIDA &&
        serie.name.toLowerCase() !== NOMBRE_SERIE_PERMITIDA.toLowerCase()
    ) {
        return null;
    }

    return serie.id;

}

// ===============================
// INFORMACIÓN GENERAL
// ===============================

async function obtenerInformacion(id) {

    const url = `${BASE_URL}/tv/${id}?api_key=${API_KEY}`;

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");

    const poster = data.poster_path
        ? `${IMAGE_URL}${data.poster_path}`
        : "https://via.placeholder.com/300x450?text=No+Image";

    contenedorDetalles.innerHTML = `
    
    <div class="detalles-info">

        <h2>${data.name}</h2>

        <img src="${poster}">

        <p><strong>Primera emisión:</strong> ${data.first_air_date}</p>

        <p><strong>Calificación:</strong> ${data.vote_average}</p>

        <p>${data.overview}</p>

    </div>

    `;

    // 🔹 MOSTRAR EL CONTENEDOR
    contenedorDetalles.style.display = "flex";

}

// ===============================
// REPARTO Y EQUIPO
// ===============================

async function obtenerActores(id) {

    const url = `${BASE_URL}/tv/${id}/aggregate_credits?api_key=${API_KEY}`;

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");

    contenedorResultados.innerHTML = "";

    const tituloReparto = document.createElement("h2");
    tituloReparto.textContent = "Reparto";
    tituloReparto.style.gridColumn = "1 / -1";

    contenedorResultados.appendChild(tituloReparto);

    data.cast.forEach(actor => {

        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card");

        let imagen = actor.profile_path
            ? `<img src="${IMAGE_URL}${actor.profile_path}">`
            : `<div class="no-image">👤</div>`;

        tarjeta.innerHTML = `
        
        ${imagen}

        <div class="card-body">
            <h3>${actor.name}</h3>
            <p>${actor.roles?.[0]?.character || "Participante"}</p>
        </div>
        
        `;

        contenedorResultados.appendChild(tarjeta);

    });

    const tituloEquipo = document.createElement("h2");
    tituloEquipo.textContent = "Equipo de Producción";
    tituloEquipo.style.gridColumn = "1 / -1";
    tituloEquipo.style.marginTop = "40px";

    contenedorResultados.appendChild(tituloEquipo);

    data.crew.forEach(persona => {

        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card");

        let imagen = persona.profile_path
            ? `<img src="${IMAGE_URL}${persona.profile_path}">`
            : `<div class="no-image">👤</div>`;

        tarjeta.innerHTML = `
        
        ${imagen}

        <div class="card-body">
            <h3>${persona.name}</h3>
            <p>${persona.jobs?.[0]?.job || "Equipo técnico"}</p>
        </div>
        
        `;

        contenedorResultados.appendChild(tarjeta);

    });

}

// ===============================
// RECOMENDACIONES
// ===============================

async function obtenerRecomendaciones(id) {

    const url = `${BASE_URL}/tv/${id}/recommendations?api_key=${API_KEY}`;

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");

    data.results.slice(0, 10).forEach(serie => {

        const poster = serie.poster_path
            ? `${IMAGE_URL}${serie.poster_path}`
            : "https://via.placeholder.com/300x450?text=No+Image";

        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card");

        tarjeta.innerHTML = `
        
        <img src="${poster}">

        <div class="card-body">
            <h3>${serie.name}</h3>
            <p>${serie.first_air_date}</p>
        </div>
        
        `;

        contenedorResultados.appendChild(tarjeta);

    });

}

// ===============================
// VIDEOS
// ===============================

async function obtenerVideos(id) {

    const url = `${BASE_URL}/tv/${id}/videos?api_key=${API_KEY}`;

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");

    data.results.slice(0, 5).forEach(video => {

        if (video.site === "YouTube") {

            const iframe = document.createElement("iframe");

            iframe.width = "100%";
            iframe.height = "250";
            iframe.src = `https://www.youtube.com/embed/${video.key}`;
            iframe.allowFullscreen = true;

            const contenedorVideo = document.createElement("div");
            contenedorVideo.classList.add("card");

            contenedorVideo.appendChild(iframe);

            contenedorResultados.appendChild(contenedorVideo);

        }

    });

}

// ===============================
// IMÁGENES
// ===============================

async function obtenerImagenes(id) {

    const url = `${BASE_URL}/tv/${id}/images?api_key=${API_KEY}`;

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");

    data.backdrops.slice(0, 10).forEach(imagen => {

        const img = document.createElement("img");

        img.src = `${IMAGE_URL}${imagen.file_path}`;
        img.style.width = "300px";
        img.style.margin = "10px";

        contenedorResultados.appendChild(img);

    });

}

// ===============================
// MENSAJES
// ===============================

function mostrarMensaje(texto) {
    contenedorMensajes.textContent = texto;
}