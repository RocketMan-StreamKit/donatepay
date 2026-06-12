const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './index.ts',
  target: 'web',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    chunkFormat: 'array-push',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: path.join(__dirname, 'tsconfig.json'),
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'logo.png', to: 'logo.png', noErrorOnMissing: true },
        { from: 'logo.svg', to: 'logo.svg', noErrorOnMissing: true },
      ],
    }),
  ],
  node: false,
  optimization: {
    splitChunks: false,
    runtimeChunk: false,
    minimize: false,
  },
};
