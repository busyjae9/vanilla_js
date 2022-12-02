import {
  add,
  delay,
  go,
  reduce,
  rangeL,
  map,
  isEmpty,
  log,
  append,
  deepFlat,
  take,
  curry,
} from "fxjs";
import * as L from "fxjs/Lazy";
import * as C from "fxjs/Concurrency";
import * as $ from "fxdom";

let todos = JSON.parse(localStorage.getItem("todos"));

const updateData = () => {
  localStorage.setItem("todos", JSON.stringify(todos));
  log(todos);
};

const makeTodoData = (text) => ({
  content: text,
  regDate: new Date(),
  checked: false,
});

const addTodo = (el) => {
  if (isEmpty(el.value)) {
    // 경고 문고 알람창 만들기
    log("비어있습니다!");
    return;
  }
  todos = go(todos, append(makeTodoData(el.value)));
  el.value = "";
  updateData();
};

const removeTodo = (value) => {
  todos = go(
    todos,
    filter((a) => a.content != value)
  );
  updateData();
};

const removeAllTodo = () => {
  todos = [];
  updateData();
};

const addInputEvent = (f) => $.$on("input", f);
const addOnClickEvent = (f) => $.$on("click", f);

const toggleGhost = (value, el) => {
  if (isEmpty(value)) {
    $.$removeClass("ghost", el);
    $.$addClass("active", el);
    return;
  }
  $.$addClass("ghost", el);
  $.$removeClass("active", el);
};

const inputEvent = (el) => (e) => toggleGhost(e.target.value, el);

const todo_input = $.$qsa(".input_box");

go(
  todo_input,
  map($.$children),
  map(([label, input]) => addInputEvent(inputEvent(label))(input))
);

const add_button = $.$qsa(".top");

const saveEvent = (el, f) => (e) => f(el);

go(
  add_button,
  map($.$children),
  map(([input_box, button_add, button_delete]) => {
    const [_, input] = $.$children(input_box);
    addOnClickEvent(saveEvent(input, addTodo))(button_add);
    addOnClickEvent(saveEvent(button_delete, removeAllTodo))(button_delete);
  })
);

go();
