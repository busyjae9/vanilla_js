import {$appendTo, $el, $qs} from "fxdom";
import Todo from "./events/main.js";
import Login from "./events/login.js";
import {go, html} from "fxjs";

import favicon from "./favicon.png";

Todo.delegate($qs("body"));
Login.delegate($qs("body"));

go(
    html`
        <link id="favicon" rel="shortcut icon" type="image/png">
    `,
    $el,
    (el) => (el.href = favicon, el),
    $appendTo($qs("head")),
);


// express에서 만들어둔 레이아웃을 가지고 템플릿을 만들어 body에 넣으면서 ssr을 지원
// client에서 필요한 이벤트나 템플릿 업데이트 혹은 각종 js가 필요한 부분은 번들링을 통해 mini 파일을 불러옴으로써 csr 달성
