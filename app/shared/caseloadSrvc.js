/**
 * Created by Evan on 7/22/2014.
 */
angular.module('easy-slp-scheduler')
    .service('caseloadService', function(){
        var self = this;

        self.services = {
            list: new ObservableArray()
        };
        self.students = {
            list: new ObservableArray()
        };
        self.classes = {
            list: new ObservableArray()
        };

        self.appointments = [];

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

        function Student(firstName, lastName){
            this.firstName = firstName;
            this.lastName = lastName;
            this.serviceReqs = [];
            this.serviceAppts = [];
        }
        this.Student = Student;

        this.ServiceSchedule = function ServiceSchedule(){
            this.events = [];
            this.color = 'blue';
        };

        function Service(name){
            this.name = name;
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
            Array.call(this);
            var _addSubscribers = [];
            var _removeSubscribers = [];
            this.push = function(elem){
                var ret = Array.prototype.push.call(this, elem);
                for(var i=0; i<_addSubscribers.length; i++){
                    _addSubscribers[i](elem, this);
                }
                return ret;
            };
            this.splice = function(index, howMany){
                var ret = Array.prototype.splice.call(this, index, howMany);
                for(var i=0; i<_removeSubscribers.length; i++){
                    _removeSubscribers[i](ret, this);
                }
                return ret;
            };
            this.subscribeToAdd = function(fn){
                _addSubscribers.push(fn);
            };
            this.subscribeToRemove = function(fn){
                _removeSubscribers.push(fn);
            };
        }
        ObservableArray.prototype = Object.create(Array.prototype);
        ObservableArray.prototype.constructor = Array;

    });