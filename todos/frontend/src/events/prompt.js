import * as L from "fxjs/Lazy";
import {
    each,
    entries,
    extend,
    find,
    go,
    head,
    hi,
    isEmpty,
    log,
    map,
    object,
    pipe,
    strMap,
    tap,
    values,
} from "fxjs";
import * as C from "fxjs/Concurrency";
import {
    $appendTo,
    $attr,
    $children,
    $closest,
    $delegate,
    $el,
    $find,
    $findAll,
    $on,
    $prependTo,
    $qs,
    $qsa,
    $remove,
    $replaceWith,
    $setAttr,
    $setVal,
    $toggleClass,
} from "fxdom";


const Prompt = {};

Prompt.mkButtonTmp = (button) =>
    `<button type="button" class="prompt__body__buttons__button__${button.class}" status="${button.class}">${button.msg}</button>`;

Prompt.mkPromptTmp = (data) => `
<div class="prompt">
    <div class="prompt__body">
        <div class="prompt__body__title">${data.title}</div>
        ${data?.msg ? `<div class="prompt__body__msg">${data.msg}</div>` : ""}
        ${
    data?.value
        ? `
                <form action="" class="prompt__body__values">
                    <div class="prompt__body__values__row">
                        <span class="prompt__body__values__row__key">Until: </span>
                        <input class="prompt__body__values__row__content" name="date"
                            placeholder="날짜 선택" type="text" onfocus="(this.type='date')" onblur="(this.type='text')" value="${new Date(
            data.value.date
        ).toDateInputValue()}">
                    </div>
                    <div class="prompt__body__values__row">
                        <span class="prompt__body__values__row__key">Todo: </span>
                        <textarea class="prompt__body__values__row__content" name="content">${
            data.value.content
        }</textarea>
                    </div>
                </form>
            `
        : ""
}
        <div class="prompt__body__buttons">${strMap(
    Prompt.mkButtonTmp,
    data.buttons
)}</div>
    </div>
</div>
`;

Prompt.pop = (data) =>
    new Promise((resolve) => {
        data = data?.buttons
            ? data
            : {...data, buttons: [{msg: "확인", class: "ok"}]};

        const el = go(data, Prompt.mkPromptTmp, $el, $appendTo($qs("body")));

        go(
            data.buttons,
            map((v) => go(el, $find(`.prompt__body__buttons__button__${v.class}`))),
            map(
                $on("click", (e) =>
                    go(
                        e.currentTarget,
                        tap($closest(".prompt"), $remove),
                        (currentTarget) => {
                            data.value.id = Number(data.value.id);

                            extend(
                                data.value,
                                go(
                                    el,
                                    $find(".prompt__body__values"),
                                    (form_el) => new FormData(form_el).entries(),
                                    object
                                )
                            );

                            resolve({
                                class: $attr("status", currentTarget),
                                value: data.value,
                            });
                        }
                    )
                )
            )
        );
    });

export default Prompt;
