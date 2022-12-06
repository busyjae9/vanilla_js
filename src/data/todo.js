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

const Todo = {
  todos: [],
};

Todo.reload = function () {
  try {
    Todo.todos = JSON.parse(localStorage.getItem("todos"));
  } catch (e) {
    log(e);
  }
  log(Todo.todos);
};

Todo.reload();

Todo.emptyCheck = (el) =>
  new Promise((resolve, reject) =>
    !el.value || isEmpty(el.value) ? reject("비어있습니다!") : resolve(el)
  );
Todo.getLastId = () => getLastId(Todo.todos);
Todo.makeTodoData = ({ value }) => ({
  id: Todo.getLastId() || 0,
  checked: false,
  content: value,
  regDate: new Date(),
});

Todo.updateData = tap((_todos = []) => {
  localStorage.setItem("todos", JSON.stringify(_todos));
  Todo.todos = _todos;

  log(_todos);
});

Todo.addTodoData = tap((todo) => go(Todo.todos, append(todo), Todo.updateData));

// 아이템을 생성 시 확인 후 경고 문구 활성화
Todo.addTodo = pipe(Todo.emptyCheck, Todo.makeTodoData, Todo.addTodoData);

// 아이템 삭제
Todo.removeTodo = (f) => go(Todo.todos, reject(f), Todo.updateData);

Todo.editTodo = (data) => go(Todo.todos, map(editOne(data)), Todo.updateData);

// 모든 아이템 삭제
Todo.removeAllTodoData = () => go(Todo.todos, makeEmptyList, Todo.updateData);

export default Todo;
