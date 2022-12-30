import { html, strMap } from 'fxjs';

const HomeUI = {};
HomeUI.mkTodoTmp = (todo) => html`
    <div like_count="${todo.like_count}" class="home__canvas__todo">
        <div class="home__canvas__todo__name">${todo.user_name}</div>
        <div class="home__canvas__todo__content">${todo.content}</div>
    </div>
`;

HomeUI.mkTmp = (todos) => html`
    <div class="home__container">
        <div class="home">
            <div class="home__canvas">
                <div class="home__canvas__text__last">
                    <span class="home__canvas__text__last__text">TODO</span>
                    <span class="home__canvas__text__last__button">시작</span>
                </div>
                <div class="home__canvas__play">다시 시작</div>
                <div class="home__canvas__text__first">당신은</div>
                <div class="home__canvas__text">지금!</div>
                <div class="home__canvas__text">뭘 해야합니까!</div>
                <div class="home__canvas__text">그건 바로</div>
                ${strMap(HomeUI.mkTodoTmp, todos)}
            </div>
        </div>
    </div>
`;

export default HomeUI;
