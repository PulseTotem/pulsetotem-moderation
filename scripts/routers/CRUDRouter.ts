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
        connection.collection(DatabaseConnection.DEFAULT_COLLECTION).createIndex({content: "text"},{unique:true});

        this.router.get('/', function (req : any, res : any) { self.retrieveContent(req, res); });
        this.router.get('/:type', function (req : any, res : any) { self.retrieveContent(req, res); });
        this.router.get('/:type/:contenttype', function (req : any, res : any) { self.retrieveContent(req, res); });
        this.router.post('/:type/:contenttype', function (req : any, res : any) { self.insertContent(req, res); });
        this.router.delete('/', function (req : any, res : any) { self.deleteContent(req, res); });
    }

    retrieveContent(req : any, res : any) {
        var connection = DatabaseConnection.getConnection();

        var request = null;
        if (req.params.type || req.params.contenttype) {
            request = {};

            if (req.params.type) {
                request['type'] = req.params.type;
            }

            if (req.params.contenttype) {
                request['content-type'] = req.params.contenttype;
            }
        }

        if (connection == null) {
            Logger.error("The service is not connected to a DB.");
            res.status(500).send({'error': 'DB not connected.'});
        } else {
            connection.collection(DatabaseConnection.DEFAULT_COLLECTION).find(request).toArray(function(err, result) {
                if (err != null) {
                    Logger.error("Error while getting data from moderation list");
                    Logger.error(err);

                    res.status(500).send({'error': 'Error while getting data from moderation list'});
                } else {
                    Logger.debug("Retrieve data from moderation list");
                    res.status(200).send(result);
                }
            });
        }
    }

    insertContent(req : any, res : any) {
        var connection = DatabaseConnection.getConnection();

        if (req.params.type != 'blacklist' && req.params.type != 'whitelist') {
            res.status(403).send({'error':'Only type value blacklist or whitelist is authorized.'});
        } else if (req.params.contenttype != 'id' && req.params.contenttype != 'username' && req.params.contenttype != 'word') {
            res.status(403).send({'error': 'Only contenttype value id, username or word is authorized.'});
        } else if (req.params.type == 'whitelist' && req.params.contenttype == 'word') {
            res.status(403).send({'error': 'Whitelisted word are not authorized.'});
        } else {

            if (connection == null) {
                Logger.error("The service is not connected to a DB.");
                res.status(500).send({'error': 'DB not connected.'});
            } else {
                var content : any = req.body.content;
                var language : any = req.body.language;

                if (typeof(content) === "string") {
                    var data = {
                        'type': req.params.type,
                        'content-type': req.params.contenttype,
                        'language': language, // language is mandatory in order to index correctly the words
                        'content': content
                    };

                    connection.collection(DatabaseConnection.DEFAULT_COLLECTION).insert(data, function (err,result) {
                        if (err != null) {
                            Logger.error("Error while inserting data in list: "+JSON.stringify(data));
                            Logger.debug(err);
                            res.status(500).send({'error': 'Error while inserting data in list'});
                        } else {
                            Logger.debug("Insert data in list");
                            res.status(200).send({'success': 'ok'});
                        }
                    });
                } else {
                    Logger.info("Trial to insert data with an incorrect type (not string): "+JSON.stringify(content));
                    res.status(403).send({'error': 'The content you post must be a string.'});
                }
            }
        }
    }

    deleteContent(req : any, res : any) {
        var connection = DatabaseConnection.getConnection();

        if (connection == null) {
            Logger.error("The service is not connected to a DB.");
            res.status(500).send({'error': 'DB not connected.'});
        } else {
            var contentId : any = new ObjectId(req.body.id);

            var request = {
                _id: contentId
            };

            connection.collection(DatabaseConnection.DEFAULT_COLLECTION).removeOne(request, function (err,result) {
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