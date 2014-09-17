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
                var elem = getElemAdded(newVal, oldVal);
                for(var i=0; i<self.services.list.length; i++){
                    elem.serviceReqs.push(new ServiceReq(self.services.list[i]));
                    elem.serviceAppts.push(new ServiceAppointmentList(self.services.list[i]));
                }
            }
        });
        $rootScope.$watchCollection('_modelObs.services', function(newVal, oldVal){
            /* Handle the addition of new services */
            if(newVal.length > oldVal.length){
                var elem = getElemAdded(newVal, oldVal);
                for(var i=0; i<self.students.list.length; i++){
                    self.students.list[i].serviceReqs.push(new ServiceReq(elem));
                    self.students.list[i].serviceAppts.push(new ServiceAppointmentList(elem));
                }
            }
            /* Handle the deletion of services */
            else if (newVal.length < oldVal.length){
                var elem = getElemRemoved(newVal, oldVal);
                for(var i=0; i<self.students.list.length; i++){
                    for(var j=0; j<self.students.list[i].serviceReqs.length; j++){
                        var servReq = self.students.list[i].serviceReqs[j];
                        if(servReq.service === elem){
                            self.students.list[i].serviceReqs.splice(j, 1);
                            break;
                        }
                    }
                    var servAppts = [];
                    for(var j=0; j<self.students.list[i].serviceAppts.length; j++){
                        var servAppt = self.students.list[i].serviceAppts[j];
                        if(servAppt.service !== elem){
                            servAppts.push(servAppt);
                        }
                    }
                    self.students.list[i].serviceAppts = servAppts;
                }
                var appointments = [];
                for(var i=0; i<self.appointments.length; i++){
                    if(self.appointments[i].service !== elem){
                        appointments.push(elem);
                    }
                }
                self.appointments = appointments;
            }
        });
        $rootScope.$watchCollection('_modelObs.classes', function(newVal, oldVal){
            /* Sit on your butt */
        });

        function getElemRemoved(newArr, prevArr){
            return $(prevArr).not(newArr).get()[0];
        }
        function getElemAdded(newArr, prevArr){
            return $(newArr).not(prevArr).get()[0];
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
                    clearAndCopy(obj.services, self.services.list);
                    clearAndCopy(obj.students, self.students.list);
                    clearAndCopy(obj.classes, self.classes.list);
                    clearAndCopy(obj.appointments, self.appointments);
                    $rootScope.$apply();
                }

                function clearAndCopy(srcArr, tgtArr){
                    tgtArr.length = 0;
                    angular.copy(srcArr, tgtArr);
                    //angular.forEach(srcArr, function(val){ tgtArr.push(val); });
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
            this.class = group || null;
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

        function ServiceSchedule(){
            this.events = [];
            this.color = 'blue';
        }
        this.ServiceSchedule = ServiceSchedule;

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

        function ServiceAppointment(service, start, end){
            this.title = service.name;
            this.start = null;
            this.end = null;
            this.service = service;
            this.students = [];
        }
        this.ServiceAppointment = ServiceAppointment;

        function ServiceAppointmentList(service){
            Array.call(this);
            this.service = service;
            this.getUnscheduled = function(){
                var arr = [];
                for(var i=0; i<this.length; i++){
                    if(!this[i].start){ arr.push(this[i]); }
                }
                return arr;
            };
            this.addNew = function(){
                Array.prototype.push.call(this, new ServiceAppointment(this.service));
            };
            this.remove = function(){
                var unscheduled = this.getUnscheduled();
                if(unscheduled.length > 0){
                    var index = this.indexOf(unscheduled[0]);
                    this.splice(index, 1);
                } else {
                    window.alert("GAH I DON'T KNOW WHAT TO DO! YOU REDUCED A SERVICE REQUIREMENT BELOW THE NUMBER OF SERVICE APPOINTMENTS YOU'VE SCHEDULED!");
                }
            }
        }
        ServiceAppointmentList.prototype = Object.create(Array.prototype);
        ServiceAppointmentList.prototype.constructor = Array;

    });