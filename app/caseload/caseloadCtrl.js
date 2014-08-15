/**
 * Created by Evan on 7/18/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('caseloadCtrl', function($scope, $modal, caseloadService){

        var defaultConstraintTypes = [
            'lunch',
            'recess'
        ];

        $scope.students = {
            list: caseloadService.students.list,
            selected: null,
            select: function(student){
                this.selected = student;
                $scope.studentEvents.events = student.constraints;
                $scope.classEvents.events = student.class ? angular.copy(student.class.constraints) : [];
            },
            isSelected: function(student){
                return this.selected === student;
            },
            delete: function(index){
                var arr = $scope.students.list.splice(index, 1);
                if(this.selected == arr[0]){ this.selected = null; }
            }
        };

        $scope.updateApptCount = function(number, index){
            var student = $scope.students.selected;
            var appts = student.serviceAppts[index];
            if(appts.length < number){ appts.addNew(); }
            else if(appts.length > number) { appts.remove(); }
        };

        $scope.openNewStudentModal = function(){
            var modalInstance = $modal.open({
                templateUrl: 'app/caseload/studentModal/newStudentModal.html',
                controller: 'newStudentModal',
                resolve: {
                    classes: function(){ return caseloadService.classes.list; }
                }
            });

            modalInstance.result.then(function(student){
                $scope.students.list.push(student);
                $scope.students.select(student);
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
                $scope.students.selected.constraints.push(event);
                $scope.studentEvents.events = $scope.students.selected.constraints;
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
            if($scope.students.selected){
                $scope.openNewConstraintModal({start:event, end: allDay?undefined:new Date(event.getTime() + 1800000), allDay: allDay});
            }
        }

        $scope.studentEvents = {
            events: []
        };
        $scope.classEvents = {
            events: [],
            editable: false,
            color: 'gray'
        };
        $scope.eventSources = [$scope.studentEvents, $scope.classEvents];

    });