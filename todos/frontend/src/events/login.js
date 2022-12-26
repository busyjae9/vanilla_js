import { each, entries, go, isEmpty, object, tap } from 'fxjs';
import { $appendTo, $closest, $delegate, $el, $find, $remove } from 'fxdom';
import Alert from '../templates/alert.js';
import axios from '../data/axios.js';
import Regexes from '../utils/regex.js';
import LoginUI from '../templates/login.js';
import KR from '../utils/replaceToKor.js';

const Login = {};

Login.validCheck = (obj) =>
    new Promise((resolve, reject) => {
        go(
            obj,
            entries,
            each(([k, v]) => {
                if (!v || isEmpty(v)) reject(`${KR[k]}이(가) 비어있습니다.`);
                else if (!v.match(Regexes[k])) reject(`${KR[k]}의 형식이 잘못되었습니다.`);
            }),
        );
        resolve(obj);
    });

Login.regCheck = (obj) =>
    new Promise((resolve, reject) => {
        if (!obj.term) return reject('약관 동의가 필요합니다.');
        delete obj.term;

        return go(obj, Login.validCheck)
            .then((obj) => resolve(obj))
            .catch((err) => reject(err));
    });

Login.delegate = (container_el) =>
    go(
        container_el,
        $delegate('submit', '.login__rows', (e) => {
            e.originalEvent.preventDefault();
            go(
                e.delegateTarget,
                $find('.login__rows'),
                tap(
                    (el) => new FormData(el).entries(),
                    object,
                    Login.validCheck,
                    (obj) => axios.post('/todo/api/login', obj),
                ),
                () => (window.location.href = '/todo'),
            ).catch((err) => {
                err.response
                    ? Alert.pop({ title: err.response.data.message })
                    : Alert.pop({ title: err });
            });
        }),
        $delegate('click', '.reg__button__cancel', (e) => {
            go(e.currentTarget, $closest('.reg'), $remove);
            const container = go(e.delegateTarget, $find('.bg_dark'));
            go(LoginUI.loginTmp(), $el, $appendTo(container));
            history.replaceState({}, '로그인', '/todo/login');
        }),
        $delegate('submit', '.reg__rows', (e) => {
            e.originalEvent.preventDefault();
            go(
                e.delegateTarget,
                $find('.reg__rows'),
                tap(
                    (el) => new FormData(el).entries(),
                    object,
                    Login.regCheck,
                    (obj) => axios.post('/todo/api/reg', obj),
                ),
                () => (window.location.href = '/todo/login'),
            ).catch((err) => {
                err.response
                    ? Alert.pop({ title: err.response.data.message })
                    : Alert.pop({ title: err });
            });
        }),
        $delegate('click', '.login__button__reg', (e) => {
            go(e.currentTarget, $closest('.login'), $remove);
            const container = go(e.delegateTarget, $find('.bg_dark'));
            go(LoginUI.regTmp(), $el, $appendTo(container));
            history.replaceState({}, '회원가입', '/todo/reg');
        }),
    );

export default Login;
