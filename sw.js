self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Memproses pesan notifikasi
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { title, body, delay } = event.data;

        if (delay <= 0) {
            // Langsung tampilkan notifikasi
            self.registration.showNotification(title, {
                body: body,
                icon: 'https://cdn-icons-png.flaticon.com/512/2953/2953361.png',
                vibrate: [200, 100, 200]
            });
        } else {
            // Untuk pengetesan lokal
            setTimeout(() => {
                self.registration.showNotification(title, {
                    body: body,
                    icon: 'https://cdn-icons-png.flaticon.com/512/2953/2953361.png',
                    vibrate: [200, 100, 200]
                });
            }, delay);
        }
    }
});
