/**
 * @author Simon Urli <simon@pulsetotem.fr>
 */

/// <reference path="../core/DatabaseConnection.ts" />
/// <reference path="../../t6s-core/core-backend/scripts/server/RouterItf.ts" />

class ModerationRouter extends RouterItf {

    constructor() {
        super();
    }

    buildRouter() {
        var self = this;

        var connection = DatabaseConnection.getConnection();

        if (connection == null) {
            Logger.error("The service is not connected to a DB.");
        }

        // The content field will contain data concerning words, username or id blacklisted.
        // We need to index this field in order to use search text with it.
        connection.collection(DatabaseConnection.DEFAULT_COLLECTION).createIndex({content: "text"},{unique: true});
        connection.collection(DatabaseConnection.DEFAULT_COLLECTION).createIndex({'content-type': 1});
        connection.collection(DatabaseConnection.DEFAULT_COLLECTION).createIndex({'type': 1});

        this.router.post('/', function (req : any, res : any) { self.moderateData(req, res); });
    }

    moderateData(req : any, res : any) {
        var connection = DatabaseConnection.getConnection();

        if (connection == null) {
            Logger.error("The service is not connected to a DB.");
            res.status(500).send({'error': 'DB not connected.'});
        } else {
            var username : string = req.body.username;
            var text : string = req.body.text;
            var id : string = req.body.id;
            var language : string = req.body.language;

            if (!language) {
                language = "fr";
            }

            if (!text) {
                text = "";
            }

            var requestWhitelist = {
                $or: [
                    {
                        'content': id,
                        'content-type': 'id',
                        'type': 'whitelist'
                    },
                    {
                        'content': username,
                        'content-type': 'username',
                        'type': 'whitelist'
                    }
                ]
            };

            var requestBlacklist = {
                $or: [
                    {
                        'content': id,
                        'content-type': 'id',
                        'type': 'blacklist'
                    },
                    {
                        'content': username,
                        'content-type': 'username',
                        'type': 'blacklist'
                    },
                    {
                        $text: {
                            $search: text,
                            $language: language
                        },
                        'content-type': 'word',
                        'type': 'blacklist'
                    }
                ]
            };

            var successCheckBlacklist = function (err, result) {
                if (err) {
                    Logger.error("Error while checking results from blacklist");
                    Logger.debug(requestBlacklist);
                    Logger.debug(err);
                    res.status(500).send({'error': 'Error while moderating'});
                } else {
                    if (result.length > 0) {
                        Logger.info("Detect blacklisted content");
                        Logger.info("Blacklist entry: "+JSON.stringify(result[0]));
                        Logger.info("Original content: "+JSON.stringify(req.body));
                        res.status(403).send({'error':'Blacklisted content'});
                    } else {
                        res.status(200).send({'success':'ok'});
                    }
                }
            };

            var successCheckWhitelist = function (err, result) {
                if (err) {
                    Logger.error("Error while checking results from whitelist");
                    Logger.debug(requestWhitelist);
                    Logger.debug(err);
                    res.status(500).send({'error': 'Error while moderating'});
                } else {
                    if (result.length > 0) {
                        Logger.info("Detect whitelisted content.");
                        res.status(200).send({'success':'ok'});
                    } else {
                        connection.collection(DatabaseConnection.DEFAULT_COLLECTION).find(requestBlacklist).toArray(successCheckBlacklist);
                    }
                }
            };

            connection.collection(DatabaseConnection.DEFAULT_COLLECTION).find(requestWhitelist).toArray(successCheckWhitelist);
        }
    }
}