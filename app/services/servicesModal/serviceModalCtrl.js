/**
 * Created by Evan on 7/27/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('newServiceModal', function($scope){
        $scope.class = new Class();

        function Class(){
            this.name = null;
            this.teacher = null;
            this.students = [];
            this.constraints = [];
        }
    });