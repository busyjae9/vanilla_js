import {delay, go, html, object, tap} from "fxjs";
import {$appendTo, $closest, $delegate, $el, $find, $qs, $remove} from "fxdom";

const LoadingUi = {}

LoadingUi.makeTmp = () => html`
    <div class="loader">
        <div class="inner one"></div>
        <div class="inner two"></div>
        <div class="inner three"></div>
    </div>
`

LoadingUi.init = () =>
    go(LoadingUi.makeTmp(), $el, $appendTo($qs("body")));

LoadingUi.remove = () =>
    go($qs(".loader"), $remove);

LoadingUi.load = (sec) => go(
    LoadingUi.init(),
    delay(sec * 1000),
    $remove)

export default LoadingUi