const CopyWebpackPlugin = require('copy-webpack-plugin');
const { IgnorePlugin, NormalModuleReplacementPlugin } = require('webpack');
const path = require('path')

const nextConfig = {
  webpack(config, { isServer }) {
    // EUI uses some libraries and features that don't work outside of a
    // browser by default. We need to configure the build so that these
    // features are either ignored or replaced with stub implementations.
    if (isServer) {
      config.externals = config.externals.map(eachExternal => {
        if (typeof eachExternal !== 'function') {
          return eachExternal;
        }

        return (context, callback) => {
          if (
            context.request.indexOf('@elastic/eui') > -1 ||
            context.request.indexOf('react-ace') > -1
          ) {
            return callback();
          }

          return eachExternal(context, callback);
        };
      });

      // Replace `react-ace` with an empty module on the server.
      // https://webpack.js.org/loaders/null-loader/
      config.module.rules.push({
        test: /react-ace/,
        use: 'null-loader',
      });

      // Mock HTMLElement on the server-side
      const definePluginId = config.plugins.findIndex(
        p => p.constructor.name === 'DefinePlugin'
      );

      config.plugins[definePluginId].definitions = {
        ...config.plugins[definePluginId].definitions,
        HTMLElement: function () {},
      };
    }

    config.resolve.mainFields = ['module', 'main'];

    return config;
  }
}

module.exports = nextConfig
