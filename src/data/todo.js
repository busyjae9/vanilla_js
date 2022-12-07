import {
  append,
  go,
  isEmpty,
  log,
  pipe,
  sortBy,
  sortByDesc,
  filter,
  take,
  reduce,
  map,
  head,
  curry,
  tap,
  reject,
  find,
  insert,
  prepend,
  each,
} from "fxjs";
import * as L from "fxjs/Lazy";
import { editOne, findId, getLastId, makeEmptyList } from "../basic_func";
import { $attr } from "fxdom";
import Alert from "../ui/alert";

const Todo_Data = {
  todos: [],
};

Todo_Data.reload = function () {
  try {
    Todo_Data.todos = JSON.parse(localStorage.getItem("todos"));
  } catch (e) {
    log(e);
  }
  log(Todo_Data.todos);
};

Todo_Data.reload();

Todo_Data.emptyCheck = (els) =>
  go(
    els,
    map(
      (el) =>
        new Promise((resolve, reject) =>
          !el.value || isEmpty(el.value) ? reject("비어있습니다!") : resolve(el)
        )
    )
  );

Todo_Data.getLastId = () => getLastId(Todo_Data.todos);

Todo_Data.extendData = (data, els) =>
  go(
    els,
    each((el) => {
      data[$attr("id", el)] = el.value;
    }),
    (_) => data
  );

Todo_Data.makeTodoData = (els) =>
  Todo_Data.extendData(
    {
      id: Todo_Data.getLastId() || 0,
      checked: false,
      regDate: new Date().toDateInputValue(),
    },
    els
  );

Todo_Data.updateData = tap((_todos = []) => {
  localStorage.setItem("todos", JSON.stringify(_todos));
  Todo_Data.todos = _todos;

  log(_todos);
});

Todo_Data.get = function (id) {
  return go(
    this.todos,
    find((todo) => Number(todo.id) == Number(id))
  );
};

Todo_Data.addTodoData = tap((todo) =>
  go(Todo_Data.todos, prepend(todo), Todo_Data.updateData)
);

// 아이템을 생성 시 확인 후 경고 문구 활성화
Todo_Data.addTodo = (els) => {
  return go(
    els,
    Todo_Data.emptyCheck,
    Todo_Data.makeTodoData,
    Todo_Data.addTodoData
  );
};

// 아이템 삭제
Todo_Data.removeTodoData = (f) =>
  go(Todo_Data.todos, reject(f), Todo_Data.updateData);

// it needs to change map to update
Todo_Data.editTodoData = (data) =>
  go(Todo_Data.todos, map(editOne(data)), Todo_Data.updateData);

// 모든 아이템 삭제
Todo_Data.removeAllTodoData = () =>
  go(Todo_Data.todos, makeEmptyList, Todo_Data.updateData);

export default Todo_Data;
