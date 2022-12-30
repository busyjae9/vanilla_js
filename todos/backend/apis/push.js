import express from 'express';
import webPush from 'web-push';
import { go, log } from 'fxjs';
import Query from '../queries/query_v1.js';

const router = express.Router();

const DEV = process.env.ENV === 'dev';
const PORT = DEV ? process.env.port_test : process.env.port;
const URL = process.env.url;

router.post('/register', async (req, res) => {
    if (!req.session.user) return res.status(400).json({ code: 'E001' });

    const token = await Query.get('tokens', { user_id: req.session.user.id });

    if (token)
        go(
            req.body,
            (key) =>
                Query.update(
                    'tokens',
                    {
                        token: JSON.stringify(key),
                        type: 'push_token',
                        user_id: req.session.user.id,
                        expired_date: null,
                    },
                    token.id,
                ),
            Query.success(res, '업데이트 되었습니다.'),
        );
    else
        go(
            req.body,
            (key) =>
                Query.insert('tokens', {
                    token: key,
                    type: 'push_token',
                    user_id: req.session.user.id,
                }),
            Query.success(res, '등록되었습니다.'),
        );
});

router.get('/test', async (req, res) => {
    const options = {
        vapidDetails: {
            subject: `${URL}:${PORT}`, // 서버 주소
            publicKey: process.env.push_public_key,
            privateKey: process.env.push_private_key,
        },
    };

    const payload = JSON.stringify({
        title: 'Web Notification',
        body: '웹 알림 테스트입니다.',
        tag: 'test',
        ...req.query,
    });

    go(
        req.session.user.id,
        (id) => Query.get('tokens', { user_id: id, type: 'push_token' }),
        (token) => webPush.sendNotification(token.token, payload, options),
        Query.success(res, '보냈습니다.'),
    );
});
export default router;
