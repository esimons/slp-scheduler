/**
 * Created by Evan on 7/24/2014.
 */
angular.module('easy-slp-scheduler')
    .controller('servicesCtrl', function($scope, $modal, caseloadService){

        $scope.services = {
            list: caseloadService.services.list,
            selected: null,
            select: function(service){
                this.selected = service;
            },
            isSelected: function(service){
                /*if(this.selected === service)
                    $scope.classCalendar.fullCalendar('render');*/
                return this.selected === service;
            },
            delete: function(index){
                var arr = caseloadService.services.list.splice(index, 1);
                if(this.selected == arr[0]){ this.selected = null; }
                delete caseloadService.idMap[arr[0].slpId]; 
            }
        };

        $scope.openNewServiceModal = function(){
            var modalInstance = $modal.open({
                templateUrl: 'app/services/servicesModal/newServiceModal.html',
                controller: 'newServiceModal',
                resolve: {
                    classes: function(){ return $scope.services.list; }
                }
            });

            modalInstance.result.then(function(service){
                $scope.services.list.push(service);
                $scope.services.select(service);
            })
        };

    });