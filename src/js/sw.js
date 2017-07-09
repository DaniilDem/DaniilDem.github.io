/**
 * Created by Daniil on 09.07.2017.
 */
// sw.js
this.addEventListener('install', e => {
    e.waitUntil(
        // after the service worker is installed,
        // open a new cache
        caches.open('my-pwa-cache').then(cache => {
            // add all URLs of resources we want to cache
            return cache.addAll([
                '/index.html',
                '/dist/js/build.min.js',
                '/dist/css/common.css',
                '/apple-icon-precomposed.png',
            ]);
        })
    );
});