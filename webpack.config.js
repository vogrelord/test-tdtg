var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var autoreset = require('postcss-autoreset');
var initial = require('postcss-initial');
var autoprefixer = require('autoprefixer');


module.exports = {
  entry: [
    //'webpack-dev-server/client?http://localhost:3000',
    //'webpack/hot/only-dev-server',
    './front/index'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    //new webpack.HotModuleReplacementPlugin(),
    new ExtractTextPlugin('style.css', { allChunks: true }),
    new webpack.ProvidePlugin({
        React: "react",
    })
  ],

  postcss: function () {
        return [autoprefixer];
  },

  module: {
    loaders: [{
        test: /\.js$/,
        loaders: ['babel'],
        include: path.join(__dirname, 'front'),
        exclude: 'node_modules'
      },
      { test: /\.css$/, 
          loader: ExtractTextPlugin.extract('style-loader', 'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss-loader'),
          include: path.join(__dirname, 'front')
      },
      { test: /\.css$/, 
          loader: ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader'),
          include: path.join(__dirname, 'node_modules'),
      },

      { test: /\.svg$/, loader: "url-loader?limit=10000&mimetype=image/svg+xml" }
    ]
  }
};
