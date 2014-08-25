/**
 * Created by Evan on 7/27/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('newClassModal', function($scope, caseloadService){
        $scope.class = new caseloadService.Class();
    });