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
                $scope.classEvents.events = classy.constraints;
            },
            isSelected: function(classy){
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
                controller: 'newClassModal'
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
                    constraintTypes: function(){ return defaultConstraintTypes; },
                    initEvent: function(){ return initEvent; }
                }
            });
            modalInstance.result.then(function(event){
                $scope.classes.selected.constraints.push(event);
                $scope.classEvents.events = $scope.classes.selected.constraints;
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
            weekends: false,
            year: 1990,
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

        $scope.classEvents = {
            events: []
        };
        $scope.eventSources = [$scope.classEvents];

    });