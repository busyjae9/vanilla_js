import { $append, $attr, $delegate, $el, $on, $qs, $qsa } from 'fxdom';
import { each, go, log, range } from 'fxjs';
import Anime from '../utils/anime.js';
import anime from 'animejs/lib/anime.es.js';

const Home = {};

Home.delegate = (container) => {
    Anime.animeSync({
        easing: 'linear',
        scale: [1, 1.1],
        duration: 1000,
        direction: 'alternate',
        autoplay: true,
        loop: true,
    })($qs('.home__canvas__text__last'));

    const animation = Anime.timeline({
        targets: $qs('.home__canvas__text__first'),
        easing: 'easeInOutExpo',
        opacity: [1, 0],
        translateY: [0, -600],
        duration: 1600,
        autoplay: true,
    });

    animation
        .add({
            targets: $qsa('.home__canvas__text'),
            easing: 'easeInOutExpo',
            opacity: [0, 1, 0],
            translateY: [600, 0, -600],
            duration: 2400,
            delay: anime.stagger(1200),
        })
        .add({
            targets: $qs('.home__canvas__text__last'),
            easing: 'easeInOutExpo',
            opacity: [0, 1],
            translateX: [600, 0],
            duration: 1600,
        })
        .add(
            {
                targets: '.home__canvas__todo',
                translateX: function () {
                    return anime.random(-500, 500);
                },

                translateY: function () {
                    return anime.random(-700, 700);
                },
                scale: function (el) {
                    const like_count = Number($attr('like_count', el)) || 1;
                    return anime.random(like_count * 1, like_count * 5);
                },
                opacity: 1,
                easing: 'linear',
                duration: 3000,
                delay: anime.stagger(10),
            },
            '-=1600',
        );

    $on('scroll', (e) => {
        animation.pause();
        const seek =
            (window.scrollY / (document.body.scrollHeight - document.body.offsetHeight)) * 100;
        animation.seek((seek / 100) * animation.duration);
    })(window);

    go(
        container,
        $delegate('click', '.home__canvas__text__last', () => (window.location = '/todo')),
        $delegate('click', '.home__canvas__play', () => animation.play()),
    );
};

export default Home;
