"use strict";

var bbManagement = angular.module('bbManagement', ['ui.router', 'ngMaterial', 'ngMessages', 'firebase', 'ngAnimate'])


/*=============================================>>>>>
= Theme setup =
===============================================>>>>>*/

bbManagement.config(function ($mdThemingProvider) {
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
= UI-Router =
===============================================>>>>>*/

bbManagement.config(function ($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise('/dashboard');
	$stateProvider
		.state('login', {
			url: '/',
			data: {
				title: "BlinkBoard"
			},
			templateUrl: 'ui-router/login.html'
		})
		.state('dashboard', {
			url: '/dashboard',
			data: {
				title: "Dashboard"
			},
			templateUrl: 'ui-router/dashboard.html'
		})
		.state('dashboard.unit', {
			url: '/:unitID',
			data: {
				title: "Unit"
			},
			views: {
				"@": {
					templateUrl: 'ui-router/dashboard.unit.html'
				}
			}
		});
});


/*=============================================>>>>>
= Main Controller =
===============================================>>>>>*/

bbManagement.controller('ManagementController', ['$scope', '$location', '$state', '$timeout', '$http', '$firebaseObject', '$mdDialog', '$mdMedia', '$mdToast', '$firebaseAuth', '$q',
	function ($scope, $location, $state, $timeout, $http, $firebaseObject, $mdDialog, $mdMedia, $mdToast, $firebaseAuth, $q) {

		/*----------- Data -----------*/

		// Firebase connection
		firebase.initializeApp({
			apiKey: env.FIREBASE_APIKEY,
			authDomain: env.FIREBASE_AUTHDOMAIN,
			databaseURL: env.FIREBASE_DATABASEURL
		});

		// Get all data
		function getData() {
			// Show spinner
			$scope.loading = true;

			// Get data with the authorized uid
			var firebaseUserRef = firebase.database()
				.ref('users/' + $scope.uid + '/');

			// Get user/unit data
			firebaseUserRef.once("value", function (user) {
				// Check if user has any data
				if (user.val() === null) {
					console.log('no units');

					$scope.units = {};

					// Hide spinner
					$scope.loading = false;
					$scope.$digest();
				} else {
					// Data-related promises
					var promises = [];

					// Get unit data for each owned unit
					angular.forEach(user.val()
						.units,
						function (key, unitID) {
							// 1 promise per unit
							var unitPromise = $q.defer();

							// Connection to specific unit
							var firebaseUnitRef = firebase.database()
								.ref('units/' + unitID + '/');

							firebaseUnitRef.once("value", function (unit) {
								// Construct corrctly formattet unit object
								var unitObject = {};
								unitObject[unitID] = unit.val();

								// Resolve unit promise
								unitPromise.resolve(unitObject);
							});

							// Push promise ahead
							promises.push(unitPromise.promise);
						});

					// When all unit data is ready
					$q.all(promises)
						.then(function (units) {
							// Populate units object
							$scope.units = {};

							// Convert returned array into object of objects
							for (var i = units.length - 1; i >= 0; i--) {
								var currentKey = Object.keys(units[i])[0];

								$scope.units[currentKey] = units[i][currentKey];
							}

							// Hide spinner
							$scope.loading = false;
						});
				}
			});

			// Get the viewerModels data
			var firebaseViewerModelsRef = firebase.database()
				.ref('viewerModels/');

			firebaseViewerModelsRef.once("value", function (viewerModels) {
				$scope.viewerModels = viewerModels.val();

				// Parse pattern strings to regex (ng-pattern requires regex)
				angular.forEach($scope.viewerModels, function (configuration, type) {
					angular.forEach(configuration.parameters, function (value, parameter) {
						$scope.viewerModels[type].parameters[parameter] = new RegExp($scope.viewerModels[type].parameters[parameter]);
					});
				});
			});
		}

		// Listen for authorization changes
		$firebaseAuth()
			.$onAuthStateChanged(function (user) {
				console.log('auth state changed');

				if (user) {
					// If authorized
					console.log('authorized', user.uid);

					// Expose UID
					$scope.uid = user.uid;

					getData();

					// Go to dashboard state if coming from login state
					if ($scope.$state.current.name === 'login') {
						$state.go('dashboard');
					}
				} else {
					// If not authorized
					console.log('not authorized');

					// Clean $scope
					$scope.viewerModels = null;
					$scope.uid = null;

					// Go to login state
					$state.go('login');
				}
			});


		/*----------- Log in/out functions -----------*/

		// Log in
		$scope.login = function (email, password) {
			// Show spinner
			$scope.loading = true;

			// Authenticate and get data
			$firebaseAuth()
				.$signInWithEmailAndPassword(email, password)
				.catch(function (error) {
					$scope.loading = false;

					alert(error);
				});
		}

		// Log out
		$scope.logout = function () {
			// Unauthenticate
			$firebaseAuth()
				.$signOut();
		}


		/*----------- State-change stuff -----------*/

		// Access $state from DOM
		$scope.$state = $state;

		$scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
			// Close any dialogues
			$mdDialog.cancel();
		});

		$scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
			// Set title on page based on state
			$scope.title = toState.data.title;
		});


		/*----------- Unit functions -----------*/

		// Configure unit dialogue
		$scope.unitSettings = function () {
			$mdDialog.show({
				templateUrl: 'templates/dialogues/unitSettings.html',
				hasBackdrop: true,
				clickOutsideToClose: true,
				controller: function (scope, $mdDialog) {
					// Make the unitID and a copy of the unit-object available to the service
					scope.unitID = $state.params.unitID;
					scope.unit = angular.copy($scope.units[$state.params.unitID]);

					scope.save = function (updatedUnit) {
						// Make connection to /units
						var firebaseUnitRef = firebase.database()
							.ref('units/' + $state.params.unitID + '/');

						// Save new unit to /units
						firebaseUnitRef.set(updatedUnit)
							.then(function () {
								// Refresh data
								getData();

								// Close dialogue
								$mdDialog.cancel();
							});
					}

					scope.close = function () {
						$mdDialog.cancel();
					}

					scope.delete = function () {
						// Remove unit from /users
						var firebaseUserRef = firebase.database()
							.ref('users/' + $scope.uid + '/');

						firebaseUserRef.child('units')
							.child($state.params.unitID)
							.remove()
							.then(function () {
								// Refresh data
								getData();

								// Close dialogue
								$mdDialog.cancel();

								$state.go('dashboard');
							});
					}
				}
			});
		}

		// Add unit dialogue
		$scope.addUnit = function () {
			$mdDialog.show({
				templateUrl: 'templates/dialogues/addUnit.html',
				hasBackdrop: true,
				clickOutsideToClose: true,
				controller: function (scope, $mdDialog) {
					scope.save = function (id, name) {
						// Construct unit object
						var newUnit = {
							"name": name,
							"size": {
								height: 1080,
								width: 1920
							},
							"fontsize": 20,
							"viewers": {}
						};

						// Save unit to /users
						var firebaseUserRef = firebase.database()
							.ref('users/' + $scope.uid + '/');

						firebaseUserRef.child('units')
							.child(id)
							.set('undefined')
							.then(function () {
								// Make connection to /units
								var firebaseUnitRef = firebase.database()
									.ref('units/' + id + '/');

								// Check if unitID already exists (has been previously created)
								firebaseUnitRef.once("value", function (unit) {
									// Didn't exist
									if (unit.exists() === false) {
										// Save new unit to /units
										firebaseUnitRef.set(newUnit)
											.then(function () {
												// Refresh data
												getData();

												// Close dialogue
												$mdDialog.cancel();
											});
									} else {
										// Did exists
										// Refresh data
										getData();

										// Close dialogue
										$mdDialog.cancel();

										// Show toast
										$timeout(function () {
											var toast = $mdToast.simple()
												.textContent("Unit already existed (" + unit.child('name')
													.val() + ").");
											$mdToast.show(toast);
										}, 500);
									}
								});
							});
					}

					scope.close = function () {
						$mdDialog.cancel();
					}
				}
			});
		}


		/*----------- Viewer functions -----------*/

		// Configure viewer
		$scope.viewerSettings = function (key) {
			$mdDialog.show({
				templateUrl: 'templates/dialogues/viewerSettings.html',
				hasBackdrop: true,
				clickOutsideToClose: true,
				controller: function (scope, $mdDialog) {
					// Make key, a copy of the viewer-object, and the viewerModels available to the service
					scope.key = key;
					scope.viewer = angular.copy($scope.units[$state.params.unitID].viewers[key]);
					scope.viewerModels = $scope.viewerModels;

					scope.save = function (updatedViewer) {
						// Make connection to /units
						var firebaseUnitRef = firebase.database()
							.ref('units/' + $state.params.unitID + '/');

						// Save viewer to /units
						firebaseUnitRef.child('viewers')
							.child(key)
							.set(updatedViewer)
							.then(function () {
								// Refresh data
								getData();

								// Close dialogue
								$mdDialog.cancel();
							});
					}

					scope.close = function () {
						$mdDialog.cancel();
					}

					scope.delete = function () {
						// Make connection to /units
						var firebaseUnitRef = firebase.database()
							.ref('units/' + $state.params.unitID + '/');

						// Remove viewer from /units
						firebaseUnitRef.child('viewers')
							.child(key)
							.remove()
							.then(function () {
								// Refresh data
								getData();

								// Close dialogue
								$mdDialog.cancel();
							});
					}
				}
			});
		}

		$scope.addViewer = function () {
			$mdDialog.show({
				templateUrl: 'templates/dialogues/addViewer.html',
				hasBackdrop: true,
				clickOutsideToClose: true,
				controller: function (scope, $mdDialog) {
					// Make data available to the service
					scope.viewerModels = $scope.viewerModels;

					scope.save = function (viewerData) {
						// Construct correctly formed viewer object
						var newViewer = {
							type: viewerData.type,
							configuration: viewerData.configuration,
							placement: {
								x: 10,
								y: 10
							},
							size: {
								height: $scope.viewerModels[viewerData.type].size.height,
								width: $scope.viewerModels[viewerData.type].size.width
							}
						};

						// Make connection to /units
						var firebaseUnitRef = firebase.database()
							.ref('units/' + $state.params.unitID + '/');

						// Save new viewer to /units
						firebaseUnitRef.child('viewers')
							.child(Date.now()) // use timestamp as key
							.set(newViewer)
							.then(function () {
								// Refresh data
								getData();

								// Close dialogue
								$mdDialog.cancel();
							});
					}

					scope.close = function () {
						$mdDialog.cancel();
					}
				}
			});
		}

		$scope.addViewers = function () {
			$mdDialog.show({
				templateUrl: 'templates/dialogues/addViewers.html',
				hasBackdrop: true,
				clickOutsideToClose: true,
				controller: function (scope, $mdDialog) {
					// Make data available to the service
					scope.viewerModels = $scope.viewerModels;
					scope.units = angular.copy($scope.units);

					// Set initial state
					scope.viewersData = {};
					scope.viewersData.state = 'configureViewer';

					scope.save = function (viewersData) {
						// Hide spinner
						$scope.loading = true;
						// Construct correctly formed viewer object
						var newViewer = {
							type: viewersData.viewerData.type,
							configuration: viewersData.viewerData.configuration,
							placement: {
								x: 10,
								y: 10
							},
							size: {
								height: $scope.viewerModels[viewersData.viewerData.type].size.height,
								width: $scope.viewerModels[viewersData.viewerData.type].size.width
							}
						}

						// Data-related promises
						var promises = [];

						// Get unit data for each owned unit
						angular.forEach(viewersData.selectedUnits,
							function (value, unitID) {
								// Only proceed if box is checked
								if (value === true) {
									// 1 promise per unit
									var unitPromise = $q.defer();

									// Connection to specific unit
									var firebaseUnitRef = firebase.database()
										.ref('units/' + unitID + '/');

									// Save new viewer to unit
									firebaseUnitRef.child('viewers')
										.child(Date.now()) // use timestamp as key
										.set(newViewer)
										.then(function () {
											// Resolve unit promise
											unitPromise.resolve();
										});

									// Push promise ahead
									promises.push(unitPromise.promise);
								}
							});

						// When all viewers are saved
						$q.all(promises)
							.then(function () {
								// Refresh data
								getData();

								// Close dialogue
								$mdDialog.cancel();
							});
					}

					scope.close = function () {
						$mdDialog.cancel();
					}
				}
			});
		}

		$scope.listViewers = function () {
			$mdDialog.show({
				templateUrl: 'templates/dialogues/listViewers.html',
				hasBackdrop: true,
				clickOutsideToClose: true,
				controller: function (scope, $mdDialog) {
					// Make a copy of the current unit-object available to the service
					scope.unit = angular.copy($scope.units[$state.params.unitID]);

					scope.goToViewer = function (key) {
						$mdDialog.cancel();

						$scope.viewerSettings(key);
					}

					scope.close = function () {
						$mdDialog.cancel();
					}
				}
			});
		}
	}
]);
