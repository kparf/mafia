var keystone = require("keystone");
var Types = keystone.Field.Types;

/**
 * Menu Item Model
 */

var MenuItem = new keystone.List("MenuItem", {
    map : { name : "title" },
    autokey : { path : "slug", from : "title", unique : true }
});

MenuItem.add({
    index : {
        type : Number
    },
    title : {
        type : String,
        requred : true
    },
    state : {
        type : Types.Select,
        options : "draft, published, archived",
        default : "draft",
        index : true
    },
    page : {
        type : Types.Relationship,
        ref : "Page"
    },
    customLink : {
        label : "Custom Link",
        type : Types.Url
    }
});


MenuItem.schema.virtual("link").get(function () {
    return this.page.slug || this.customLink;
});

MenuItem.defaultSort = "indext";
MenuItem.defaultColumns = "title, index|10%, state|22%, page|22%, customLink|22%";
MenuItem.register();
