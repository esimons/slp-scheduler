/**
 * Created by Evan on 7/20/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('newStudentModal', function($scope, classes){
        $scope.student = new Student();
        $scope.classes = classes;

        function Student(){
            this.firstName = null;
            this.lastName = null;
            this.class = null;
        }
    });