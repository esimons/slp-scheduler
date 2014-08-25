/**
 * Created by Evan on 8/11/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('addConstraintModalCtrl', function($scope, constraintTypes, initEvent){
        var defaultStart = new Date(90, 0, 1, 12, 0);
        var defaultEnd = new Date(90, 0, 1, 12, 30);
        $scope.options = constraintTypes;
        $scope.event = initEvent || {title:null, start:defaultStart, end:defaultEnd, allDay:false};
        $scope.days = [
            new Date(0,0,1), //Monday
            new Date(0,0,2), //Tuesday
            new Date(0,0,3), //Wednesday
            new Date(0,0,4), //Thursday
            new Date(0,0,5), //Friday
            new Date(0,0,6), //Saturday
            new Date(0,0,7)  //Sunday
        ];
        $scope.selected = {
            day: initEvent ? $scope.days[initEvent.start.getDate()-1] : $scope.days[0],
            startTime: $scope.event.start,
            endTime: $scope.event.end
        };
        $scope.$watch('selected.day', function(newVal){
            if(newVal){
                $scope.event.start.setDate(newVal.getDate());
                $scope.event.end.setDate(newVal.getDate());
            }
        });
        $scope.$watch('selected.startTime', function(newVal){
            if(newVal){ setTime(newVal, $scope.event.start); }
        });
        $scope.$watch('selected.endTime', function(newVal){
            if(newVal){ setTime(newVal, $scope.event.end); }
        });

        function setTime(watchObj, targetObj){
            targetObj.setHours(watchObj.getHours());
            targetObj.setMinutes(watchObj.getMinutes());
        }
    });