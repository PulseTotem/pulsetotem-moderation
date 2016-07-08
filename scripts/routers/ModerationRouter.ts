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
        connection.collection(DatabaseConnection.COLLECTION_BLACKLIST).createIndex({content: "text"},{unique: true});

        this.router.post('/text', function (req : any, res : any) { self.moderateText(req, res); });
    }

    moderateText(req : any, res : any) {
        var connection = DatabaseConnection.getConnection();

        if (connection == null) {
            Logger.error("The service is not connected to a DB.");
            res.status(500).send({'error': 'DB not connected.'});
        } else {
            var stringToModerate : string = req.body.data;

            var request = {
                $text: {
                    $search: stringToModerate,
                    $language: "fr"
                },
                'content-type': 'word'
            };

            Logger.debug("Request : "+JSON.stringify(request));

            connection.collection(DatabaseConnection.COLLECTION_BLACKLIST).find(request).toArray(function (err, result) {
                if (result.length > 0) {
                    res.status(403).send({'error': 'The phrase should be moderate.'});
                } else {
                    res.status(200).send({'success': 'ok'});
                }
            });
        }
    }
}