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

        this.router.post('/', function (req : any, res : any) { self.moderateData(req, res); });
    }

    moderateData(req : any, res : any) {
        var connection = DatabaseConnection.getConnection();

        if (connection == null) {
            Logger.error("The service is not connected to a DB.");
            res.status(500).send({'error': 'DB not connected.'});
        } else {
            var stringToModerate : string = req.body;

            connection.collection(DatabaseConnection.COLLECTION_BLACKLIST).find({ $text: { $search: stringToModerate } }, function (err, result) {
                if (result.length > 0) {
                    res.status(403).send({'error': 'The phrase should be moderate.'});
                } else {
                    res.status(200).send({'success': 'ok'});
                }
            });
        }
    }
}