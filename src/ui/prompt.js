import * as L from "fxjs/Lazy";
import { find, go, head, isEmpty, log, map, pipe, strMap, tap } from "fxjs";
import * as C from "fxjs/Concurrency";
import {
  $appendTo,
  $attr,
  $children,
  $closest,
  $delegate,
  $el,
  $find,
  $findAll,
  $on,
  $prependTo,
  $qs,
  $remove,
  $replaceWith,
  $setAttr,
  $setVal,
  $toggleClass,
} from "fxdom";

import Todo from "../data/todo";
import { check_box, check_box_full } from "./icons";
import { findAttrId, logFast } from "../basic_func";

const Alert = {};

Alert.mkButtonTmp = (button) =>
  `<button type="button" class="${button.class}">${button.msg}</button>`;

Alert.mkAlertTmp = (data) => `
<div class="alert">
    <div class="body">
        <div class="title">${data.title}</div>
        ${data?.msg ? `<div class="msg">${data.msg}</div>` : ""}
        <div class="buttons">${strMap(Alert.mkButtonTmp, data.buttons)}</div>
    </div>
</div>
`;

Alert.asyncPop = (data) =>
  new Promise((resolve) => {
    const el = go(data, Alert.mkAlertTmp, $el, $appendTo($qs("body")));
    go(
      data.buttons,
      map((v) => go(el, $find(`.${v.class}`))),
      map(
        $on("click", (e) =>
          go(e.currentTarget, tap($closest(".alert"), $remove), (el) =>
            resolve($attr("class", el))
          )
        )
      )
    );
  });

Alert.pop = async (data) => {
  const class_name = await Alert.asyncPop(data);
  go(
    class_name,
    (class_name) => (a) => a.class == class_name,
    (f) => go(data.buttons, find(f), (v) => v?.func && v?.func())
  );
};

export default Alert;
