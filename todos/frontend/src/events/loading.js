import { delay, go, html, object, tap } from 'fxjs';
import { $appendTo, $closest, $delegate, $el, $find, $qs, $remove } from 'fxdom';
import LoadingUi from '../templates/loading.js';

const Loading = {};

Loading.init = () => go(LoadingUi.makeTmp(), $el, $appendTo($qs('body')));

Loading.remove = () => go($qs('.loader'), $remove);

Loading.load = (sec) => go(Loading.init(), delay(sec * 1000), $remove);

export default Loading;
