/**
 * Created by Evan on 8/11/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('addConstraintModalCtrl', function($scope, constraintTypes, date){
        $scope.options = constraintTypes;
        $scope.days = [
            moment(new Date(0,0,7)), //Sunday
            moment(new Date(0,0,1)), //Monday
            moment(new Date(0,0,2)), //Tuesday
            moment(new Date(0,0,3)), //Wednesday
            moment(new Date(0,0,4)), //Thursday
            moment(new Date(0,0,5)), //Friday
            moment(new Date(0,0,6))  //Saturday
        ];
        // if no date provided, just set up some defaults
        if (!date) { date = moment($scope.days[1]).hours(8); }
        var allDay = !date.hasTime(),
            start = !allDay ? date : undefined,
            end = !allDay ? moment(date).add(30, 'minutes') : undefined;
        $scope.selected = {
            day: $scope.days[date.day()],
            startTime: start ? start.toDate() : undefined,
            endTime: end ? end.toDate() : undefined,
            allDay: allDay
        };
        $scope.event = {
            start: start,
            end: end,
            allDay: allDay
        };
        $scope.$watch('selected.day', function(newVal){
            if(newVal){
                $scope.event.start.day(newVal.day());
                $scope.event.end.day(newVal.day());
            }
        });
        $scope.$watch('selected.startTime', function(newVal){
            if(newVal){ setTime(newVal, $scope.event.start); }
        });
        $scope.$watch('selected.endTime', function(newVal){
            if(newVal){ setTime(newVal, $scope.event.end); }
        });

        function setTime(watchObj, targetObj){
            targetObj.hours(watchObj.getHours());
            targetObj.minutes(watchObj.getMinutes());
        }
    });