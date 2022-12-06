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

import Todo from "../data/todo";
import { check_box, check_box_full } from "./icons";
import { findAttrId } from "../basic_func";

const Todo = {};

Todo.mkConTmp = (todo) => `
<div class="content" id="${todo.id}">
    <button status="${todo.checked ? "done" : "empty"}" class="empty checkbox">
        ${
          todo.checked
            ? check_box_full(["button", "done", "fa-xl"])
            : check_box(["button", "empty", "fa-xl"])
        }
    </button>
    <span class="title">${todo.content}</span>
    <button class="button delete">삭제</button>
</div>
`;

Todo.initTmp = (_todos) => `
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
        ${strMap(Todo.mkConTmp, _todos)}
    </section>
</div>
`;

Todo.init = pipe(Todo.initTmp, $el, $appendTo($qs("body")));
/*
 * $prependTo가 $qs를 미리 받고 함수를 리턴한 상황이기 때문에 초기에 init이 되지 않았으면 null이 반환되기 때문
 *  */
Todo.mkCon = pipe(Todo.mkConTmp, $el, (v) => $prependTo($qs(".contents"))(v));
Todo.mkConAndSave = () =>
  go($qs(".todo"), tap(Todo.addTodo, Todo.mkCon), $setVal(""));
Todo.rmAll = pipe($findAll("div.content"), map($remove));
Todo.rmOne = pipe($closest("div.content"), $remove);

Todo.conditionCheck = (el) => $attr("status", el) == "empty";

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

Todo.check = ([el, check]) =>
  go(
    el,
    $setAttr({ status: check ? "done" : "empty" }),
    tap($closest("div.content"), $children, doneText(check)),
    $children,
    replaceIcon(check)
  );

Todo.initPipe = () => go(Todo.todos, Todo.init);

Todo.delegate = (container_el) =>
  go(
    container_el,
    $delegate("click", ".contents .delete", ({ target }) =>
      go(target, Todo.rmOne, findAttrId, Todo.removeTodo)
    ),
    $delegate("click", ".contents .checkbox", ({ target }) =>
      go(
        target,
        $closest("button.checkbox"),
        (el) => [el, Todo.conditionCheck(el)],
        tap(
          ([el, check]) => [$closest("div.content", el), check],
          ([el, check]) => ({ id: $attr("id", el), checked: check }),
          Todo.editTodo
        ),
        Todo.check
      )
    ),
    $delegate("click", ".top_bar .add", Todo.mkConAndSave),
    $delegate(
      "keypress",
      ".top_bar .todo",
      (e) => e.key == "Enter" && Todo.mkConAndSave()
    ),
    $delegate("click", ".top_bar .delete_all", (_) =>
      go($qs(".contents"), Todo.rmAll, Todo.removeAllTodoData)
    )
  );

export default Todo;
