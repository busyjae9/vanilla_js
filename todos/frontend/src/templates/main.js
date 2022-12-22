import { go, head, strMap, html } from 'fxjs';
import {
    check_box,
    check_box_full,
    comment_full,
    heart,
    heart_full,
    left,
    right,
} from './icons.js';
import { format } from 'date-fns';
import numberToKorean from '../utils/numberToKor.js';

Date.prototype.toDateInputValue = function () {
    let local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
};

const MainUI = {};

MainUI.checkFullTmp = () => go(check_box_full(['content__checkbox__done', 'fa-xl']), head);

MainUI.checkTmp = () => go(check_box(['content__checkbox__empty', 'fa-xl']), head);

MainUI.heartTmp = (like) =>
    go(heart_full([`content__info__heart__${like ? 'full' : 'empty'}`, 'content__heart']), head);
MainUI.commentFullTmp = () => go(comment_full(['content__info__comment__full']), head);

MainUI.mkConTmp = (todo) => html`
    <div class="content content_${todo.id}" id="${todo.id}">
        <div class="content__body">
            ${todo.my_todo
                ? `
                    <button status='${todo.checked ? 'done' : 'empty'}' class='content__checkbox'>
                        ${todo.checked ? MainUI.checkFullTmp() : MainUI.checkTmp()}
                    </button>
                `
                : `
                ${todo.checked ? MainUI.checkFullTmp() : MainUI.checkTmp()}
                `}
            <span class="content__title ${todo.checked ? 'done_text' : ''}">${todo.content}</span>
            ${todo.my_todo
                ? `
                <div class='content__buttons'>
                    <button class='content__button__edit'>수정</button>
                    <button class='content__button__archive'>보관</button>
                </div>
            `
                : `<div></div>`}
        </div>
        <div class="content__info">
            <div class="content__info__heart">
                ${MainUI.heartTmp(todo.like)}
                <span class="content__info__heart__count">
                    ${numberToKorean(todo?.like_count) || 0}
                </span>
            </div>
            <form class="content__info__input">
                <input
                    name="comment"
                    type="text"
                    class="content__info__input__text"
                    placeholder="댓글 달기"
                />
                <input type="submit" class="content__info__input__submit" value="등록" />
            </form>
            <div class="content__info__comment">
                ${MainUI.commentFullTmp()}
                <span class="content__info__comment__count">
                    ${numberToKorean(todo?.comment_count) || 0}
                </span>
            </div>
        </div>
        <div status="before" class="content__comments"></div>
    </div>
`;

MainUI.mkCommentTmpAll = ({ comments, next_page }) => html`
    <div class="content__comments__all">
        <div class="content__comments__all__body">${strMap(MainUI.mkCommentTmp, comments)}</div>
        ${next_page
            ? `<div page='${next_page}' class='content__comments__all__next'>더보기</div>`
            : ''}
    </div>
`;

MainUI.mkCommentTmp = (comment) => html`
    <div class="content__comment" id="${comment.id}">
        <div class="content__comment__body">
            <div class="content__comment__body__user">${comment.user_name}</div>
            <div class="content__comment__body__text">${comment.comment}</div>
        </div>
        <div class="content__comment__info">
            <div class="content__comment__info__reg">
                ${new Date(comment.reg_date).toLocaleDateString()}
            </div>
        </div>
    </div>
`;

MainUI.mkArchiveConTmp = (todo) => html`
    <div class="content content_${todo.id}" id="${todo.id}">
        <div class="content__body">
            <span class="content__archive__title ${todo.checked ? 'done_text' : ''}">
                ${todo.content}
            </span>
            <span class="content__archive__date ${todo.checked ? 'done_text' : ''}">
                ${format(new Date(todo.date), 'yy-MM-dd')}
            </span>
            <div class="content__buttons">
                <button class="content__button__return">복구</button>
                <button class="content__button__delete">삭제</button>
            </div>
        </div>
    </div>
`;

MainUI.mkConAllTmp = (todos) => html`
    <section class="contents">${strMap(MainUI.mkConTmp, todos)}</section>
`;

MainUI.initTmp = (todos, date) => html`
    <div class="container">
        <form class="input__input_box">
            <header class="header">
                <button type="button" class="header__button__left">
                    ${left(['header__button__left__icon', 'fa-xl'])}
                </button>
                <input
                    value="${date}"
                    class="header__today"
                    id="today"
                    placeholder="날짜 선택"
                    type="text"
                    onfocus="(this.type='date')"
                    onblur="(this.type='text')"
                    name="date"
                />
                <button type="button" class="header__button__right">
                    ${right(['header__button__right__icon', 'fa-xl'])}
                </button>
            </header>
            <section class="input">
                <input
                    class="input__input_box__todo"
                    type="text"
                    name="content"
                    required
                    minlength="1"
                    placeholder="할 일 입력하기"
                />
                <input type="submit" class="input__input_box__submit" value="추가" />
            </section>
        </form>
        <section class="contents">${strMap(MainUI.mkConTmp, todos)}</section>
    </div>
`;

MainUI.archiveTmp = (todos) => html`
    <div class="container">
        <section class="contents">${strMap(MainUI.mkArchiveConTmp, todos)}</section>
    </div>
`;

MainUI.initOtherTmp = (todos, date) => html`
    <div class="container">
        <header class="header">
            <button type="button" class="header__button__left">
                ${left(['header__button__left__icon', 'fa-xl'])}
            </button>
            <input
                value="${date}"
                class="header__today"
                id="today"
                placeholder="날짜 선택"
                type="text"
                onfocus="(this.type='date')"
                onblur="(this.type='text')"
                name="date"
            />
            <button type="button" class="header__button__right">
                ${right(['header__button__right__icon', 'fa-xl'])}
            </button>
        </header>
        <section class="contents">${strMap(MainUI.mkConTmp, todos)}</section>
    </div>
`;

export default MainUI;
