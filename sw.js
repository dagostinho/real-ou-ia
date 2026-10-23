// Aumente a versão sempre que mudar qualquer arquivo do jogo (imagens, textos, código),
// para o iPad descartar o cache antigo e baixar tudo de novo.
const CACHE_VERSION = "v10";
const CACHE_NAME = `real-ou-ia-${CACHE_VERSION}`;

// define a lista QUESTIONS, usada para descobrir quais imagens guardar
importScripts("questions.js");

const IMAGE_FILES = QUESTIONS.flatMap((q) => (q.type === "pair" ? q.images : [q.image]));
const CORE_FILES = [
  "./",
  "index.html",
  "style.css",
  "game.js",
  "questions.js",
  "manifest.webmanifest",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // cache: "reload" ignora o cache HTTP e garante arquivos novos
      .then((cache) => cache.addAll([...CORE_FILES, ...IMAGE_FILES].map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Cache primeiro: o jogo abre na hora e funciona sem internet
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || fetch(event.request))
  );
});
