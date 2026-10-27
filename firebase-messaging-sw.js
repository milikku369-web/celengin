importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDVFoMedduyW951hA1a9FOpt4whm0NIFI",
    authDomain: "tabungin-app-74a2f.firebaseapp.com",
    projectId: "tabungin-app-74a2f",
    storageBucket: "tabungin-app-74a2f.firebasestorage.app",
    messagingSenderId: "291986020648",
    appId: "1:291986020648:web:3f74bb239afc7e3872181d"
});

const messaging = firebase.messaging();

// Menangani notifikasi push saat halaman/browser sedang ditutup
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || 'Waktunya Menabung! 🐷';
    const notificationOptions = {
        body: payload.notification?.body || 'Yuk sisihkan uang untuk target impianmu hari ini!',
        icon: 'https://cdn-icons-png.flaticon.com/512/2953/2953361.png',
        vibrate: [200, 100, 200]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
