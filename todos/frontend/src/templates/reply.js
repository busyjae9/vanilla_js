import {
    $appendTo,
    $attr,
    $closest,
    $delegate,
    $el,
    $find,
    $focus,
    $hide,
    $insertBefore,
    $on,
    $prependTo,
    $prev,
    $qs,
    $remove,
    $replaceWith,
    $setAttr,
    $setText,
    $setVal,
    $show,
    $text,
    $children,
    $insertAfter,
} from 'fxdom';
import { delay, each, go, hi, html, log, map, object, replace, strMap, tap } from 'fxjs';
import { format } from 'date-fns';
import anime from 'animejs/lib/anime.es.js';
import LoadingUi from './loading.js';
import axios from '../data/axios.js';
import Main from '../events/main.js';
import MainUI from './main.js';
import numberToKorean from '../utils/numberToKor.js';
import Alert from './alert.js';
import animateCSS from '../utils/animateCSS.js';
import Anime from '../utils/anime.js';

const Reply = {};

Reply.replyFixTmp = (value) => html`
    <div class="comment__replys__reply__body__fix">
        <form class="comment__replys__reply__body__fix__form">
            <input
                type="text"
                name="comment"
                value="${value}"
                class="comment__replys__reply__body__fix__form__main"
                placeholder="비워질 수 없습니다."
                required
            />
            <input
                class="comment__replys__reply__body__fix__form__submit"
                type="submit"
                value="변경"
            />
        </form>
    </div>
`;

Reply.mkReplyTmp = (reply) => html`
    <div class="comment__replys__reply" id="reply_${reply.id}">
        <div class="comment__replys__reply__body">
            <ion-icon
                class="comment__replys__reply__body__icon"
                name="return-down-forward"
            ></ion-icon>
            <div id="user_${reply.user_id}" class="comment__replys__reply__body__user">
                ${reply.user_name}
            </div>
            <div class="comment__replys__reply__body__text">
                <span class="comment__replys__reply__body__text__main"> ${reply.comment} </span>
                ${reply.reg_date !== reply.modified_date
                    ? `
                    <span class='mini__text__flex'>
                        (수정됨 ${format(new Date(reply.modified_date), 'yy-MM-dd HH:mm')})
                    <span/>`
                    : ''}
            </div>
        </div>
        ${reply.my_reply
            ? `
            <div class='comment__replys__reply__buttons'>
                <div status='normal' class='comment__replys__reply__buttons__fix'>수정</div>
                <div class='comment__replys__reply__buttons__delete'>삭제</div>
            </div>
            `
            : ''}
    </div>
`;

Reply.mkReplyAllTmp = ({ replys, next_page }) => html`
    <div class="comment__replys" status='"empty'>
        <div class="comment__replys__all">${strMap(Reply.mkReplyTmp, replys)}</div>
        ${next_page
            ? `<div page='${next_page}' class='comment__replys__all__next'>더보기</div>`
            : ''}
    </div>
`;

Reply.mkPlusTmp = (next_page) => html`
    <div page="${next_page}" class="comment__replys__all__next">더보기</div>
`;

Reply.commentFixTmp = (value) => html`
    <div class="comment__origin__body__fix">
        <form class="comment__origin__body__fix__form">
            <input
                type="text"
                name="comment"
                value="${value}"
                class="comment__origin__body__fix__form__main"
                placeholder="비워질 수 없습니다."
                required
            />
            <input class="comment__origin__body__fix__form__submit" type="submit" value="변경" />
        </form>
    </div>
`;

Reply.mkOriginTmp = (comment) => html`
    <div class="comment__origin" id="comment_pop_${comment.id}">
        <div class="comment__origin__body">
            <div id="user_${comment.user_id}" class="comment__origin__body__user">
                ${comment.user_name}
            </div>
            <div class="comment__origin__body__text">
                <span class="comment__origin__body__text__main"> ${comment.comment} </span>
                ${comment.reg_date !== comment.modified_date
                    ? `<span class='mini__text__flex'>
                            (수정됨 ${format(new Date(comment.modified_date), 'yy-MM-dd HH:mm')})
                            <span/>`
                    : ''}
            </div>
        </div>
        <div class="comment__origin__info">
            <div class="comment__origin__info__buttons">
                ${comment.my_comment
                    ? `
                            <div status='normal' class='comment__origin__info__buttons__fix'>
                            수정
                            </div>
                            <div class='comment__origin__info__buttons__delete'>삭제</div>
                        `
                    : ''}
            </div>
            <div class="comment__origin__info__reg">
                ${format(new Date(comment.modified_date), 'yy-MM-dd HH:mm')}
            </div>
        </div>
    </div>
`;

Reply.mkReplyPopTmp = (comment) => html`
    <div class="bg_dark" tabindex="-1">
        <div class="comment">
            <div class="comment__top_bar">
                <ion-icon class="comment__top_bar__close" name="close"></ion-icon>
                <div class="comment__top_bar__title">답글</div>
            </div>
            <div class="comment__origin" id="comment_pop_${comment.id}">
                <div class="comment__origin__body">
                    <div id="user_${comment.user_id}" class="comment__origin__body__user">
                        ${comment.user_name}
                    </div>
                    <div class="comment__origin__body__text">
                        <span class="comment__origin__body__text__main"> ${comment.comment} </span>
                        ${comment.reg_date !== comment.modified_date
                            ? `<span class='mini__text__flex'>
                            (수정됨 ${format(new Date(comment.modified_date), 'yy-MM-dd HH:mm')})
                            <span/>`
                            : ''}
                    </div>
                </div>
                <div class="comment__origin__info">
                    <div class="comment__origin__info__buttons">
                        ${comment.my_comment
                            ? `
                            <div status='normal' class='comment__origin__info__buttons__fix'>
                            수정
                            </div>
                            <div class='comment__origin__info__buttons__delete'>삭제</div>
                        `
                            : ''}
                    </div>
                    <div class="comment__origin__info__reg">
                        ${format(new Date(comment.modified_date), 'yy-MM-dd HH:mm')}
                    </div>
                </div>
            </div>
            <div status="empty" class="comment__replys">
                <div class="comment__replys__all"></div>
            </div>
            <form class="comment__input">
                <input
                    name="comment"
                    type="text"
                    class="comment__input__text"
                    placeholder="댓글 달기"
                />
                <input type="submit" class="comment__input__submit" value="등록" />
            </form>
        </div>
    </div>
`;

Reply.pop = (data) =>
    new Promise((resolve) => {
        const popup = go(
            data,
            Reply.mkReplyPopTmp,
            $el,
            $appendTo($qs('body')),
            tap($focus),
            tap(
                $find('.comment'),
                Anime.animeSync({
                    opacity: [0, 1],
                    translateY: [300, 0],
                    autoplay: true,
                    easing: 'easeInQuart',
                    duration: 500,
                }),
            ),
        );

        go(
            $qs('.bg_dark'),
            $on('keyup', (e) => {
                if (e.key === 'Escape')
                    go(
                        e.currentTarget,
                        $find('.comment'),
                        Anime.anime({
                            opacity: 0,
                            translateY: 300,
                            autoplay: true,
                            easing: 'easeOutQuart',
                            duration: 500,
                        }),
                        $closest('.bg_dark'),
                        $remove,
                        (el) => resolve(true),
                    );
            }),
        );

        go(
            data.id,
            (id) => axios.get(`/v2/todo/api/todo/comment/${id}/reply?page=1`),
            async ({ data }) => {
                const reply_all = go(popup, $find('.comment__replys__all'));
                const next = go(popup, $find('.comment__replys__all__next'));

                go(data.result.replys, map(Reply.mkReplyTmp), map($el), each($appendTo(reply_all)));

                if (data.result.next_page)
                    go(data.result.next_page, Reply.mkPlusTmp, $el, $insertAfter(reply_all));
                else if (next) go(next, $remove);

                if (data.result.replys.length === 0)
                    go(popup, $find('.comment__replys'), $setAttr({ status: 'empty' }));
                else go(popup, $find('.comment__replys'), $setAttr({ status: 'full' }));
            },
        );

        go(
            $qs('.bg_dark'),
            $on(
                'click',
                (e) =>
                    e.target === e.currentTarget &&
                    go(
                        e.currentTarget,
                        $find('.comment'),
                        Anime.anime({
                            opacity: 0,
                            translateY: 300,
                            autoplay: true,
                            easing: 'easeOutQuart',
                            duration: 500,
                        }),
                        $closest('.bg_dark'),
                        $remove,
                        (el) => resolve(true),
                    ),
            ),
            $delegate('click', '.comment__top_bar__close', (e) => {
                go(e.currentTarget, $closest('.bg_dark'), $remove, (el) => resolve(true));
            }),
            $delegate('submit', '.comment__input', (e) => {
                e.originalEvent.preventDefault();

                if (go(popup, $find('.comment__replys'), $attr('status')) === 'empty')
                    go(popup, $find('.comment__replys'), $setAttr({ status: 'full' }), $show);

                go(
                    e.currentTarget,
                    tap(
                        (el) => new FormData(el).entries(),
                        object,
                        (obj) => axios.post(`/todo/api/todo/comment/${data.id}/reply`, obj),
                        ({ data }) =>
                            go(
                                data.result.reply,
                                Reply.mkReplyTmp,
                                $el,
                                $prependTo($qs('.comment__replys__all')),
                                Anime.anime({
                                    easing: 'easeInSine',
                                    translateX: [e.currentTarget.clientWidth, 0],
                                    duration: 300,
                                }),
                            ),
                    ),
                    $find('.comment__input__text'),
                    $setVal(''),
                ).catch(Main.error);
            }),

            $delegate('click', '.comment__replys__reply__buttons__fix', (e) => {
                const normal = go(e.currentTarget, $attr('status')) === 'normal';
                const reply = go(
                    e.currentTarget,
                    $closest('.comment__replys__reply'),
                    $find('.comment__replys__reply__body'),
                );

                go(
                    e.currentTarget,
                    $setText(normal ? '수정 취소' : '수정'),
                    $setAttr({ status: normal ? 'fix' : 'normal' }),
                );

                const original_text = go(
                    reply,
                    $find('.comment__replys__reply__body__text__main'),
                    $text,
                ).trim();

                if (normal) {
                    go(reply, $find('.comment__replys__reply__body__text'), $hide, (el) =>
                        go(original_text, Reply.replyFixTmp, $el, $insertBefore(el)),
                    );
                } else {
                    go(
                        reply,
                        $find('.comment__replys__reply__body__text'),
                        tap((el) => go(el, $prev, $remove)),
                        $show,
                    );
                }
            }),

            $delegate('submit', '.comment__replys__reply__body__fix__form', async (e) => {
                e.originalEvent.preventDefault();

                const reply_id = go(
                    e.currentTarget,
                    $closest('.comment__replys__reply'),
                    $attr('id'),
                    replace('reply_', ''),
                );

                go(
                    e.currentTarget,
                    (el) => new FormData(el).entries(),
                    object,
                    (obj) => axios.patch(`/todo/api/todo/comment/reply/${reply_id}`, obj),
                    ({ data }) => {
                        go(
                            e.currentTarget,
                            $closest('.comment__replys__reply'),
                            $replaceWith(go(data.result.reply, Reply.mkReplyTmp, $el)),
                        );
                    },
                ).catch(Main.error);
            }),

            $delegate('click', '.comment__replys__reply__buttons__delete', async (e) => {
                const reply_id = go(
                    e.currentTarget,
                    $closest('.comment__replys__reply'),
                    $attr('id'),
                    replace('reply_', ''),
                );

                const button = await Alert.pop({
                    title: '삭제하시겠습니까?',
                    buttons: Main.defaultButtons,
                });

                if (button.class === 'ok')
                    go(axios.delete(`/todo/api/todo/comment/reply/${reply_id}`), ({ data }) => {
                        go(e.currentTarget, $closest('.comment__replys__reply'), $remove);
                    });
            }),

            $delegate('click', '.comment__origin__info__buttons__fix', (e) => {
                const normal = go(e.currentTarget, $attr('status')) === 'normal';
                const comment = go(e.currentTarget, $closest('.comment__origin'));

                go(
                    e.currentTarget,
                    $setText(normal ? '수정 취소' : '수정'),
                    $setAttr({ status: normal ? 'fix' : 'normal' }),
                );

                const original_text = go(
                    comment,
                    $find('.comment__origin__body__text__main'),
                    $text,
                ).trim();

                if (normal) {
                    go(comment, $find('.comment__origin__body__text'), $hide, (el) =>
                        go(original_text, Reply.commentFixTmp, $el, $insertBefore(el)),
                    );
                } else {
                    go(
                        comment,
                        $find('.comment__origin__body__text'),
                        tap((el) => go(el, $prev, $remove)),
                        $show,
                    );
                }
            }),

            $delegate('submit', '.comment__origin__body__fix__form', async (e) => {
                e.originalEvent.preventDefault();

                const comment_id = go(
                    e.currentTarget,
                    $closest('.comment__origin'),
                    $attr('id'),
                    replace('comment_pop_', ''),
                );

                go(
                    e.currentTarget,
                    (el) => new FormData(el).entries(),
                    object,
                    (obj) => axios.patch(`/todo/api/todo/comment/${comment_id}`, obj),
                    ({ data }) => {
                        go(
                            e.currentTarget,
                            $closest('.comment__origin'),
                            $replaceWith(go(data.result.comment, Reply.mkOriginTmp, $el)),
                        );

                        go(
                            $qs(
                                `.content_${data.result.comment.todo_id} .content__info__comment__count`,
                            ),
                            $setText(numberToKorean(data.result.comment_count)),
                        );

                        go(
                            $qs(`.comment_${comment_id}`),
                            $replaceWith(go(data.result.comment, MainUI.mkCommentTmp, $el)),
                        );
                    },
                ).catch(Main.error);
            }),

            $delegate('click', '.comment__origin__info__buttons__delete', async (e) => {
                const comment_id = go(
                    e.currentTarget,
                    $closest('.comment__origin'),
                    $attr('id'),
                    replace('comment_pop_', ''),
                );

                const button = await Alert.pop({
                    title: '삭제하시겠습니까?',
                    buttons: Main.defaultButtons,
                });

                if (button.class === 'ok')
                    go(axios.delete(`/todo/api/todo/comment/${comment_id}`), ({ data }) => {
                        go(
                            $qs(
                                `.content_${data.result.comment.todo_id} .content__info__comment__count`,
                            ),
                            $setText(numberToKorean(data.result.comment_count)),
                        );

                        go($qs(`.comment_${comment_id}`), $remove);

                        go(e.currentTarget, $closest('.bg_dark'), $remove, (el) => resolve(true));
                    });
            }),

            $delegate('click', '.comment__replys__all__next', (e) => {
                const id = go(
                    e.currentTarget,
                    $closest('.bg_dark'),
                    $find('.comment__origin'),
                    $attr('id'),
                    replace('comment_pop_', ''),
                );

                const page = $attr('page', e.currentTarget);

                go(axios.get(`/todo/api/todo/comment/${id}/reply?page=${page}`), ({ data }) => {
                    go(
                        data.result.replys,
                        map(Reply.mkReplyTmp),
                        map($el),
                        each($appendTo($qs(`.comment__replys__all`))),
                    );

                    if (!data.result.next_page) go(e.currentTarget, $remove);
                    else go(e.currentTarget, $setAttr({ page: data.result.next_page }));
                });
            }),

            $delegate('click', '.comment__origin__body__user', (e) =>
                go(e.currentTarget, $attr('id'), replace('user_', ''), (id) => {
                    window.location = `todo?id=${id}`;
                }),
            ),
            $delegate('click', '.comment__replys__reply__user', (e) =>
                go(e.currentTarget, $attr('id'), replace('user_', ''), (id) => {
                    window.location = `todo?id=${id}`;
                }),
            ),
        );
    });

export default Reply;
