const path = require('path');

module.exports = {
  entry: './src/index.jsx', // React 入口文件
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',   // 输出文件名
  },
  resolve: {
    extensions: ['.js', '.jsx'], // 支持js和jsx
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react'
            ],
          },
        },
      },
    ],
  },
  target: 'electron-renderer', // 针对 Electron 环境
  devtool: false
};
