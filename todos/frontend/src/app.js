import { $appendTo, $el, $qs } from 'fxdom';
import Todo from './events/main.js';
import Login from './events/login.js';
import { go, html } from 'fxjs';
import Search from './templates/search.js';

Todo.delegate($qs('body'));
Login.delegate($qs('body'));

go(
    html` <link id="favicon" rel="shortcut icon" type="image/png" /> `,
    $el,
    (el) => ((el.href = 'http://192.168.0.7/static/favicon.png'), el),
    $appendTo($qs('head')),
);

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
