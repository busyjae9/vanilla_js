import axios from 'axios';
import { log } from 'fxjs';

const date = new Date();
axios
    .get('https://jae9.loca.lt/ping')
    .then(({ data }) => log(date.toDateString() + ' ' + date.toTimeString()));
setInterval(() => {
    const date = new Date();

    axios
        .get('https://jae9.loca.lt/ping')
        .then(({ data }) => log(date.toDateString() + ' ' + date.toTimeString()));
}, 10000);
