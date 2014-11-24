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
                $scope.eventSources[0] = new StudentEvents(student.constraints);
                $scope.eventSources[1] = student.class ? new ClassEvents(student.class.constraints) : new ClassEvents();
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
                $scope.eventSources[0] = new StudentEvents($scope.students.selected.constraints);
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
                $scope.openNewConstraintModal(new BlankEvent(event, allDay));
            }
        }

        function BlankEvent(event, allDay){
            this.start = event;
            this.end = allDay?undefined:new Date(event.getTime() + 1800000);
            this.allDay = allDay;
            this.self = this;
        }

        function updateEvent(event, dayDelta, minuteDelta){
            event.orig.start = event.start;
            event.orig.end = event.end;
        }

        function StudentEvents(eventsArr) {
            this.events = eventsArr ? angular.copy(eventsArr) : [];
            for(var i=0; i<eventsArr.length; i++){
                this.events[i].orig = eventsArr[i];
            }
        }

        function ClassEvents(eventsArr) {
            var events = this.events = [];
            angular.forEach(eventsArr, function(event){
                delete event.__uiCalId;
                delete event.className;
                events.push(event);
            });
            this.editable = false;
            this.color = 'gray';
        }

        $scope.eventSources = [];

    });