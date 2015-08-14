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
            var json = self.jsonify(
                self.services.list,
                self.students.list,
                self.classes.list,
                self.appointments
            );

            var a = document.createElement('a');
            a.download = "Save.slp";
            a.href = "data:text/json;base64," + btoa(json);
            a.click();
        };

        self.jsonify = function(services, students, classes, appointments){
            // TODO: Need to look at how I can decycle data w/out screwing up object refs
            // Should probably just modify objects in-place instead of using underscore,
            // then serialize, then undo the modifications afterwards
            var map = {
                classStudents: []
            };

            // Let's decycle our data!
            _.each(classes, function(classy){
                map.classStudents.push({
                    classy: classy,
                    students: classy.students
                });
                classy.students = [];
            });

            // TODO: Remove Cryo. I don't think it's doing anything for us, really.
            var json = Cryo.stringify({
                services: services,
                students: students,
                classes: classes,
                appointments: appointments
            });

            // Let's RE-cycle our data!
            _.each(map.classStudents, function(obj){
                obj.classy.students = obj.students;
            });

            return json;
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
                        obj = Cryo.parse(result),
                        cryoMap = {};

                    self.classes.list.length = 0;
                    self.services.list.length = 0;
                    self.students.list.length = 0;

                    $rootScope.$apply();

                    angular.forEach(obj.classes, function(c){
                        var newC = new Class(c.name, c.teacher);
                        newC.constraints = c.constraints;
                        self.classes.list.push(newC);
                        cryoMap[c.$$hashKey] = newC;
                        $rootScope.$apply();
                    });
                    angular.forEach(obj.services, function(s){
                        var newS = new Service(s.name);
                        newS.defaultDuration = s.defaultDuration;
                        self.services.list.push(newS);
                        cryoMap[s.$$hashKey] = newS;
                        $rootScope.$apply();
                    });
                    angular.forEach(obj.students, function(s){
                        var classy = s.class ? cryoMap[s.class.$$hashKey] : null,
                            newS = new Student(s.firstName, s.lastName, classy);
                        self.students.list.push(newS);
                        $rootScope.$apply();
                        if (classy) { classy.students.push(newS); }
                        _.each(s.serviceReqs, function(req){
                            if (req.number !== 0) {
                                var service = cryoMap[req.service.$$hashKey],
                                    req2 = _.find(newS.serviceReqs, { service: service });
                                req2.number = req.number;
                            }
                        });
                        cryoMap[s.$$hashKey] = newS;
                        $rootScope.$apply();
                    });
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
            this.class = group;
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
            this.removeStudent = function(student){
                var index = this.students.indexOf(student);
                this.students.splice(index, 1);
                index = student.serviceAppts.indexOf(this);
                student.serviceAppts.splice(index, 1);
                if (this.students.length < 1) {
                    index = self.appointments.list.indexOf(this);
                    self.appointments.list.splice(index, 1);
                }
            }
        }
        this.Appointment = Appointment;

    });