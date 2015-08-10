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

                // Add zeroed-out requirements for all service types to the new student
                _.each(self.services.list, function(service){
                    addedStudent.serviceReqs.push(new ServiceReq(service));
                });
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

        function getElemRemoved(newArr, prevArr){
            return _.first(_.difference(prevArr, newArr));
        }
        function getElemAdded(newArr, prevArr){
            return _.first(_.difference(newArr, prevArr));
        }

        self.save = function(){
            var json = {
                services: self.services.list,
                students: self.students.list,
                classes: self.classes.list,
                appointments: self.appointments
            };
            var s = Cryo.stringify(json);
            var o = Cryo.parse(s);

            var a = document.createElement('a');
            a.download = "Save.slp";
            a.href = "data:text/json;base64," + btoa(s);
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
                    var result = e.target.result;
                    var obj = Cryo.parse(result);

                    self.classes.list.length = 0;
                    self.services.list.length = 0;
                    self.students.list.length = 0;

                    $rootScope.$apply();

                    var map = {
                        classes: [],
                        services: [],
                        students: []
                    };

                    angular.forEach(obj.classes, function(c){
                        var newC = new Class(c.name, c.teacher);
                        newC.constraints = c.constraints;
                        self.classes.list.push(newC);
                        /*var id = map.classes.push(newC)-1;
                        c.__$id = id;*/
                        $rootScope.$apply();
                    });
                    angular.forEach(obj.services, function(s){
                        var newS = new Service(s.name);
                        newS.defaultDuration = s.defaultDuration;
                        self.services.list.push(newS);
                        /*var id = map.services.push(newS)-1;
                        s.__$id = id;*/
                        $rootScope.$apply();
                    });
                    angular.forEach(obj.students, function(s){
                        var newS = new Student(s.firstName, s.lastName, map.classes[s.class.__$id]);
                        self.students.list.push(newS);
                        /*var id = map.students.push(newS)-1;
                        s.__$id = id;*/
                        $rootScope.$apply();
                    });

                    /*angular.forEach(obj.students, function(s){
                        var newS = map.students[s.__$id];
                        for(var i=0; i < s.serviceReqs.length; i++){
                            newS.serviceReqs[i].number = s.serviceReqs[i].number;
                        }
                        $rootScope.$apply();
                    });*/
                }
            };
            input.click();
        };


        /*
         * CONSTRUCTORS
         */

        function Student(firstName, lastName, group){
            this.firstName = firstName;
            this.lastName = lastName;
            this.serviceReqs = [];
            this.serviceAppts = [];
            this.constraints = [];
        }
        this.Student = Student;

        function Class(name, teacher){
            this.name = name || null;
            this.teacher = teacher || null;
            this.students = [];
            this.constraints = [];
        }
        this.Class = Class;

        function Service(name){
            this.name = name;
            this.defaultDuration = 30;
        }
        this.Service = Service;

        function ServiceReq(service){
            this.service = service;
            this.number = 0;
        }
        this.ServiceReq = ServiceReq;

        function Appointment(service, start, end){
            this.title = service.name;
            this.start = null;
            this.end = null;
            this.service = service;
            this.students = [];
        }
        this.Appointment = Appointment;

    });