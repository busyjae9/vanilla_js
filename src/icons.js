import { library, icon } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";

library.add(fas, far);

export const check_box = (classes) =>
  icon({ prefix: "far", iconName: "square" }, { classes }).html;
export const check_box_full = (classes) =>
  icon(
    {
      prefix: "fas",
      iconName: "square-check",
    },
    {
      classes,
    }
  ).html;
