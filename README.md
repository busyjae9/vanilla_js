# Vanilla js project - TODO

## 실행 방법

### 서버

- 데이터 베이스 먼저 생성 후 시작

#### migration - knex

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
npm run knex_create $name=[file_name]
```

3. migration 파일 작성 후 migrate:up - todo_fx

```
npm run knex_up
```

#### migration - FxSQL로 만든 모듈

1. migration 폴더에 [number]_migration.js 파일 작성

2. migration 실행 - todo_fx

~~~
npm run migrate
~~~

#### 서버 실행

```
cd backend
npm install
npm run dev
```

### 웹

```
cd frontend
npm install
npm run dev
```

