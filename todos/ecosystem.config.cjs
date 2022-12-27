module.exports = {
    apps: [
        {
            name: 'projectName-dev',
            script: './backend/server.js',
            instances: 1,
            watch: true,
            env: {
                Server_PORT: 8080, //Express PORT
                NODE_ENV: 'development',
                pg_host: 'localhost',
                pg_port: 5432,
                pg_user: 'postgres',
                pg_password: '0523',
                pg_db: 'todo',
            },
        },
        {
            name: 'projectName-pd',
            script: './backend/server.js',
            instances: -1, // 클러스터 모드
            watch: false,
            env: {
                Server_PORT: 80, //Express PORT
                NODE_ENV: 'development',
                pg_host: 'localhost',
                pg_port: 5432,
                pg_user: 'postgres',
                pg_password: '0523',
                pg_db: 'todo',
            },
        },
    ],
};
