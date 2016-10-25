"use strict";

var request = require('request');
var _ = require('lodash');
var fs = require('fs');
var feed = require("feed-read");

// Visible object
module.exports = {
	getData: function (req, res) {
		try {
			feed(req.body.url, function (error, articles) {
				if (error) {
					console.log('error: ', error);
				} else {
					// Construct object for changed info
					var RSSfeed = {};
					RSSfeed.value = [];

					// Convert from array to object (with room for 'changed')
					for (var i = articles.length - 1; i >= 0; i--) {
						RSSfeed.value[i] = {
							title: articles[i].title,
							published: articles[i].published
								//content: articles[i].content,
								//link: articles[i].link
						}

						RSSfeed.name = articles[0].feed.name;
					}

					// Sort by published
					RSSfeed.value.sort(function (a, b) {
						return b.published - a.published;
					});

					res.send(RSSfeed);

					//console.log(Date.now(), 'got RSS data');
				}
			});
		} catch (error) {
			console.log('error: ', error);
		}
	}
}
