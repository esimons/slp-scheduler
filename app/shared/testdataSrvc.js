/**
 * Created by Evan on 7/31/2014.
 */
angular.module('easy-slp-scheduler')
.service('testdataService', function(caseloadService){

        caseloadService.students.list.push(new caseloadService.Student('Evan', 'Simons'));
        caseloadService.students.list.push(new caseloadService.Student('Lauren', 'Simons'));
        caseloadService.students.list.push(new caseloadService.Student('Elliot', 'Simons'));

        caseloadService.services.list.push(new caseloadService.Service('Articulation'));
        caseloadService.services.list.push(new caseloadService.Service('Language'));

        caseloadService.classes.list.push({name: 'First Grade', teacher: 'Mr. F', constraints: []});
    });