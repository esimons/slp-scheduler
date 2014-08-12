/**
 * Created by Evan on 7/24/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('classesCtrl', function($scope, $modal, caseloadService){

        var defaultConstraintTypes = [
            'lunch',
            'recess'
        ];

        $scope.classes = {
            list: caseloadService.classes.list,
            selected: null,
            select: function(classy){
                this.selected = classy;
                //$scope.eventSources = [classy.constraints];
            },
            isSelected: function(classy){
                if(this.selected === classy)
                    $scope.classCalendar.fullCalendar('render');
                return this.selected === classy;
            },
            delete: function(index){
                var arr = $scope.classes.list.splice(index, 1);
                if(this.selected == arr[0]){ this.selected = null; }
            }
        };

        $scope.openNewClassModal = function(){
            var modalInstance = $modal.open({
                templateUrl: 'app/classes/classesModal/newClassModal.html',
                controller: 'newClassModal',
                resolve: {
                    classes: function(){ return caseloadService.classes.list; }
                }
            });

            modalInstance.result.then(function(classy){
                $scope.classes.list.push(classy);
                $scope.classes.select(classy);
            })
        };

        $scope.openNewConstraintModal = function(initEvent){
            var modalInstance = $modal.open({
                templateUrl: 'app/shared/addConstraintModal/addConstraintModal.html',
                controller: 'addConstraintModalCtrl',
                resolve: {
                    events: function(){ return $scope.classes.selected; },
                    constraintTypes: function(){ return defaultConstraintTypes; },
                    initEvent: function(){ return initEvent; }
                }
            });
        };

        $scope.calendarConfig = {
            height: 450,
            editable: true,
            header: {
                left: '',
                center: '',
                right: ''
            },
            defaultView: 'agendaWeek',
            year: 0,
            month: 0,
            date: 1,
            columnFormat: {
                month: 'ddd',    // Mon
                week: 'ddd', // Mon
                day: 'dddd'  // Monday
            },
            dayClick: calendarOnClick,
            eventDrop: angular.noop,
            eventResize: angular.noop
        };

        function calendarOnClick(event, allDay, jsEvent, view){
            if($scope.classes.selected){
                $scope.openNewConstraintModal({start:event, end: allDay?undefined:new Date(event.getTime() + 1800000), allDay: allDay});
            }
        }

        $scope.events = [];
        $scope.eventSources = [$scope.events];

    });