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
  $append,
  $appendTo,
  $attr,
  $children,
  $closest,
  $delegate,
  $el,
  $find,
  $findAll,
  $next,
  $prepend,
  $prependTo,
  $prev,
  $qs,
  $remove,
  $replaceWith,
  $setAttr,
  $setText,
  $setVal,
  $toggleClass,
} from "fxdom";

import Todo_Data from "../data/todo";
import { check_box, check_box_full, left, right } from "./icons";
import { findAttrId, getNextDay, getPrevDay, logFast } from "../basic_func";
import Alert from "./alert";
import Prompt from "./prompt";

const MainUI = {};

MainUI.defaultButtons = [
  {
    msg: "취소",
    class: "cancel",
  },
  {
    msg: "확인",
    class: "ok",
  },
];

MainUI.mkConTmp = (todo) => html`
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
      <button class="content__button__archive">보관</button>
    </div>
  </div>
`;

MainUI.mkArchiveConTmp = (todo) => html`
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
      <button class="content__button__return">복구</button>
      <button class="content__button__delete">삭제</button>
    </div>
  </div>
`;

MainUI.mkConAllTmp = (todos) => html`
  <section class="contents">${strMap(MainUI.mkConTmp, todos)}</section>
`;

MainUI.initTmp = (_todos) => html`
  <div class="container">
    <header class="header">
      <button class="header__button__left">
        ${left(["header__button__left__icon", "fa-xl"])}
      </button>
      <input
        class="header__today"
        id="today"
        placeholder="날짜 선택"
        type="text"
        onfocus="(this.type='date')"
        onblur="(this.type='text')"
      />
      <button class="header__button__right">
        ${right(["header__button__right__icon", "fa-xl"])}
      </button>
      <!--  아카이브를 켜는 버튼, 날짜 넘기는 버튼 + 날짜 지정 공간  -->
    </header>
    <section class="input">
      <div class="input__input_box">
        <input
          class="input__input_box__todo_date"
          id="date"
          placeholder="날짜 선택"
          type="text"
          onfocus="(this.type='date')"
          onblur="(this.type='text')"
        />
        <input
          class="input__input_box__todo"
          type="text"
          id="content"
          todo="todo"
          required
          minlength="1"
          placeholder="할 일 입력하기"
        />
      </div>
      <button class="input__button__add">추가하기</button>
      <button class="input__button__archive">보관함</button>
    </section>
    <section class="contents">${strMap(MainUI.mkConTmp, _todos)}</section>
  </div>
`;

MainUI.archiveTmp = (_todos) => html`
  <div class="container">
    <section class="input">
      <button class="input__button__back">돌아가기</button>
      <button class="input__button__delete_all">전부 삭제</button>
    </section>
    <section class="contents">
      ${strMap(MainUI.mkArchiveConTmp, _todos)}
    </section>
  </div>
`;

MainUI.initDate = () => {
  $qs("#date").value = Todo_Data.date;
  $qs("#today").value = Todo_Data.date;
  $qs("#date").min = Todo_Data.date;
};

MainUI.init = (todos) => {
  go(todos, MainUI.initTmp, $el, $appendTo($qs("body")));
  MainUI.initDate();
};

MainUI.initPipe = () => go(Todo_Data.todayTodo, MainUI.init);

/*
 * $prependTo가 $qs를 미리 받고 함수를 리턴한 상황이기 때문에 초기에 init이 되지 않았으면 null이 반환되기 때문
 *  */
MainUI.mkCon = (todoData) =>
  go(todoData, MainUI.mkConTmp, $el, (v) => $prependTo($qs(".contents"))(v));

MainUI.mkConAndSave = () =>
  go(
    $qs(".input__input_box"),
    $children,
    tap(Todo_Data.addTodo, (todoData) =>
      todoData.date == Todo_Data.date ? MainUI.mkCon(todoData) : null
    ),
    reject((el) => $attr("id", el) == "date"),
    map((el) => $setVal("")(el))
  ).catch((msg) => Alert.pop({ title: msg }));

MainUI.rmAll = pipe($findAll("div.content"), map($remove));
MainUI.rmOne = pipe($closest("div.content"), $remove);
MainUI.rmAllAndDel = () =>
  go($qs(".contents"), MainUI.rmAll, Todo_Data.removeAllTodoData);

MainUI.conditionCheck = (el) => $attr("status", el) == "empty";

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

MainUI.check = ([el, check]) =>
  go(
    el,
    $setAttr({ status: check ? "done" : "empty" }),
    tap($closest("div.content"), $children, doneText(check)),
    $children,
    replaceIcon(check)
  );

MainUI.update = (data) =>
  data.date == Todo_Data.date
    ? go($qs(`.content_${data.id} `), $children, ([icon, content, buttons]) =>
        $setText(data.content)(content)
      )
    : go($qs(`.content_${data.id} `), $remove);

MainUI.setPrevDate = (el) =>
  go(el, (el) => ((el.value = getPrevDay(el.value).toDateInputValue()), el));

MainUI.setNextDate = (el) =>
  go(el, (el) => ((el.value = getNextDay(el.value).toDateInputValue()), el));

MainUI.updateElValue = (f) => (el) => f(el.value);

MainUI.contentViewUpdate = () => {
  go($qs(".contents"), $remove);
  go(
    Todo_Data.todayTodo,
    MainUI.mkConAllTmp,
    $el,
    $appendTo($qs(".container"))
  );
};

MainUI.delegate = (container_el) =>
  go(
    container_el,
    $delegate("click", ".header__button__left", ({ currentTarget }) =>
      go(
        currentTarget,
        $next,
        MainUI.setPrevDate,
        MainUI.updateElValue(Todo_Data.updateDay),
        () => MainUI.contentViewUpdate()
      )
    ),
    $delegate("click", ".header__button__right", ({ currentTarget }) =>
      go(
        currentTarget,
        $prev,
        MainUI.setNextDate,
        MainUI.updateElValue(Todo_Data.updateDay),
        () => MainUI.contentViewUpdate()
      )
    ),
    $delegate("change", ".header__today", ({ currentTarget }) =>
      go(currentTarget, MainUI.updateElValue(Todo_Data.updateDay), () =>
        MainUI.contentViewUpdate()
      )
    ),

    $delegate("click", ".content__button__archive", ({ currentTarget }) =>
      go(
        currentTarget,
        $closest(".content"),
        tap(findAttrId, Todo_Data.moveToArchive),
        MainUI.rmOne
      )
    ),
    $delegate("click", ".content__button__delete", ({ currentTarget }) =>
      go(
        currentTarget,
        $closest(".content"),
        tap(findAttrId, Todo_Data.removeTodoData),
        MainUI.rmOne
      )
    ),
    $delegate("click", ".content__button__edit", async ({ currentTarget }) => {
      const todo = Todo_Data.get(
        $attr("id", $closest(".content")(currentTarget))
      );

      currentTarget.blur();

      const data = await Prompt.pop({
        title: "수정하기",
        value: todo, // todo 형식의 데이터
        buttons: MainUI.defaultButtons,
      });

      if (data.class == "ok") {
        go(data.value, tap(Todo_Data.editTodoData), MainUI.update);
      }
    }),
    $delegate("click", ".content__button__return", ({ currentTarget }) =>
      go(
        currentTarget,
        $closest(".content"),
        tap(findAttrId, Todo_Data.returnToTodos),
        MainUI.rmOne
      )
    ),
    $delegate("click", ".content__checkbox", ({ currentTarget }) =>
      go(
        currentTarget,
        (el) => [el, MainUI.conditionCheck(el)],
        tap(
          ([el, check]) => [$closest("div.content", el), check],
          ([el, check]) => ({ id: $attr("id", el), checked: check }),
          Todo_Data.editTodoData
        ),
        MainUI.check
      )
    ),
    $delegate("click", ".input__button__add", MainUI.mkConAndSave),
    $delegate("click", ".input__button__delete_all", async (_) => {
      const button = await Alert.pop({
        title: "전부 삭제하시겠습니까?",
        buttons: MainUI.defaultButtons,
      });

      button.class == "ok" && MainUI.rmAllAndDel();
    }),
    $delegate("keypress", ".input__input_box__todo", (e) => {
      if (e.key == "Enter") {
        MainUI.mkConAndSave();
      }
    }),
    $delegate("click", ".input__button__archive", (_) =>
      go(
        $qs("body"),
        tap($children, ([_, container]) => $remove(container)),
        $append(go(Todo_Data.archives, MainUI.archiveTmp, $el))
      )
    ),
    $delegate("click", ".input__button__back", (_) =>
      go(
        $qs("body"),
        tap($children, ([_, container]) => $remove(container)),
        $append(go(Todo_Data.todayTodo, MainUI.initTmp, $el)),
        (el) => MainUI.initDate()
      )
    )
  );

export default MainUI;
