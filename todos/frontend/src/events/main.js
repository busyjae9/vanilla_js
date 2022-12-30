import { curry, delay, each, go, head, last, log, map, object, pipe, replace, tap } from 'fxjs';
import {
    $appendTo,
    $attr,
    $children,
    $closest,
    $delegate,
    $el,
    $find,
    $findAll,
    $hide,
    $insertBefore,
    $next,
    $prependTo,
    $prev,
    $qs,
    $remove,
    $replaceWith,
    $scrollTop,
    $setAttr,
    $setText,
    $setVal,
    $show,
    $text,
    $toggleClass,
} from 'fxdom';

import { getNextDay, getPrevDay } from '../basic_func.js';
import Alert from '../templates/alert.js';
import Prompt from '../templates/prompt.js';
import MainUI from '../templates/main.js';
import axios, { cancel_token } from '../data/axios.js';
import LoginUI from '../templates/login.js';
import { format } from 'date-fns';
import Search from '../templates/search.js';
import numberToKorean from '../utils/numberToKor.js';
import Reply from '../templates/reply.js';
import Anime from '../utils/anime.js';
import anime from 'animejs/lib/anime.es.js';

const Main = {};

Main.cancel_token = {};

Main.defaultButtons = [
    {
        msg: '취소',
        class: 'cancel',
    },
    {
        msg: '확인',
        class: 'ok',
    },
];

Main.error = (err) =>
    err
        ? err?.response
            ? Alert.pop({ title: err.response.data.message })
            : Alert.pop({ title: '일시 오류가 발생했습니다.' }).then(() => log(err))
        : log('취소');

Main.mkCon = (todoData) => go(todoData, Main.mkConTmp, $el, (v) => $prependTo($qs('.contents'))(v));
Main.rmAll = pipe($findAll('div.content'), each($remove));
Main.rmOne = pipe($closest('div.content'), $remove);
Main.rmAllAndDel = () => go($qs('.contents'), Main.rmAll);

Main.check = curry((check, el) =>
    go(
        el,
        $setAttr({ status: check ? 'done' : 'empty' }),
        $closest('.content__body'),
        $children,
        ([icon, title]) => {
            go(icon, $children, ([iconEl]) =>
                check
                    ? $replaceWith(go(MainUI.checkFullTmp(), $el), iconEl)
                    : $replaceWith(go(MainUI.checkTmp(), $el), iconEl),
            );
            $toggleClass('done_text', title);
        },
    ),
);

Main.update = (data) =>
    go($qs(`.content_${data.id} `), (content) =>
        $qs('.header__today').value === format(new Date(data.date), 'yyyy-MM-dd')
            ? go(content, $children, head, $children, ([icon, content, buttons]) =>
                  $setText(data.content)(content),
              )
            : $remove(content),
    );

Main.setPrevDate = (el) =>
    go(el, (el) => ((el.value = getPrevDay(el.value).toDateInputValue()), el));

Main.setNextDate = (el) =>
    go(el, (el) => ((el.value = getNextDay(el.value).toDateInputValue()), el));

Main.updateElValue = (f) => (el) => f(el.value);

Main.contentViewUpdate = (todos) => {
    go($qs('.contents'), $remove);
    go(todos, MainUI.mkConAllTmp, $el, $appendTo($qs('.container')));
    return true;
};

Main.delegate = (container_el) =>
    go(
        container_el,
        $delegate('click', '.whoami__buttons__logout', async (e) => {
            try {
                const res = await axios.post('/todo/api/logout');

                go(e.delegateTarget, $findAll('div'), each($remove));
                go(LoginUI.loginTmp(), $el, $appendTo(e.delegateTarget));

                history.replaceState({}, '메인화면', '/todo/login');

                await Alert.pop({ title: res.data.message });
            } catch (err) {
                Main.error(err);
            }
        }),
        $delegate('click', '.header__button__left', async () => {
            const id = new URLSearchParams(window.location.search).get('id');

            const render = await go(
                $qs('.header__today'),
                (el) => el.value,
                getPrevDay,
                tap((day) => {
                    const urlParams = new URLSearchParams(window.location.search);
                    urlParams.set('date', day.toDateInputValue());
                    history.replaceState(
                        {},
                        day.toDateInputValue(),
                        `/todo?${urlParams.toString()}`,
                    );
                }),
                (prev) =>
                    axios.get(
                        `/todo/api/todo/list?date=${prev.toDateInputValue()}${
                            id ? `&id=${id}` : ''
                        }`,
                    ),
                (res) => Main.contentViewUpdate(res.data.result),
            ).catch(Main.error);

            render && go($qs('.header__today'), Main.setPrevDate);
        }),
        $delegate('click', '.header__button__right', async () => {
            const id = new URLSearchParams(window.location.search).get('id');

            const render = await go(
                $qs('.header__today'),
                (el) => el.value,
                getNextDay,
                tap((day) => {
                    const urlParams = new URLSearchParams(window.location.search);
                    urlParams.set('date', day.toDateInputValue());

                    history.replaceState(
                        {},
                        day.toDateInputValue(),
                        `/todo?${urlParams.toString()}`,
                    );
                }),
                (prev) =>
                    axios.get(
                        `/todo/api/todo/list/?date=${prev.toDateInputValue()}${
                            id ? `&id=${id}` : ''
                        }`,
                    ),
                (res) => Main.contentViewUpdate(res.data.result),
            ).catch(Main.error);

            render && go($qs('.header__today'), Main.setNextDate);
        }),
        $delegate('change', '.header__today', (e) => {
            const id = new URLSearchParams(window.location.search).get('id');

            go(
                e.currentTarget,
                tap((el) => {
                    const urlParams = new URLSearchParams(window.location.search);
                    urlParams.set('date', el.value);
                    history.replaceState({}, el.value, `/todo?${urlParams.toString()}`);
                }),
                (el) => axios.get(`/todo/api/todo/list/?date=${el.value}${id ? `&id=${id}` : ''}`),
                (res) => Main.contentViewUpdate(res.data.result),
            ).catch(Main.error);
        }),
        $delegate('click', '.content__return__button', async (e) => {
            const todo = go(e.currentTarget, $closest('.content'));
            const todo_id = go(todo, $attr('id'));

            const original_status = Main.cancel_token[todo_id].status;

            Main.cancel_token[todo_id].status = 'cancel';

            if (original_status === 'loading') Main.cancel_token[todo_id].cancel_token.cancel();
            else
                go(todo_id, replace('todo_', ''), (id) =>
                    axios.post(`/todo/api/archive/return/${id}`),
                );

            go(
                todo,
                Anime.animeSync({
                    easing: 'easeInSine',
                    opacity: 1,
                    duration: 800,
                }),
                $find('.content__return'),
                Anime.animeSync({
                    opacity: 0,
                    height: 0,
                    duration: 800,
                }),
            );
        }),
        $delegate('click', '.content__button__archive', (e) => {
            const cancel_token_source = cancel_token.source();
            const todo = go(e.currentTarget, $closest('.content'));
            const todo_id = go(todo, $attr('id'));

            go(
                e.currentTarget,
                $closest('.content'),
                $find('.content__return'),
                Anime.animeSync({
                    opacity: 1,
                    height: '100%',
                    duration: 800,
                }),
            );

            go(
                todo,
                tap(
                    $attr('id'),
                    replace('todo_', ''),
                    (id) => {
                        Main.cancel_token[todo_id] = {
                            cancel_token: cancel_token_source,
                            status: 'loading',
                        };
                        return axios.post(
                            `/todo/api/archive/?id=${id}`,
                            {},
                            { cancelToken: cancel_token_source.token },
                        );
                    },
                    () =>
                        (Main.cancel_token[todo_id] = {
                            cancel_token: null,
                            status: 'done',
                        }),
                ),
                delay(2000),
                (el) =>
                    new Promise((resolve, reject) => {
                        if (Main.cancel_token[todo_id].status === 'cancel') reject();
                        else resolve(el);
                    }),
                Anime.anime({
                    easing: 'easeOutSine',
                    height: 0,
                    margin: 0,
                    opacity: 0,
                    duration: 500,
                }),
                $remove,
            ).catch(Main.error);

            delete Main.cancel_token[todo_id];

            // 애니메이션 및 숨겨있던 엘리먼트를 보여주는 것은 클릭 시 바로 시작하고,
            // axios 상태를 업데이트하면서 mainUi 객체에 cancelToken과 id를 저장하고 loading 혹은 done인지 확인한다
            // loading이라면 axios를 취소하고 done이라면 return 요청을 보낸다.
        }),
        $delegate('click', '.content__button__delete', (e) =>
            go(
                e.currentTarget,
                $closest('.content'),
                tap($attr('id'), replace('todo_', ''), (id) =>
                    axios.post(`/todo/api/archive/delete/${id}`),
                ),
                Main.rmOne,
            ).catch(Main.error),
        ),
        $delegate('click', '.content__info__heart', async (e) => {
            const res = await go(
                e.currentTarget,
                $closest('.content'),
                $attr('id'),
                replace('todo_', ''),
                (id) => axios.post(`/todo/api/todo/${id}/like`),
            ).catch(Main.error);

            if (!res.data?.result) return;

            go(
                e.currentTarget,
                tap(
                    $find('.content__heart'),
                    $replaceWith(go(MainUI.heartTmp(!res.data.result?.cancel_date), $el)),
                ),
                $find('.content__info__heart__count'),
                $setText(res.data.result.like_count),
            );
        }),

        $delegate('submit', '.content__info__input', (e) => {
            e.originalEvent.preventDefault();

            const id = go(e.currentTarget, $closest('.content'), $attr('id'), replace('todo_', ''));

            go(
                e.currentTarget,
                (el) => new FormData(el).entries(),
                object,
                (obj) => axios.post(`/todo/api/todo/${id}/comment`, obj),
                ({ data }) => {
                    const comment = $qs(`.content_${id} .content__comments`);
                    const status = go($qs(`.content_${id} .content__comments`), $attr('status'));

                    go(
                        $qs(`.content_${id} .content__info__comment__count`),
                        $setText(numberToKorean(data.result.comment_count)),
                    );

                    if (status === 'after')
                        go(
                            data.result.comment,
                            MainUI.mkCommentTmp,
                            $el,
                            $prependTo(go(comment, $find('.content__comments__all__body'))),
                            (el) =>
                                Anime.anime({
                                    easing: 'easeInSine',
                                    opacity: [0, 1],
                                    height: [el.offsetHeight / 4, el.offsetHeight],
                                    translateX: [comment.clientWidth, 0],
                                    duration: 300,
                                    delay: anime.stagger(50),
                                })(el),
                        );
                    else
                        go(axios.get(`/todo/api/todo/${id}/comment?page=1`), ({ data }) => {
                            if (data.result.comment_count !== 0) {
                                go(comment, $setAttr({ status: 'after' }));
                                go(
                                    data.result,
                                    MainUI.mkCommentTmpAll,
                                    $el,
                                    $appendTo(comment),
                                    (el) =>
                                        go(
                                            data.result.comments,
                                            map(MainUI.mkCommentTmp),
                                            map($el),
                                            each(
                                                $appendTo(
                                                    go(el, $find('.content__comments__all__body')),
                                                ),
                                            ),
                                            Anime.anime({
                                                easing: 'easeInSine',
                                                opacity: [0, 1],
                                                translateX: [comment.clientWidth, 0],
                                                duration: 300,
                                                delay: anime.stagger(50),
                                            }),
                                        ),
                                );
                            }
                        });

                    go(e.currentTarget, $find('.content__info__input__text'), $setVal(''));
                    $qs(`.content_${id} .content__comments`).scrollTo({
                        top: 0,
                        behavior: 'smooth',
                    });
                },
            ).catch(Main.error);
        }),

        $delegate('click', '.content__comments__all__next', (e) => {
            const id = go(e.currentTarget, $closest('.content'), $attr('id'), replace('todo_', ''));
            const cursor = go(
                e.currentTarget,
                $prev,
                $children,
                last,
                $attr('id'),
                replace('comment_', ''),
            );

            go(axios.get(`/todo/api/todo/${id}/comment?cursor=${cursor}`), ({ data }) => {
                go(
                    $qs(`.content_${id} .content__info__comment__count`),
                    $setText(numberToKorean(data.result.comment_count)),
                );

                const comment = $qs(`.content_${id} .content__comments`);

                go(
                    data.result.comments,
                    map(MainUI.mkCommentTmp),
                    map($el),
                    each($appendTo($qs(`.content_${id} .content__comments__all__body`))),
                    Anime.animeSync({
                        easing: 'easeInSine',
                        translateX: [comment.clientWidth, 0],
                        duration: 600,
                        delay: anime.stagger(100),
                    }),
                );

                comment.scrollTo({ left: 0, top: comment.scrollHeight, behavior: 'smooth' });

                if (data.result.last_page)
                    go($qs(`.content_${id} .content__comments__all__next`), $remove);
            });
        }),

        $delegate('click', '.content__comment__body__user', (e) =>
            go(
                e.currentTarget,
                $attr('id'),
                replace('user_', ''),
                (id) => (window.location = `/todo?id=${id}`),
            ),
        ),
        $delegate('click', '.content__comment__info__buttons__delete', async (e) => {
            const comment_id = go(
                e.currentTarget,
                $closest('.content__comment'),
                $attr('id'),
                replace('comment_', ''),
            );
            const comment = go(e.currentTarget, $closest('.content__comment'));

            const todo_id = go(
                e.currentTarget,
                $closest('.content'),
                $attr('id'),
                replace('todo_', ''),
            );

            const button = await Alert.pop({
                title: '삭제하시겠습니까?',
                buttons: Main.defaultButtons,
            });

            if (button.class === 'ok')
                go(axios.delete(`/todo/api/todo/comment/${comment_id}`), ({ data }) => {
                    go(
                        $qs(`.content_${todo_id} .content__info__comment__count`),
                        $setText(numberToKorean(data.result.comment_count)),
                    );

                    go(
                        comment,
                        Anime.anime({
                            easing: 'easeOutSine',
                            height: 0,
                            margin: 0,
                            opacity: 0,
                            duration: 500,
                        }),
                        $remove,
                    );
                });
        }),
        $delegate('click', '.content__comment__info__buttons__fix', (e) => {
            const normal = go(e.currentTarget, $attr('status')) === 'normal';
            const comment = go(e.currentTarget, $closest('.content__comment'));

            go(
                e.currentTarget,
                $setText(normal ? '수정 취소' : '수정'),
                $setAttr({ status: normal ? 'fix' : 'normal' }),
            );

            const original_text = go(
                comment,
                $find('.content__comment__body__text__main'),
                $text,
            ).trim();

            if (normal) {
                go(comment, $find('.content__comment__body__text'), $hide, (el) =>
                    go(original_text, MainUI.commentFixTmp, $el, $insertBefore(el)),
                );
            } else {
                go(
                    comment,
                    $find('.content__comment__body__text'),
                    tap((el) => go(el, $prev, $remove)),
                    $show,
                );
            }
        }),

        $delegate('click', '.content__comment__info__buttons__reply', (e) => {
            go(
                e.currentTarget,
                $closest('.content__comment'),
                $attr('id'),
                replace('comment_', ''),
                (id) => axios.get(`/todo/api/todo/comment/${id}`),
                ({ data }) => Reply.pop(data.result),
            );
        }),
        $delegate('click', '.content__comment__body__plus', (e) => {
            go(
                e.currentTarget,
                $closest('.content__comment'),
                $attr('id'),
                replace('comment_', ''),
                (id) => axios.get(`/todo/api/todo/comment/${id}`),
                ({ data }) => Reply.pop(data.result),
            );
        }),

        $delegate('submit', '.content__comment__body__fix__form', async (e) => {
            e.originalEvent.preventDefault();
            const comment_id = go(
                e.currentTarget,
                $closest('.content__comment'),
                $attr('id'),
                replace('comment_', ''),
            );
            const todo_id = go(
                e.currentTarget,
                $closest('.content'),
                $attr('id'),
                replace('todo_', ''),
            );

            go(
                e.currentTarget,
                (el) => new FormData(el).entries(),
                object,
                (obj) => axios.patch(`/todo/api/todo/comment/${comment_id}`, obj),
                ({ data }) => {
                    go(
                        $qs(`.content_${todo_id} .content__info__comment__count`),
                        $setText(numberToKorean(data.result.comment_count)),
                    );

                    go(
                        $qs(`.comment_${comment_id}`),
                        tap((el) => go(el, $find('.content__comment__body__fix'), $remove)),
                        $replaceWith(go(data.result.comment, MainUI.mkCommentTmp, $el)),
                    );
                },
            ).catch(Main.error);
        }),

        $delegate('click', '.content__info__comment', (e) => {
            const comment = go(e.currentTarget, $closest('.content__info'), $next);
            const status = go(comment, $attr('status'));

            if (status === 'after') {
                return go(
                    comment,
                    $setAttr({ status: 'before' }),
                    delay(1000),
                    tap($children, each($remove)),
                );
            }

            go(
                e.currentTarget,
                $closest('.content'),
                $attr('id'),
                replace('todo_', ''),
                (id) => axios.get(`/todo/api/todo/${id}/comment`),
                ({ data }) => {
                    go(
                        e.currentTarget,
                        $find('.content__info__comment__count'),
                        $setText(numberToKorean(data.result.comment_count)),
                    );

                    if (data.result.comment_count !== 0) {
                        go(comment, $setAttr({ status: 'after' }));
                        go(data.result, MainUI.mkCommentTmpAll, $el, $appendTo(comment), (el) =>
                            go(
                                data.result.comments,
                                map(MainUI.mkCommentTmp),
                                map($el),
                                each($appendTo(go(el, $find('.content__comments__all__body')))),
                                Anime.anime({
                                    easing: 'easeInSine',
                                    translateX: [comment.clientWidth, 0],
                                    duration: 300,
                                    delay: anime.stagger(50),
                                }),
                            ),
                        );
                    }
                },
            );
        }),
        $delegate('click', '.content__button__edit', (e) =>
            go(
                e.currentTarget,
                tap((el) => el.blur()),
                $closest('.content'),
                $attr('id'),
                replace('todo_', ''),
                (id) => axios.get(`/todo/api/todo/${id}`),
                (res) =>
                    Prompt.pop({
                        title: '수정하기',
                        value: res.data.result,
                        buttons: Main.defaultButtons,
                    }),
                (data) =>
                    new Promise((resolve, reject) =>
                        data.class === 'cancel' ? reject() : resolve(data),
                    ),
                (data) => axios.patch(`/todo/api/todo/${data.value.id}`, data.value),
                (res) => Main.update(res.data.result),
            ).catch(Main.error),
        ),
        $delegate('click', '.content__button__return', (e) =>
            go(
                e.currentTarget,
                $closest('.content'),
                tap($attr('id'), replace('todo_', ''), (id) =>
                    axios.post(`/todo/api/archive/return/${id}`),
                ),
                Main.rmOne,
            ).catch(Main.error),
        ),
        $delegate('click', '.content__checkbox', (e) => {
            const checked = go(e.currentTarget, (el) => $attr('status', el) === 'empty');

            go(e.currentTarget, $closest('.content'), $attr('id'), replace('todo_', ''), (id) =>
                axios.patch(`/todo/api/todo/${id}`, { checked }),
            )
                .then((res) => go(e.currentTarget, Main.check(res.data.result.checked)))
                .catch(Main.error);
        }),
        $delegate('click', '.whoami__buttons__del_all', async () => {
            go(
                Alert.pop({
                    title: '전부 삭제하시겠습니까?',
                    buttons: Main.defaultButtons,
                }),
                (data) =>
                    new Promise((resolve, reject) =>
                        data.class === 'cancel' ? reject() : resolve(data),
                    ),
                () => axios.post(`/todo/api/archive/delete_all`),
                () => Main.rmAllAndDel(),
            ).catch(Main.error);
        }),
        $delegate('submit', '.input__input_box', (e) => {
            e.originalEvent.preventDefault();

            go(
                e.currentTarget,
                tap(
                    (el) => new FormData(el).entries(),
                    object,
                    (obj) => axios.post('/todo/api/todo', obj),
                    ({ data }) => {
                        if (
                            $qs('.header__today').value ===
                            format(new Date(data.result.date), 'yyyy-MM-dd')
                        )
                            go(
                                {
                                    ...data.result,
                                    my_todo: true,
                                    like_count: 0,
                                    comment_count: 0,
                                },
                                MainUI.mkConTmp,
                                $el,
                                $prependTo($qs('.contents')),
                                Anime.anime({
                                    easing: 'easeInSine',
                                    translateX: [e.currentTarget.clientWidth, 0],
                                    duration: 300,
                                }),
                            );
                    },
                ),
                $find('.input__input_box__todo'),
                $setVal(''),
            ).catch(Main.error);
        }),
        $delegate('click', '.whoami__buttons__archive', () =>
            window.location.replace('/todo/archive'),
        ),
        $delegate('click', '.whoami__buttons__return', () => (window.location = '/todo')),
        $delegate('click', '.whoami__buttons__search', () => Search.pop()),
        $delegate('click', '.whoami__buttons__my_page', () => (window.location = '/todo')),
    );

export default Main;
