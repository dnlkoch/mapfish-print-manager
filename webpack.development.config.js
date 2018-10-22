const merge = require('webpack-merge');
const commonConfig = require('./webpack.common.config.js');

module.exports = merge(commonConfig, {
  mode: 'development',
  devServer: {
    contentBase: './example',
    compress: true,
    port: 9000,
    proxy: {
      '/print/**': {
        target: {
          host: '127.0.0.1',
          port: 18082
        }
      }
    }
  }
});
