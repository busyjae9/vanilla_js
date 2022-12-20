import { curry2 } from 'fxjs';
import { $addClass, $removeClass } from 'fxdom';

const animateCSS = curry2(
    (animation, time = "1s", element) =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const prefix = 'animate__';
            const animationName = `${prefix}${animation}`;
            const animationTime = `${prefix}${time}`;

            element.style.setProperty('--animate-duration', time)
            $addClass(`${prefix}animated ${animationName}`)(element);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd() {
                $removeClass(`${prefix}animated ${animationName}`)(element);
                element.style.setProperty('--animate-duration', '1s')
                resolve(element);
            }

            element.addEventListener('animationend', handleAnimationEnd, { once: true });
        }),
);

export default animateCSS;
