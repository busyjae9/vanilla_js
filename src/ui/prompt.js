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
  `<button type="button" class="prompt__body__buttons__button__${button.class}" id="${button.class}">${button.msg}</button>`;

Prompt.mkPromptTmp = (data) => `
<div class="prompt">
    <div class="prompt__body">
        <div class="prompt__body__title">${data.title}</div>
        ${data?.msg ? `<div class="prompt__body__msg">${data.msg}</div>` : ""}
        ${
          data?.value
            ? `
            <div class="prompt__body__values">
                <div class="prompt__body__values__row">
                    <span class="prompt__body__values__row__key">Until: </span>
                    <input class="prompt__body__values__row__content" id="date"
                        placeholder="날짜 선택" type="text" onfocus="(this.type='date')" onblur="(this.type='text')">
                </div>
                <div class="prompt__body__values__row">
                    <span class="prompt__body__values__row__key">Todo: </span>
                    <textarea class="prompt__body__values__row__content" id="content">${data.value.content}</textarea>
                </div>
            </div>
            `
            : ""
        }
        <div class="prompt__body__buttons">${strMap(
          Prompt.mkButtonTmp,
          data.buttons
        )}</div>
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
      map((v) => go(el, $find(`.prompt__body__buttons__button__${v.class}`))),
      map(
        $on("click", (e) =>
          go(
            e.currentTarget,
            tap($closest(".prompt"), $remove),
            (currentTarget) => {
              let new_data = data.value;

              go(
                el,
                $find(".prompt__body__values"),
                $children,
                map(pipe($children, ([k, v]) => [$attr("id", v), v.value])),
                each(([k, v]) => (new_data[k] = v))
              );

              resolve({
                class: $attr("id", currentTarget),
                value: new_data,
              });
            }
          )
        )
      )
    );

    $qs(".prompt #date").value = new Date(data.value.date).toDateInputValue();
  });

Prompt.pop = async (data) => await Prompt.asyncPop(data);

export default Prompt;
