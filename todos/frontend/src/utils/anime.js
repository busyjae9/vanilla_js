import { curry, go, tap } from 'fxjs';
import anime from 'animejs/lib/anime.es.js';
import { $qs } from 'fxdom';

const Anime = {};

Anime.font = parseFloat(window.getComputedStyle($qs('body')).fontSize);

Anime.anime = curry(
    (option, element) =>
        new Promise((resolve) =>
            anime({ targets: element, ...option }).finished.then(() => resolve(element)),
        ),
);

Anime.animeSync = curry((option, element) =>
    go(
        element,
        tap((el) => anime({ targets: el, ...option })),
    ),
);

Anime.animation = (option) => anime(option);
Anime.timeline = (option) => anime.timeline(option);
export default Anime;
