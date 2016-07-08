/**
 * @author Simon Urli <simon@pulsetotem.fr>
 */

/// <reference path="../core/DatabaseConnection.ts" />
/// <reference path="../../t6s-core/core-backend/scripts/server/RouterItf.ts" />

var ObjectId = require('mongodb').ObjectId;

class CRUDRouter extends RouterItf {

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
        // Unicity is managed on plural forms of the content with uppercase or not.
        connection.collection(DatabaseConnection.COLLECTION_BLACKLIST).createIndex({content: "text"},{unique:true});

        this.router.get('/blacklist/:type', function (req : any, res : any) { self.retrieveBlacklistedContent(req, res); });
        this.router.post('/blacklist/:type', function (req : any, res : any) { self.insertBlacklistedContent(req, res); });
        this.router.delete('/blacklist', function (req : any, res : any) { self.deleteBlacklistedContent(req, res); });
    }

    retrieveBlacklistedContent(req : any, res : any) {
        var connection = DatabaseConnection.getConnection();

        if (connection == null) {
            Logger.error("The service is not connected to a DB.");
            res.status(500).send({'error': 'DB not connected.'});
        } else {
            connection.collection(DatabaseConnection.COLLECTION_BLACKLIST).find({'content-type':req.params.type}).toArray(function(err, result) {
                if (err != null) {
                    Logger.error("Error while getting data from blacklist");
                    Logger.error(err);

                    res.status(500).send({'error': 'Error while getting data from blacklist'});
                } else {
                    Logger.debug("Retrieve data from blacklist");
                    res.status(200).send(result);
                }
            });
        }
    }

    insertBlacklistedContent(req : any, res : any) {
        var connection = DatabaseConnection.getConnection();

        if (connection == null) {
            Logger.error("The service is not connected to a DB.");
            res.status(500).send({'error': 'DB not connected.'});
        } else {
            var word : any = req.body.word;
            var language : any = req.body.language;

            if (typeof(word) === "string") {
                var data = {
                    'type': 'blacklist',
                    'content-type': req.params.type,
                    'language': language, // language is mandatory in order to index correctly the words
                    'content': word
                };

                connection.collection(DatabaseConnection.COLLECTION_BLACKLIST).insert(data, function (err,result) {
                    if (err != null) {
                        Logger.error("Error while inserting data in blacklist: "+JSON.stringify(data));
                        Logger.debug(err);
                        res.status(500).send({'error': 'Error while inserting data in blacklist'});
                    } else {
                        Logger.debug("Insert data in blacklist");
                        res.status(200).send({'success': 'ok'});
                    }
                });
            } else {
                Logger.info("Trial to insert data with an incorrect type (not string): "+JSON.stringify(word));
                res.status(403).send({'error': 'The word you post is not a string.'});
            }
        }
    }

    deleteBlacklistedContent(req : any, res : any) {
        var connection = DatabaseConnection.getConnection();

        if (connection == null) {
            Logger.error("The service is not connected to a DB.");
            res.status(500).send({'error': 'DB not connected.'});
        } else {
            var contentId : any = new ObjectId(req.body.id);

            var request = {
                _id: contentId
            };

            connection.collection(DatabaseConnection.COLLECTION_BLACKLIST).removeOne(request, function (err,result) {
                if (err != null) {
                    Logger.error("Error while removing data from blacklist");
                    Logger.debug(err);
                    res.status(500).send({'error': 'Error while removing data from blacklist'});
                } else {
                    if (result.result.n == 0) {
                        Logger.info("No data has been removed. Data id: "+req.body.id);
                        res.status(404).send({'error':'Data cannot be found to be removed.'});
                    } else if (result.result.n > 1) {
                        Logger.error("More than one data has been removed !");
                        Logger.error(JSON.stringify(result.result));
                    } else {
                        Logger.debug("Remove data from blacklist");
                        res.status(200).send({'success': 'ok'});
                    }
                }
            });
        }
    }
}