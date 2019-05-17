const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'print-manager-v2-example': './example/print-manager-v2-example.js',
    'print-manager-v3-example': './example/print-manager-v3-example.js'
  },

  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  },

  module: {
    rules: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      use: 'babel-loader'
    }]
  },

  plugins: [
    new CopyWebpackPlugin([{
      from: path.resolve('assets/info.json')
    },
    ]),

  ]
};
