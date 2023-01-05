import { find, go, insert, reject } from 'fxjs';

let Loading = {};

Loading.container = [];

Loading.get = (event, tag) => {
    const res = go(
        Loading.container,
        find((load) => load.event === event && load.tag === tag),
    );
    return !!res;
};

Loading.set = (event, tag) => {
    Loading.container = go(Loading.container, insert(Loading.container.length, { event, tag }));
};

Loading.del = (event, tag) => {
    Loading.container = go(
        Loading.container,
        reject((load) => load.event === event && load.tag === tag),
    );
};

export default Loading;
