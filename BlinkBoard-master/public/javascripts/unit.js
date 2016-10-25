"use strict";

var bbUnit = angular.module('bbUnit', ['firebase']);


/*=============================================>>>>>
= Master unit controller =
===============================================>>>>>*/

bbUnit.controller('UnitController', ['$scope', '$firebaseObject', '$compile',
	function ($scope, $firebaseObject, $compile) {

		// Make unitID available
		$scope.unitID = localStorage.getItem('unitID');

		// Firebase for this specific unit
		firebase.initializeApp({
			apiKey: env.FIREBASE_APIKEY,
			authDomain: env.FIREBASE_AUTHDOMAIN,
			databaseURL: env.FIREBASE_DATABASEURL
		});

		var firebaseUnitRef = firebase.database()
			.ref('units/' + $scope.unitID + '/');

		// Bind the unit data to the $scope
		var fireObject = $firebaseObject(firebaseUnitRef);
		fireObject.$bindTo($scope, 'unit')
			.then(function () {
				console.log($scope.unit);
			});
	}
])


/*=============================================>>>>>
= General viewer directive which creates the actual viewer directives using $compile =
===============================================>>>>>*/

bbUnit.directive('viewer', function ($compile) {
	return {
		scope: {
			data: "="
		},
		link: function (directiveScope, element) {
			var html = '<' + directiveScope.data.type + ' class="viewer" data="data"></' + directiveScope.data.type + '>';
			element.append($compile(html)(directiveScope));
		}
	};
});
