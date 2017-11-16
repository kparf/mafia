const keystone = require("keystone");

const getMainMenuItems = async () => {
    const MenuItem = keystone.list("MenuItem");
    const items = await MenuItem.model.find()
                        .where("state", "published")
                        .sort("index")
                        .exec();
    const results = [];
    for (let item of items) {
        let href = item.customLink || item.slug;
        results.push({
            label : item.title,
            kay : item._id,
            href
        });
    }
    return results;
};

module.exports = {
    getMainMenuItems
};
