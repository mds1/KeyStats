const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    entry: ['babel-polyfill', './assets/js/main.js'],
    plugins: [
        new CleanWebpackPlugin(['dist']),
    ],
    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
        ],
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    output: {
        filename: './keystats-dist.js',
        path: path.resolve(__dirname, 'dist')
    }
};