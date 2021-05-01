const rewire = require('rewire');
const defaults = rewire('react-scripts/scripts/build.js'); // If you ejected, use this instead: const defaults = rewire('./build.js')
let config = defaults.__get__('config');

config.optimization.splitChunks = {
	cacheGroups: {
		default: false
	}
};

config.optimization.runtimeChunk = false;

config.output.filename = 'static/js/[name].js';
config.output.chunkFilename = "static/js/[name].chunk.js";

config.plugins[5].options.filename = 'static/css/[name].css';
config.plugins[5].options.moduleFilename = () => 'static/css/main.css';