/**
 * Created by Evan on 7/20/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('newStudentModal', function($scope, classes, caseloadService){
        $scope.student = new caseloadService.Student();
        $scope.classes = classes;
    });