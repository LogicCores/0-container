
const VERBOSE = false;

const WAITFOR = require("waitfor");
const REQUEST = require("request");
const RUNBASH = require("runbash");


function main (callback) {

    function getRepoInfo (callback) {
        return RUNBASH([
            'echo "URL:$(git config --get remote.origin.url)"'
        ], {
            exports: {
                "URL": true
            }
        }).then(function (result) {
            var m = result.exports.URL.match(/^git(?:@|:\/\/)github\.com(?::|\/)([^\/]+)\/([^\/]+?)\.git$/);
            if (!m) {
                return callback(new Error("Origin URL '" + result.exports.URL + "' not supported! Only github is supported right now!"));
            }
            return callback(null, {
                username: m[1],
                reponame: m[2]
            });
        }).catch(callback);
    }

    return getRepoInfo(function (err, info) {
        if (err) return callback(err);

        function makeRequest (method, endpoint, body, callback) {
            if (typeof body === "function" && typeof callback === "undefined") {
                callback = body;
                body = null;
            }
            // @see https://circleci.com/docs/api
            var url = "https://circleci.com/api/v1/project/" + info.username + "/" + info.reponame + endpoint + "?circle-token=" + process.env.Z0_BUILD_CIRCLECI_API_TOKEN;
            if (VERBOSE) console.log("Making request to:", url);
            if (method === "GET") {
                return REQUEST({
                    method: "GET",
                    url: url,
                    json: true
                }, function (err, response, body) {
                    if (err) return callback(err);
                    return callback(null, response.body);
                });
            } else
            if (method === "POST") {
                return REQUEST({
                    method: "POST",
                    url: url,
                    json: true,
                    body: body
                }, function (err, response, body) {
                    if (err) return callback(err);
                    return callback(null, response.body);
                });
            } else {
                return callback(new Error("Unknown method '" + method + "'!"));
            }
        }

        function listExisting (callback) {
            return makeRequest("GET", "/envvar", callback);
        }
        
        function setOrUpdate (name, value) {
            return makeRequest("POST", "/envvar", {
                name: name,
                value: value
            }, callback);
        }

//        return listExisting(function (err, existing) {
//            if (err) return callback(err);

            var waitfor = WAITFOR.parallel(callback);

// TODO: Store variables in cache so we can detect changes.
//            var existingVariables = {};
/*
            doc.env.global.forEach(function (obj) {
                var key = Object.keys(obj).shift();
                existingVariables[key] = obj[key];
            });
*/

            process.argv.slice(2).forEach(function (pair) {
                var pairParts = pair.split("=");
                var name = pairParts.shift();
                var value = pairParts.join("=");
                waitfor(function (callback) {
                    return setOrUpdate(name, value, callback);
                });
            });
            return waitfor();
//        });
    });
}


main(function (err) {
    if (err) {
        console.error(err.stack);
        process.exit(1);
    }
    process.exit(0);
});

