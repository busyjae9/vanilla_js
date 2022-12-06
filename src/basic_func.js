// 기초 함수들
import { head, isEmpty, log, map, pipe, sortByDesc, take } from "fxjs";
import { $addClass, $attr, $removeClass } from "fxdom";

export const applyToEl = (el, f) => (_) => f(el);
export const applyToTarget = (f) => (e) => f(e.target);
export const applyToElOnlyEnter = (el, f) => (e) => e.key == "Enter" && f(el);

// 태그에 클래스를 붙이고 삭제하는 방식으로 해당 태그 내용을 화면에서 토글
const visible = pipe($removeClass("ghost"), $addClass("active"));
const invisible = pipe($addClass("ghost"), $removeClass("active"));
export const toggleGhost = (value, el) =>
  !value || isEmpty(value) ? visible(el) : invisible(el);

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
export const getLastId = pipe(
  sortByDesc(expId),
  take(1),
  map(addToId1),
  head,
  String
);

export const logFast = (v) => {
  log(v);
  return v;
};
