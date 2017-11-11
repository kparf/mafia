var keystone = require("keystone");
var Types = keystone.Field.Types;

/**
 * Page model
 */

var Page = new keystone.List("Page", {
	map : { name : "title" },
	autokey : {
		path : "slug",
		from : "title",
		unique : true
	}
});

Page.add({
	title : {
		type : String,
		required : true
	},
	state : {
		type : Types.Select,
		options : "draft, published, archived",
		default : "draft",
		index : true
	},
	publishedDate : {
		type : Types.Date,
		index : true,
		dependsOn : {
			state : "published"
		}
	},
	content : {
		type : Types.Html,
		wysiwyg : true,
		height : 1000
	}
});

Page.defaultColumns = "title, state|20%, publishedDate|20%";
Page.register();
