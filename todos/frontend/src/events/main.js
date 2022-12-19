import {
    go,
    pipe,
    tap,
    each,
    object, log, curry
} from "fxjs";
import {
    $appendTo,
    $attr,
    $children,
    $closest,
    $delegate,
    $el, $find,
    $findAll,
    $prependTo,
    $qs,
    $remove,
    $replaceWith,
    $setAttr,
    $setText,
    $setVal,
    $toggleClass,
} from "fxdom";

import {
    getNextDay,
    getPrevDay,
} from "../basic_func.js";
import Alert from "./alert.js";
import Prompt from "./prompt.js";
import MainUI from "../templates/main.js";
import axios from "../data/axios.js";
import LoginUI from "../templates/login.js";
import {format} from "date-fns";

const Main = {};

Main.defaultButtons = [
    {
        msg: "취소",
        class: "cancel",
    },
    {
        msg: "확인",
        class: "ok",
    },
];

Main.error = (err) => err
    ? err?.response
        ? Alert.pop({title: err.response.data.message})
        : Alert.pop({title: "일시 오류가 발생했습니다."}).then(() => log(err))
    : log("취소");

/*
 * $prependTo가 $qs를 미리 받고 함수를 리턴한 상황이기 때문에 초기에 init이 되지 않았으면 null이 반환되기 때문
 *  */
Main.mkCon = (todoData) =>
    go(todoData, Main.mkConTmp, $el, (v) => $prependTo($qs(".contents"))(v));


Main.rmAll = pipe($findAll("div.content"), each($remove));
Main.rmOne = pipe($closest("div.content"), $remove);
Main.rmAllAndDel = () =>
    go($qs(".contents"), Main.rmAll);

Main.check = curry((check, el) =>
    go(
        el,
        $setAttr({status: check ? "done" : "empty"}),
        $closest("div.content"),
        $children,
        ([icon, title, ..._]) => (
            go(icon, $children, ([iconEl, ..._]) =>
                check
                    ? $replaceWith(go(MainUI.checkFullTmp(), $el), iconEl)
                    : $replaceWith(go(MainUI.checkTmp(), $el), iconEl)
            ),
                $toggleClass("done_text", title)
        )
    ));

Main.update = (data) =>
    go($qs(`.content_${data.id} `), (content) =>
        $qs(".header__today").value === format(new Date(data.date), "yyyy-MM-dd")
            ? go(content, $children, ([icon, content, buttons]) =>
                $setText(data.content)(content)
            )
            : $remove(content)
    );

Main.setPrevDate = (el) =>
    go(el, (el) => ((el.value = getPrevDay(el.value).toDateInputValue()), el));

Main.setNextDate = (el) =>
    go(el, (el) => ((el.value = getNextDay(el.value).toDateInputValue()), el));

Main.updateElValue = (f) => (el) => f(el.value);

Main.contentViewUpdate = (todos) => {
    go($qs(".contents"), $remove);

    go(todos, MainUI.mkConAllTmp, $el, $appendTo($qs(".container")));

    return true;
};

Main.delegate = (container_el) =>
    go(
        container_el,
        $delegate(
            "click",
            ".whoami__buttons__logout",
            async (e) => {
                try {
                    const res = await axios.post('/todo/logout');

                    go(
                        e.delegateTarget,
                        $findAll('div'),
                        each($remove)
                    );

                    go(
                        LoginUI.loginTmp(),
                        $el,
                        $appendTo(e.delegateTarget)
                    );

                    history.replaceState({}, "로그인", "/todo/login");

                    await Alert.pop({title: res.data.message});

                } catch (err) {
                    Main.error(err);
                }
            }
        ),
        $delegate(
            "click",
            ".header__button__left",
            async () => {

                const render = await go(
                    $qs(".header__today"),
                    (el) => el.value,
                    getPrevDay,
                    (prev) => axios.get(`/todo/list/${prev.toDateInputValue()}`),
                    (res) => Main.contentViewUpdate(res.data.result),
                ).catch(Main.error);

                render && go(
                    [$qs(".header__today"), $qs(".input__input_box__todo_date")],
                    each(Main.setPrevDate),
                );
            }
        ),
        $delegate(
            "click",
            ".header__button__right",
            async () => {
                const render = await go(
                    $qs(".header__today"),
                    (el) => el.value,
                    getNextDay,
                    (prev) => axios.get(`/todo/list/${prev.toDateInputValue()}`),
                    (res) => Main.contentViewUpdate(res.data.result),
                ).catch(Main.error);

                render && go(
                    [$qs(".header__today"), $qs(".input__input_box__todo_date")],
                    each(Main.setNextDate),
                );
            }
        ),
        $delegate(
            "change",
            ".header__today",
            async (e) =>
                go(
                    e.currentTarget,
                    (el) => axios.get(`/todo/list/${el.value}`),
                    (res) => Main.contentViewUpdate(res.data.result),
                ).catch(Main.error)
        ),
        $delegate(
            "click",
            ".content__button__archive",
            (e) => go(
                e.currentTarget,
                $closest(".content"),
                tap($attr("id"), (id) => axios.post(`/todo/data/archive/${id}`)),
                Main.rmOne
            ).catch(Main.error)
        ),
        $delegate(
            "click",
            ".content__button__delete",
            (e) => go(
                e.currentTarget,
                $closest(".content"),
                tap($attr("id"), (id) => axios.post(`/todo/data/delete/${id}`)),
                Main.rmOne
            ).catch(Main.error)
        ),
        $delegate(
            "click",
            ".content__button__edit",
            (e) => go(
                e.currentTarget,
                tap(el => el.blur()),
                $closest(".content"),
                $attr("id"),
                (id) => axios.get(`/todo/data/${id}`),
                (res) =>
                    Prompt.pop({
                        title: "수정하기",
                        value: res.data.result,
                        buttons: Main.defaultButtons,
                    }),
                (data) => new Promise((resolve, reject) =>
                    data.class == "cancel"
                        ? reject()
                        : resolve(data)),
                (data) => axios.patch(`todo/data/${data.value.id}`, data.value),
                (res) => Main.update(res.data.result),
            ).catch(Main.error)
        ),
        $delegate(
            "click",
            ".content__button__return",
            (e) => go(
                e.currentTarget,
                $closest(".content"),
                tap($attr("id"), (id) => axios.post(`/todo/data/return/${id}`)),
                Main.rmOne
            ).catch(Main.error)
        ),
        $delegate(
            "click",
            ".content__checkbox",
            (e) => {
                const checked = go(
                    e.currentTarget,
                    el => $attr("status", el) === "empty"
                );

                go(
                    e.currentTarget,
                    $closest(".content"),
                    $attr("id"),
                    (id) => axios.patch(`/todo/data/${id}`, {checked}),
                ).then(res =>
                    go(
                        e.currentTarget,
                        Main.check(res.data.result.checked),
                    )
                ).catch(Main.error);
            }
        ),
        $delegate("click", ".whoami__buttons__del_all", async () => {
            go(
                Alert.pop({
                    title: "전부 삭제하시겠습니까?",
                    buttons: Main.defaultButtons,
                }),
                (data) => new Promise((resolve, reject) =>
                    data.class == "cancel"
                        ? reject()
                        : resolve(data)),
                () => axios.post(`todo/data/delete_all`),
                () => Main.rmAllAndDel(),
            ).catch(Main.error);
        }),
        $delegate("submit", ".input__input_box", (e) => {
            e.originalEvent.preventDefault();

            go(
                e.currentTarget,
                tap((el) => new FormData(el).entries(),
                    object,
                    (obj) => axios.post('todo/add', obj),
                    ({data}) => {
                        $qs(".header__today").value == format(new Date(data.result.date), "yyyy-MM-dd") && go(data.result, MainUI.mkConTmp, $el, $prependTo($qs(".contents")));
                    }),
                $find(".input__input_box__todo"),
                $setVal("")
            ).catch(Main.error);
        }),
        $delegate("click", ".whoami__buttons__archive", () =>
            // 데이터 받아와서 템플릿 그려주기
            window.location.replace("/todo/archive")
        ),
        $delegate("click", ".whoami__buttons__return", () =>
            // 데이터 받아와서 템플릿 그려주기
            window.location.replace("/todo")
        )
    );

export default Main;
