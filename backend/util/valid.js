import {curry, each, entries, find, go, hi, includes, isEmpty, isUndefined, keys, log, map} from "fxjs";
import validator from 'validator';

export const validCheck = curry((validKeys, data) => new Promise((resolve, reject) => {
    const invalid = go(
        validKeys,
        map(key => [key, data[key]]),
        find(([k, v]) => (isEmpty(v) || isUndefined(v)) || (k == "email" && !validator.isEmail(v))),
    )
    return invalid ? reject(`${invalid[0].toUpperCase()}의 데이터가 잘못되었습니다`) : resolve(data)
}))