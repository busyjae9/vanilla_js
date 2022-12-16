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
pg_host=localhost
pg_port=5432
pg_user=postgres
pg_password=0523
pg_db=todo
pg_db_fx=todo_fx
```

2. knex migrate:make

```
npm run knex_create [file_name]
```

3. migration 파일 작성 후 migrate:up - todo_fx

```
npm run knex_up
```

### 서버 실행

```
npm install
npm run dev
```

