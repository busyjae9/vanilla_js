import { delay, go, tap } from 'fxjs';
import Query from './backend/queries/query_v1.js';
import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log(`이메일을 입력하여 주시기 바랍니다.`);

rl.on('line', function (line) {
    go(
        line,
        tap(() => console.log(`5초 뒤 ${line}님의 비밀번호를 초기화합니다.`)),
        delay(5000),
        tap(() => console.log(`${line}님의 비밀번호를 초기화합니다.`)),
        (email) => {
            const valid_data = { email };
            valid_data.password = bcrypt.hashSync('a12345678!', 10);
            return valid_data;
        },
        (data) => Query.updateWhere('users', data, { email: data.email }),
    ).then(() => {
        rl.close();
    });
}).on('close', function () {
    process.exit();
});
