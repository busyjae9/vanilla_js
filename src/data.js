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
import { editOne, findId, getLastId, makeEmptyList } from "./basic_func";

const Data = {
  todos: [],
};

Data.reload = function () {
  try {
    Data.todos = JSON.parse(localStorage.getItem("todos"));
  } catch (e) {
    log(e);
  }
  log(Data.todos);
};

Data.reload();

Data.emptyCheck = (el) =>
  new Promise((resolve, reject) =>
    !el.value || isEmpty(el.value) ? reject("비어있습니다!") : resolve(el)
  );
Data.getLastId = () => getLastId(Data.todos);
Data.makeTodoData = ({ value }) => ({
  id: Data.getLastId() || 0,
  checked: false,
  content: value,
  regDate: new Date(),
});

Data.updateData = tap((_todos = []) => {
  localStorage.setItem("todos", JSON.stringify(_todos));
  Data.todos = _todos;

  log(_todos);
});

Data.addTodoData = tap((todo) => go(Data.todos, append(todo), Data.updateData));

// 아이템을 생성 시 확인 후 경고 문구 활성화
Data.addTodo = pipe(Data.emptyCheck, Data.makeTodoData, Data.addTodoData);

// 아이템 삭제
Data.removeTodo = (f) => go(Data.todos, reject(f), Data.updateData);

Data.editTodo = (data) => go(Data.todos, map(editOne(data)), Data.updateData);

// 모든 아이템 삭제
Data.removeAllTodoData = () => go(Data.todos, makeEmptyList, Data.updateData);

export default Data;
