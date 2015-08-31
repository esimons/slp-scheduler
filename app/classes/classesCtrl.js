/**
 * Created by Evan on 7/24/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('classesCtrl', function($scope, $modal, caseloadService, uiCalendarConfig) {

        var defaultConstraintTypes = [
            'lunch',
            'recess'
        ];

        $scope.classes = {
            list: caseloadService.classes.list,
            selected: null,
            select: function(classy) {
                var events = $scope.classConstraints.events;
                events.splice(0, events.length);
                if (classy) {
                    _.each(classy.constraints, function(constraint){
                        events.push(_.clone(constraint));
                    });
                }
                this.selected = classy;
            },
            isSelected: function(classy) {
                return this.selected === classy;
            },
            delete: function(index) {
                var arr = $scope.classes.list.splice(index, 1);
                if (this.selected == arr[0]) {
                    this.select(null);
                }
                delete caseloadService.idMap[arr[0].slpId];                
            }
        };

        $scope.openNewClassModal = function() {
            var modalInstance = $modal.open({
                templateUrl: 'app/classes/classesModal/newClassModal.html',
                controller: 'newClassModal'
            });

            modalInstance.result.then(function(classy) {
                $scope.classes.list.push(classy);
                $scope.classes.select(classy);
            })
        };

        $scope.openNewConstraintModal = function(date) {
            var modalInstance = $modal.open({
                templateUrl: 'app/shared/addConstraintModal/addConstraintModal.html',
                controller: 'addConstraintModalCtrl',
                resolve: {
                    constraintTypes: function() {
                        return defaultConstraintTypes;
                    },
                    date: function() {
                        return date;
                    }
                }
            });
            modalInstance.result.then(function(event) {
                $scope.classes.selected.constraints.push(event);
                $scope.classConstraints.events.push(_.clone(event));
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
            allDaySlot: false,
            defaultDate: moment(new Date(0,0,1)),
            columnFormat: {
                month: 'ddd', // Mon
                week: 'ddd', // Mon
                day: 'dddd' // Monday
            },
            dayClick: calendarOnClick,
            eventDrop: eventUpdate,
            eventResize: eventUpdate,
            timezone: 'local'
        };

        function calendarOnClick(date, jsEvent, view) {
            if ($scope.classes.selected) {
                $scope.openNewConstraintModal(date);
            }
        }

        function eventUpdate(event, delta, revertFunc, jsEvent, ui, view) {
            var index = _.findIndex($scope.classConstraints.events, { _id: event._id }),
                constraint = $scope.classes.selected.constraints[index];
            constraint.start = event.start;
            constraint.end = event.end;
        }

        $scope.classConstraints = {
            events: [],
            editable: true,
            color: '#3A87AD'
        };
        $scope.eventSources = [$scope.classConstraints];

    });
