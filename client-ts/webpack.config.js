const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/main.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProduction ? "[name].[contenthash].js" : "[name].js",
      clean: true,
      publicPath: "./",
    },
    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@/core": path.resolve(__dirname, "src/core"),
        "@/systems": path.resolve(__dirname, "src/systems"),
        "@/types": path.resolve(__dirname, "src/types"),
        "@/utils": path.resolve(__dirname, "src/utils"),
        "@/config": path.resolve(__dirname, "src/config"),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/images/[name].[contenthash][ext]",
          },
        },
        {
          test: /\.(mp3|wav|ogg)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/audio/[name].[contenthash][ext]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        filename: "index.html",
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "../client/assets"),
            to: path.resolve(__dirname, "dist/assets"),
          },
        ],
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      compress: true,
      port: 3000,
      open: true,
      hot: true,
      historyApiFallback: true,
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
    optimization: {
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
        },
      },
    },
  };
};
