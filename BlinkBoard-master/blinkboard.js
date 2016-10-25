"use strict";

/********** .env **********/
require('dotenv')
	.config();

/********** Node Modules **********/
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var request = require('request');
var _ = require('lodash');
var uuid = require('node-uuid');

/********** My Modules **********/
var currencyviewer = require('./viewer_modules/currencyviewer');
var rssviewer = require('./viewer_modules/rssviewer');

/********** Actual blinkboard **********/
var blinkboard = express();

// view engine setup
blinkboard.set('views', path.join(__dirname, 'views'));
blinkboard.set('view engine', 'ejs');

blinkboard.use(bodyParser.json());
blinkboard.use(bodyParser.urlencoded({
	extended: true
}));
blinkboard.use(express.static(path.join(__dirname, 'public')));
blinkboard.use('/bower_components', express.static('bower_components'));

// blinkboards
blinkboard.get('/', function (req, res) {
	// Get array of viewer types
	request({
		url: process.env.FIREBASE_DATABASEURL + 'viewerModels.json',
		method: 'GET'
	}, function (error, response, body) {
		if (error) {
			console.log('error: ', error);
		} else {
			// Provide array of viewer types to the render function
			res.render('unit', {
				viewerTypes: _.keys(JSON.parse(body))
			});
		}
	});
});

blinkboard.get('/blank', function (req, res) {
	res.render('blank');
});

blinkboard.get('/management', function (req, res) {
	res.render('management');
});

blinkboard.get('/setid', function (req, res) {
	res.render('setID');
});

blinkboard.get('/generateid', function (req, res) {
	// Send generated UUID
	res.send(uuid.v1()
		.toUpperCase());
});


// Data
blinkboard.post('/currencyviewer.getData', function (req, res) {
	currencyviewer.getData(req, res);
});

blinkboard.post('/rssviewer.getData', function (req, res) {
	rssviewer.getData(req, res);
});

// Initialization
blinkboard.listen(process.env.PORT, function () {
	console.log('Listening on port ' + process.env.PORT);
});

module.exports = blinkboard;
