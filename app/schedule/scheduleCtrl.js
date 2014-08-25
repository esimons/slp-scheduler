/**
 * Created by Evan on 7/19/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('scheduleCtrl', function($scope, $timeout, $compile, caseloadService, ngToast){

        var serviceSort = $scope.serviceSort = new ServiceSort();

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
            var index = 0;
            var methods = [
                byClass, byStudent, byServiceType
            ];
            this.unscheduledCount = 0;
            this.change = function(){
                (index >= 2) ? index = 0 : index++;
                self.result = methods[index]();
            };
            this.refresh = function(){
                self.result = methods[index]();
            };
            this.refresh();

            function byClass(){
                //TODO: This is just a test
                var arr = [];
                var totalCount = 0;
                for(var i=0; i<caseloadService.students.list.length; i++){
                    for(var j=0; j<caseloadService.students.list[i].serviceAppts.length; j++){
                        var count = 0;
                        for(var k=0; k<caseloadService.students.list[i].serviceAppts[j].length; k++){
                            var appt = caseloadService.students.list[i].serviceAppts[j][k];
                            if(!appt.start){
                                if(count < 1){
                                    arr.push({student: caseloadService.students.list[i], appt: appt, count: 1});
                                } else {
                                    var t = arr[arr.length - 1];
                                    t.count++;
                                }
                                count++;
                                totalCount++;
                            }
                        }
                    }
                }
                self.unscheduledCount = totalCount;
                return arr;
            }
            function byStudent(){
                return caseloadService.students.list;
            }
            function byServiceType(){
            }
        }

        $scope.selected = null;
        $scope.select = function(item){
            $scope.selected = item;
            $scope.studentEvents.events = angular.copy(item.student.constraints);
            $scope.classEvents.events = item.student.class ? angular.copy(item.student.class.constraints) : [];
        };
        $scope.isSelected = function(item){
            return item === $scope.selected;
        };

        $scope.calendarConfig = {
            height: 700,
            editable: true,
            header: {
                left: '',
                center: '',
                right: ''
            },
            allDaySlot: false,
            defaultView: 'agendaWeek',
            weekends: false,
            minTime: '5:00am',
            maxTime: '6:00pm',
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
            eventResize: angular.noop,
            eventRender: function(event, element) {
                /*
                $timeout(function(){
                    //element.append('<ul><li ng-repeat=""')
                    element.attr('popover', 'sweet test');
                    $compile(element)($scope);
                });
                */
            }
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

        function calendarOnClick(event, allDay, jsEvent, view){
            if($scope.selected){
                $scope.selected.appt.start = event;
                $scope.selected.appt.end = new Date(event.getTime() + minsToMillis($scope.selected.appt.service.defaultDuration));
                $scope.selected.appt.allDay = false;
                $scope.events.push($scope.selected.appt);
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