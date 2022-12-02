import { library, icon } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";

library.add(fas, far);

export const check = icon({ prefix: "fas", iconName: "check" }).html;
export const home = icon({ prefix: "fas", iconName: "home" }).html;
export const fasHeart = icon({ prefix: "fas", iconName: "heart" }).html;
export const farHeart = icon({ prefix: "far", iconName: "heart" }).html;
export const fasPaperPlane = icon({
  prefix: "fas",
  iconName: "paper-plane",
}).html;
export const farPaperPlane = icon({
  prefix: "far",
  iconName: "paper-plane",
}).html;
export const fasCompass = icon({ prefix: "fas", iconName: "compass" }).html;
export const farCompass = icon({ prefix: "far", iconName: "compass" }).html;
