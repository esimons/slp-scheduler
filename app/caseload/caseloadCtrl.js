/**
 * Created by Evan on 7/18/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('caseloadCtrl', function($scope, $modal, caseloadService){

        var defaultConstraintTypes = [
            'lunch',
            'recess',
            'math',
            'specialist',
            'misc'
        ];

        $scope.caseloadService = caseloadService;
        $scope.students = {
            list: caseloadService.students.list,
            selected: null,
            select: function(student){
                var studentEvents = $scope.studentConstraints.events,
                    classEvents = $scope.classConstraints.events;
                studentEvents.splice(0, studentEvents.length);
                classEvents.splice(0, classEvents.length);
                if (student) {
                    _.each(student.constraints, function(constraint){
                        studentEvents.push(_.clone(constraint));
                    });
                    // Need to do a full search to figure out what class a student belongs to?
                    // Should fix this. Don't really care if it causes cycles.
                    var classId = student.classId,
                        classy = classId ? caseloadService.idMap[classId] : null;
                    if (classy) {
                        _.each(classy.constraints, function(constraint){
                            classEvents.push(_.clone(constraint));
                        });                        
                    }
                }
                this.selected = student;
            },
            isSelected: function(student){
                return this.selected === student;
            },
            delete: function(index){
                var arr = $scope.students.list.splice(index, 1);
                if (this.selected == arr[0]){
                    this.selected = null;
                }
                delete caseloadService.idMap[arr[0].slpId];
            }
        };

        $scope.updateApptCount = function(serviceReq){
            var student = $scope.students.selected,
                number = serviceReq.number,
                service = serviceReq.service,
                appts = _.chain(student.serviceApptIds)
                    .map(function(id){ return caseloadService.idMap[id]; })
                    .filter(function(appt){ return serviceReq.serviceId === appt.serviceId; })
                    .value();
            if (appts.length > number) {
                if (window.confirm(
                'You have reduced a service requirement below the number of ' +
                'services already scheduled. Okay if we remove one of those service ' +
                'appointments for you? Or click cancel, and you can remove an appointment ' +
                'manually and then re-try the service req adjustment.')) {
                    caseloadService.removeStudentFromAppt(student, appts[0]);                
                } else {
                    serviceReq.number++;
                }
            }
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
                if (student.classId) {
                    var classy = caseloadService.idMap[student.classId]; 
                    classy.studentIds.push(student.slpId);
                }
                $scope.students.select(student);
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
            modalInstance.result.then(function(event){
                $scope.students.selected.constraints.push(event);
                $scope.studentConstraints.events.push(_.clone(event));
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
                month: 'ddd',    // Mon
                week: 'ddd', // Mon
                day: 'dddd'  // Monday
            },
            dayClick: calendarOnClick,
            eventDrop: eventUpdate,
            eventResize: eventUpdate,
            timezone: 'local'
        };

        function calendarOnClick(date, jsEvent, view) {
            if ($scope.students.selected) {
                $scope.openNewConstraintModal(date);
            }
        }

        function eventUpdate(event, delta, revertFunc, jsEvent, ui, view) {
            var index = _.findIndex($scope.studentConstraints.events, { _id: event._id }),
                constraint = $scope.students.selected.constraints[index];
            constraint.start = event.start;
            constraint.end = event.end;
        }

        $scope.studentConstraints = {
            events: [],
            editable: true,
            color: '#3A87AD'            
        };
        $scope.classConstraints = {
            events: [],
            editable: false,
            color: '#BEBEBE'            
        };
        $scope.eventSources = [$scope.studentConstraints, $scope.classConstraints];

    });