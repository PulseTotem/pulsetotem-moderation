/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../../t6s-core/core-backend/scripts/Logger.ts" />

var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;


/**
 * Contains Database Connection information.
 *
 * @class DatabaseConnection
 */
class DatabaseConnection {

	public static DEFAULT_COLLECTION : string = "default";

	/**
     * Host.
     *
     * @property host
     * @type string
     * @static
     */
    static host : string = "";

    /**
     * Port.
     *
     * @property port
     * @type number
     * @static
     */
    static port : number = -1;

	static database : string = "";

	static login : string = "";

	static password : string = "";

	static dbHandler : any = null;

    /**
     * Retrieve connection information from file description.
     *
     * @method retrieveConnectionInformation
     * @static
     */
    static retrieveConnectionInformation() {
        if(DatabaseConnection.host == "" && DatabaseConnection.port == -1) {
            var file = __dirname + '/connection_infos.json';


			try {
				var connectionInfos = JSON.parse(fs.readFileSync(file, 'utf8'));
				DatabaseConnection.host = connectionInfos.host;
				DatabaseConnection.port = parseInt(connectionInfos.port);
				DatabaseConnection.database = connectionInfos.database;
				DatabaseConnection.login = connectionInfos.login;
				DatabaseConnection.password = connectionInfos.password;
			} catch (e) {
				Logger.error("Connection configuration file can't be read.");
				//TODO ? Throw Exception ?
			}
        }
    }

	static getConnection() {
		return DatabaseConnection.dbHandler;
	}

    static connect(callback : Function) {
		if (DatabaseConnection.dbHandler != null) {
			callback();
		}

		DatabaseConnection.retrieveConnectionInformation();
		var mongoUrl = "mongodb://";

		if (DatabaseConnection.login != "") {
			mongoUrl += DatabaseConnection.login+":"+DatabaseConnection.password+"@";
		}
		mongoUrl += DatabaseConnection.host+":"+DatabaseConnection.port+"/"+DatabaseConnection.database;

		MongoClient.connect(mongoUrl, function(err, db) {
			if (err != null) {
				Logger.error("Error while connecting database :");
				Logger.error(err);
			} else {
				Logger.debug("Successfully connected to mongoDB "+DatabaseConnection.host+":"+DatabaseConnection.port+"/"+DatabaseConnection.database+" with user "+DatabaseConnection.login);
			}

			DatabaseConnection.dbHandler = db;
			callback();
		});
	}
}