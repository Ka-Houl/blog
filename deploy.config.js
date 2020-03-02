module.exports = {
    app: [
        {
            name: 'xiaomi_mobile_pro',
            script: 'app.js',
            env: {
                COMMON_VARIABLE: 'true',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],

    deploy: {
        production: {
            user: 'root',
            host: '47.92.198.10',

            ref: 'origin/master',
            // repo: 'https://gitee.com/Ka-houl/xiaomi_mobile_pro.git',
            repo: 'git@github.com:Ka-Houl/blog.git',
            path: '/www/xiaomi_mobile_pro/production',
            'pre-deploy': 'git fetch --all',
            'post-deploy':
                'npm install && npm run prd && pm2 startOrRestart deploy.config.js --env production',
        },
    },
};
