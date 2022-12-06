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
} from "fxjs";
import * as L from "fxjs/Lazy";
import { emptyCheck, getLastId, makeEmptyList } from "./basic_func";

export let todos = [];

function reload() {
  try {
    todos = JSON.parse(localStorage.getItem("todos"));
  } catch (e) {
    log(e);
  }

  log(todos);
}

reload();

// 텍스트를 받아서 아이템을 객체로 생성
export const makeTodoData = ({ value }) => ({
  content: value,
  regDate: new Date(),
  checked: false,
  id: getLastId(todos) || 0,
});

export const updateData = tap((_todos = []) => {
  localStorage.setItem("todos", JSON.stringify(_todos));
  todos = _todos;
});

export const addTodoData = tap((todo) => go(todos, append(todo), updateData));

// 아이템을 생성 시 확인 후 경고 문구 활성화
export const addTodo = pipe(emptyCheck, makeTodoData, addTodoData);

// 아이템 삭제
export const removeTodo = (f) => go(todos, filter(f), updateData);

// 모든 아이템 삭제
export const removeAllTodoData = () => go(todos, makeEmptyList, updateData);
