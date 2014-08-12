/**
 * Created by Evan on 7/18/2014.
 */
angular.module('easy-slp-scheduler')
    .directive('navbar', function($state, testdataService, caseloadService){
        return {
            templateUrl: 'app/navbar/navbar.html',
            scope: {},
            link: function(scope, element, attrs){
                scope.$state = $state;
            }
        }
    });