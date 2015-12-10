
const PATH = require('path');
const FS = require('fs');
const CRYPTO = require("crypto");
const WAITFOR = require("waitfor");
const YAML = require('js-yaml');
const TRAVIS_ENCRYPT = require('travis-encrypt');


function main (callback) {

    var travisFile = PATH.join(process.cwd(), ".travis.yml");
    if (process.env.VERBOSE) console.log("travisFile:", travisFile);
    
    return FS.readFile(travisFile, 'utf8', function (err, data) {
        if (err) return callback(err);

        var doc = YAML.safeLoad(FS.readFileSync(travisFile, 'utf8'));
        var changed = false;

        var waitfor = WAITFOR.parallel(function (err) {
            if (err) return callback(err);
            if (!changed) {
                return callback(null);
            }
            if (process.env.VERBOSE) console.log("Writing to travisFile:", travisFile);
            return FS.writeFile(travisFile, YAML.safeDump(doc), "utf8", callback);
        });
        
        if (!doc.env) {
            doc.env = {};
        }
        if (!doc.env.global) {
            doc.env.global = [];
        }
        var existingVariables = {};
        doc.env.global.forEach(function (obj) {
            var key = Object.keys(obj).shift();
            existingVariables[key] = obj[key];
        });
        process.argv.slice(2).forEach(function (pair) {
            var pairParts = pair.split("=");
            var name = pairParts.shift();
            var value = pairParts.join("=");
            var hash = CRYPTO.createHash('sha256')
                        // TODO: Use configurable seed variables.
                        .update(process.env.PIO_PROFILE_KEY + ":" + process.env.PIO_PROFILE_SECRET + ":" + name + ":" + value)
                        .digest('hex')
                        .substring(0, 12);
            if (existingVariables["__" + name]) {
                var existingParts = existingVariables["__" + name].split(":");
                if (
                    existingParts.length !== 3 ||
                    existingParts[0] !== "secure"
                ) {
                    throw new Error("Variable '" + "__" + name + "' does not match expected format!");
                }
                if (existingParts[1] === hash) {
                    // Value has not changed.
                    return;
                }
                // Value has changed. Remove existing.
                var indexes = [];
                doc.env.global.forEach(function (obj, i) {
                    var varName = Object.keys(obj).shift();
                    var varValue = obj[varName];
                    if (
                        varName === "__" + name ||
                        (varName === "secure" && varValue.substring(0, 12) === existingParts[2])
                    ) {
                        indexes.push(i);
                    }
                });
                indexes.sort();
                indexes.reverse();
                indexes.forEach(function (index) {
                    doc.env.global.splice(index, 1);
                });
            }
            changed = true;
            waitfor(function (callback) {
                return TRAVIS_ENCRYPT('LogicCores/0', pair, undefined, undefined, function (err, blob) {
                    if (err) return callback(err);

                    var obj = {};
                    obj["__" + name] = "secure:" + hash + ":" + blob.substring(0, 12);
                    doc.env.global.push(obj);

                    obj = {};
                    obj["secure"] = blob;
                    doc.env.global.push(obj);

                    return callback(null);
                });
            });
        });
        return waitfor();
    });
}


main(function (err) {
    if (err) {
        console.error(err.stack);
        process.exit(1);
    }
    process.exit(0);
});

