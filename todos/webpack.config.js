import * as path from "path";
import webpack from "webpack"
import miniCssExtractPlugin from "mini-css-extract-plugin"

export default ({url, port}) =>
    ({
        mode: process.env.node_env,
        entry: ['@babel/polyfill', './frontend/src/app.js', './frontend/src/app.styl'],
        output: {
            filename: 'app.bundle.js',
            path: path.resolve(process.cwd(), 'frontend/dist'),
            publicPath: `${url}:${port}/dist`
        },
        module: {
            rules: [
                {
                    test: /\.(png|jpg)$/,
                    use: ['file-loader']
                },
                {
                    test: /\.(styl|css)$/,
                    use: [
                        miniCssExtractPlugin.loader,
                        'css-loader',
                        'stylus-loader'
                    ]
                }
            ],
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            new miniCssExtractPlugin({filename: "app.bundle.css"})
        ]
    })
