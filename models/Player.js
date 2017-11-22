var keystone = require("keystone");
var Types = keystone.Field.Types;

/**
 * Player Model
 * ==========
 */
var Player = new keystone.List("Player");

Player.add({
    nickname : {
        type : String,
        required : true,
        initial : true
    },
    name : {
        type : Types.Name
    }
});


/**
 * Registration
 */
Player.defaultColumns = "name, nickname";
Player.register();
