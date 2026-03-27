// ─── Configuración ───────────────────────────────────────────────────────────

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const ID_SERIE = 751;

// ─── DOM ─────────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

const onboarding = $("onboarding");
const apiKeyInput = $("apiKeyInput");
const btnValidar = $("btnValidar");
const estadoClave = $("estadoClave");
const app = $("app");
const resultados = $("resultados");
const detalles = $("detalles");
const mensajes = $("mensajes");
const hamburger = $("hamburger");
const navLinks = $("navLinks");
const navBtns = document.querySelectorAll(".nav-btn");

// ─── Estado ──────────────────────────────────────────────────────────────────

let API_KEY = "";
let claveValida = false;
let filtroActivo = "info";

detalles.style.display = "none";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Fetch + JSON en una línea
const apiFetch = url => fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });

// URL de la API con idioma opcional
const apiUrl = (path, lang = "es-ES") =>
    `${BASE_URL}${path}?api_key=${API_KEY}${lang ? `&language=${lang}` : ""}`;

// Crear una tarjeta genérica
const crearTarjeta = (clases, html) => {
    const el = document.createElement("div");
    el.className = "card " + clases;
    el.innerHTML = html;
    return el;
};

// Imagen o placeholder
const imgOPlaceholder = (path, alt = "", clsPlaceholder = "no-image", icono = "👤") =>
    path ? `<img src="${IMAGE_URL}${path}" alt="${alt}">` : `<div class="${clsPlaceholder}">${icono}</div>`;

// Titular de sección dentro del grid
const crearTitulo = (texto, mt = 0) => {
    const h = document.createElement("h2");
    h.textContent = texto;
    h.style.gridColumn = "1 / -1";
    if (mt) h.style.marginTop = mt + "px";
    return h;
};

// Limpiar contenedores y mostrar mensaje de carga
const limpiarVista = () => {
    resultados.innerHTML = "";
    resultados.classList.remove("traducciones-grid");
    detalles.innerHTML = "";
    detalles.style.display = "none";
    mensajes.textContent = "Cargando información...";
};

// ─── Onboarding ──────────────────────────────────────────────────────────────

btnValidar.addEventListener("click", validarApiKey);
apiKeyInput.addEventListener("keypress", e => e.key === "Enter" && validarApiKey());

async function validarApiKey() {
    const clave = apiKeyInput.value.trim();
    if (!clave) return mostrarEstado("error", "Ingresa una API Key");

    mostrarEstado("loading", "Validando clave...");
    btnValidar.disabled = apiKeyInput.disabled = true;

    try {
        await apiFetch(`${BASE_URL}/tv/${ID_SERIE}?api_key=${clave}`);
        API_KEY = clave;
        claveValida = true;
        mostrarEstado("ok", "¡Clave válida! Cargando...");
        setTimeout(mostrarApp, 900);
    } catch {
        mostrarEstado("error", "Clave inválida o sin permisos");
        btnValidar.disabled = apiKeyInput.disabled = false;
    }
}

const mostrarEstado = (tipo, texto) => {
    estadoClave.className = `api-status visible status--${tipo}`;
    estadoClave.innerHTML = `<span class="api-status-dot"></span>${texto}`;
};

const mostrarApp = () => {
    onboarding.classList.add("fade-out");
    app.classList.replace("app--hidden", "app--visible");
    cargarSeccion();
    precachearEnBackground();
};

// Envía la API Key al Service Worker para pre-cachear todos los datos
function precachearEnBackground() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({ type: "PRECACHE_API", apiKey: API_KEY });
    });
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const hamburgerLabel = hamburger.querySelector(".hamburger-label");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    navLinks.classList.toggle("open");
});

navBtns.forEach(btn => btn.addEventListener("click", () => {
    navBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filtroActivo = btn.dataset.filtro;
    if (hamburgerLabel) hamburgerLabel.textContent = btn.textContent;
    hamburger.classList.remove("open");
    navLinks.classList.remove("open");
    if (claveValida) cargarSeccion();
}));

// ─── Router de secciones ─────────────────────────────────────────────────────

const secciones = {
    info: obtenerInformacion,
    actores: obtenerActores,
    temporadas: obtenerTemporadas,
    videos: obtenerVideos,
    imagenes: obtenerImagenes,
    traducciones: obtenerTraducciones,
};

async function cargarSeccion() {
    limpiarVista();
    try {
        await secciones[filtroActivo]?.(ID_SERIE);
    } catch (e) {
        console.error(e);
        mensajes.textContent = "Error al consultar la API";
    }
}

// ─── Secciones ────────────────────────────────────────────────────────────────

async function obtenerInformacion(id) {
    const d = await apiFetch(apiUrl(`/tv/${id}`));
    mensajes.textContent = "";

    const poster = imgOPlaceholder(d.poster_path, d.name, "no-image", "🎬");

    detalles.innerHTML = `
        <div class="detalles-info">
            <div class="detalles-media">${poster}</div>
            <div class="detalles-contenido">
                <h2>${d.name}</h2>
                <div class="detalles-meta">
                    <span class="chip">Primera emisión<strong>${d.first_air_date}</strong></span>
                    <span class="chip chip--accent">Calificación<strong>${d.vote_average}</strong></span>
                    <span class="chip">Temp. / Episodios<strong>${d.number_of_seasons} temporadas · ${d.number_of_episodes} episodios</strong></span>
                </div>
                <p class="detalles-resumen">${d.overview}</p>
            </div>
        </div>`;

    detalles.style.display = "flex";
}

async function obtenerActores(id) {
    const d = await apiFetch(apiUrl(`/tv/${id}/aggregate_credits`));
    mensajes.textContent = "";

    const renderPersona = (p, rol) => crearTarjeta("", `
        ${imgOPlaceholder(p.profile_path, p.name)}
        <div class="card-body">
            <h3>${p.name}</h3>
            <p>${rol || "Participante"}</p>
        </div>`);

    resultados.appendChild(crearTitulo("Reparto"));
    d.cast.forEach(a => resultados.appendChild(renderPersona(a, a.roles?.[0]?.character)));

    resultados.appendChild(crearTitulo("Equipo de Producción", 40));
    d.crew.forEach(p => resultados.appendChild(renderPersona(p, p.jobs?.[0]?.job)));
}

async function obtenerTemporadas(id) {
    const d = await apiFetch(apiUrl(`/tv/${id}`));
    const total = d.number_of_seasons || 1;
    mensajes.textContent = "";

    const wrapper = document.createElement("div");
    wrapper.className = "episodios-wrapper";

    if (total === 1) {
        const badge = document.createElement("div");
        badge.className = "temporada-unica-badge";
        badge.style.gridColumn = "1 / -1";
        badge.innerHTML = `
            <span class="temporada-unica-icon">📺</span>
            <div class="temporada-unica-texto">
                <strong>Temporada única</strong>
                <span>Esta serie cuenta con una sola temporada</span>
            </div>`;
        resultados.appendChild(badge);
    } else {
        const sw = document.createElement("div");
        sw.className = "temporadas-selector-wrapper";
        sw.style.gridColumn = "1 / -1";
        sw.innerHTML = `<label class="temporadas-label" for="selTemp">Seleccionar temporada:</label>
            <select id="selTemp" class="temporadas-select">
                ${Array.from({ length: total }, (_, i) => `<option value="${i + 1}">Temporada ${i + 1}</option>`).join("")}
            </select>`;
        resultados.appendChild(sw);
        sw.querySelector("select").addEventListener("change", e => cargarEpisodios(id, +e.target.value, wrapper));
    }

    resultados.appendChild(wrapper);
    await cargarEpisodios(id, 1, wrapper);
}

async function cargarEpisodios(id, num, wrapper) {
    wrapper.innerHTML = "<p style='grid-column:1/-1;text-align:center;color:#64748b;padding:20px 0'>Cargando episodios...</p>";
    const d = await apiFetch(apiUrl(`/tv/${id}/season/${num}`));
    wrapper.innerHTML = "";

    if (!d.episodes?.length) {
        wrapper.innerHTML = "<p style='grid-column:1/-1;text-align:center;color:#64748b;padding:20px 0'>Sin episodios disponibles.</p>";
        return;
    }

    d.episodes.forEach(ep => {
        const rating = ep.vote_average
            ? `<span class="ep-rating">⭐ ${ep.vote_average.toFixed(1)}</span>`
            : `<span class="ep-rating ep-rating--na">Sin calificación</span>`;

        wrapper.appendChild(crearTarjeta("card--episodio", `
            ${imgOPlaceholder(ep.still_path, ep.name, "no-image", "🎬")}
            <div class="card-body">
                <div class="ep-header">
                    <span class="ep-num">Ep. ${ep.episode_number}</span>${rating}
                </div>
                <h3>${ep.name}</h3>
                <p>${ep.overview || "Sin descripción disponible."}</p>
            </div>`));
    });
}

async function obtenerVideos(id) {
    const d = await apiFetch(apiUrl(`/tv/${id}/videos`, ""));
    mensajes.textContent = "";

    d.results.filter(v => v.site === "YouTube").slice(0, 5).forEach(v => {
        const card = document.createElement("div");
        card.className = "card";
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube.com/embed/${v.key}`;
        iframe.width = "100%";
        iframe.height = "300";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        card.appendChild(iframe);
        resultados.appendChild(card);
    });
}

async function obtenerImagenes(id) {
    const d = await apiFetch(apiUrl(`/tv/${id}/images`, ""));
    mensajes.textContent = "";

    d.backdrops.slice(0, 10).forEach(img => {
        const el = document.createElement("img");
        el.src = IMAGE_URL + img.file_path;
        el.className = "grid-backdrop";
        resultados.appendChild(el);
    });
}

async function obtenerTraducciones(id) {
    const d = await apiFetch(apiUrl(`/tv/${id}/translations`));
    mensajes.textContent = "";
    resultados.classList.add("traducciones-grid");
    resultados.appendChild(crearTitulo("Traducciones disponibles"));

    const IDIOMAS = { en: "Inglés", fr: "Francés", de: "Alemán", pt: "Portugués" };
    const PERMITIDOS = ["en", "fr", "de", "pt"];

    (d.translations || [])
        .filter(t => t.data && (t.data.overview || t.data.name) && (
            (t.iso_639_1 === "es" && ["MX", "ES"].includes(t.iso_3166_1)) ||
            PERMITIDOS.includes(t.iso_639_1)
        ))
        .forEach(t => {
            const etiqueta =
                t.iso_639_1 === "es" ? `Español (${t.iso_3166_1 === "MX" ? "México" : "España"})` :
                    IDIOMAS[t.iso_639_1] || t.english_name;

            resultados.appendChild(crearTarjeta("", `
                <div class="card-body">
                    <h3>${etiqueta}</h3>
                    <p><strong>${t.data.name || t.data.title || "Sin título"}</strong></p>
                    <p>${t.data.overview || "Sin sinopsis en esta traducción."}</p>
                </div>`));
        });
}