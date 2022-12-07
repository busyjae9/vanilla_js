import * as L from "fxjs/Lazy";
import {
  each,
  entries,
  extend,
  find,
  go,
  head,
  isEmpty,
  log,
  map,
  pipe,
  strMap,
  tap,
} from "fxjs";
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
  $qsa,
  $remove,
  $replaceWith,
  $setAttr,
  $setVal,
  $toggleClass,
} from "fxdom";

import Todo from "../data/todo";
import { check_box, check_box_full } from "./icons";
import { findAttrId, logFast } from "../basic_func";

const Prompt = {};

Prompt.mkButtonTmp = (button) =>
  `<button type="button" class="${button.class}">${button.msg}</button>`;

Prompt.mkPromptTmp = (data) => `
<div class="prompt">
    <div class="body">
        <div class="title">${data.title}</div>
        ${data?.msg ? `<div class="msg">${data.msg}</div>` : ""}
        ${
          data?.value
            ? `
            <div class="values">
                <div class="row_key_value">
                    <span class="key">Until: </span>
                    <input class="content" id="date"
                        placeholder="날짜 선택" type="text" onfocus="(this.type='date')" onblur="(this.type='text')">
                </div>
                <div class="row_key_value">
                    <span class="key">Todo: </span>
                    <textarea class="content" id="content">${data.value.content}</textarea>
                </div>
            </div>
            `
            : ""
        }
        <div class="buttons">${strMap(Prompt.mkButtonTmp, data.buttons)}</div>
    </div>
</div>
`;

Prompt.asyncPop = (data) =>
  new Promise((resolve) => {
    data = data?.buttons
      ? data
      : { ...data, buttons: [{ msg: "확인", class: "ok" }] };

    const el = go(data, Prompt.mkPromptTmp, $el, $appendTo($qs("body")));

    go(
      data.buttons,
      map((v) => go(el, $find(`.${v.class}`))),
      map(
        $on("click", (e) =>
          go(e.currentTarget, tap($closest(".prompt"), $remove), (target) => {
            let new_data = data.value;

            go(
              el,
              $find(".values"),
              $children,
              map(pipe($children, ([k, v]) => [$attr("id", v), v.value])),
              each(([k, v]) => (new_data[k] = v))
            );

            resolve({
              class: $attr("class", target),
              value: new_data,
            });
          })
        )
      )
    );

    $qs(".prompt #date").value = new Date(data.value.date).toDateInputValue();
  });

Prompt.pop = async (data) => await Prompt.asyncPop(data);

export default Prompt;
