const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldScript = `<script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js').then(reg => console.log('SW registered!', reg)).catch(err => console.log('SW registration failed', err));
        });
      }
    </script>`;

const newScript = `<script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
          // Force clear cache and unregister if ?refresh= is present
          if (window.location.search.includes('refresh=')) {
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (const reg of registrations) {
                await reg.unregister();
              }
              const keys = await caches.keys();
              for (const key of keys) {
                await caches.delete(key);
              }
              console.log('SW & Caches cleared by refresh parameter');
            } catch (e) {
              console.error('Error clearing SW/Caches:', e);
            }
          }
          
          navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registered!', reg))
            .catch(err => console.log('SW registration failed', err));
        });
      }
    </script>`;

if (html.includes(oldScript)) {
  html = html.replace(oldScript, newScript);
  fs.writeFileSync('index.html', html);
  console.log("sw.js refresh logic added!");
} else {
  console.log("Could not find the script tag in index.html");
}
