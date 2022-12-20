import { go, head, strMap, html } from 'fxjs';
import { check_box, check_box_full, heart, heart_full, left, right } from './icons.js';
import { format } from 'date-fns';

Date.prototype.toDateInputValue = function () {
    let local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
};

const MainUI = {};

MainUI.checkFullTmp = () => go(check_box_full(['content__checkbox__done', 'fa-xl']), head);

MainUI.checkTmp = () => go(check_box(['content__checkbox__empty', 'fa-xl']), head);

MainUI.heartTmp = () => go(heart(['content__heart__empty', 'fa-xl']), head);
MainUI.heartFullTmp = () => go(heart_full(['content__heart__full', 'fa-xl']), head);

MainUI.mkConTmp = (todo) => html`
    <div class="content content_${todo.id}" id="${todo.id}">
        <button status="${todo.checked ? 'done' : 'empty'}" class="content__checkbox">
            ${todo.checked ? MainUI.checkFullTmp() : MainUI.checkTmp()}
        </button>
        <span class="content__title ${todo.checked ? 'done_text' : ''}">${todo.content}</span>
        <div class="content__buttons">
            <button class="content__button__edit">수정</button>
            <button class="content__button__archive">보관</button>
        </div>
    </div>
`;

MainUI.mkConOtherTmp = (todo) => html`
    <div class="content content_${todo.id}" id="${todo.id}">
        <button status="${todo.heart ? 'full' : 'empty'}" class="content__heart">
            ${todo?.heart ? MainUI.heartFullTmp() : MainUI.heartTmp()}
            <span> ${todo?.heart_count || 0} </span>
        </button>
        <span class="content__title ${todo.checked ? 'done_text' : ''}">${todo.content}</span>
        <div class="content__buttons">
            <button class="content__button__comment">댓글</button>
        </div>
    </div>
`;

MainUI.mkArchiveConTmp = (todo) => html`
    <div class="content content_${todo.id}" id="${todo.id}">
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
`;

MainUI.mkConAllTmp = (todos) => html`
    <section class="contents">
        ${strMap(
            (todo) => (todo.my_todo ? MainUI.mkConTmp(todo) : MainUI.mkConOtherTmp(todo)),
            todos,
        )}
    </section>
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
        <section class="contents">${strMap(MainUI.mkConOtherTmp, todos)}</section>
    </div>
`;

export default MainUI;
