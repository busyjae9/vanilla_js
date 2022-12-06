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
} from "fxjs";
import * as L from "fxjs/Lazy";
import { editOne, findId, getLastId, makeEmptyList } from "../basic_func";

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

Todo_Data.emptyCheck = (el) =>
  new Promise((resolve, reject) =>
    !el.value || isEmpty(el.value) ? reject("비어있습니다!") : resolve(el)
  );
Todo_Data.getLastId = () => getLastId(Todo_Data.todos);
Todo_Data.makeTodoData = ({ value }) => ({
  id: Todo_Data.getLastId() || 0,
  checked: false,
  content: value,
  regDate: new Date(),
});

Todo_Data.updateData = tap((_todos = []) => {
  localStorage.setItem("todos", JSON.stringify(_todos));
  Todo_Data.todos = _todos;

  log(_todos);
});

Todo_Data.addTodoData = tap((todo) =>
  go(Todo_Data.todos, append(todo), Todo_Data.updateData)
);

// 아이템을 생성 시 확인 후 경고 문구 활성화
Todo_Data.addTodo = pipe(
  Todo_Data.emptyCheck,
  Todo_Data.makeTodoData,
  Todo_Data.addTodoData
);

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
