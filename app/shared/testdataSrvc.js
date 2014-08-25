/**
 * Created by Evan on 7/31/2014.
 */
angular.module('easy-slp-scheduler')
.service('testdataService', function(caseloadService){

        var klass = new caseloadService.Class('First Grade', 'Mr. F');

        caseloadService.students.list.push(new caseloadService.Student('Evan', 'Simons', klass));
        caseloadService.students.list.push(new caseloadService.Student('Lauren', 'Simons', klass));
        caseloadService.students.list.push(new caseloadService.Student('Elliot', 'Simons', klass));

        caseloadService.services.list.push(new caseloadService.Service('Articulation'));
        caseloadService.services.list.push(new caseloadService.Service('Language'));

        caseloadService.classes.list.push(klass);
    });