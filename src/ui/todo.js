import * as L from "fxjs/Lazy";
import {
  go,
  head,
  log,
  map,
  pipe,
  reject,
  strMap,
  tap,
  html,
  find,
  each,
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
  $prependTo,
  $qs,
  $remove,
  $replaceWith,
  $setAttr,
  $setText,
  $setVal,
  $toggleClass,
} from "fxdom";

import Todo_Data from "../data/todo";
import { check_box, check_box_full } from "./icons";
import { findAttrId, logFast } from "../basic_func";
import Alert from "./alert";
import Prompt from "./prompt";

const TodoUi = {};

TodoUi.defaultButtons = [
  {
    msg: "취소",
    class: "cancel",
  },
  {
    msg: "확인",
    class: "ok",
  },
];

TodoUi.mkConTmp = (todo) => html`
  <div class="content content_${todo.id}" id="${todo.id}">
    <button
      status="${todo.checked ? "done" : "empty"}"
      class="content__checkbox"
    >
      ${todo.checked
        ? check_box_full(["content__checkbox__done", "fa-xl"])
        : check_box(["content__checkbox__empty", "fa-xl"])}
    </button>
    <span class="content__title ${todo.checked ? "done_text" : ""}">
      ${todo.content}
    </span>
    <div>
      <button class="content__button__edit">수정</button>
      <button class="content__button__delete">삭제</button>
    </div>
  </div>
`;

TodoUi.initTmp = (_todos) => `
<div class="container">
    <header>
    
    </header>
    <section class="input">
        <div class="input__input_box">
            <input  class="input__input_box__todo_date" id="date"
                    placeholder="날짜 선택" type="text" onfocus="(this.type='date')" onblur="(this.type='text')">
            <input class="input__input_box__todo" type="text" id="content" todo="todo" required
                   minlength="1" placeholder="할 일 입력하기">
        </div>
        <button class="input__button__add">추가하기</button>
        <button class="input__button__delete_all">전부 삭제</button>
    </section>
    <section class="contents">
        ${strMap(TodoUi.mkConTmp, _todos)}
    </section>
</div>
`;

TodoUi.init = (todos) => {
  go(todos, TodoUi.initTmp, $el, $appendTo($qs("body")));
  $qs("#date").value = new Date().toDateInputValue();
  $qs("#date").min = new Date().toDateInputValue();
};

TodoUi.initPipe = () => go(Todo_Data.todos, TodoUi.init);

/*
 * $prependTo가 $qs를 미리 받고 함수를 리턴한 상황이기 때문에 초기에 init이 되지 않았으면 null이 반환되기 때문
 *  */
TodoUi.mkCon = pipe(TodoUi.mkConTmp, $el, (v) =>
  $prependTo($qs(".contents"))(v)
);

TodoUi.mkConAndSave = () =>
  go(
    $qs(".input__input_box"),
    $children,
    tap(Todo_Data.addTodo, TodoUi.mkCon),
    reject((el) => $attr("id", el) == "date"),
    map((el) => $setVal("")(el))
  ).catch((msg) => Alert.pop({ title: msg }));

TodoUi.rmAll = pipe($findAll("div.content"), map($remove));
TodoUi.rmOne = pipe($closest("div.content"), $remove);
TodoUi.rmAllAndDel = () =>
  go($qs(".contents"), TodoUi.rmAll, Todo_Data.removeAllTodoData);

TodoUi.conditionCheck = (el) => $attr("status", el) == "empty";

const doneText = (check) => (els) => $toggleClass("done_text", els[1]);

const replaceIcon = (check) => (els) =>
  check
    ? $replaceWith(
        go(check_box_full(["content__checkbox__done", "fa-xl"]), head, $el),
        head(els)
      )
    : $replaceWith(
        go(check_box(["content__checkbox__empty", "fa-xl"]), head, $el),
        head(els)
      );

TodoUi.check = ([el, check]) =>
  go(
    el,
    $setAttr({ status: check ? "done" : "empty" }),
    tap($closest("div.content"), $children, doneText(check)),
    $children,
    replaceIcon(check)
  );

TodoUi.update = (data) =>
  go($qs(`.content_${data.id} `), $children, ([icon, content, buttons]) =>
    $setText(data.content)(content)
  );

TodoUi.delegate = (container_el) =>
  go(
    container_el,
    $delegate("click", ".content__button__delete", ({ currentTarget }) =>
      go(
        currentTarget,
        $closest(".content"),
        tap(findAttrId, Todo_Data.removeTodoData),
        TodoUi.rmOne
      )
    ),
    $delegate("click", ".content__button__edit", async ({ currentTarget }) => {
      const todo = Todo_Data.get(
        $attr("id", $closest(".content")(currentTarget))
      );

      const data = await Prompt.pop({
        title: "수정하기",
        value: todo, // todo 형식의 데이터
        buttons: TodoUi.defaultButtons,
      });

      if (data.class == "ok") {
        go(data.value, tap(Todo_Data.editTodoData), TodoUi.update);
      }
    }),
    $delegate("click", ".content__checkbox", ({ target }) =>
      go(
        target,
        $closest("button.content__checkbox"),
        (el) => [el, TodoUi.conditionCheck(el)],
        tap(
          ([el, check]) => [$closest("div.content", el), check],
          ([el, check]) => ({ id: $attr("id", el), checked: check }),
          Todo_Data.editTodoData
        ),
        TodoUi.check
      )
    ),
    $delegate("click", ".input__button__add", TodoUi.mkConAndSave),
    $delegate("click", ".input__button__delete_all", async (_) => {
      const button = await Alert.pop({
        title: "전부 삭제하시겠습니까?",
        buttons: TodoUi.defaultButtons,
      });

      button.class == "ok" && TodoUi.rmAllAndDel();
    }),
    $delegate("keypress", ".input__input_box__todo", (e) => {
      if (e.key == "Enter") {
        e.currentTarget.blur();
        TodoUi.mkConAndSave();
      }
    })
  );

export default TodoUi;
