// ─── Service Worker — Consultor de Series

const CACHE_STATIC = "static-v1";
const CACHE_DATA = "data-v1";

// Archivos del shell de la app (se cachean al instalar)
const SHELL = [
    "/index.html",
    "/styles/style.css",
    "/js/script.js",
    "/manifest.json"
];

// ─── Instalación: cachear shell
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then(cache => cache.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});

// ─── Activación: limpiar cachés viejas
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => k !== CACHE_STATIC && k !== CACHE_DATA)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// ─── Fetch: estrategia por tipo de solicitud
self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    // 1. Solicitudes a la API de TMDB → Network first, caché como respaldo
    if (url.hostname === "api.themoviedb.org") {
        event.respondWith(networkFirstData(event.request));
        return;
    }

    // 2. Imágenes de TMDB → Cache first (evita recargar imágenes)
    if (url.hostname === "image.tmdb.org") {
        event.respondWith(cacheFirstImages(event.request));
        return;
    }

    // 3. Archivos propios (shell) → Cache first, network como respaldo
    event.respondWith(cacheFirstShell(event.request));
});

// ─── Estrategia: Network first (datos de API)
// Intenta red; si falla, devuelve lo cacheado
async function networkFirstData(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_DATA);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached || new Response(
            JSON.stringify({ error: "Sin conexión y sin datos en caché" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
        );
    }
}

// ─── Estrategia: Cache first (imágenes)
// Si está en caché la devuelve; si no, la descarga y la guarda
async function cacheFirstImages(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_DATA);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        // Devolver respuesta vacía si no hay imagen ni red
        return new Response("", { status: 408 });
    }
}

// ─── Estrategia: Cache first (shell)
// Sirve desde caché; si no existe, va a red
async function cacheFirstShell(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_STATIC);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        // Si falla todo, devolver el index.html cacheado (SPA fallback)
        return caches.match("./index.html");
    }
}