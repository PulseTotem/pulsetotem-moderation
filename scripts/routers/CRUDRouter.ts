/**
 * @author Simon Urli <simon@pulsetotem.fr>
 */

/// <reference path="../core/DatabaseConnection.ts" />
/// <reference path="../../t6s-core/core-backend/scripts/server/RouterItf.ts" />

class CRUDRouter extends RouterItf {

    constructor() {
        super();
    }

    buildRouter() {
        var self = this;

        this.router.get('/blacklist', function (req : any, res : any) { self.retrieveBlacklistedWords(req, res); });
    }

    retrieveBlacklistedWords(req : any, res : any) {
        var connection = DatabaseConnection.getConnection();

        if (connection == null) {
            Logger.error("The service is not connected to a DB.");
            res.status(500).send({'error': 'DB not connected.'});
        } else {
            connection.collection(DatabaseConnection.COLLECTION_BLACKLIST).findOne(function(err, result) {
                if (err != null) {
                    Logger.error("Error while getting data from blacklist");
                    Logger.error(err);

                    res.status(500).send({'error': 'Error while getting data from blacklist'});
                } else {
                    Logger.debug("Retrieve data from blacklist");
                    res.status(200).send(result.words);
                }
            });
        }
    }
}