import {
    $appendTo,
    $closest,
    $delegate,
    $el,
    $find,
    $hide,
    $on,
    $qs,
    $remove,
    $replaceWith,
    $setAttr,
} from 'fxdom';
import { delay, go, html, strMap } from 'fxjs';
import { format } from 'date-fns';
import LoadingUi from './loading.js';
import axios from '../data/axios.js';

const Reply = {};

Reply.mkReplyTmp = (reply) => html`
    <div class="comment__replys__reply" id="reply_${reply.id}">
        <ion-icon class="comment__replys__reply__icon" name="return-down-forward"></ion-icon>
        <div id="user_${reply.user_id}" class="comment__replys__reply__user">
            ${reply.user_name}
        </div>
        <div class="comment__replys__reply__text">
            <span class="comment__replys__reply__text__main"> ${reply.comment} </span>
            ${reply.reg_date !== reply.modified_date
                ? `
                    <span class='mini__text__flex'>
                        (수정됨 ${format(new Date(reply.modified_date), 'yy-MM-dd HH:mm')})
                    <span/>`
                : ''}
        </div>
    </div>
`;

Reply.mkReplyAllTmp = ({ replys, next_page }) => html`
    <div class="comment__replys">
        <div class="comment__replys__all">${strMap(Reply.mkReplyTmp, replys)}</div>
        ${next_page
            ? `<div page='${next_page}' class='comment__replys__all__next'>더보기</div>`
            : ''}
    </div>
`;

Reply.mkReplyPopTmp = (comment) => html`
    <div class="bg_dark">
        <div class="comment">
            <div class="comment__top_bar">
                <ion-icon class="comment__top_bar__close" name="close"></ion-icon>
                <div class="comment__top_bar__title">답글</div>
            </div>
            <div class="comment__origin" id="comment__pop__${comment.id}">
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
            <div status="full" class="comment__replys"></div>
            ${LoadingUi.makeTmp}
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

// todo 내일로 넘기기 및 자동으로 넘어가기 완성 안된거
// todo popup에서 원래 댓글 수정하기 및 삭제하기
// todo 답글 수정 및 삭제 및 등록
// todo 답글 더보기
// todo esc 누르면 cancel 혹은 close 태그가서 이벤트 발생시키기

Reply.pop = (data) =>
    new Promise((resolve) => {
        const popup = go(data, Reply.mkReplyPopTmp, $el, $appendTo($qs('body')));

        go(
            data.id,
            delay(500),
            (id) => axios.get(`/todo/api/todo/comment/${id}/reply?page=1`),
            ({ data }) => {
                go(popup, $find('.loader'), $hide);

                if (data.result.replys.length === 0)
                    go(popup, $find('.comment__replys'), $setAttr({ status: 'empty' }));
                else go(popup, $find('.comment__replys'), $setAttr({ status: 'full' }));

                const new_replys = go(data.result, Reply.mkReplyAllTmp, $el);
                go(popup, $find('.comment__replys'), $replaceWith(new_replys));
            },
        );

        go(
            $qs('.bg_dark'),
            $delegate('click', '.comment__top_bar__close', (e) => {
                go(e.currentTarget, $closest('.bg_dark'), $remove, (el) => resolve(true));
            }),
        );
    });

export default Reply;
