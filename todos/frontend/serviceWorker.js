import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { delay, each, find, go, log, map } from 'fxjs';
import * as L from 'fxjs/Lazy';

clientsClaim();

self.addEventListener('install', function (event) {
    console.log('인스톨 되었다~');
}); // install 이 끝나면 인스톨되었다고 출력.

self.addEventListener('push', (event) => {
    const { title, body, badge, tag, icon, data } = JSON.parse(event.data && event.data.text());
    event.waitUntil(
        self.registration.showNotification(title || '', {
            body,
            tag,
            badge,
            icon,
            data,
        }),
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(
        (async () => {
            const allClients = await self.clients.matchAll({
                includeUncontrolled: true,
            });

            log(event.notification);

            const target_url = new URL(self.location.origin + (event.notification.data?.url || ''));

            const todo_client = go(
                allClients,
                find((client) => {
                    const url = new URL(client.url);
                    if (url.pathname === target_url.pathname) {
                        client.focus();
                        return client;
                    }
                }),
            );

            if (!todo_client) {
                return self.clients.openWindow(event.notification.data?.url);
            }

            todo_client.postMessage(event.notification.data);
        })(),
    );
});

precacheAndRoute(self.__WB_MANIFEST);
