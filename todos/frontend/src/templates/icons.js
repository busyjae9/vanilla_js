import { library, icon } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';

library.add(fas, far);

export const heart = (classes) => icon({ prefix: 'far', iconName: 'heart' }, { classes }).html;
export const heart_full = (classes) => icon({ prefix: 'fas', iconName: 'heart' }, { classes }).html;
export const comment_full = (classes) =>
    icon(
        {
            prefix: 'fas',
            iconName: 'comment',
        },
        { classes },
    ).html;

export const check_box = (classes) => icon({ prefix: 'far', iconName: 'square' }, { classes }).html;

export const check_box_full = (classes) =>
    icon(
        {
            prefix: 'fas',
            iconName: 'square-check',
        },
        {
            classes,
        },
    ).html;

export const left = (classes) =>
    icon({ prefix: 'fas', iconName: 'chevron-left' }, { classes }).html;
export const right = (classes) =>
    icon(
        {
            prefix: 'fas',
            iconName: 'chevron-right',
        },
        {
            classes,
        },
    ).html;
