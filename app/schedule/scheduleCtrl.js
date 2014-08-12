/**
 * Created by Evan on 7/19/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('scheduleCtrl', function($scope, $timeout, caseloadService, ngToast){

        var serviceSort = $scope.serviceSort = new ServiceSort();

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
            if($scope.selected){
                $scope.selected.appt.start = event;
                $scope.selected.appt.end = new Date(event.getTime() + 1800000);
                $scope.selected.appt.allDay = false;
                $scope.events.push($scope.selected.appt);
                $scope.selected = null;
                $scope.serviceSort.refresh();
            }
        }

        $scope.events = caseloadService.appointments;
        $scope.eventSources = [$scope.events];

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