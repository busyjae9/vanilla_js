import { go, hi, html, object, strMap, tap } from 'fxjs';
import {
    $addClass,
    $appendTo,
    $attr,
    $closest,
    $delegate,
    $el,
    $find,
    $on,
    $qs,
    $remove,
    $toggleClass,
} from 'fxdom';
import axios from '../data/axios.js';
import animateCSS from '../utils/animateCSS.js';

const Search = {};

Search.mkResultTmp = (user) => html`
    <div class="search__results">
        <div class="search__result" user_id="${user.id}">
            <ion-icon class="search__result__icon" name="person"></ion-icon>
            <div class="search__result__name">${user.name}</div>
            <div class="search__result__email">${user.email}</div>
        </div>
    </div>
`;

Search.mkResultsTmp = (users) => html`
    <div class="search__results">${strMap(Search.mkResultTmp, users)}</div>
`;

Search.mkSearchTmp = html`
    <div class="bg_transparent">
        <div class="search">
            <div class="search__body">
                <form class="search__body__form">
                    <input
                        type="text"
                        class="search__body__data"
                        name="people"
                        placeholder="PEOPLE 검색"
                    />
                </form>
            </div>
        </div>
    </div>
`;

Search.pop = () =>
    new Promise((resolve) => {
        go(
            Search.mkSearchTmp,
            $el,
            $appendTo($qs('body')),
            tap($find('.search'), animateCSS('fadeInUp', '.3s')),
            $find('.search__body__data'),
            (el) => el.focus(),
        );

        go(
            $qs('.bg_transparent'),
            $on(
                'click',
                (e) =>
                    e.target === e.currentTarget &&
                    go(
                        e.currentTarget,
                        $find('.search'),
                        animateCSS('fadeOutDown', '.3s'),
                        $closest('.bg_transparent'),
                        $remove,
                        (el) => resolve(false),
                    ),
            ),
            $delegate('keydown', '.search__body__data', (e) => {
                e.key === 'Escape' &&
                    go(
                        e.currentTarget,
                        $closest('.search'),
                        animateCSS('fadeOutDown', '.3s'),
                        $closest('.bg_transparent'),
                        $remove,
                        (el) => resolve(false),
                    );
            }),
            $delegate('submit', '.search__body__form', (e) => {
                e.originalEvent.preventDefault();
                const results = $qs('.search__results');
                results && go(results, $remove);

                go(
                    e.currentTarget,
                    (el) => new FormData(el).entries(),
                    object,
                    (obj) => axios.get('/todo/api/user/list', { params: obj }),
                    ({ data }) => Search.mkResultsTmp(data.result),
                    $el,
                    $appendTo($qs('.search__body')),
                );
            }),
            $delegate('click', '.search__result', (e) => {
                e.originalEvent.preventDefault();
                const results = $qs('.bg_transparent');
                results && go(results, $remove);

                go(e.currentTarget, $attr('user_id'), (id) =>
                    window.location.replace(`/todo?id=${id}`),
                );
            }),
        );
    });

export default Search;
