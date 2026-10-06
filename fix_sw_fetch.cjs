const fs = require('fs');
let sw = fs.readFileSync('public/sw.js', 'utf8');

// Change CACHE_NAME to force an update
sw = sw.replace(/const CACHE_NAME = 'webbarcode-v[0-9]+';/, "const CACHE_NAME = 'webbarcode-v3';");

// Make Network First ignore browser cache for navigation requests
const oldFetch = `event.respondWith(
    fetch(event.request).then(response => {`;

const newFetch = `event.respondWith(
    fetch(event.request, { cache: event.request.mode === 'navigate' ? 'no-cache' : undefined }).then(response => {`;

if (sw.includes(oldFetch)) {
  sw = sw.replace(oldFetch, newFetch);
  fs.writeFileSync('public/sw.js', sw);
  console.log("sw.js fetch updated!");
} else {
  console.log("sw.js old fetch not found!");
}
