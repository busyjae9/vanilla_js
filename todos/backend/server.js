import express from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import session from 'express-session';
import connect from 'connect-redis';
import { v1 } from 'uuid';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpack from 'webpack';
import webpackConfig from '../webpack.config.js';

import livereload from 'livereload';
import livereloadMiddleware from 'connect-livereload';
import { extend, go, hi, includes, isNull, log, map, reject, sortByDesc, take, tap } from 'fxjs';
import { join } from 'path';
import geoip from 'geoip-lite';
import schedule from 'node-schedule';

import todos_api_v2 from './apis/todos_v2.js';
import todos_tmp_v2 from './templates/todos_v2.js';
import HomeUI from '../frontend/src/templates/home.js';
import { ASSOCIATE, COLUMN, SQL } from './db/db_connect.js';
import push_apis from './apis/push.js';
import Push from './util/push.js';

const DEV = process.env.ENV === 'dev';
const PORT = DEV ? process.env.port_test : process.env.port;
const URL = process.env.url;

let build_done = false;

const app = express();

const makeStatic = () => {
    const config = webpackConfig();
    const compiler = webpack(config);

    const DIST_DIR = join(process.cwd(), '/frontend/static');
    app.use('/todo/static', express.static(DIST_DIR));

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
        return new Promise((resolve) => {
            resolve(true);
        });
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
    cors({
        origin: `http://192.168.0.7:8080`,
        credentials: true,
    }),
);

app.use(
    cors({
        origin: `http://192.168.0.7`,
        credentials: true,
    }),
);

app.use(
    session({
        secret: 'busy',
        genid: function () {
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
app.use(function (req, res, next) {
    if (req.session?.user) res.locals.whoami = req.session.user;
    else res.locals.whoami = undefined;

    res.locals.url = req.url;

    next();
});

app.get('/', function (req, res) {
    console.time('메인 투두');
    go(
        ASSOCIATE`
            todos ${{
                hook: (todos) =>
                    go(
                        todos,
                        map((todo) =>
                            extend(todo, {
                                like_count: todo._.likes.length,
                                user_name: todo._.user.name,
                            }),
                        ),
                        sortByDesc((left, right) => left.like_count < right.like_count),
                        take(100),
                    ),
                column: COLUMN('checked', 'content', 'id'),
                query: SQL`where archived_date is null`,
            }}
                p < likes
                - user
        `,
        tap(() => console.timeEnd('메인 투두')),
        (todos) => res.render('home', { body: HomeUI.mkTmp(todos) }),
    );
});

app.use((req, res, next) => {
    // if (!DEV) return res.render('notice');
    next();
});

app.use(function (req, res, next) {
    build_done ? res.status(200) : res.status(400);

    if (!req.session?.user && !includes('/todo/login', req.url) && req.method === 'GET')
        return res.redirect('/todo/login');
    next();
});

app.use('/todo', todos_tmp_v2);
app.use('/todo/api', todos_api_v2);
app.use('/push', push_apis);

app.use(function (req, res, next) {
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('404', { message: `${req.url} 페이지가 존재하지 않습니다.` });
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.json({ error: 'Not found' }); /**/
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
});

app.listen(PORT, () => {
    console.log(`서버 구동중 ${URL}:${PORT}`);

    if (process.env.INSTANCE_ID === '0') {
        // Push.sendTodoNotification();

        const rule = new schedule.RecurrenceRule();
        rule.hour = 10;
        rule.minute = 30;
        rule.tz = 'Asia/Seoul';

        schedule.scheduleJob(rule, () => Push.sendTodoNotification());

        const second_rule = new schedule.RecurrenceRule();
        // second_rule.minute = new schedule.Range(0, 59, 30);
        second_rule.minute = 0;
        second_rule.tz = 'Asia/Seoul';

        schedule.scheduleJob(second_rule, () => Push.sendTodoNotification());

        const third_rule = new schedule.RecurrenceRule();
        third_rule.hour = 17;
        third_rule.minute = 30;
        third_rule.tz = 'Asia/Seoul';

        schedule.scheduleJob(third_rule, () => Push.sendTodoNotification());
    }
});
