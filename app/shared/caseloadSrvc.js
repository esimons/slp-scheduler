/**
 * Created by Evan on 7/22/2014.
 */
angular.module('easy-slp-scheduler')
    .service('caseloadService', function($rootScope){

        var self = this;

        self.services = { list: [] };
        self.students = { list: [] };
        self.classes = { list: [] };

        self.appointments = [];

        var idPrefix = 0;

        self.idGen = function() {
            return _.uniqueId(idPrefix + '-');
        };
        self.idMap = {};

        /*********
        * Use $rootScope watchers to observe and respond to collection changes
        *********/
        $rootScope._modelObs = {
            services: self.services.list,
            students: self.students.list,
            classes: self.classes.list
        };

        $rootScope.$watchCollection('_modelObs.students', function(newVal, oldVal){
            /* Handle the addition of new students */
            if(newVal.length > oldVal.length){
                var addedStudent = getElemAdded(newVal, oldVal);

                // TODO: This sucks. I'm checking to see if this is from a load or an actual add.
                // Need to change my whole approach re: the collection watches.
                if (addedStudent.serviceReqs.length === 0) {
                    // Add zeroed-out requirements for all service types to the new student
                    _.each(self.services.list, function(service){
                        addedStudent.serviceReqs.push(new ServiceReq(service));
                    });
                }
            }
        });

        $rootScope.$watchCollection('_modelObs.services', function(newVal, oldVal){
            /* Handle the addition of new services */
            if (newVal.length > oldVal.length){
                var addedService = getElemAdded(newVal, oldVal);

                // Add a zeroed-out service requirement of the new type to all students 
                _.each(self.students.list, function(student){
                    student.serviceReqs.push(new ServiceReq(addedService));
                });
            }
            /* Handle the deletion of services */
            else if (newVal.length < oldVal.length){
                var removedService = getElemRemoved(newVal, oldVal);

                // Remove any appoints or service requirements of the removed service type
                _.each(self.students.list, function(student){
                    student.serviceReqs = _.reject(student.serviceReqs, function(req){
                        return req.serviceId === removedService.slpId;
                    });
                    student.serviceAppts = _.reject(student.serviceAppts, function(appt){
                        return appt.serviceId === removedService.slpId;
                    });
                });
                self.appointments = _.reject(self.appointments, function(appt){
                    return appt.serviceId === removedService.slpId;
                });
            }
        });

        $rootScope.$watchCollection('_modelObs.classes', function(newVal, oldVal){
            /* Handle the addition of new classes */
            if (newVal.length > oldVal.length){
                /* Sit on your butt */
            }
            /* Handle the deletion of classes */
            else if (newVal.length < oldVal.length){
                var removedClass = getElemRemoved(newVal, oldVal);

                // Remove any appoints or service requirements of the removed service type
                _.each(self.students.list, function(student){
                    if (student.classId === removedClass.slpId) {
                        student.classId = null;
                    }
                });
            }
        });

        // TODO: If you make this return an array, and handle as such above, we can 
        // avoid doing all those $rootScope.$digest calls below; would probably be
        // way more performant  
        function getElemRemoved(newArr, prevArr){
            return _.first(_.difference(prevArr, newArr));
        }
        function getElemAdded(newArr, prevArr){
            return _.first(_.difference(newArr, prevArr));
        }

        self.save = function(){
            var json = Cryo.stringify({
                services: self.services.list,
                students: self.students.list,
                classes: self.classes.list,
                appointments: self.appointments,
                idMap: self.idMap,
                idPrefix: idPrefix
            });

            var a = document.createElement('a');
            a.download = "Save.slp";
            a.href = "data:text/json;base64," + btoa(json);
            a.click();
        };

        self.load = function(file){
            var input = document.createElement('input');
            input.type = 'file';
            input.onchange = function(){
                var file = input.files[0];
                var reader = new FileReader();
                reader.onload = fileHandler;
                reader.readAsText(file);

                function fileHandler(e){
                    var result = e.target.result,
                        obj = Cryo.parse(result);

                    idPrefix = obj.idPrefix + 1;
                    self.idMap = obj.idMap;

                    self.classes.list.length = 0;
                    self.services.list.length = 0;
                    self.students.list.length = 0;
                    self.appointments.length = 0;

                    Array.prototype.push.apply(self.appointments, obj.appointments);

                    $rootScope.$apply();

                    angular.forEach(obj.classes, function(c){
                        self.classes.list.push(c);
                        $rootScope.$apply();
                    });
                    angular.forEach(obj.services, function(s){
                        self.services.list.push(s);
                        $rootScope.$apply();
                    });
                    angular.forEach(obj.students, function(s){
                        self.students.list.push(s);
                        $rootScope.$apply();
                    });
                    $rootScope.$broadcast('fileLoad');
                }
            };
            input.click();
        };


        /*
         * CONSTRUCTORS
         */

        function Student(firstName, lastName, classId){
            self.idMap[this.slpId = self.idGen()] = this;
            this.firstName = firstName;
            this.lastName = lastName;
            this.serviceReqs = [];
            this.serviceApptIds = [];
            this.classId = classId;
            this.constraints = [];
        }
        this.Student = Student;

        function Class(name, teacher){
            self.idMap[this.slpId = self.idGen()] = this;
            this.name = name || null;
            this.teacher = teacher || null;
            this.studentIds = [];
            this.constraints = [];
        }
        this.Class = Class;

        function Service(name){
            self.idMap[this.slpId = self.idGen()] = this;
            this.name = name;
            this.defaultDuration = 30;
        }
        this.Service = Service;

        function ServiceReq(service){
            self.idMap[this.slpId = self.idGen()] = this;
            this.serviceId = service.slpId;
            this.number = 0;
            this.scheduled = 0;
        }
        this.ServiceReq = ServiceReq;

        function Appointment(service, start, end){
            self.idMap[this.slpId = self.idGen()] = this;
            this.title = service.name;
            this.start = start;
            this.end = end;
            this.serviceId = service.slpId;
            this.studentIds = [];
        }
        this.Appointment = Appointment;

        self.addStudentToAppt = function(student, appt) {
            appt.studentIds.push(student.slpId);
            student.serviceApptIds.push(appt.slpId);
            _.find(student.serviceReqs, function(serviceReq) {
                if (serviceReq.serviceId === appt.serviceId) {
                    serviceReq.scheduled++;
                    return true;
                }
            });
        };
        self.removeStudentFromAppt = function(student, appt) {
            var index = _.findIndex(appt.studentIds, function(id) {
                return (student.slpId === id);
            });
            appt.studentIds.splice(index, 1);
            index = _.findIndex(student.serviceApptIds, function(id) {
                return (appt.slpId === id);
            });
            student.serviceApptIds.splice(index, 1);
            if (appt.studentIds.length < 1) {
                index = self.appointments.indexOf(self.idMap[appt.slpId]);
                self.appointments.splice(index, 1);
                delete self.idMap[appt.slpId];
            }
            _.find(student.serviceReqs, function(serviceReq) {
                if (serviceReq.serviceId === appt.serviceId) {
                    serviceReq.scheduled--;
                    return true;
                }
            });
        };
        self.deleteAppt = function(appt) {
            _.each(_.clone(appt.studentIds), function(id) {
                var student = self.idMap[id];
                self.removeStudentFromAppt(student, appt);
            });
        };

    });