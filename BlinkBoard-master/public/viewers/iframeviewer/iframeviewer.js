"use strict";

bbUnit.controller('IframeviewerController', ['$scope', '$timeout', '$http', '$interval', '$sce',
	function ($scope, $timeout, $http, $interval, $sce) {

		// Check if all configuration values are defined
		if ($scope.data.configuration.updatefrequency === undefined) {
			return;
		}
		if ($scope.data.configuration.url === undefined) {
			return;
		}

		// Get scrollbar size
		function getScrollBarWidth() {
			var inner = document.createElement('p');
			inner.style.width = "100%";
			inner.style.height = "200px";

			var outer = document.createElement('div');
			outer.style.position = "absolute";
			outer.style.top = "0px";
			outer.style.left = "0px";
			outer.style.visibility = "hidden";
			outer.style.width = "200px";
			outer.style.height = "150px";
			outer.style.overflow = "hidden";
			outer.appendChild(inner);

			document.body.appendChild(outer);
			var w1 = inner.offsetWidth;
			outer.style.overflow = 'scroll';
			var w2 = inner.offsetWidth;
			if (w1 == w2) w2 = outer.clientWidth;

			document.body.removeChild(outer);

			return (w1 - w2);
		};

		// Set scrollbar difference
		var scrollbarSize = getScrollBarWidth();

		$scope.containerWidth = (parseInt($scope.data.size.width) + parseInt(scrollbarSize))
			.toString();
		$scope.containerHeight = (parseInt($scope.data.size.height) + parseInt(scrollbarSize))
			.toString();

		// Update url
		function updateURL() {
			// Hack to refresh iframe
			$scope.url = $sce.trustAsResourceUrl("/blank");

			setTimeout(function () {
				$scope.url = $sce.trustAsResourceUrl($scope.data.configuration.url);
			}, 100);
		}

		// Watch for url changes and refresh url
		$scope.$watch('data.configuration.url', function () {
			updateURL();
		});

		// $interval to refresh data
		var interval = $interval(updateURL, ($scope.data.configuration.updatefrequency * 1000));

		// Watch for updatefrequency changes ($interval has to be canceled and then recreated each time)
		$scope.$watch("data.configuration.updatefrequency", function () {
			// Cancel existing interval
			$interval.cancel(interval);

			// Refresh iframe
			$scope.url = $sce.trustAsResourceUrl("");
			updateURL();

			// Set new $interval with new updateFrequency
			interval = $interval(updateURL, ($scope.data.configuration.updatefrequency * 1000));
		});
	}
]);

// Stockviewer directive
bbUnit.directive('iframeviewer', function () {
	return {
		controller: 'IframeviewerController',
		templateUrl: '/viewers/iframeviewer/iframeviewer.html',
		scope: {
			data: '='
		}
	};
});
