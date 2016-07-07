/**
 * @author Simon Urli <simon@pulsetotem.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/Server.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />
/// <reference path="./routers/CRUDRouter.ts" />
/// <reference path="./routers/ModerationRouter.ts" />
/// <reference path="./core/DatabaseConnection.ts" />

class PulseTotemModeration extends Server {

    constructor(listeningPort : number, arguments : Array<string>) {
        super(listeningPort, arguments);

        this.init();
    }

    init = function() {
        var self = this;

        var success = function () {
            self.addAPIEndpoint("crud", CRUDRouter);
            self.addAPIEndpoint("moderate", ModerationRouter);
        };

        DatabaseConnection.connect(success);
    }
}

/**
 * Server's PulseTotemStats listening port.
 *
 * @property _The6thScreenBackendListeningPort
 * @type number
 * @private
 */
var _PulseTotemModerationListeningPort : number = process.env.PORT || 13000;

/**
 * Server's PulseTotemStats command line arguments.
 *
 * @property _PulseTotemStatsArguments
 * @type Array<string>
 * @private
 */
var _PulseTotemModerationArguments : Array<string> = process.argv;

var serverInstance = new PulseTotemModeration(_PulseTotemModerationListeningPort, _PulseTotemModerationArguments);
serverInstance.run();