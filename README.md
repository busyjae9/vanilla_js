# Vanilla js project - TODO

## 실행 방법

- 데이터 베이스 먼저 생성

```
cd todos
```

### migration - knex

1. env 파일 작성

```
// default
pg_host=[데이터 베이 호스트]
pg_port=[데이터 베이스 포트]
pg_user=[데이터 베이스 유저]
pg_password=[데이터 베이스 비밀번호]
pg_db=[데이터 베이스 이름]
migration_folder=[마이그레이션 폴더]
url=[서버 url]
port=[서버 port]
NODE_ENV=[nodejs 환경]
TZ=[원하는 타임존]
```

2. knex migration 파일 만들기 - env.migration_folder에 생성

```
npm run knex_create [file_name]
```

3. migration 파일 작성 후 migrate:up

```
npm run knex_up
```

### 서버 실행

```
npm install
npm run dev
```

