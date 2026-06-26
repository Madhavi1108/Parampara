if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[ServiceWorker] Registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.log('[ServiceWorker] Registration failed: ', err);
      });
  });
}
