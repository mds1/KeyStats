const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: ['babel-polyfill', './src/main.js'],
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Output Management',
            template: 'index.html'
        })
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
                exclude: /node_modules/,
            }, {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ['file-loader'],
                exclude: /node_modules/
            }
        ]
    },
    output: {
        filename: './keystats-dist.js',
        path: path.resolve(__dirname, 'dist')
    }
};