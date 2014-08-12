/**
 * Created by Evan on 7/31/2014.
 */
angular.module('easy-slp-scheduler')
.service('testdataService', function(caseloadService){

        caseloadService.students.list.push(new caseloadService.Student('Evan', 'Simons'));
        caseloadService.students.list.push({firstName: 'Lauren', lastName: 'Simons', serviceReqs: [], serviceAppts: []});
        caseloadService.students.list.push({firstName: 'Elliot', lastName: 'Simons', serviceReqs: [], serviceAppts: []});

        caseloadService.services.list.push({name: 'Articulation'});
        caseloadService.services.list.push({name: 'Language'});

        caseloadService.classes.list.push({name: 'First Grade', teacher: 'Mr. F', constraints: []});
    });