// ─── Service Worker — Consultor de Series ────────────────────────────────────

const VERSION = "v1";
const CACHE_STATIC = "static-" + VERSION;
const CACHE_DATA = "data-" + VERSION;

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const ID_SERIE = 751;

const SHELL = [
    "./index.html",
    "./styles/style.css",
    "./js/script.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

// ─── Instalación: cachear shell ───────────────────────────────────────────────
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then(cache => cache.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});

// ─── Activación: limpiar cachés viejas ───────────────────────────────────────
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(k => k !== CACHE_STATIC && k !== CACHE_DATA)
                    .map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// ─── Mensaje desde el JS principal: precachear datos con la API Key ───────────
self.addEventListener("message", async event => {
    if (event.data?.type !== "PRECACHE_API") return;

    const apiKey = event.data.apiKey;
    if (!apiKey) return;

    // Notificar al cliente que empezó el precacheo
    event.source?.postMessage({ type: "PRECACHE_START" });

    try {
        await precachearTodo(apiKey);
        event.source?.postMessage({ type: "PRECACHE_DONE" });
    } catch (e) {
        event.source?.postMessage({ type: "PRECACHE_ERROR", error: e.message });
    }
});

// ─── Precachear todos los endpoints de la serie ───────────────────────────────
async function precachearTodo(apiKey) {
    const cache = await caches.open(CACHE_DATA);

    // Todos los endpoints a pre-cachear
    const endpoints = [
        `${BASE_URL}/tv/${ID_SERIE}?api_key=${apiKey}&language=es-ES`,
        `${BASE_URL}/tv/${ID_SERIE}/aggregate_credits?api_key=${apiKey}&language=es-ES`,
        `${BASE_URL}/tv/${ID_SERIE}/season/1?api_key=${apiKey}&language=es-ES`,
        `${BASE_URL}/tv/${ID_SERIE}/videos?api_key=${apiKey}`,
        `${BASE_URL}/tv/${ID_SERIE}/images?api_key=${apiKey}`,
        `${BASE_URL}/tv/${ID_SERIE}/translations?api_key=${apiKey}&language=es-ES`,
    ];

    // Fetch paralelo de todos los endpoints
    await Promise.all(endpoints.map(async url => {
        try {
            const response = await fetch(url);
            if (response.ok) await cache.put(url, response);
        } catch {
            // Si falla uno no detiene los demás
        }
    }));

    // Pre-cachear imágenes del poster y backdrops
    await precachearImagenes(apiKey, cache);
}

async function precachearImagenes(apiKey, cache) {
    try {
        const url = `${BASE_URL}/tv/${ID_SERIE}?api_key=${apiKey}&language=es-ES`;
        const cached = await cache.match(url);
        if (!cached) return;

        const data = await cached.clone().json();

        const imagenes = [
            data.poster_path,
            data.backdrop_path,
        ].filter(Boolean).map(p => IMAGE_URL + p);

        await Promise.all(imagenes.map(async imgUrl => {
            try {
                const res = await fetch(imgUrl);
                if (res.ok) await cache.put(imgUrl, res);
            } catch { /* ignorar */ }
        }));
    } catch { /* ignorar */ }
}

// ─── Fetch: estrategia por origen ────────────────────────────────────────────
self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    if (url.hostname === "api.themoviedb.org") {
        event.respondWith(networkFirst(event.request, CACHE_DATA));
        return;
    }

    if (url.hostname === "image.tmdb.org") {
        event.respondWith(cacheFirst(event.request, CACHE_DATA));
        return;
    }

    event.respondWith(cacheFirst(event.request, CACHE_STATIC));
});

// ─── Network first ────────────────────────────────────────────────────────────
async function networkFirst(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(
            JSON.stringify({ offline: true, error: "Sin conexión" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
        );
    }
}

// ─── Cache first ──────────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return caches.match("./index.html");
    }
}