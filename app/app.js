/**
 * Created by Evan on 7/17/2014.
 */
angular.module('easy-slp-scheduler', [
    'ui.bootstrap',
    'ui.calendar',
    'ui.router',
    'ngToast',
    'angularBootstrapNavTree'
])
    .config(function($stateProvider, $urlRouterProvider, ngToastProvider){
        $urlRouterProvider.otherwise('/caseload');

        $stateProvider
            .state('classes', {
                url: '/classes',
                templateUrl: 'app/classes/classes.html',
                controller: 'classesCtrl'
            })
            .state('services', {
                url: '/services',
                templateUrl: 'app/services/services.html',
                controller: 'servicesCtrl'
            })
            .state('caseload', {
                url: '/caseload',
                templateUrl: 'app/caseload/caseload.html',
                controller: 'caseloadCtrl'
            })
            .state('schedule', {
                url: '/schedule',
                templateUrl: 'app/schedule/schedule.html',
                controller: 'scheduleCtrl'
            });

        ngToastProvider.configure({horizontalPosition: 'center'});
    });

