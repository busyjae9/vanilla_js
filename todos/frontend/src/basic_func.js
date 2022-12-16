// 기초 함수들
import { head, isEmpty, log, map, pipe, sortByDesc, take } from "fxjs";
import { $addClass, $attr, $removeClass } from "fxdom";

Date.prototype.toDateInputValue = function () {
  let local = new Date(this);
  local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
  return local.toJSON().slice(0, 10);
};

export const makeEmptyList = (list) => (list = []);
export const findAttrId = (el) => (a) => a.id == $attr("id", el);
export const findId = (id) => (v) => v.id == id;
export const editOne = (data) => (v) =>
  findId(data.id)(v)
    ? {
        ...v,
        ...data,
      }
    : v;
export const expId = (v) => v.id;
export const addToId1 = (v) => Number(v.id) + 1;
export const getLastId = pipe(sortByDesc(expId), take(1), map(addToId1), head);

export const getPrevDay = (date = "") => {
  const day = new Date(date);
  day.setDate(day.getDate() - 1);
  return day;
};

export const getNextDay = (date = "") => {
  const day = new Date(date);
  day.setDate(day.getDate() + 1);
  return day;
};

export const getCurrentTarget = (e) => e.currentTarget;
