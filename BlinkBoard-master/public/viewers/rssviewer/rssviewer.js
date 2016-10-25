"use strict";

bbUnit.controller('RSSviewerController', ['$scope', '$timeout', '$http', '$interval',
	function ($scope, $timeout, $http, $interval) {

		// Check if all configuration values are defined
		if ($scope.data.configuration.updatefrequency === undefined) {
			return;
		}
		if ($scope.data.configuration.url === undefined) {
			return;
		}
		if ($scope.data.configuration.stories === undefined) {
			return;
		}

		// Check and set changed values
		function setChanged(prevData, newData) {
			// Construct object for change info
			var newDataChanged = newData;

			// Compare to previous data
			if (angular.equals(prevData.value, newData.value) === true) {
				newDataChanged.changed = false;
			} else {
				newDataChanged.changed = true;
			}

			return newDataChanged;
		}

		// Remove excess articles
		function setNumberOfStories(feed) {
			var updatedFeed = {
				value: [],
				name: feed.name
			};

			for (var i = parseInt($scope.data.configuration.stories) - 1; i >= 0; i--) {
				updatedFeed.value[i] = feed.value[i];
			}

			return updatedFeed;
		}

		// Format published parameters
		function formatPublished(feed) {
			for (var i = feed.value.length - 1; i >= 0; i--) {
				var publishedObject = {
					timeAgo: moment(feed.value[i].published)
						.local()
						.fromNow(),
					time: moment(feed.value[i].published)
						.local()
						.format('HH:mm')
				}

				feed.value[i].published = publishedObject;
			}

			return feed;
		}

		// Url
		$scope.url = '/rssviewer.getData';

		// Get initial data
		$http.post($scope.url, {
				'url': $scope.data.configuration.url
			})
			.then(function (data, status, headers, config) {
				// Save data for raw comparison
				$scope.rawData = data.data;

				// Set number of articles and format published parameters
				$scope.rssData = formatPublished(setNumberOfStories(angular.copy(data.data)));
			});

		// Function to get data
		function getData() {
			$http.post($scope.url, {
					'url': $scope.data.configuration.url
				})
				.then(function (data, status, headers, config) {
					// Only check for changes if existing data exists
					if ($scope.rawData !== undefined) {
						// Check and set changed values
						$scope.rssDataChanged = setChanged($scope.rawData, data.data);

						$timeout(function () {
							// Save data for raw comparison
							$scope.rawData = data.data;

							// Set number of articles and format published parameters
							$scope.rssData = formatPublished(setNumberOfStories(angular.copy(data.data)));

							$timeout(function () {
								// Reset changed info
								$scope.rssDataChanged = null;
							}, 2500);
						}, 2500);
					}
				});
		}

		// $interval to refresh data
		var interval = $interval(getData, ($scope.data.configuration.updatefrequency * 1000));

		// Watch for updatefrequency changes ($interval has to be canceled and then recreated each time)
		$scope.$watch("data.configuration.updatefrequency", function () {
			// Cancel existing interval
			$interval.cancel(interval);

			// Get new data
			getData();

			// Set new $interval with new updateFrequency
			interval = $interval(getData, ($scope.data.configuration.updatefrequency * 1000));
		});
	}
]);

// Stockviewer directive
bbUnit.directive('rssviewer', function () {
	return {
		controller: 'RSSviewerController',
		templateUrl: '/viewers/rssviewer/rssviewer.html',
		scope: {
			data: '='
		}
	};
});
