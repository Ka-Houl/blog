module.exports = {
    app: [
        {
            name: 'blog',
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
            repo: 'https://github.com/Ka-Houl/blog.git',
            // repo: 'git@github.com:Ka-Houl/blog.git',
            path: '/www/blog/production',
            'pre-deploy': 'git fetch --all',
            'post-deploy':
                'yarn install && npm run prd && pm2 startOrRestart deploy.config.js --env production',
        },
    },
};
