/**
 * Created by Evan on 7/18/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('caseloadCtrl', function($scope, $modal, caseloadService){

        $scope.students = {
            list: caseloadService.students.list,
            selected: null,
            select: function(student){
                this.selected = student;
            },
            isSelected: function(student){
                if(this.selected === student)
                    $scope.studentCalendar.fullCalendar('render');
                return this.selected === student;
            },
            delete: function(index){
                var arr = $scope.students.list.splice(index, 1);
                if(this.selected == arr[0]){ this.selected = null; }
            }
        };

        $scope.test = function(number, index){
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
            dayClick: angular.noop,
            eventDrop: angular.noop,
            eventResize: angular.noop
        };

        $scope.events = [];

    });