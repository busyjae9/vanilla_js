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
import MainUI from "./main";

const Alert = {};

Alert.mkButtonTmp = (button) =>
  `<button type="button" value="${button.class}" class="alert__body__buttons__button__${button.class}">${button.msg}</button>`;

Alert.mkAlertTmp = (data) => `
<div class="alert">
    <div class="alert__body">
        <div class="alert__body__title">${data.title}</div>
        ${data?.msg ? `<div class="alert__body__msg">${data.msg}</div>` : ""}
        <div class="alert__body__buttons">${strMap(
          Alert.mkButtonTmp,
          data.buttons
        )}</div>
    </div>
    <input type="submit" class="ghost enter"></input>
</div>
`;

Alert.asyncPop = (data) =>
  new Promise((resolve) => {
    data = data?.buttons
      ? data
      : { ...data, buttons: [{ msg: "확인", class: "ok" }] };

    const el = go(data, Alert.mkAlertTmp, $el, $appendTo($qs("body")));

    go(
      data.buttons,
      map((v) => go(el, $find(`.alert__body__buttons__button__${v.class}`))),
      map(
        $on("click", (e) =>
          go(e.currentTarget, tap($closest(".alert"), $remove), (el) =>
            resolve($attr("value", el))
          )
        )
      ),
      head,
      (el) => el.focus()
    );
  });

Alert.pop = async (data) => {
  const class_name = await Alert.asyncPop(data);
  return go(
    class_name,
    (class_name) => (a) => a.class == class_name,
    (f) => go(data.buttons, find(f))
  );
};

export default Alert;
