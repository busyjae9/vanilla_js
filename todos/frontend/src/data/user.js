import {delay, each, entries, filter, go, isEmpty, log, map, tap, values} from "fxjs";
import axios from './axios.js'
import Regexes from "../utils/regex.js";

const User = {};


User.emptyCheck = (obj) =>
    go(
        obj,
        entries,
        each(
            ([k, v]) =>
                new Promise((resolve, reject) =>
                    !v || isEmpty(v) ? reject(`${k} 이(가) 비어있습니다.`) : resolve()
                )
        )
    );

User.validCheck = (obj) => new Promise((resolve, reject) =>
    go(
        obj,
        entries,
        each(
            ([k, v]) => {
                !v || !v.match(Regexes[k]) && reject(`${k} 의 형식이 잘못되었습니다.`)
            }
        ),
        (_) => resolve()
    ));


export default User