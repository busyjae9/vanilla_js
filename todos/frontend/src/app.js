import { $closest, $find, $qs, $trigger } from 'fxdom';
import Todo from './events/main.js';
import Login from './events/login.js';
import Search from './templates/search.js';
import Home from './events/home.js';
import { delay, go, tap } from 'fxjs';
import axios from './data/axios.js';
import { format } from 'date-fns';
import Reply from './templates/reply.js';
import MyPage from './events/mypage.js';

const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey:
        'BHcqKRANGFHOnDVoIswavyyzvWO06LQQOB5KWqXByuDE34TFq7Uo5VTydeRpP-VIiSysts6QNB3NzBQXi4M-mio',
    // 발급받은 vapid public key
};

const body = $qs('body');

Todo.delegate(body);
Login.delegate(body);
Home.delegate(body);
MyPage.delegate(body);

function getNotificationPermission() {
    // 브라우저 지원 여부 체크
    if (!('Notification' in window)) return;
    Notification.requestPermission().then((result) => {
        console.log('Notification Permission: ', result);

        if (result === 'granted') {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    go(
                        navigator.serviceWorker.register('/dist/serviceWorker.js'),
                        async (registration) => {
                            await registration.update();
                            return registration.pushManager.subscribe(subscribeOptions);
                        },
                        (pushSubscription) =>
                            axios.post('/push/register', pushSubscription.toJSON()),
                    ).catch((e) => {
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

PushHandler.checkAction = () => {
    const data = JSON.parse(sessionStorage.getItem('pushAction'));
    sessionStorage.removeItem('pushAction');
    if (data?.action) PushHandler[data.action](data.payload);
};

PushHandler.linkAndAction = (data) => {
    sessionStorage.setItem('pushAction', JSON.stringify(data));
    window.location.replace(data.link);
};

PushHandler.toTodo = ({ user_id, date }) =>
    window.location.replace(`/todo?id=${user_id}&date=${format(new Date(date), 'yyyy-MM-dd')}`);

PushHandler.toComment = ({ todo_id, id }) =>
    go(
        $qs(`#todo_${todo_id}`),
        tap((todo) =>
            todo.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest',
            }),
        ),
        $find('.content__info__comment'),
        tap((el) => $trigger('click', el)),
        $closest('.content'),
        delay(1000),
        $find(`.comment_${id}`),
        tap((comment) =>
            comment.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest',
            }),
        ),
    );

PushHandler.toReply = ({ todo_id, id }) => {
    go(
        $qs(`#todo_${todo_id}`),
        tap((todo) =>
            todo.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest',
            }),
        ),
        $find('.content__info__comment'),
        tap((el) => $trigger('click', el)),
        $closest('.content'),
    );

    go(axios.get(`/todo/api/todo/comment/${id}`), ({ data }) => Reply.pop(data.result));
};

PushHandler.checkAction();

navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.link) PushHandler.linkAndAction(event.data);
    else PushHandler[event.data.action](event.data.payload);
});
