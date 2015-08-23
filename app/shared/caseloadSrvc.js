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
                        return req.service === removedService;
                    });
                    student.serviceAppts = _.reject(student.serviceAppts, function(appt){
                        return appt.service === removedService;
                    });
                });
                self.appointments = _.reject(self.appointments, function(appt){
                    return appt.service === removedService;
                });
            }
        });

        $rootScope.$watchCollection('_modelObs.classes', function(newVal, oldVal){
            /* Sit on your butt */
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
            this.addStudent = function(student){
                this.studentIds.push(student.slpId);
                student.serviceApptIds.push(this.slpId);
                _.find(student.serviceReqs, function(serviceReq) {
                    if (serviceReq.serviceId === this.serviceId) {
                        serviceReq.scheduled++;
                        return true;
                    }
                }, this);
            };
            this.removeStudent = function(student){
                var index = _.findIndex(this.studentIds, function(id) {
                    return (student === self.idMap[id]);
                });
                this.studentIds.splice(index, 1);
                index = _.findIndex(student.serviceApptIds, function(id) {
                    return (this === self.idMap[id]);
                });
                student.serviceApptIds.splice(index, 1);
                if (this.students.length < 1) {
                    index = self.appointments.list.indexOf(this);
                    self.appointments.list.splice(index, 1);
                }
                _.find(student.serviceReqIds, function(serviceReq) {
                    if (serviceReq.serviceId === this.serviceId) {
                        serviceReq.scheduled--;
                        return true;
                    }
                });
            };
        }
        this.Appointment = Appointment;

    });