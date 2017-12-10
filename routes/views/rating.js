const keystone = require("keystone");
const { calculateRating } = require("../../services/rating-service");


exports = module.exports = function (req, res) {
    const view = new keystone.View(req, res);
    const locals = res.locals;

    locals.section = "rating";

    view.on("init", async function (next) {
        locals.rating = await calculateRating();
        next();
    });

    view.render("rating");
};
