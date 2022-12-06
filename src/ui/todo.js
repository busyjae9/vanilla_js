import * as L from "fxjs/Lazy";
import { go, head, log, map, pipe, strMap, tap } from "fxjs";
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

import Todo_Data from "../data/todo";
import { check_box, check_box_full } from "./icons";
import { findAttrId } from "../basic_func";
import Alert from "./alert";

const TodoUi = {};

TodoUi.mkConTmp = (todo) => `
<div class="content" id="${todo.id}">
    <button status="${todo.checked ? "done" : "empty"}" class="empty checkbox">
        ${
          todo.checked
            ? check_box_full(["button", "done", "fa-xl"])
            : check_box(["button", "empty", "fa-xl"])
        }
    </button>
    <span class="title ${todo.checked ? "done_text" : ""}" >
        ${todo.content}
    </span>
    <div>
        <button class="button edit">수정</button>
        <button class="button delete">삭제</button>
    </div>
</div>
`;

TodoUi.initTmp = (_todos) => `
<div class="container">
    <header class="top_bar">
        <div class="input_box">
            <input class="todo" type="text" id="todo" todo="todo" required
                   minlength="1" placeholder="할 일 입력하기">
        </div>
        <button class="add button">추가하기</button>
        <button class="delete_all button">전부 삭제</button>
    </header>
    <section class="contents">
        ${strMap(TodoUi.mkConTmp, _todos)}
    </section>
</div>
`;

TodoUi.init = pipe(TodoUi.initTmp, $el, $appendTo($qs("body")));
/*
 * $prependTo가 $qs를 미리 받고 함수를 리턴한 상황이기 때문에 초기에 init이 되지 않았으면 null이 반환되기 때문
 *  */
TodoUi.mkCon = pipe(TodoUi.mkConTmp, $el, (v) =>
  $prependTo($qs(".contents"))(v)
);
TodoUi.mkConAndSave = () =>
  go($qs(".todo"), tap(Todo_Data.addTodo, TodoUi.mkCon), $setVal(""));
TodoUi.rmAll = pipe($findAll("div.content"), map($remove));
TodoUi.rmOne = pipe($closest("div.content"), $remove);

TodoUi.conditionCheck = (el) => $attr("status", el) == "empty";

const doneText = (check) => (els) => $toggleClass("done_text", els[1]);

const replaceIcon = (check) => (els) =>
  check
    ? $replaceWith(
        go(check_box_full(["button", "done", "fa-xl"]), head, $el),
        head(els)
      )
    : $replaceWith(
        go(check_box(["button", "empty", "fa-xl"]), head, $el),
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

TodoUi.initPipe = () => go(Todo_Data.todos, TodoUi.init);

TodoUi.delegate = (container_el) =>
  go(
    container_el,
    $delegate(
      "click",
      ".contents .delete",
      async ({ target }) =>
        await Alert.pop({
          title: "삭제하시겠습니까?",
          buttons: [
            {
              msg: "취소",
              class: "cancel",
            },
            {
              msg: "확인",
              class: "ok",
              func: () =>
                go(target, TodoUi.rmOne, findAttrId, Todo_Data.removeTodoData),
            },
          ],
        })
    ),
    $delegate("click", ".contents .checkbox", ({ target }) =>
      go(
        target,
        $closest("button.checkbox"),
        (el) => [el, TodoUi.conditionCheck(el)],
        tap(
          ([el, check]) => [$closest("div.content", el), check],
          ([el, check]) => ({ id: $attr("id", el), checked: check }),
          Todo_Data.editTodoData
        ),
        TodoUi.check
      )
    ),
    $delegate("click", ".top_bar .add", TodoUi.mkConAndSave),
    $delegate(
      "keypress",
      ".top_bar .todo",
      (e) => e.key == "Enter" && TodoUi.mkConAndSave()
    ),
    $delegate(
      "click",
      ".top_bar .delete_all",
      async (_) =>
        await Alert.pop({
          title: "전부 삭제하시겠습니까?",
          buttons: [
            {
              msg: "취소",
              class: "cancel",
            },
            {
              msg: "확인",
              class: "ok",
              func: () =>
                go($qs(".contents"), TodoUi.rmAll, Todo_Data.removeAllTodoData),
            },
          ],
        })
    )
  );

export default TodoUi;
