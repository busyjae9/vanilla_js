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

import Data from "../data/todo";
import { check_box, check_box_full, left, right } from "./icons";
import {
  findAttrId,
  getCurrentTarget,
  getNextDay,
  getPrevDay,
  logFast,
} from "../basic_func";
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
    <div class="content__buttons">
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
    <span class="content__archive__title ${todo.checked ? "done_text" : ""}">
      ${todo.content}
    </span>
    <span class="content__archive__date ${todo.checked ? "done_text" : ""}">
      ${todo.date}
    </span>
    <div class="content__buttons">
      <button class="content__button__return">복구</button>
      <button class="content__button__delete">삭제</button>
    </div>
  </div>
`;

MainUI.mkConAllTmp = (todos) => html`
  <section class="contents">${strMap(MainUI.mkConTmp, todos)}</section>
`;

MainUI.initTmp = (todos) => html`
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
          key="date"
          placeholder="날짜 선택"
          type="text"
          onfocus="(this.type='date')"
          onblur="(this.type='text')"
        />
        <input
          class="input__input_box__todo"
          type="text"
          key="content"
          todo="todo"
          required
          minlength="1"
          placeholder="할 일 입력하기"
        />
      </div>
      <button class="input__button__add">추가하기</button>
      <button class="input__button__archive">보관함</button>
    </section>
    <section class="contents">${strMap(MainUI.mkConTmp, todos)}</section>
  </div>
`;

MainUI.archiveTmp = (todos) => html`
  <div class="container">
    <section class="input">
      <button class="input__button__back">돌아가기</button>
      <button class="input__button__delete_all">전부 삭제</button>
    </section>
    <section class="contents">${strMap(MainUI.mkArchiveConTmp, todos)}</section>
  </div>
`;

MainUI.initDate = () => {
  $qs("input[key=date]").value = Data.date;
  $qs("input[key=date]").min = Data.date;
  $qs("#today").value = Data.date;
};

MainUI.init = (todos) =>
  go(todos, MainUI.initTmp, $el, $appendTo($qs("body")), MainUI.initDate);

/*
 * $prependTo가 $qs를 미리 받고 함수를 리턴한 상황이기 때문에 초기에 init이 되지 않았으면 null이 반환되기 때문
 *  */
MainUI.mkCon = (todoData) =>
  go(todoData, MainUI.mkConTmp, $el, (v) => $prependTo($qs(".contents"))(v));

MainUI.mkConAndSave = () =>
  go(
    $qs(".input__input_box"),
    $children,
    tap(
      Data.addTodo,
      (todoData) => todoData.date == Data.date && MainUI.mkCon(todoData)
    ),
    find((el) => $attr("key", el) == "content"),
    $setVal("")
  ).catch((msg) => Alert.pop({ title: msg }));

MainUI.rmAll = pipe($findAll("div.content"), each($remove));
MainUI.rmOne = pipe($closest("div.content"), $remove);
MainUI.rmAllAndDel = () =>
  go($qs(".contents"), tap(Data.removeAllTodoData), MainUI.rmAll);

MainUI.conditionCheck = (el) => $attr("status", el) == "empty";

const doneText =
  () =>
  ([icon, title, ..._]) =>
    $toggleClass("done_text", title);

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
  data.date == Data.date
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
  go(Data.todayTodo, MainUI.mkConAllTmp, $el, $appendTo($qs(".container")));
};

MainUI.delegate = (container_el) =>
  go(
    container_el,
    $delegate(
      "click",
      ".header__button__left",
      pipe(
        getCurrentTarget,
        $next,
        MainUI.setPrevDate,
        MainUI.updateElValue(Data.updateDay),
        (_) => MainUI.contentViewUpdate()
      )
    ),
    $delegate(
      "click",
      ".header__button__right",
      pipe(
        getCurrentTarget,
        $prev,
        MainUI.setNextDate,
        MainUI.updateElValue(Data.updateDay),
        (_) => MainUI.contentViewUpdate()
      )
    ),
    $delegate(
      "change",
      ".header__today",
      pipe(getCurrentTarget, MainUI.updateElValue(Data.updateDay), (_) =>
        MainUI.contentViewUpdate()
      )
    ),

    $delegate(
      "click",
      ".content__button__archive",
      pipe(
        getCurrentTarget,
        $closest(".content"),
        tap(findAttrId, Data.moveToArchive),
        MainUI.rmOne
      )
    ),
    $delegate(
      "click",
      ".content__button__delete",
      pipe(
        getCurrentTarget,
        $closest(".content"),
        tap(findAttrId, Data.removeTodoData),
        MainUI.rmOne
      )
    ),
    $delegate("click", ".content__button__edit", async ({ currentTarget }) => {
      const todo = go(
        currentTarget,
        tap((ct) => (ct.blur(), ct)),
        $closest(".content"),
        $attr("id"),
        logFast,
        Data.get
      );

      const data = await Prompt.pop({
        title: "수정하기",
        value: todo,
        buttons: MainUI.defaultButtons,
      });

      if (data.class == "ok") {
        go(data.value, tap(Data.editTodoData), MainUI.update);
      }
    }),
    $delegate(
      "click",
      ".content__button__return",
      pipe(
        getCurrentTarget,
        $closest(".content"),
        tap(findAttrId, Data.returnToTodos),
        MainUI.rmOne
      )
    ),
    $delegate(
      "click",
      ".content__checkbox",
      pipe(
        getCurrentTarget,
        (el) => [el, MainUI.conditionCheck(el)],
        tap(
          ([el, check]) => [$closest("div.content", el), check],
          ([el, check]) => ({ id: $attr("id", el), checked: check }),
          Data.editTodoData
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
        $append(go(Data.archives, MainUI.archiveTmp, $el))
      )
    ),
    $delegate("click", ".input__button__back", (_) =>
      go(
        $qs("body"),
        tap($children, ([_, container]) => $remove(container)),
        $append(go(Data.todayTodo, MainUI.initTmp, $el)),
        (_) => MainUI.initDate()
      )
    )
  );

export default MainUI;
