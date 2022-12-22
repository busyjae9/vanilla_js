import express from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import session from 'express-session';
import connect from 'connect-redis';
import { v1 } from 'uuid';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpack from 'webpack';
import webpackConfig from './webpack.config.js';

import livereload from 'livereload';
import livereloadMiddleware from 'connect-livereload';
import { includes } from 'fxjs';

import geoip from 'geoip-lite';
import todos_api from './apis/todos.js';
import todos_tmp from './templates/todos.js';
import { join } from 'path';

const DEV = process.env.ENV === 'dev';
const PORT = DEV ? process.env.port_test : process.env.port;
const URL = process.env.url;

let build_done = false;

const app = express();

const makeStatic = () => {
    const config = webpackConfig({ url: URL, port: PORT });
    const compiler = webpack(config);

    const DIST_DIR = join(process.cwd(), '/frontend/static');
    app.use('/static', express.static(DIST_DIR));

    if (DEV) {
        const webpackDevMiddlewareInstance = webpackDevMiddleware(compiler);

        app.use(webpackDevMiddlewareInstance);
        app.use(webpackHotMiddleware(compiler));
        return new Promise((resolve) => {
            webpackDevMiddlewareInstance.waitUntilValid(() => {
                resolve(true);
            });
        });
    } else {
        const DIST_DIR = join(process.cwd(), '/frontend/dist');
        app.use('/dist', express.static(DIST_DIR));
        return new Promise((resolve) => resolve(true));
    }
};

const redisStore = connect(session);
const redisClient = createClient({
    url: 'redis://localhost:6379',
    legacyMode: true,
});
redisClient.connect().catch(console.error);

const maxAge = 1000 * 60 * 60 * 24;

if (DEV) {
    // 라이브 서버 설정
    const liveServer = livereload.createServer({
        // 변경시 다시 로드할 파일 확장자들 설정
        exts: ['html', 'css', 'ejs', 'js'],
        debug: true,
    });

    liveServer.watch(process.cwd());
    app.use(livereloadMiddleware());
}

app.use(
    cors({
        origin: `${URL}`,
        credentials: true,
    }),
);

app.use(
    session({
        secret: 'busy',
        genid: function() {
            return v1(); // use UUIDs for session IDs
        },
        store: new redisStore({ client: redisClient }),
        saveUninitialized: false,
        resave: false,
        cookie: {
            maxAge,
        },
    }),
);

app.set('view engine', 'ejs');
app.set('views', './frontend');
app.use('/static', express.static('./node_modules/font-awesome'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
    const geo = geoip.lookup(req.ip);

    geo ? (req.headers.timezone = geo.timezone) : (req.headers.timezone = 'Asia/Seoul');

    next();
});

makeStatic().then((status) => (build_done = status));
app.get('/', (req, res) => {
    build_done ? res.status(200) : res.status(400);
});

app.use(function(req, res, next) {
    if (req.session?.user) res.locals.whoami = req.session.user;
    else res.locals.whoami = undefined;

    res.locals.url = req.url;

    next();
});

app.use(function(req, res, next) {
    if (!req.session?.user && !includes('/todo/login', req.url) && req.method === 'GET')
        return res.redirect('/todo/login');
    next();
});

app.use('/todo', todos_tmp);
app.use('/todo/api', todos_api);

app.use(function(req, res, next) {
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('404', { message: `${req.url} 페이지가 존재하지 않습니다.` });
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.json({ error: 'Not found' });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
});

app.listen(PORT, () => {
    console.log(`서버 구동중 ${URL}:${PORT}`);
});
