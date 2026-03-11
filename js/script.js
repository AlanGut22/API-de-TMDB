// =====================================================
// CONFIGURACIÓN GENERAL DE LA API
// =====================================================

// URL base de la API de The Movie Database
// Todas las consultas a la API parten de esta dirección
const BASE_URL = "https://api.themoviedb.org/3";

// URL base para obtener imágenes (posters, actores, fondos, etc.)
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";


// =====================================================
// CONSTANTE DE LA SERIE ASIGNADA
// =====================================================

// ID oficial de la serie "The World at War" dentro de TMDB
// Se usa para evitar que el usuario consulte otras series
const ID_SERIE_PERMITIDA = 751;

// Nombre de la serie permitida
// También se valida para asegurar que el usuario busque la serie correcta
const NOMBRE_SERIE_PERMITIDA = "The World at War";


// =====================================================
// ELEMENTOS DEL DOM
// =====================================================

// Botón que ejecuta la búsqueda
const btnBuscar = document.getElementById("btnBuscar");

// Input donde el usuario escribe el nombre de la serie
const inputBusqueda = document.getElementById("searchInput");

// Select que define el tipo de consulta (info, actores, videos, etc.)
const tipoConsulta = document.getElementById("tipoConsulta");

// Contenedor donde se mostrarán resultados como actores, imágenes, etc.
const contenedorResultados = document.getElementById("resultados");

// Contenedor donde se muestra la información detallada de la serie
const contenedorDetalles = document.getElementById("detalles");

// Contenedor donde se muestran mensajes al usuario
const contenedorMensajes = document.getElementById("mensajes");


// Ocultar la sección de detalles al iniciar la página
contenedorDetalles.style.display = "none";


// =====================================================
// EVENTOS
// =====================================================

// Cuando el usuario hace clic en el botón buscar
// se ejecuta la función principal de búsqueda
btnBuscar.addEventListener("click", iniciarBusqueda);

// También se permite buscar presionando ENTER
inputBusqueda.addEventListener("keypress", function (e) {

    // Si la tecla presionada es Enter se inicia la búsqueda
    if (e.key === "Enter") {
        iniciarBusqueda();
    }

});


// =====================================================
// FUNCIÓN PRINCIPAL DE BÚSQUEDA
// =====================================================

async function iniciarBusqueda() {

    // Obtiene el texto escrito por el usuario y elimina espacios
    const nombre = inputBusqueda.value.trim();

    // Obtiene el tipo de consulta seleccionada
    const filtro = tipoConsulta.value;

    // Validación: si el usuario no escribió nada
    if (nombre === "") {
        mostrarMensaje("Escribe el nombre de la serie asignada");
        return;
    }

    // Mensaje temporal mientras se consulta la API
    mostrarMensaje("Buscando información...");

    try {

        // Obtener el ID de la serie buscada
        const id = await obtenerID(nombre);

        // Si el ID no es válido significa que el usuario
        // intentó buscar una serie diferente
        if (!id) {
            mostrarMensaje("Solo se permite consultar la serie 'The World at War' (El mundo en guerra)");
            return;
        }

        // Limpiar resultados anteriores
        contenedorResultados.innerHTML = "";
        contenedorResultados.classList.remove("traducciones-grid");

        // Limpiar detalles anteriores
        contenedorDetalles.innerHTML = "";
        contenedorDetalles.style.display = "none";

        // Según el filtro seleccionado se ejecuta
        // la función correspondiente

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

        if (filtro === "traducciones") {
            obtenerTraducciones(id);
        }

    } catch (error) {

        // Si ocurre algún error en la API
        console.error(error);
        mostrarMensaje("Error al consultar la API");

    }

}


// =====================================================
// OBTENER EL ID DE LA SERIE
// =====================================================

async function obtenerID(nombre) {

    // Construcción de la URL para buscar la serie por nombre
    const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(nombre)}`;

    // Se realiza la petición HTTP a la API
    const respuesta = await fetch(url);

    // Si la respuesta no es válida se genera error
    if (!respuesta.ok) {
        throw new Error("Error en la API");
    }

    // Convertir respuesta a JSON
    const data = await respuesta.json();

    // Si no hay resultados se retorna null
    if (!data.results || data.results.length === 0) {
        return null;
    }

    // Se toma el primer resultado encontrado
    const serie = data.results[0];

    // Validación de seguridad:
    // solo se permite la serie asignada
    if (
        serie.id !== ID_SERIE_PERMITIDA &&
        serie.name.toLowerCase() !== NOMBRE_SERIE_PERMITIDA.toLowerCase()
    ) {
        return null;
    }

    // Retorna el ID válido
    return serie.id;

}


// =====================================================
// INFORMACIÓN GENERAL DE LA SERIE
// =====================================================

async function obtenerInformacion(id) {

    // URL para obtener la información de la serie
    const url = `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=es-ES`;

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    // Limpia mensajes
    mostrarMensaje("");

    // Si no existe poster se usa imagen de reemplazo
    const poster = data.poster_path
        ? `${IMAGE_URL}${data.poster_path}`
        : "https://via.placeholder.com/300x450?text=No+Image";

    // Se genera el HTML dinámico con la información
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
                <p class="detalles-resumen">
                    ${data.overview}
                </p>
            </div>
        </div>
    `;

    // Mostrar el contenedor de detalles
    contenedorDetalles.style.display = "flex";

}


// =====================================================
// REPARTO Y EQUIPO DE PRODUCCIÓN
// =====================================================

async function obtenerActores(id) {

    // Endpoint que devuelve actores y equipo técnico
    const url = `${BASE_URL}/tv/${id}/aggregate_credits?api_key=${API_KEY}&language=es-ES`;

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");

    contenedorResultados.innerHTML = "";

    // Título de la sección de reparto
    const tituloReparto = document.createElement("h2");
    tituloReparto.textContent = "Reparto";
    tituloReparto.style.gridColumn = "1 / -1";

    contenedorResultados.appendChild(tituloReparto);

    // Recorrer lista de actores
    data.cast.forEach(actor => {

        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card");

        // Si el actor tiene foto se muestra
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

    // Título sección equipo técnico
    const tituloEquipo = document.createElement("h2");
    tituloEquipo.textContent = "Equipo de Producción";
    tituloEquipo.style.gridColumn = "1 / -1";
    tituloEquipo.style.marginTop = "40px";

    contenedorResultados.appendChild(tituloEquipo);

    // Recorrer personal técnico
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


// =====================================================
// RECOMENDACIONES DE SERIES SIMILARES
// =====================================================

async function obtenerRecomendaciones(id) {

    const url = `${BASE_URL}/tv/${id}/recommendations?api_key=${API_KEY}&language=es-ES`;

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");

    // Mostrar máximo 10 recomendaciones
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


// =====================================================
// VIDEOS DE LA SERIE
// =====================================================

async function obtenerVideos(id) {

    const url = `${BASE_URL}/tv/${id}/videos?api_key=${API_KEY}`;

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");

    // Mostrar máximo 5 videos
    data.results.slice(0, 5).forEach(video => {

        // Solo se muestran videos de YouTube
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


// =====================================================
// IMÁGENES DE LA SERIE
// =====================================================

async function obtenerImagenes(id) {

    const url = `${BASE_URL}/tv/${id}/images?api_key=${API_KEY}`;

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    mostrarMensaje("");

    // Mostrar máximo 10 imágenes de fondo
    data.backdrops.slice(0, 10).forEach(imagen => {

        const img = document.createElement("img");

        img.src = `${IMAGE_URL}${imagen.file_path}`;
        img.classList.add("grid-backdrop");

        contenedorResultados.appendChild(img);

    });

}


// =====================================================
// TRADUCCIONES DISPONIBLES
// =====================================================

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

    // Filtrar solo algunos idiomas específicos
    const traduccionesFiltradas = data.translations?.filter(t => {

        if (!t.data || (!t.data.overview && !t.data.name)) return false;

        const lang = t.iso_639_1;
        const country = t.iso_3166_1;

        const esMX = lang === "es" && country === "MX";
        const esES = lang === "es" && country === "ES";
        const en = lang === "en";
        const fr = lang === "fr";
        const de = lang === "de";
        const pt = lang === "pt";

        return esMX || esES || en || fr || de || pt;

    }) || [];

    // Mostrar traducciones filtradas
    traduccionesFiltradas.forEach(traduccion => {

        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card");

        let etiquetaIdioma = traduccion.english_name;

        if (traduccion.iso_639_1 === "es" && traduccion.iso_3166_1 === "MX") {
            etiquetaIdioma = "Español (México)";
        } else if (traduccion.iso_639_1 === "es" && traduccion.iso_3166_1 === "ES") {
            etiquetaIdioma = "Español (España)";
        } else if (traduccion.iso_639_1 === "en") {
            etiquetaIdioma = "Inglés";
        } else if (traduccion.iso_639_1 === "fr") {
            etiquetaIdioma = "Francés";
        } else if (traduccion.iso_639_1 === "de") {
            etiquetaIdioma = "Alemán";
        } else if (traduccion.iso_639_1 === "pt") {
            etiquetaIdioma = "Portugués";
        }

        const tituloTraducido = traduccion.data.name || traduccion.data.title || "Sin título";
        const resumen = traduccion.data.overview || "Sin sinopsis en esta traducción.";

        tarjeta.innerHTML = `
            <div class="card-body">
                <h3>${etiquetaIdioma}</h3>
                <p><strong>${tituloTraducido}</strong></p>
                <p>${resumen}</p>
            </div>
        `;

        contenedorResultados.appendChild(tarjeta);

    });

}


// =====================================================
// FUNCIÓN PARA MOSTRAR MENSAJES AL USUARIO
// =====================================================

// Esta función muestra textos informativos en pantalla
// como errores, avisos o mensajes de carga
function mostrarMensaje(texto) {
    contenedorMensajes.textContent = texto;
}