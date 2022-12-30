import { $el, $qs, $replaceWith, $trigger } from 'fxdom';
import Todo from './events/main.js';
import Login from './events/login.js';
import Search from './templates/search.js';
import Home from './events/home.js';
import { each, go, hi, log } from 'fxjs';
import axios from './data/axios.js';

Todo.delegate($qs('body'));
Login.delegate($qs('body'));
Home.delegate($qs('body'));

function getNotificationPermission() {
    // 브라우저 지원 여부 체크
    if (!('Notification' in window)) return;
    Notification.requestPermission().then((result) => {
        console.log('Notification Permission: ', result);

        if (result === 'granted') {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker
                        .register('/dist/serviceWorker.js')
                        .then(async (registration) => {
                            await registration.update();

                            const subscribeOptions = {
                                userVisibleOnly: true,
                                applicationServerKey:
                                    'BHcqKRANGFHOnDVoIswavyyzvWO06LQQOB5KWqXByuDE34TFq7Uo5VTydeRpP-VIiSysts6QNB3NzBQXi4M-mio', // 발급받은 vapid public key
                            };

                            return registration.pushManager.subscribe(subscribeOptions);
                        })
                        .then(function (pushSubscription) {
                            axios.post('/push/register', pushSubscription.toJSON());
                        })
                        .catch((e) => {
                            console.log('SW registration failed: ', e);
                        });
                });
            } // load 가 끝나면 워커를 등록해줌.
        }
    });
}

// https만 됨...
getNotificationPermission();

let isCmd, isShift, isDot;

document.onkeydown = (e) => {
    if (e.key === 'Meta') isCmd = true;
    if (e.key === 'Shift') isShift = true;
    if (e.key === '.') isDot = true;

    const search = $qs('.search');

    if (isDot && isCmd && isShift && !search) return Search.pop();
};

document.onkeyup = (e) => {
    if (e.key === 'Meta') isCmd = false;
    if (e.key === 'Shift') isShift = false;
    if (e.key === '.') isDot = false;
};

const PushHandler = {};

PushHandler.move = ({ url }) =>
    new Promise((resolve) => {
        // axios.get(url).then((res) => {
        //     go($qs('html'), $replaceWith(go(res.data, $el)));
        //     history.replaceState({}, 'TODO', url);
        //     resolve(true);
        // });
        if (window.location.pathname + window.location.search === url) return resolve(true);
        else {
            window.location.replace(url);
            return resolve(true);
        }
    });

PushHandler.scroll = ({ scroll_id }) =>
    new Promise((resolve) => {
        $qs(scroll_id).scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest',
        });
        resolve(true);
    });

PushHandler.click = ({ click }) =>
    new Promise((resolve) => {
        $trigger('click', $qs(click));
        resolve(true);
    });

navigator.serviceWorker.addEventListener('message', (event) => {
    typeof event.data.type == 'string'
        ? PushHandler[event.data.type](event.data)
        : go(
              event.data.type,
              each((type) => PushHandler[type](event.data)),
          );
});
