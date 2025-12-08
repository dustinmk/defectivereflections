const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const web_template = require("../web/index.html");

const production = process.env.NODE_ENV === "production"
const root = path.resolve(__dirname, "..");

const postcss_options = {
    postcssOptions: {
        plugins: [
            [
                "postcss-preset-env"
            ]
        ]
    }
}

const common_config = {
    mode: production
        ? "production"
        : "development",
    devtool: "inline-source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: postcss_options
                    }
                ]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: postcss_options
                    },
                    "sass-loader"
                ]
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)?$/,
                type: "asset/resource",
                generator: {
                    filename: "fonts/[hash][ext][query]"
                }
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
            common: path.resolve(root, "common"),
            desktop: path.resolve(root, "desktop"),
            mobile: path.resolve(root, "mobile"),
            server: path.resolve(root, "server"),
            web: path.resolve(root, "web"),
        }
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "index.[hash].css"
        })
    ],
    externals: {
        knex: "knex",
        express: "express"
    }
}

const web_config = {...common_config, ...{
    entry: "./web/index.ts",
    output: {
        path: path.resolve(root, "dist", "web"),
        filename: "index.[hash].js"
    },
    plugins: [...common_config.plugins, ...[
        new HtmlWebpackPlugin({
            templateContent: web_template,
            filename: "index.html"
        })
    ]],
    devServer: {
        static: {
          directory: path.join(__dirname, "..", "dist"),
        },
        compress: true,
        port: 8001,
    }
}}

const server_config = {...common_config, ...{
    entry: "./server/index.ts",
    target: "node",
    output: {
        path: path.resolve(root, "dist", "server"),
        filename: "server.js"
    }
}}

module.exports = [
    web_config,
    server_config
]