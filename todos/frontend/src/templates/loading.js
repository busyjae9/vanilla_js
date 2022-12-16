import {go, html} from "fxjs";

const LoadingUi = {}

LoadingUi.makeTmp = (a) => html`
    <div class="loader">
        <div class="inner one"></div>
        <div class="inner two"></div>
        <div class="inner three"></div>
    </div>
`

export default LoadingUi