/**
 * Created by Evan on 7/19/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('scheduleCtrl', function($scope, $timeout, $compile, caseloadService, ngToast){

        var serviceSort = $scope.serviceSort = new ServiceSort();

        $scope.$on('fileLoad', _.bind($scope.$apply, $scope, serviceSort.refresh));

        $scope.event = {
            selected: null,
            select: function(event){
                $scope.event.selected = event;
            },
            removeSelected: function(){

            }
        };

        function ServiceSort(){
            var self = this;
            var index = 1;
            var methods = [
                byClass, byStudent, byServiceType
            ];
            this.unscheduledCount = 0;
            this.change = function(){
                (index >= methods.length) ? index = 0 : index++;
                self.refresh();
            };
            this.refresh = function(){
                self.result = methods[index]();
            };
            this.refresh();

            function byClass(){                
            }
            function byStudent(){
                return _.filter(_.map(caseloadService.students.list, function(student){
                    return {
                        label: student.firstName + ' ' + student.lastName,
                        children: _.map(_.filter(student.serviceReqs,
                            function(serviceReq){
                                return serviceReq.number - serviceReq.scheduled;
                            }), 
                            function(serviceReq){
                                return {                                
                                    data: {
                                        serviceReq: serviceReq,
                                        student: student
                                    },
                                    label: caseloadService.idMap[serviceReq.serviceId].name + ': ' + (serviceReq.number - serviceReq.scheduled)
                                }
                            })
                    };
                }), function(node){
                    return node.children.length;
                });
            }
            function byServiceType(){
            }
        }

        $scope.selected = [];
        $scope.treeOptions = {
            dirSelectable: false,
            multiSelection: true,
            filter: function(node) {
                var selected = $scope.selected[0];
                return !selected || node.children || (node.data.serviceReq.serviceId === selected.data.serviceReq.serviceId);
            }
        };
        $scope.$watchCollection('selected', function(selected){
            $scope.studentEvents.events.length = 0;
            $scope.classEvents.events.length = 0;
            var classIdsEncountered = {};
            _.each(selected, function(treeNode) {
                Array.prototype.push.apply($scope.studentEvents.events, _.map(treeNode.data.student.constraints, _.clone));
                var classId = treeNode.data.student.classId;
                if (classId && !classIdsEncountered[classId]) {
                    var classy = caseloadService.idMap[classId];
                    Array.prototype.push.apply($scope.classEvents.events, _.map(classy.constraints, _.clone));
                    classIdsEncountered[classId] = true;
                }
            });
        });

        $scope.calendarConfig = {
            minTime: '05:00:00',
            maxTime: '18:00:00',
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
            eventClick: eventOnClick,
            eventDrop: eventUpdate,
            eventResize: eventUpdate,
            eventRender: eventRender
        };

        $scope.zoom = {
            current: 1,
            slotMinutes: [
                '00:60:00',
                '00:30:00',
                '00:20:00',
                '00:15:00',
                '00:10:00',
                '00:05:00'
            ]
        };

        $scope.$watch('zoom.current', function(newVal){
            var index = parseInt(newVal);
            $scope.calendarConfig.slotDuration = $scope.zoom.slotMinutes[index];
            refreshCalendarAppts();
        });

        function calendarOnClick(date, jsEvent, view){
            if ($scope.selected.length){
                var selected = $scope.selected,
                    service = caseloadService.idMap[selected[0].data.serviceReq.serviceId],
                    start = date,
                    end = moment(date).add(service.defaultDuration, 'm'),
                    appt = new caseloadService.Appointment(service, start, end);
                _.each(selected, function(node) {
                    caseloadService.addStudentToAppt(node.data.student, appt);
                });
                caseloadService.appointments.push(appt);
                $scope.selected.length = 0;
                $scope.serviceSort.refresh();
            }
        }

        function eventOnClick(event, jsEvent, view){
            if (jsEvent.ctrlKey) {
                caseloadService.deleteAppt(event);
                serviceSort.refresh();
            } else {
                var noStudentOverlap = !_.intersection(_.map($scope.selected, function(node) {
                    return node.data.student.slpId;
                }), event.studentIds).length;
                if (noStudentOverlap && $scope.selected.length && $scope.selected[0].data.serviceReq.serviceId === event.serviceId){
                    _.each($scope.selected, function(node) {
                        caseloadService.addStudentToAppt(node.data.student, event);
                    });
                    $scope.selected.length = 0;
                    $scope.serviceSort.refresh();
                }
            }
        }

        function eventUpdate(event, delta, revertFunc, jsEvent, ui, view) {
            var appt = caseloadService.idMap[event.slpId];
            appt.start = event.start;
            appt.end = event.end;
        }

        function eventRender(event, element, view){
            var studentList = '';
            angular.forEach(event.studentIds, function(id){
                var student = caseloadService.idMap[id];
                if (studentList) { studentList += '<br/>'; }
                studentList += student.firstName + ' ' + student.lastName;
            });
            $timeout(function() {
                element.attr('tooltip-html', '\'' + studentList + '\'');
                var listForPrint = $('<div/>').addClass('visible-print-block event-students').append(studentList);
                $(element).find('.fc-title').after(listForPrint);
                $compile(element)($scope);
            });
        }

        $scope._events = caseloadService.appointments;
        $scope.events = [];
        $scope.$watchCollection('_events', refreshCalendarAppts);

        function refreshCalendarAppts() {
            $scope.events.length = 0;
            Array.prototype.push.apply($scope.events, _.map(caseloadService.appointments, _.clone));            
        }

        $scope.studentEvents = {
            events: [],
            editable: false,
            color: 'rgba(125,125,125,0.25)',
            textColor: 'rgb(60,60,60)'
        };
        $scope.classEvents = {
            events: [],
            editable: false,
            color: 'rgba(25,25,25,0.2)',
            textColor: 'rgb(60,60,60)'
        };
        $scope.eventSources = [$scope.events, $scope.studentEvents, $scope.classEvents];

        $scope.autoSchedule = function(){
            if(typeof(Worker) !== "undefined") {
                var msgId = ngToast.create({
                    content: '<span class="fa fa-cog fa-spin"></span> *BEEP* *BOP* *BOOP* I AM SCHEDULING YOUR APPOINTMENTS',
                    class: 'info',
                    dismissOnTimeout: false,
                    dismissOnClick: false
                });
                var scheduleWorker = new Worker("app/webworkers/test.js");
                scheduleWorker.onmessage = function(oEvent){
                    $timeout(function(){
                        angular.forEach(ngToast.messages, function(msg){
                            if(msgId === msg.id){
                                msg.content = '<span class="fa fa-check fa-lg"></span> All done!';
                                msg.class = 'success';
                            }
                        });
                    });
                    $timeout(function(){ ngToast.dismiss(msgId); }, 1500);
                }
            } else {
                ngToast.create({
                    content: 'NO WEBWORKERS?! What is this, 2012?',
                    class: 'danger'
                });
            }
        }

    });