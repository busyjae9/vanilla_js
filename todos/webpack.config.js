import * as path from 'path';
import webpack from 'webpack';
import miniCssExtractPlugin from 'mini-css-extract-plugin';
import { InjectManifest } from 'workbox-webpack-plugin';

const workboxInject = new InjectManifest({
    swSrc: './frontend/serviceWorker.js',
    swDest: 'serviceWorker.js',
    maximumFileSizeToCacheInBytes: 1024 * 10 * 10 * 10 * 10,
});

const DEV = process.env.ENV === 'dev';
const PORT = DEV ? process.env.port_test : process.env.port;
const URL = process.env.url;

export default () => ({
    mode: process.env.ENV === 'dev' ? process.env.NODE_ENV : 'production',
    devtool: process.env.ENV === 'dev' ? 'source-map' : undefined,
    entry: ['@babel/polyfill', './frontend/src/app.js', './frontend/src/app.styl'],
    output: {
        filename: 'app.bundle.js',
        path: path.resolve(process.cwd(), 'frontend/dist'),
        publicPath: `/dist/`,
    },
    module: {
        rules: [
            {
                test: /\.(png|jpg)$/,
                use: ['file-loader'],
            },
            {
                test: /\.(styl|css)$/,
                use: [miniCssExtractPlugin.loader, 'css-loader', 'stylus-loader'],
            },
        ],
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new miniCssExtractPlugin({ filename: 'app.bundle.css' }),
        workboxInject,
    ],
});
