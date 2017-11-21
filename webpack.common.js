const path = require('path');
// const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    entry: ['babel-polyfill', './src/main.js'],
    // plugins: [
    //     new CleanWebpackPlugin(['dist']),
    // ],
    module: {
        // loaders: [
        //     { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
        // ],
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