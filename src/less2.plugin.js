// Modernized ES6+ version of docpad-plugin-less2
module.exports = function (BasePlugin) {
    class Less2Plugin extends BasePlugin {
        constructor(...args) {
            super(...args);

            // DocPad instance
            this.docpad = this.docpad;

            // always safe
            this._config = {};

            // Load LESS
            this.less = require('less');
        }

        get name() {
            return "less2";
        }

        /**
         * DocPad passes plugin config here.
         */
        setConfig(config) {
            console.log("Less2Plugin:setConfig()", config);

            // Store config safely
            this._config = config || {};

            return super.setConfig(config);
        }

        /**
         * Main render step
         */
        render(opts, next) {
            const { inExtension, outExtension, file } = opts;
            const config = this.getConfig();

            if (inExtension !== "less") {
                return next();
            }

            // LESS render options
            const lessOptions = {
                filename: file.get("fullPath"),
                ...config,
            };

            // Load plugins if configured
            if (lessOptions.plugins) {
                try {
                    const loaded = [];

                    for (const [pluginName, pluginOptions] of Object.entries(lessOptions.plugins)) {
                        const PluginClass = require(pluginName);
                        loaded.push(new PluginClass(pluginOptions));
                    }

                    lessOptions.plugins = loaded;
                } catch (err) {
                    return next(new Error("LESS plugin load failed: " + err.message));
                }
            }

            // Render LESS
            this.less.render(opts.content, lessOptions)
                .then(output => {
                    // Set compiled CSS
                    opts.content = output.css;

                    // Handle imported files
                    if (output.imports && output.imports.length > 0) {
                        file.setMetaDefaults({ referencesOthers: true });
                    }

                    return next();
                })
                .catch(err => {
                    return next(new Error(err));
                });
        }
    }

    return Less2Plugin;
};
