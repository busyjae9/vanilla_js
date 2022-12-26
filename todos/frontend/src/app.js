import { $qs } from 'fxdom';
import Todo from './events/main.js';
import Login from './events/login.js';
import Search from './templates/search.js';

Todo.delegate($qs('body'));
Login.delegate($qs('body'));

function getNotificationPermission() {
    // 브라우저 지원 여부 체크
    if (!('Notification' in window)) return;
    Notification.requestPermission().then((result) =>
        console.log('Notification Permission: ', result),
    );
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
