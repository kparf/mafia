const keystone = require("keystone");
const Types = keystone.Field.Types;

/**
 * Game model
 */

const Game = new keystone.List("Game", {
    map : { name : "title" }
});

Game.add({
    title : {
        label : "Заголовок",
        type : String,
        required : true
    },
    state : {
        label : "Состояние",
        type : Types.Select,
        options : "draft, published, archived",
        default : "draft",
        index : true
    },
    winner : {
        label : "Победитель",
        type : Types.Select,
        options : "mafia, civilians"
    },
    date : {
        label : "Дата проведения",
        type : Types.Date,
        index : true
    },
    civilians : {
        label : "Мирные жители",
        type : Types.Relationship,
        ref : "Player",
        many : true
    },
    mafia : {
        label : "Мафия",
        type : Types.Relationship,
        ref : "Player",
        many : true
    },
    don : {
        label : "Дон",
        type : Types.Relationship,
        ref : "Player"
    },
    sheriff : {
        label : "Шериф",
        type : Types.Relationship,
        ref : "Player"
    },
    firstKilled : {
        label : "Первый Убитый",
        type : Types.Relationship,
        ref : "Player"
    },
    bestMove : {
        label : "Лучший ход",
        type : Types.Relationship,
        ref : "Player",
        many : true
    },
    bestPlayer : {
        label : "Лучший Игрок",
        type : Types.Relationship,
        ref : "Player"
    },
    bestPlayerPoints : {
        label : "Очки за лучшего игрока",
        type : Types.Number
    }
});

Game.defaultColumns = "title, date|20%, state|20%";
Game.register();
