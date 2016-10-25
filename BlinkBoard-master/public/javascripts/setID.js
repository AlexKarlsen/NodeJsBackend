"use strict";

var bbSetID = angular.module('bbSetID', ['ngSanitize', 'ngMaterial', 'ngMessages', 'ngAnimate']);


/*=============================================>>>>>
= Theme setup =
===============================================>>>>>*/

bbSetID.config(function ($mdThemingProvider) {
	$mdThemingProvider.theme('default')
		.primaryPalette('grey', {
			'default': '900'
		})
		.accentPalette('indigo', {
			'default': '500'
		})
		.warnPalette('deep-orange', {
			'default': '900'
		});
});


/*=============================================>>>>>
= Master controller =
===============================================>>>>>*/

bbSetID.controller('SetIDController', ['$scope', '$http',
	function ($scope, $http) {
		// Check if unitID exists in the localstorage
		if (localStorage.unitID !== undefined) { // does exist
			// Make available to the DOM
			$scope.unitID = localStorage.unitID;
		}

		// Display current ID in the DOM
		$scope.currentID = localStorage.unitID;

		// Generate and set new ID
		$scope.newID = function () {
			$http.get('/generateid')
				.then(function (data, status, headers, config) {
					localStorage.unitID = data.data;

					// Update currentID
					$scope.currentID = localStorage.unitID;
				});
		}
	}
]);
