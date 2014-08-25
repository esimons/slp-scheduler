/**
 * Created by Evan on 7/22/2014.
 */
angular.module('easy-slp-scheduler')
    .service('caseloadService', function($rootScope){
        var self = this;

        self.services = {
            list: ObservableArray(), //TODO: Replace the ObservableArray with standard array, move observable-ness into parent object
            add: function(service){
                var len = self.services.list.push(service);
                var subs = self.services_subscribers.toAddition;
                for(var i=0; i<subs.length; i++){
                    subs[i](service, self.services.list);
                }
                return len;
            },
            remove: angular.noop,
            _subscribers: {
                toAddition: [],
                toRemoval: []
            }
        };
        self.students = {
            list: ObservableArray()
        };
        self.classes = {
            list: ObservableArray()
        };

        self.appointments = [];

        self.save = function(){
            var json = {
                services: self.services.list,
                students: self.students.list,
                classes: self.classes.list,
                appointments: self.appointments.list
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

                    /*self.services.list = obj.services;
                    self.students.list = obj.students;
                    self.classes.list = obj.classes;
                    self.appointments = obj.appointments;
                    $rootScope.$apply();*/
                    console.info(obj);
                }
            };
            input.click();
        };

        /*
         *  Wiring up observers to handle changes in collections
         */

        // Handle the addition of new services
        self.services.list.subscribeToAdd(function(elem, arr){
            for(var i=0; i<self.students.list.length; i++){
                self.students.list[i].serviceReqs.push(new ServiceReq(elem));
                self.students.list[i].serviceAppts.push(new ServiceAppointmentList(elem));
            }
        });

        // Handle the addition of new students
        self.students.list.subscribeToAdd(function(elem, arr){
            for(var i=0; i<self.services.list.length; i++){
                elem.serviceReqs.push(new ServiceReq(self.services.list[i]));
                elem.serviceAppts.push(new ServiceAppointmentList(self.services.list[i]));
            }
        });

        // Handle the deletion of services
        self.services.list.subscribeToRemove(function(elem, arr){
            for(var i=0; i<self.students.list.length; i++){
                for(var j=0; j<self.students.list[i].serviceReqs.length; j++){
                    var servReq = self.students.list[i].serviceReqs[j];
                    if(servReq.service === elem[0]){
                        self.students.list[i].serviceReqs.splice(j, 1);
                        break;
                    }
                }
                var servAppts = [];
                for(var j=0; j<self.students.list[i].serviceAppts.length; j++){
                    var servAppt = self.students.list[i].serviceAppts[j];
                    if(servAppt.service !== elem[0]){
                        servAppts.push(servAppt);
                    }
                }
                self.students.list[i].serviceAppts = servAppts;
            }
            var appointments = [];
            for(var i=0; i<self.appointments.length; i++){
                if(self.appointments[i].service !== elem[0]){
                    appointments.push(elem[0]);
                }
            }
            self.appointments = appointments;
        });

        // Handle the deletion of students
        self.students.list.subscribeToRemove(function(elem, arr){

        });

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

        this.ServiceSchedule = function ServiceSchedule(){
            this.events = [];
            this.color = 'blue';
        };

        function Service(name){
            this.name = name;
            this.defaultDuration = 30;
        }
        this.Service = Service;

        function ServiceReq(service){
            this.service = service;
            this.number = 0;
        }

        function ServiceAppointment(service, start, end){
            this.title = service.name;
            this.start = null;
            this.end = null;
            this.service = service;
            this.students = [];
        }

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

        function ObservableArray(){
            var arr = [];
            var _addSubscribers = [];
            var _removeSubscribers = [];
            arr.push = function(elem){
                var ret = Array.prototype.push.call(arr, elem);
                for(var i=0; i<_addSubscribers.length; i++){
                    _addSubscribers[i](elem, arr);
                }
                return ret;
            };
            arr.splice = function(index, howMany){
                var ret = Array.prototype.splice.call(arr, index, howMany);
                for(var i=0; i<_removeSubscribers.length; i++){
                    _removeSubscribers[i](ret, arr);
                }
                return ret;
            };
            arr.subscribeToAdd = function(fn){
                _addSubscribers.push(fn);
            };
            arr.subscribeToRemove = function(fn){
                _removeSubscribers.push(fn);
            };
            return arr;
        }

    });