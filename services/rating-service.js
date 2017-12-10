const keystone = require("keystone");
const Game = keystone.list("Game");
const Player = keystone.list("Player");

const BEST_MOVE_3_POINTS = 1;
const BEST_MOVE_2_POINTS = 0.5;


const bestPlayerStatistic = async (from, to) => {

    const bestPlayerStats = await Game.model.aggregate()
        .group({
            _id : "$bestPlayer",
            points : {
                $sum : "$bestPlayerPoints"
            }
        }).exec();

    return bestPlayerStats.reduce((bestPlayerMap, bestPlayerStat) => {

        if (!bestPlayerStat._id) {
            return bestPlayerMap;
        }

        const playerId = bestPlayerStat._id.toString();
        if (bestPlayerMap.has(playerId)) {
            bestPlayerMap.set(playerId, bestPlayerMap.get(playerId) + bestPlayerStat.points);
        } else {
            bestPlayerMap.set(playerId, bestPlayerStat.points);
        }
        return bestPlayerMap;
    }, new Map());
};

const bestMoveStatistic = async (from, to) => {

    const games = await Game.model.find().exec();
    return games.map(game => {
        const mafiaPlayers = [
            ...game.mafia.map(player => player.toString()),
            game.don.toString()
        ];
        const bestMoveCount = game.bestMove.reduce((count, player) => {
            if (mafiaPlayers.includes(player.toString())) {
                return count + 1;
            } else {
                return count;
            }
        }, 0);

        let bestMovePoints = 0;
        if (bestMoveCount === 3) {
            bestMovePoints = BEST_MOVE_3_POINTS;
        } else if (bestMoveCount === 2) {
            bestMovePoints = BEST_MOVE_2_POINTS;
        }

        return {
            firstKilled : game.firstKilled,
            bestMovePoints
        };
    }).reduce(([bestMoveMap, firstKilledMap], game) => {

        if (!game.firstKilled) {
            return [bestMoveMap, firstKilledMap];
        }

        const firstKilledId = game.firstKilled.toString();
        if (bestMoveMap.has(firstKilledId)) {
            bestMoveMap.set(firstKilledId, bestMoveMap.get(firstKilledId) + game.bestMovePoints);
            firstKilledMap.set(firstKilledId, firstKilledMap.get(firstKilledId) + 1);
        } else {
            bestMoveMap.set(firstKilledId, game.bestMovePoints);
            firstKilledMap.set(firstKilledId, 1);
        }
        return [bestMoveMap, firstKilledMap];
    }, [new Map(), new Map()]);
};

const getCiviliansStatistic = async (from, to) => {

    const win = Game.model.aggregate()
        .unwind("civilians")
        .match({
            winner : "civilians"
        })
        .group({
            _id : "$civilians",
            count : {
                $sum : 1
            }
        }).exec();
    const defeat = Game.model.aggregate()
        .unwind("civilians")
        .match({
            winner : "mafia"
        })
        .group({
            _id : "$civilians",
            count : {
                $sum : 1
            }
        }).exec();

    return Promise.all([
        win,
        defeat
    ]);
};

const getMafiaStatistic = async (from, to) => {
    const win = Game.model.aggregate()
        .unwind("mafia")
        .match({
            winner : "mafia"
        })
        .group({
            _id : "$mafia",
            count : {
                $sum : 1
            }
        }).exec();
    const defeat = Game.model.aggregate()
        .unwind("mafia")
        .match({
            winner : "civilians"
        })
        .group({
            _id : "$mafia",
            count : {
                $sum : 1
            }
        }).exec();

    return Promise.all([
        win,
        defeat
    ]);
};

const getSheriffStatistic = async (from, to) => {
    const win = Game.model.aggregate()
        .match({
            winner : "civilians"
        })
        .group({
            _id : "$sheriff",
            count : {
                $sum : 1
            }
        }).exec();
    const defeat = Game.model.aggregate()
        .match({
            winner : "mafia"
        })
        .group({
            _id : "$sheriff",
            count : {
                $sum : 1
            }
        }).exec();

    return Promise.all([
        win,
        defeat
    ]);
};

const getDonStatistic = async (from, to) => {
    const win = Game.model.aggregate()
        .match({
            winner : "mafia"
        })
        .group({
            _id : "$don",
            count : {
                $sum : 1
            }
        }).exec();
    const defeat = Game.model.aggregate()
        .match({
            winner : "civilians"
        })
        .group({
            _id : "$don",
            count : {
                $sum : 1
            }
        }).exec();

    return Promise.all([
        win,
        defeat
    ]);
};

/**
 * While the returns of all players
 * @param from
 * @param to
 */
const getPlayedUsers = async (from, to) => {
    return Player.model.find({}, { nickname : 1 }).exec();
};

const calculateRating = async (from, to) => {

    const [
        [
            winCiviliansStatistic,
            defeatCiviliansStatistic
        ],
        [
            winMafiaStatistic,
            defeatMafiaStatistic
        ],
        [
            winSheriffStatistic,
            defeatSheriffStatistic
        ],
        [
            winDonStatistic,
            defeatDonStatistic
        ],
        players
    ] = await Promise.all([
        getCiviliansStatistic(),
        getMafiaStatistic(),
        getSheriffStatistic(),
        getDonStatistic(),
        getPlayedUsers()
    ]);

    const winCiviliansStatisticMap = convertToMap(winCiviliansStatistic);
    const defeatCiviliansStatisticMap = convertToMap(defeatCiviliansStatistic);
    const winMafiaStatisticMap = convertToMap(winMafiaStatistic);
    const defeatMafiaStatisticMap = convertToMap(defeatMafiaStatistic);
    const winSheriffStatisticMap = convertToMap(winSheriffStatistic);
    const defeatSheriffStatisticMap = convertToMap(defeatSheriffStatistic);
    const winDonStatisticMap = convertToMap(winDonStatistic);
    const defeatDonStatisticMap = convertToMap(defeatDonStatistic);

    const [
        bestMoveStatisticMap,
        firstKilledMap
    ] = await bestMoveStatistic();
    const bestPlayerStatisticMap = await bestPlayerStatistic();

    const stats = players.map(player => {
        const playerId = player._id.toString();
        let stat = {
            id : playerId,
            nickname : player.nickname,
            winCivilians : winCiviliansStatisticMap.has(playerId) ? winCiviliansStatisticMap.get(playerId).count : 0,
            defeatCivilians : defeatCiviliansStatisticMap.has(playerId) ? defeatCiviliansStatisticMap.get(playerId).count : 0,
            winMafia : winMafiaStatisticMap.has(playerId) ? winMafiaStatisticMap.get(playerId).count : 0,
            defeatMafia : defeatMafiaStatisticMap.has(playerId) ? defeatMafiaStatisticMap.get(playerId).count : 0,
            winSheriff : winSheriffStatisticMap.has(playerId) ? winSheriffStatisticMap.get(playerId).count : 0,
            defeatSheriff : defeatSheriffStatisticMap.has(playerId) ? defeatSheriffStatisticMap.get(playerId).count : 0,
            winDon : winDonStatisticMap.has(playerId) ? winDonStatisticMap.get(playerId).count : 0,
            defeatDon : defeatDonStatisticMap.has(playerId) ? defeatDonStatisticMap.get(playerId).count : 0,
            bestMove : bestMoveStatisticMap.has(playerId) ? bestMoveStatisticMap.get(playerId) : 0,
            firstKilledCount : firstKilledMap.has(playerId) ? firstKilledMap.get(playerId) : 0,
            bestPlayer : bestPlayerStatisticMap.has(playerId) ? bestPlayerStatisticMap.get(playerId) : 0
        };
        stat = {
            ...stat,
            winCount : stat.winCivilians + stat.winMafia + stat.winSheriff + stat.winDon,
            defeatCount : stat.defeatCivilians + stat.defeatMafia + stat.defeatSheriff + stat.defeatDon,
        };

        const gameCount = stat.winCount + stat.defeatCount;
        let winPercentage = 0;
        if (gameCount > 0) {
            winPercentage = stat.winCount / gameCount * 100;
        }

        return {
            ...stat,
            rating : calculate(stat),
            winPercentage
        };
    });

    return stats.sort((a, b) => {
        return b.rating - a.rating;
    });
};

function calculate (stat) {

    const countGames = stat.winCount + stat.defeatCount;
    if (countGames === 0) {
        return 0;
    }

    const points = stat.winCivilians * 3
                   + stat.winMafia * 3
                   + stat.winSheriff * 4
                   + stat.defeatDon * 5
                   + stat.bestMove
                   + stat.bestPlayer
                   - stat.defeatSheriff
                   - stat.defeatDon;
    return points / countGames * 100 + (0.25 * countGames);
}

function convertToMap (array) {
    return array.reduce((accumulator, value) => {
        return accumulator.set(value._id.toString(), value);
    }, new Map());
}

module.exports = {
    getCiviliansStatistic,
    getMafiaStatistic,
    getSheriffStatistic,
    getDonStatistic,
    getPlayedUsers,
    calculateRating
};
