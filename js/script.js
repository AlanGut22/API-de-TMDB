// CONFIGURACIÓN GENERAL DE LA API

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

// Serie fija: The World at War
const ID_SERIE = 751;

// ELEMENTOS DEL DOM

// Onboarding
const onboarding = document.getElementById("onboarding");
const apiKeyInput = document.getElementById("apiKeyInput");
const btnValidar = document.getElementById("btnValidar");
const estadoClave = document.getElementById("estadoClave");

// App
const app = document.getElementById("app");
const contenedorResultados = document.getElementById("resultados");
const contenedorDetalles = document.getElementById("detalles");
const contenedorMensajes = document.getElementById("mensajes");
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
const navBtns = document.querySelectorAll(".nav-btn");

// ESTADO GLOBAL

let API_KEY = "";
let claveValida = false;
let filtroActivo = "info";

contenedorDetalles.style.display = "none";

// ONBOARDING – VALIDACIÓN DE API KEY

btnValidar.addEventListener("click", validarApiKey);

apiKeyInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") validarApiKey();
});

async function validarApiKey() {

    const clave = apiKeyInput.value.trim();

    if (!clave) {
        mostrarEstado("error", "Ingresa una API Key");
        return;
    }

    mostrarEstado("loading", "Validando clave...");
    btnValidar.disabled = true;
    apiKeyInput.disabled = true;

    try {

        const url = `${BASE_URL}/tv/${ID_SERIE}?api_key=${clave}`;
        const respuesta = await fetch(url);

        if (respuesta.ok) {
            API_KEY = clave;
            claveValida = true;

            mostrarEstado("ok", "¡Clave válida! Cargando...");

            // Esperar un momento para que el usuario vea el mensaje de éxito
            setTimeout(function () {
                mostrarApp();
            }, 900);

        } else {
            claveValida = false;
            mostrarEstado("error", "Clave inválida o sin permisos");
            btnValidar.disabled = false;
            apiKeyInput.disabled = false;
        }

    } catch (error) {
        console.error(error);
        mostrarEstado("error", "Error de conexión");
        btnValidar.disabled = false;
        apiKeyInput.disabled = false;
    }

}

function mostrarEstado(tipo, texto) {
    estadoClave.className = "api-status visible status--" + tipo;
    estadoClave.innerHTML = `<span class="api-status-dot"></span>${texto}`;
}

function mostrarApp() {
    // Ocultar onboarding con fade
    onboarding.classList.add("fade-out");

    // Mostrar la app
    app.classList.remove("app--hidden");
    app.classList.add("app--visible");

    // Cargar la sección inicial
    cargarSeccion();
}


// NAVBAR – LÓGICA

hamburger.addEventListener("click", function () {
    hamburger.classList.toggle("open");
    navLinks.classList.toggle("open");
});

const hamburgerLabel = hamburger.querySelector(".hamburger-label");

navBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {

        navBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        filtroActivo = btn.dataset.filtro;

        if (hamburgerLabel) hamburgerLabel.textContent = btn.textContent;

        hamburger.classList.remove("open");
        navLinks.classList.remove("open");

        if (claveValida) cargarSeccion();

    });
});


// CARGAR SECCIÓN ACTIVA

async function cargarSeccion() {

    mostrarMensaje("Cargando información...");

    contenedorResultados.innerHTML = "";
    contenedorResultados.classList.remove("traducciones-grid");
    contenedorDetalles.innerHTML = "";
    contenedorDetalles.style.display = "none";

    try {

        if (filtroActivo === "info") await obtenerInformacion(ID_SERIE);
        if (filtroActivo === "actores") await obtenerActores(ID_SERIE);
        if (filtroActivo === "temporadas") await obtenerTemporadas(ID_SERIE);
        if (filtroActivo === "videos") await obtenerVideos(ID_SERIE);
        if (filtroActivo === "imagenes") await obtenerImagenes(ID_SERIE);
        if (filtroActivo === "traducciones") await obtenerTraducciones(ID_SERIE);

    } catch (error) {
        console.error(error);
        mostrarMensaje("Error al consultar la API");
    }

}

// INFORMACIÓN GENERAL DE LA SERIE

async function obtenerInformacion(id) {

    const url = `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=es-ES`;
    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");

    const poster = data.poster_path
        ? `${IMAGE_URL}${data.poster_path}`
        : "https://via.placeholder.com/300x450?text=No+Image";

    contenedorDetalles.innerHTML = `
        <div class="detalles-info">
            <div class="detalles-media">
                <img src="${poster}" alt="${data.name}">
            </div>
            <div class="detalles-contenido">
                <h2>${data.name}</h2>
                <div class="detalles-meta">
                    <span class="chip">
                        Primera emisión
                        <strong>${data.first_air_date}</strong>
                    </span>
                    <span class="chip chip--accent">
                        Calificación
                        <strong>${data.vote_average}</strong>
                    </span>
                    <span class="chip">
                        Temp. / Episodios
                        <strong>${data.number_of_seasons} temporadas · ${data.number_of_episodes} episodios</strong>
                    </span>
                </div>
                <p class="detalles-resumen">${data.overview}</p>
            </div>
        </div>
    `;

    contenedorDetalles.style.display = "flex";

}

// REPARTO Y EQUIPO DE PRODUCCIÓN

async function obtenerActores(id) {

    const url = `${BASE_URL}/tv/${id}/aggregate_credits?api_key=${API_KEY}&language=es-ES`;
    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");
    contenedorResultados.innerHTML = "";

    const tituloReparto = document.createElement("h2");
    tituloReparto.textContent = "Reparto";
    tituloReparto.style.gridColumn = "1 / -1";
    contenedorResultados.appendChild(tituloReparto);

    data.cast.forEach(function (actor) {

        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card");

        const imagen = actor.profile_path
            ? `<img src="${IMAGE_URL}${actor.profile_path}">`
            : `<div class="no-image">👤</div>`;

        tarjeta.innerHTML = `
            ${imagen}
            <div class="card-body">
                <h3>${actor.name}</h3>
                <p>${actor.roles && actor.roles[0] ? actor.roles[0].character : "Participante"}</p>
            </div>`;

        contenedorResultados.appendChild(tarjeta);

    });

    const tituloEquipo = document.createElement("h2");
    tituloEquipo.textContent = "Equipo de Producción";
    tituloEquipo.style.gridColumn = "1 / -1";
    tituloEquipo.style.marginTop = "40px";
    contenedorResultados.appendChild(tituloEquipo);

    data.crew.forEach(function (persona) {

        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card");

        const imagen = persona.profile_path
            ? `<img src="${IMAGE_URL}${persona.profile_path}">`
            : `<div class="no-image">👤</div>`;

        tarjeta.innerHTML = `
            ${imagen}
            <div class="card-body">
                <h3>${persona.name}</h3>
                <p>${persona.jobs && persona.jobs[0] ? persona.jobs[0].job : "Equipo técnico"}</p>
            </div>`;

        contenedorResultados.appendChild(tarjeta);

    });

}

// RECOMENDACIONES DE SERIES SIMILARES

async function obtenerTemporadas(id) {

    // 1. Obtener info general para saber cuántas temporadas hay
    const urlSerie = `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=es-ES`;
    const resSerie = await fetch(urlSerie);
    const dataSerie = await resSerie.json();

    const totalTemporadas = dataSerie.number_of_seasons || 1;

    mostrarMensaje("");
    contenedorResultados.innerHTML = "";

    // Contenedor donde se inyectarán los episodios
    const episodiosWrapper = document.createElement("div");
    episodiosWrapper.id = "episodiosWrapper";
    episodiosWrapper.classList.add("episodios-wrapper");

    if (totalTemporadas === 1) {

        // 2a. Serie de una sola temporada: mostrar badge informativo
        const badge = document.createElement("div");
        badge.classList.add("temporada-unica-badge");
        badge.style.gridColumn = "1 / -1";
        badge.innerHTML = `
            <span class="temporada-unica-icon">📺</span>
            <div class="temporada-unica-texto">
                <strong>Temporada única</strong>
                <span>Esta serie cuenta con una sola temporada</span>
            </div>
        `;
        contenedorResultados.appendChild(badge);

    } else {

        // 2b. Varias temporadas: mostrar selector
        const selectorWrapper = document.createElement("div");
        selectorWrapper.classList.add("temporadas-selector-wrapper");
        selectorWrapper.style.gridColumn = "1 / -1";

        const label = document.createElement("label");
        label.textContent = "Seleccionar temporada:";
        label.classList.add("temporadas-label");
        label.setAttribute("for", "selectorTemporada");

        const selector = document.createElement("select");
        selector.id = "selectorTemporada";
        selector.classList.add("temporadas-select");

        for (let i = 1; i <= totalTemporadas; i++) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = "Temporada " + i;
            selector.appendChild(opt);
        }

        selectorWrapper.appendChild(label);
        selectorWrapper.appendChild(selector);
        contenedorResultados.appendChild(selectorWrapper);

        selector.addEventListener("change", async function () {
            await cargarEpisodios(id, parseInt(this.value), episodiosWrapper);
        });

    }

    contenedorResultados.appendChild(episodiosWrapper);

    // 3. Cargar temporada 1 por defecto
    await cargarEpisodios(id, 1, episodiosWrapper);

}

async function cargarEpisodios(id, numTemporada, wrapper) {

    wrapper.innerHTML = "<p style='grid-column:1/-1;text-align:center;color:#64748b;padding:20px 0'>Cargando episodios...</p>";

    const url = `${BASE_URL}/tv/${id}/season/${numTemporada}?api_key=${API_KEY}&language=es-ES`;
    const respuesta = await fetch(url);
    const data = await respuesta.json();

    wrapper.innerHTML = "";

    if (!data.episodes || data.episodes.length === 0) {
        wrapper.innerHTML = "<p style='grid-column:1/-1;text-align:center;color:#64748b;padding:20px 0'>No hay episodios disponibles.</p>";
        return;
    }

    data.episodes.forEach(function (ep) {

        const imagen = ep.still_path
            ? `<img src="${IMAGE_URL}${ep.still_path}" alt="${ep.name}">`
            : `<div class="no-image" style="height:180px;font-size:48px">🎬</div>`;

        const calificacion = ep.vote_average
            ? `<span class="ep-rating">⭐ ${ep.vote_average.toFixed(1)}</span>`
            : `<span class="ep-rating ep-rating--na">Sin calificación</span>`;

        const descripcion = ep.overview
            ? ep.overview
            : "Sin descripción disponible para este episodio.";

        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card", "card--episodio");

        tarjeta.innerHTML = `
            ${imagen}
            <div class="card-body">
                <div class="ep-header">
                    <span class="ep-num">Ep. ${ep.episode_number}</span>
                    ${calificacion}
                </div>
                <h3>${ep.name}</h3>
                <p>${descripcion}</p>
            </div>`;

        wrapper.appendChild(tarjeta);
    });
}

// VIDEOS DE LA SERIE

async function obtenerVideos(id) {

    const url = `${BASE_URL}/tv/${id}/videos?api_key=${API_KEY}`;
    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");

    data.results.slice(0, 5).forEach(function (video) {

        if (video.site === "YouTube") {

            const iframe = document.createElement("iframe");
            iframe.width = "100%";
            iframe.height = "300";
            iframe.src = `https://www.youtube.com/embed/${video.key}`;
            iframe.allowFullscreen = true;

            const contenedorVideo = document.createElement("div");
            contenedorVideo.classList.add("card");
            contenedorVideo.appendChild(iframe);
            contenedorResultados.appendChild(contenedorVideo);
        }
    });
}

// IMÁGENES DE LA SERIE

async function obtenerImagenes(id) {

    const url = `${BASE_URL}/tv/${id}/images?api_key=${API_KEY}`;
    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");

    data.backdrops.slice(0, 10).forEach(function (imagen) {

        const img = document.createElement("img");
        img.src = `${IMAGE_URL}${imagen.file_path}`;
        img.classList.add("grid-backdrop");
        contenedorResultados.appendChild(img);
    });
}

// TRADUCCIONES DISPONIBLES

async function obtenerTraducciones(id) {

    const url = `${BASE_URL}/tv/${id}/translations?api_key=${API_KEY}&language=es-ES`;
    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");
    contenedorResultados.innerHTML = "";
    contenedorResultados.classList.add("traducciones-grid");

    const titulo = document.createElement("h2");
    titulo.textContent = "Traducciones disponibles";
    titulo.style.gridColumn = "1 / -1";
    contenedorResultados.appendChild(titulo);

    const idiomasPermitidos = ["en", "fr", "de", "pt"];

    const traduccionesFiltradas = (data.translations || []).filter(function (t) {

        if (!t.data || (!t.data.overview && !t.data.name)) return false;

        const lang = t.iso_639_1;
        const country = t.iso_3166_1;

        return (
            (lang === "es" && country === "MX") ||
            (lang === "es" && country === "ES") ||
            idiomasPermitidos.indexOf(lang) !== -1
        );

    });

    traduccionesFiltradas.forEach(function (traduccion) {

        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card");

        let etiquetaIdioma = traduccion.english_name;

        if (traduccion.iso_639_1 === "es" && traduccion.iso_3166_1 === "MX") etiquetaIdioma = "Español (México)";
        else if (traduccion.iso_639_1 === "es" && traduccion.iso_3166_1 === "ES") etiquetaIdioma = "Español (España)";
        else if (traduccion.iso_639_1 === "en") etiquetaIdioma = "Inglés";
        else if (traduccion.iso_639_1 === "fr") etiquetaIdioma = "Francés";
        else if (traduccion.iso_639_1 === "de") etiquetaIdioma = "Alemán";
        else if (traduccion.iso_639_1 === "pt") etiquetaIdioma = "Portugués";

        const tituloTraducido = traduccion.data.name || traduccion.data.title || "Sin título";
        const resumen = traduccion.data.overview || "Sin sinopsis en esta traducción.";

        tarjeta.innerHTML = `
            <div class="card-body">
                <h3>${etiquetaIdioma}</h3>
                <p><strong>${tituloTraducido}</strong></p>
                <p>${resumen}</p>
            </div>`;

        contenedorResultados.appendChild(tarjeta);

    });
}


// FUNCIÓN PARA MOSTRAR MENSAJES AL USUARIO

function mostrarMensaje(texto) {
    contenedorMensajes.textContent = texto;
}