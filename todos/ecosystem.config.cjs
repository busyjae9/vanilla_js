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
            instance_var: 'INSTANCE_ID', // 편한 이름으로 설정하면 됩니다.
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
