var _ = require('underscore');

// sanity check arguments
var ENV = process.argv[2];
if (ENV != 'development' && ENV != 'production') {
  console.error("\n./app [environment]");
  console.error("environments: [development, production]");
  console.error("default environment set to: [development]");
  ENV = 'development';
  //process.exit(1);
}

// set Node.js app settings and boot
global.settings  = require(__dirname + '/settings');
var env          = require(__dirname + '/config/environments/' + ENV);
_.extend(global.settings, env);
 
var Neemo = require(global.settings.app_root + '/lib/neemo');

// Initialize tile server on port 4000
var ws = new Neemo.Server();
ws.listen(global.settings.neemo_port);

console.log("NEEMO is now being served out of: http://localhost:" + global.settings.neemo_port );
