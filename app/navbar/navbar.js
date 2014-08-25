/**
 * Created by Evan on 7/18/2014.
 */
angular.module('easy-slp-scheduler')
    .directive('navbar', function($state, caseloadService){
        return {
            templateUrl: 'app/navbar/navbar.html',
            scope: {},
            link: function(scope, element, attrs){
                scope.$state = $state;

                scope.file = {
                    menuIsOpen: false,
                    save: caseloadService.save,
                    load: caseloadService.load
                };
            }
        }
    });