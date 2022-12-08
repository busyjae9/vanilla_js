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
import {
  editOne,
  findId,
  getLastId,
  logFast,
  makeEmptyList,
} from "../basic_func";
import { $attr } from "fxdom";
import Alert from "../ui/alert";

const Todo_Data = {
  date: new Date().toDateInputValue(),
  todos: [],
  todayTodo: [],
  archives: [],
  log() {
    log({
      date: this.date,
      todos: this.todos,
      todayTodo: this.todayTodo,
      archives: this.archives,
    });
  },
};

Todo_Data.reload = function () {
  try {
    this.todos = JSON.parse(localStorage.getItem("todos")) || [];
    this.archives = JSON.parse(localStorage.getItem("archives")) || [];

    this.todayTodo = go(
      this.todos,
      filter((todo) => todo.date == this.date)
    );
  } catch (e) {
    log(e);
  }

  Todo_Data.log();
};

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
      id: Number(Todo_Data.getLastId()) || 0,
      checked: false,
      regDate: new Date().toDateInputValue(),
    },
    els
  );

Todo_Data.updateTodosData = tap((_todos = []) => {
  localStorage.setItem("todos", JSON.stringify(_todos));
  Todo_Data.todos = _todos;

  log(_todos);
});

Todo_Data.updateArchivesData = tap((_archives = []) => {
  localStorage.setItem("archives", JSON.stringify(_archives));
  Todo_Data.archives = _archives;

  log(_archives);
});

Todo_Data.updateTodayTodo = () => {
  Todo_Data.todayTodo = go(
    Todo_Data.todos,
    filter((todo) => todo.date == Todo_Data.date)
  );
};

Todo_Data.updateDay = (date = new Date().toDateInputValue()) => {
  Todo_Data.date = date;
  Todo_Data.updateTodayTodo();
  Todo_Data.log();
};

Todo_Data.get = function (id) {
  return {
    ...go(
      this.todos,
      find((todo) => Number(todo.id) == Number(id))
    ),
  };
};

Todo_Data.addTodoData = tap((todo) => {
  go(Todo_Data.todos, prepend(todo), Todo_Data.updateTodosData);
  todo.date == Todo_Data.date && go(Todo_Data.todayTodo, prepend(todo));
});

// 아이템을 생성 시 확인 후 경고 문구 활성화
Todo_Data.addTodo = (els) => {
  return go(
    els,
    Todo_Data.emptyCheck,
    Todo_Data.makeTodoData,
    Todo_Data.addTodoData
  );
};

// todo: 보관함에서 삭제
Todo_Data.removeTodoData = (f) => {
  go(Todo_Data.archives, reject(f), Todo_Data.updateArchivesData);
};

// it needs to change map to update
Todo_Data.editTodoData = (data) => {
  go(Todo_Data.todos, map(editOne(data)), Todo_Data.updateTodosData);
  Todo_Data.todayTodo = go(Todo_Data.todayTodo, map(editOne(data)));
};

Todo_Data.removeAllTodoData = () =>
  go(Todo_Data.archives, makeEmptyList, Todo_Data.updateArchivesData);

Todo_Data.moveToArchive = (f) => {
  const archive = go(Todo_Data.todos, find(f), (todo) =>
    prepend(todo, Todo_Data.archives)
  );
  Todo_Data.updateArchivesData(archive);
  go(Todo_Data.todos, reject(f), Todo_Data.updateTodosData);
  go(Todo_Data.todayTodo, reject(f));
};

Todo_Data.returnToTodos = (f) => {
  const todos = go(Todo_Data.archives, find(f), (todo) =>
    prepend(todo, Todo_Data.todos)
  );

  Todo_Data.updateTodosData(todos);

  Todo_Data.todayTodo = go(
    todos,
    filter((todo) => todo.date == Todo_Data.date)
  );

  go(Todo_Data.archives, reject(f), Todo_Data.updateArchivesData);
};

/*
 * todo: 완료 시 데이터 순서를 변경하는 로직
 *       checked를 기준으로 2개의 배열로 만들고
 *       변경되기 전 값 배열에서 데이터를 지우고
 *       변경된 값 배열 추가 - false는 맨 앞, true는 맨 뒤
 * */

export default Todo_Data;
