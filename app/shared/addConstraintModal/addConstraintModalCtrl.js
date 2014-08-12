/**
 * Created by Evan on 8/11/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('addConstraintModalCtrl', function($scope, events, constraintTypes, initEvent){
        var defaultStart = new Date(0, 0, 1, 12, 0);
        var defaultEnd = new Date(0, 0, 1, 12, 30);
        $scope.options = constraintTypes;
        $scope.event = initEvent || {title:null, start:defaultStart, end:defaultEnd, allDay:false};
    });