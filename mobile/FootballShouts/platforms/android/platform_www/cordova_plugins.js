cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "id": "cordova-sqlite-ext.SQLitePlugin",
        "file": "plugins/cordova-sqlite-ext/www/SQLitePlugin.js",
        "pluginId": "cordova-sqlite-ext",
        "clobbers": [
            "SQLitePlugin"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-jade": "0.0.1",
    "cordova-plugin-whitelist": "1.3.2",
    "cordova-sqlite-ext": "0.10.4"
};
// BOTTOM OF METADATA
});