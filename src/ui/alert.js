import * as L from "fxjs/Lazy";
import { go, head, isEmpty, log, map, pipe, strMap, tap } from "fxjs";
import * as C from "fxjs/Concurrency";
import {
  $appendTo,
  $attr,
  $children,
  $closest,
  $delegate,
  $el,
  $findAll,
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
  `<button type="button" class="${button.classes}">${button.msg}</button>`;

Alert.mkAlertTmp = (data) => `
<div class="alert">
    <div class="body">
        <div class="title">${data.title}</div>
        ${
          data?.msg || !isEmpty(data.msg)
            ? `<div class="msg">${data.msg}</div>`
            : ""
        }
        <div class="buttons">
            ${strMap(Alert.mkButtonTmp, data.buttons)}
        <div>
    </div>
</div>
`;

Alert.pop = (data) =>
  go(data, Alert.mkAlertTmp, logFast, $el, $appendTo($qs("body")));

export default Alert;
