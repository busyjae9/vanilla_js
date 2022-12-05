import * as L from "fxjs/Lazy";
import { go, map, pipe, tap } from "fxjs";
import * as C from "fxjs/Concurrency";
import {
  $addClass,
  $append,
  $appendTo,
  $attr,
  $children,
  $closest,
  $delegate,
  $el,
  $els,
  $findAll,
  $on,
  $prepend,
  $prependTo,
  $qs,
  $remove,
  $removeClass,
} from "fxdom";

// 사전에 정의된 아이콘들
import { check_box, check_box_full } from "./icons";
// 데이터 및 기능 정의
import {
  addTodo,
  makeTodoData,
  removeAllTodoData,
  removeTodo,
  todos,
} from "./data";
import {
  applyToEl,
  applyToTarget,
  applyToElOnlyEnter,
  findNotId,
  makeEmpty,
} from "./basic_func";

/*
 * 기본 생성 tags
 * top_bar : 탑바
 * $children(top_bar) : input_box - [input], 추가 버튼, 삭제 버튼
 * contents : todos가 들어갈 자리
 * */
const top_bar = $qs(".top");
const [input_box, button_add, button_delete] = $children(top_bar);
const input = $children(input_box)[0];
const contents = $qs(".contents");

// todo를 받아서 하나의 template string 만들
const mkCon = (todo) => `<div class="content" id="${todo.id}">
    <button class="button check">
        ${
          todo.checked
            ? check_box_full(["button", "check"])
            : check_box(["button", "check"])
        }
    </button>
    <span class="title">${todo.content}</span>
    <button class="button delete">삭제</button>
</div>`;

// 하나의 컴포넌트를 만들기
const mkConOne = pipe(mkCon, $el, $prependTo(contents));

// 모든 element tag 삭제
const rmAll = pipe($findAll("div"), map($remove));
// 선택한 element tag 삭제
const rmOne = pipe($closest("div"), $remove);

// 선택한 content 태그 및 데이터 삭제
const rmAllCnt = () => go(contents, rmAll, removeAllTodoData);
// 모든 content 태그 및 데이터 삭제
const rmOneCnt = pipe(rmOne, findNotId, removeTodo);

// content 만들기 및 저장
const mkCntOne = pipe(tap(addTodo, mkConOne), makeEmpty);

// 기존 데이터 토대로 컴포넌트 활성화
go(todos, L.map(mkCon), L.map($el), map($prependTo(contents)));

// 이벤트 위임 - 삭제
go(contents, $delegate("click", ".delete", applyToTarget(rmOneCnt)));

// 이벤트 위임 - 추가, 전부 삭제
go(
  top_bar,
  $delegate("click", ".add", applyToEl(input, mkCntOne)),
  $delegate("keypress", ".todo", applyToElOnlyEnter(input, mkCntOne)),
  $delegate("click", ".delete_all", applyToEl(button_delete, rmAllCnt))
);
