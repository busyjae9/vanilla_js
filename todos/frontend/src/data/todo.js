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
    hi,
} from "fxjs";
import * as L from "fxjs/Lazy";
import {
    editOne,
    getLastId,
    makeEmptyList,
} from "../basic_func.js";
import {$attr} from "fxdom";


const Data = {
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


Data.reload = function () {
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

    Data.log();
};

Data.emptyCheck = (els) =>
    go(
        els,
        map(
            (el) =>
                new Promise((resolve, reject) =>
                    !el.value || isEmpty(el.value) ? reject("비어있습니다!") : resolve(el)
                )
        )
    );

Data.getLastId = () => getLastId(Data.todos);

Data.extendData = (data, els) =>
    go(
        els,
        each((el) => {
            data[$attr("key", el)] = el.value;
        }),
        (_) => data
    );

Data.makeTodoData = (els) =>
    Data.extendData(
        {
            id: Number(Data.getLastId()) || 0,
            checked: false,
            regDate: new Date().toDateInputValue(),
        },
        els
    );

Data.updateTodosData = tap((_todos = []) => {
    localStorage.setItem("todos", JSON.stringify(_todos));
    Data.todos = _todos;

    Data.log();
});

Data.updateArchivesData = tap((_archives = []) => {
    localStorage.setItem("archives", JSON.stringify(_archives));
    Data.archives = _archives;

    Data.log();
});

Data.updateTodayTodo = () => {
    Data.todayTodo = go(
        Data.todos,
        filter((todo) => todo.date == Data.date)
    );
};

Data.updateDay = (date = new Date().toDateInputValue()) => {
    Data.date = date;
    Data.updateTodayTodo();
    Data.log();
};

Data.get = (id) => {
    return {
        ...go(
            Data.todos,
            find((todo) => Number(todo.id) == Number(id))
        ),
    };
};

Data.addTodoData = tap((todo) => {
    if (todo.date == Data.date) {
        Data.todayTodo = go(Data.todayTodo, prepend(todo));
    }
    go(Data.todos, prepend(todo), Data.updateTodosData);
});

Data.addTodo = (els) => {
    return go(els, Data.emptyCheck, Data.makeTodoData, Data.addTodoData);
};

Data.removeTodoData = (f) => {
    go(Data.archives, reject(f), Data.updateArchivesData);
};

// it needs to change map to update
Data.editTodoData = (data) => {
    Data.todayTodo = go(Data.todayTodo, map(editOne(data)));
    go(Data.todos, map(editOne(data)), Data.updateTodosData);
};

Data.removeAllTodoData = () =>
    go(Data.archives, makeEmptyList, Data.updateArchivesData);

Data.moveToArchive = (f) => {
    const archive = go(Data.todos, find(f), (todo) =>
        prepend(todo, Data.archives)
    );
    Data.updateArchivesData(archive);
    go(Data.todos, reject(f), Data.updateTodosData);
    Data.todayTodo = go(Data.todayTodo, reject(f));
};

Data.returnToTodos = (f) => {
    const todos = go(Data.archives, find(f), (todo) => prepend(todo, Data.todos));

    Data.updateTodosData(todos);

    Data.todayTodo = go(
        todos,
        filter((todo) => todo.date == Data.date)
    );

    go(Data.archives, reject(f), Data.updateArchivesData);
};

/*
 * todo: 완료 시 데이터 순서를 변경하는 로직
 *       checked를 기준으로 2개의 배열로 만들고
 *       변경되기 전 값 배열에서 데이터를 지우고
 *       변경된 값 배열 추가 - false는 맨 앞, true는 맨 뒤
 * */

export default Data;
