import { each, delay, go, isEmpty, log, map, object, replace, tap, last } from 'fxjs';
import {
    $appendTo,
    $attr,
    $children,
    $closest,
    $delegate,
    $el,
    $find,
    $next,
    $prev,
    $qs,
    $remove,
    $setAttr,
    $setCss,
    $setText,
} from 'fxdom';
import axios from '../data/axios.js';
import MyPageUI from '../templates/mypage.js';
import Anime from '../utils/anime.js';

const MyPage = {};

MyPage.delegate = (container_el) =>
    go(
        container_el,
        $delegate('click', '.my_page__follow', (e) => {
            const status = go(e.currentTarget, $attr('status'));

            go(
                e.currentTarget,
                $attr('id'),
                replace('user_follow_', ''),
                (id) => axios[status](`/todo/api/user/${id}/follow`),
                ({ data }) => {
                    go(
                        e.currentTarget,
                        $setAttr({ status: status === 'delete' ? 'post' : 'delete' }),
                        $setText(status === 'delete' ? '팔로우' : '팔로우 취소'),
                    );

                    $setText(`${data.result.following_count}명`, $qs('#user_following'));
                    $setText(`${data.result.follower_count}명`, $qs('#user_follower'));
                },
            );
        }),
        $delegate('click', '.my_page__info__row__followings__person__buttons__cancel', (e) => {
            const parent = go(e.currentTarget, $closest('.my_page__info__row__followings'));

            go(
                e.currentTarget,
                $closest('.my_page__info__row__followings__person'),
                $attr('id'),
                replace('following_', ''),
                (id) => axios.delete(`/todo/api/user/${id}/follow?my_count=true`),
                ({ data }) => {
                    $setText(`${data.result.following_count}명`, $qs('#user_following'));
                    $setText(`${data.result.follower_count}명`, $qs('#user_follower'));

                    go(
                        e.currentTarget,
                        $closest('.my_page__info__row__followings__person'),
                        Anime.anime({
                            easing: 'linear',
                            height: 0,
                            margin: 0,
                            opacity: 0,
                            duration: 500,
                        }),
                        $remove,
                    );

                    if (data.result.following_count === '0') {
                        go(parent, $setAttr({ status: 'before' }));
                        go(
                            parent,
                            $closest('.my_page__info__row'),
                            $find('.my_page__info__row__icon'),
                            $setAttr({ name: 'chevron-down-sharp' }),
                        );
                    }
                },
            );
        }),

        $delegate('click', '.my_page__info__row__followers__person__buttons__delete', (e) => {
            const parent = go(e.currentTarget, $closest('.my_page__info__row__followers'));

            go(
                e.currentTarget,
                $closest('.my_page__info__row__followers__person'),
                $attr('id'),
                replace('follower_', ''),
                (id) => axios.delete(`/todo/api/user/${id}/follow/cancel`),
                ({ data }) => {
                    $setText(`${data.result.following_count}명`, $qs('#user_following'));
                    $setText(`${data.result.follower_count}명`, $qs('#user_follower'));

                    go(
                        e.currentTarget,
                        $closest('.my_page__info__row__followers__person'),
                        Anime.anime({
                            easing: 'linear',
                            height: 0,
                            margin: 0,
                            opacity: 0,
                            duration: 500,
                        }),
                        $remove,
                    );

                    if (data.result.follower_count === '0') {
                        go(parent, $setAttr({ status: 'before' }));
                        go(
                            parent,
                            $closest('.my_page__info__row'),
                            $find('.my_page__info__row__icon'),
                            $setAttr({ name: 'chevron-down-sharp' }),
                        );
                    }
                },
            );
        }),
        $delegate('click', '.my_page__info__row__follower', (e) => {
            const parent = go(e.currentTarget, $next);
            const status = $attr('status', parent);
            const id = go($qs('.whoami__info'), $attr('id'), replace('user_', ''));

            if (status === 'after') {
                go(parent, $setAttr({ status: 'before' }), delay(600), $children, each($remove));
                return go(
                    e.currentTarget,
                    $find('.my_page__info__row__icon'),
                    $setAttr({ name: 'chevron-down-sharp' }),
                );
            }

            go(axios.get(`/todo/api/user/${id}/follower`), ({ data }) => {
                go(
                    data.result.followers,
                    map(data.result.my_page ? MyPageUI.mkMyFollowerTmp : MyPageUI.mkFollowerTmp),
                    map($el),
                    each($appendTo($qs('.my_page__info__row__followers'))),
                );

                go(
                    $qs('.my_page__info__row__followers__more'),
                    $setCss({ display: data.result.last_page ? 'none' : 'visible' }),
                );

                go($qs('#user_follower'), $setText(`${data.result.follower_count}명`));

                go(
                    e.currentTarget,
                    $find('.my_page__info__row__icon'),
                    $setAttr({ name: 'chevron-up-sharp' }),
                );

                go(parent, $setAttr({ status: 'after' }));
            });
        }),
        $delegate('click', '.my_page__info__row__followers__more', (e) => {
            const parent = go(e.currentTarget, $prev);
            const id = go($qs('.whoami__info'), $attr('id'), replace('user_', ''));

            const cursor = go(parent, $children, last, $attr('id'), replace('follower_', ''));

            go(axios.get(`/todo/api/user/${id}/follower?cursor=${cursor}`), ({ data }) => {
                go(
                    data.result.followers,
                    map(data.result.my_page ? MyPageUI.mkMyFollowerTmp : MyPageUI.mkFollowerTmp),
                    map($el),
                    each($appendTo($qs('.my_page__info__row__followers'))),
                );

                go(
                    $qs('.my_page__info__row__followers__more'),
                    $setCss({ display: data.result.last_page ? 'none' : 'visible' }),
                );

                go($qs('#user_follower'), $setText(`${data.result.follower_count}명`));
            });
        }),
        $delegate('click', '.my_page__info__row__following', (e) => {
            const parent = go(e.currentTarget, $next);
            const status = $attr('status', parent);
            const id = go($qs('.whoami__info'), $attr('id'), replace('user_', ''));

            if (status === 'after') {
                go(
                    e.currentTarget,
                    $find('.my_page__info__row__icon'),
                    $setAttr({ name: 'chevron-down-sharp' }),
                );

                return go(
                    parent,
                    $setAttr({ status: 'before' }),
                    delay(600),
                    $children,
                    each($remove),
                );
            }

            go(axios.get(`/todo/api/user/${id}/following`), ({ data }) => {
                go(
                    data.result.followings,
                    map(data.result.my_page ? MyPageUI.mkMyFollowingTmp : MyPageUI.mkFollowingTmp),
                    map($el),
                    each($appendTo($qs('.my_page__info__row__followings'))),
                );

                go(
                    $qs('.my_page__info__row__followings__more'),
                    $setCss({ display: data.result.last_page ? 'none' : 'visible' }),
                );

                go($qs('#user_following'), $setText(`${data.result.following_count}명`));

                go(
                    e.currentTarget,
                    $find('.my_page__info__row__icon'),
                    $setAttr({ name: 'chevron-up-sharp' }),
                );

                go(parent, $setAttr({ status: 'after' }));
            });
        }),
        $delegate('click', '.my_page__info__row__followings__more', (e) => {
            const parent = go(e.currentTarget, $prev);
            const id = go($qs('.whoami__info'), $attr('id'), replace('user_', ''));

            const cursor = go(parent, $children, last, $attr('id'), replace('follower_', ''));

            go(axios.get(`/todo/api/user/${id}/following?cursor=${cursor}`), ({ data }) => {
                go(
                    data.result.followers,
                    map(data.result.my_page ? MyPageUI.mkMyFollowingTmp : MyPageUI.mkFollowingTmp),
                    map($el),
                    each($appendTo($qs('.my_page__info__row__followings'))),
                );

                go(
                    $qs('.my_page__info__row__followings__more'),
                    $setCss({ display: data.result.last_page ? 'none' : 'visible' }),
                );

                go($qs('#user_following'), $setText(`${data.result.follower_count}명`));
            });
        }),
        $delegate('click', '.my_page__info__row__followers__person__info', (e) =>
            go(
                e.currentTarget,
                $closest('.my_page__info__row__followers__person'),
                $attr('id'),
                replace('follower_', ''),
                (id) => (window.location = `/todo/page?id=${id}`),
            ),
        ),
        $delegate('click', '.my_page__info__row__followings__person__info', (e) =>
            go(
                e.currentTarget,
                $closest('.my_page__info__row__followings__person'),
                $attr('id'),
                replace('following_', ''),
                (id) => (window.location = `/todo/page?id=${id}`),
            ),
        ),
    );

export default MyPage;
