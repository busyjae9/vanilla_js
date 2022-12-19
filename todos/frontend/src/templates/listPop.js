import {find, go, head, map, strMap, tap} from "fxjs";
import {
    $appendTo,
    $attr,
    $closest,
    $el,
    $find,
    $on,
    $qs,
    $remove,
} from "fxdom";

const List = {};

List.mkButtonTmp = (button) =>
    `<button type="button" value="${button.class}" class="alert__body__buttons__button__${button.class}">${button.msg}</button>`;

List.mkListTmp = (data) => `
<div class="alert">
    <div class="alert__body">
        <div class="alert__body__title">${data.title}</div>
        ${data?.msg ? `<div class="alert__body__msg">${data.msg}</div>` : ""}
        <div class="alert__body__buttons">
        ${strMap(
    List.mkButtonTmp,
    data.buttons
)}
        </div>
    </div>
</div>
`;

List.asyncPop = (data) =>
    new Promise((resolve) => {
        data = data?.buttons
            ? data
            : {...data, buttons: [{msg: "확인", class: "ok"}]};

        const el = go(data, List.mkListTmp, $el, $appendTo($qs("body")));

        go(
            data.buttons,
            map((v) => go(el, $find(`.alert__body__buttons__button__${v.class}`))),
            map(
                $on("click", (e) =>
                    go(e.currentTarget, tap($closest(".alert"), $remove), (el) =>
                        resolve($attr("value", el))
                    )
                )
            ),
            head,
            (el) => el.focus()
        );
    });

List.pop = async (data) => {
    const class_name = await List.asyncPop(data);
    return go(
        class_name,
        (class_name) => (a) => a.class == class_name,
        (f) => go(data.buttons, find(f))
    );
};

export default List;
