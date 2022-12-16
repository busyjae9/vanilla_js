import {delay, isEmpty, log} from "fxjs";

import LoadingUi from "./loading.js";

const Gate = {}

Gate.init = () => {
    LoadingUi.init()
    delay(1000)().then(() => {
        LoadingUi.remove()
    })
}

export default Gate