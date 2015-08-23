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
                return _.map(caseloadService.students.list, function(student){
                    return {
                        label: student.firstName + ' ' + student.lastName,
                        children: _.map(_.filter(student.serviceReqs, 'number'), function(serviceReq){
                            return {                                
                                data: {
                                    serviceReq: serviceReq,
                                    student: _.omit(student, 'class')
                                },
                                label: caseloadService.idMap[serviceReq.serviceId].name + ': ' + serviceReq.number // TODO: Get the count right
                            }
                        })
                    };
                });
            }
            function byServiceType(){
            }
        }

        $scope.selected = null;
        $scope.select = function(item){
            $scope.selected = item;
            $scope.studentEvents.events = angular.copy(item.student.constraints);
            var classId = item.student.classId;
            $scope.classEvents.events = classId ? angular.copy(caseloadService.idMap[classId].constraints) : [];
        };
        $scope.isSelected = function(item){
            return item === $scope.selected;
        };
        $scope.treeSelect = function(branch) {
            $scope.selected = branch.data ? branch.data : null;
        };

        $scope.calendarConfig = {
            height: 700,
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
            eventDrop: angular.noop,
            eventResize: angular.noop/*,
            eventRender: function(event, element) {                
                $timeout(function(){
                    //element.append('<ul><li ng-repeat=""')
                    element.attr('popover', 'sweet test');
                    $compile(element)($scope);
                });                
            }*/
        };

        $scope.zoom = {
            current: 1,
            slotMinutes: [
                60,
                30,
                20,
                15,
                10,
                5
            ],
            slotHeight: [
                40,
                45,
                50,
                55,
                60,
                65,
                70,
                75
            ],
            levels: []
        };
        for(var i in $scope.zoom.slotMinutes){
            for(var j in $scope.zoom.slotHeight){
                $scope.zoom.levels.push({
                    minutes: $scope.zoom.slotMinutes[i],
                    height: $scope.zoom.slotHeight[j]
                })
            }
        }

        $scope.$watch('zoom.current', function(newVal){
            var index = parseInt(newVal);
            $scope.calendarConfig.slotMinutes = $scope.zoom.levels[index].minutes;
            $scope.calendarConfig.slotHeight = $scope.zoom.levels[index].height;
        });

        function calendarOnClick(date, jsEvent, view){
            if ($scope.selected){
                var selected = $scope.selected,
                    service = caseloadService.idMap[selected.serviceReq.serviceId],
                    start = date,
                    end = moment(date).add(service.defaultDuration, 'm'),
                    appt = new caseloadService.Appointment(service, start, end);
                appt.addStudent(selected.student);
                $scope.events.push(appt);
                $scope.selected = null;
                $scope.serviceSort.refresh();
            }
            function minsToMillis(mins){
                return mins * 60000;
            }
        }

        $scope.events = caseloadService.appointments;
        $scope.studentEvents = {
            events: [],
            editable: false,
            color: 'gray'
        };
        $scope.classEvents = {
            events: [],
            editable: false,
            color: 'gray'
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