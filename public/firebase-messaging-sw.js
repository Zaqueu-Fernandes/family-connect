/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC6OnsbYZXkLJml9BAspouq_BuQcbZsYjk",
  authDomain: "whatszak.firebaseapp.com",
  projectId: "whatszak",
  storageBucket: "whatszak.firebasestorage.app",
  messagingSenderId: "518347482386",
  appId: "1:518347482386:web:570beff4e627cad9d03fcb",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (title) {
    self.registration.showNotification(title, {
      body: body || "",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: "whatzak-push",
      renotify: true,
    });
  }
});
