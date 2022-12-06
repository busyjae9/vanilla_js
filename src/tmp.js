import * as L from "fxjs/Lazy";
import { go, log, map, pipe, strMap, tap } from "fxjs";
import * as C from "fxjs/Concurrency";
import {
  $appendTo,
  $closest,
  $delegate,
  $el,
  $findAll,
  $prependTo,
  $qs,
  $remove,
  $setVal,
} from "fxdom";

import Data from "./data";
import { check_box, check_box_full } from "./icons";
import { applyToElOnlyEnter, findNotId } from "./basic_func";

const Todo = {};

Todo.mkConTmp = (todo) => `
<div class="content" id="${todo.id}">
    <button class="button empty">
        ${
          todo.checked
            ? check_box_full(["button", "check"])
            : check_box(["button", "check"])
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
  go($qs(".todo"), tap(Data.addTodo, Todo.mkCon), $setVal(""));
Todo.rmAll = pipe($findAll("div.content"), map($remove));
Todo.rmOne = pipe($closest("div.content"), $remove);

Todo.initPipe = () => go(Data.todos, Todo.init);

Todo.delegate = (container_el) =>
  go(
    container_el,
    $delegate("click", ".contents .delete", ({ target }) =>
      go(target, Todo.rmOne, findNotId, Data.removeTodo)
    ),
    $delegate("click", ".top_bar .add", Todo.mkConAndSave),
    $delegate(
      "keypress",
      ".top_bar .todo",
      (e) => e.key == "Enter" && Todo.mkConAndSave()
    ),
    $delegate("click", ".top_bar .delete_all", (_) =>
      go($qs(".contents"), Todo.rmAll, Data.removeAllTodoData)
    )
  );

export default Todo;
