(function (angular) {
    'use strict';

    angular.module('quantacann2.warmup', [
        'quantacann2.warmup.CONFIG'
    ]);

})(angular);

function Stage(id, actionName, stateDescription){
    var self = this;
    self.id = id;
    self.actionName = actionName;
    self.state = null;
    self.getCurrentStateDescription = function(){
        if(!self.state){
            return "";
        }
        return stateDescription.apply(self);
    };
    self.errorMessage = null;
    self.nextStage = null;
}
(function (angular) {
    'use strict';

    angular.module('quantacann2.warmup.CONFIG',[])
        .constant('WARMUP_CONFIG',(function warmupConfigBuilder(){
            var c = {
                apiPath: ''
            };

            return c;
        })());
})(angular);

(function (angular) {
    'use strict';

    angular.module('quantacann2.warmup')
     .constant('stateValues',{
        start: 'start',
        finish: 'finish',
        error: 'error'
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('quantacann2.warmup')
    .directive('quantacann2Warmup', ['warmupService',
        function (warmupService) {
            return {
                scope: {
                    unitId: '@',
                    unitName: '@'
                },
                restrict: 'E',
                replace: true,
                templateUrl: function($element, $attrs) {
                    return $attrs.useTemplate || "src/templates/quantacann2-warmup.tpl.html";
                },
                link: function (scope) {

                    scope.warmup = warmupService;

                    scope.$watch('unitId', function (newVal, oldVal) {
                        if(newVal != oldVal && newVal && !scope.warmup.isProcess()){
                            scope.warmup.startWarmupProcess(scope.unitId, scope.unitName);
                        }
                    });
                }
            }
        }]);
})(angular);
(function (angular) {
    'use strict';

    angular.module('quantacann2.warmup')
     .provider('warmupService', function(){
        var unit = {};
        var stageSequence = [];
        var rootStage = null;
        var isProcess = false;

        this.$get = [
            '$http', 'WARMUP_CONFIG', '$timeout', 'stateValues',
            function warmupServiceFactory($http, WARMUP_CONFIG, $timeout, stateValues){

                Stage.prototype.setErrorMessage = function(e){
                    var err = e.response? e.response : e;
                    if(err.status >= 400 && err.status < 500){
                        this.errorMessage = err.data.error? err.data.error.msg : err.data.message;
                    }
                }

                Stage.prototype.canExecuteStage = function(){
                    var self = this;
                    var rez = true;
                    var stage = rootStage;
                    while(stage && self.id != stage.id && rez){
                        if(self.id != stage.id && stage.state != stateValues.finish){
                            self.errorMessage = "Can't start " + self.id +  " stage.";
                            self.state = stateValues.error;
                            rez = false;
                        }
                        stage = stage.nextStage;
                    }

                    return rez;
                }

                Stage.prototype.action = function() {
                    var self = this;

                    if(!self.canExecuteStage()){
                        return;
                    }

                    isProcess = true;
                    self.state = stateValues.start;
                    self.errorMessage = null;

                    $http.get(WARMUP_CONFIG.apiPath + 'units/' + unit.id + '/' + self.actionName)
                        .then(function (response) {
                            self.successAction(response)
                        })
                        .catch(function (e) {
                            self.setErrorMessage(e);
                            isProcess = false;
                            self.state = stateValues.error;
                        });
                }

                Stage.prototype.successAction = function(response, params){
                    var self = this;

                    self.state = stateValues.finish;
                    if(self.nextStage) {
                        self.nextStage.action(params);
                    }
                    else {
                        isProcess = false;
                    }
                }

                var checkInstrumentStage = new Stage("check_instrument", "status", function(){
                    var self = this;
                    return self.state != stateValues.error? "Instrument Online" : "Instrument Offline";
                });

                var setTemperatureStage = new Stage("set_temperature", "tec", function(){
                    var self = this;
                    return self.state != stateValues.error? "Set TE Cooler Temperature" : "Set TE Cooler Temperature Failed";
                });

                var setLightStage = new Stage("set_light", "warmup", function(){
                    var self = this;
                    return self.state != stateValues.error? "Turn on Source Light" : "Turn on Source Light Failed";
                });

                var waitWarmupStage = new Stage("wait_warmup", "", function(){
                    var self = this;
                    var getRemainingTime = function(){
                        if(!self.remainingTime){
                            return ''
                        }
                        else if (self.remainingTime < 60){
                            return self.remainingTime + ' second' + (self.remainingTime > 1? 's' : '')
                        }
                        else {
                            var minutes = Math.floor(self.remainingTime / 60);
                            var seconds = self.remainingTime % 60;
                            return (minutes + ' minute' + (minutes > 1? 's ': ' ')) +
                                (seconds > 0? seconds + ' second' + (seconds > 1? 's':'') : '')
                        }
                    }

                    if(self.state == stateValues.start){
                        return "Warmup Time Remaining: " + getRemainingTime();
                    }
                    else if(self.state == stateValues.finish){
                        return "Instrument is warm";
                    }
                });

                rootStage = checkInstrumentStage;
                checkInstrumentStage.nextStage = setTemperatureStage;
                setTemperatureStage.nextStage = setLightStage;
                setLightStage.nextStage = waitWarmupStage;

                checkInstrumentStage.successAction = function(response){
                    var self = this;

                    if(!response.data.status){
                        Stage.prototype.successAction.call(self, response);
                    }
                    else{
                        self.errorMessage = 'Instrument is not online.';
                        isProcess = false;
                        self.state = stateValues.error;
                    }
                }

                setLightStage.successAction = function(response){
                    var self = this;

                    if(response.data.lightState == 'on1'){
                        var remainingTime = response.data.warmupTime - response.data.lightDuration;
                        Stage.prototype.successAction.call(self, response, {'remainingTime': remainingTime});
                    }
                    else{
                        self.errorMessage = 'Impossible turn on instrument.';
                        isProcess = false;
                        self.state = stateValues.error;
                    }
                }

                waitWarmupStage.action = function(params){
                    var self = this;

                    if(!self.canExecuteStage()){
                        return;
                    }

                    isProcess = true;
                    self.state = stateValues.start;
                    if(params && params.remainingTime) {
                        self.remainingTime = params.remainingTime;
                    }

                    if( !self.remainingTime || self.remainingTime <= 0){
                        self.state = stateValues.finish;
                        isProcess = false;
                    }
                    else{
                        var countDown = function(){
                            self.remainingTime--;
                            if(self.remainingTime > 0){
                                $timeout(countDown, 1000);
                            }
                            else {
                                self.state = stateValues.finish;
                                isProcess = false;
                            }
                        }

                        $timeout(countDown, 1000);
                    }
                }

                stageSequence = [
                    checkInstrumentStage,
                    setTemperatureStage,
                    setLightStage,
                    waitWarmupStage
                ];

                function WarmupService(){
                    return this;
                }

                //return first stage of warmup process
                WarmupService.prototype.getRootStage = function(){
                    return rootStage;
                }

                //return unit of current warmup process
                WarmupService.prototype.getUnit = function(){
                    return unit;
                }

                //return sequence of warm up stages
                WarmupService.prototype.getStages = function(){
                    return stageSequence;
                }

                //detect that service is busy
                WarmupService.prototype.isProcess = function(){
                    return isProcess;
                }

                //run warmup process
                WarmupService.prototype.startWarmupProcess = function(unitId, unitName){
                    if(isProcess){
                        return;
                    }

                    for(var i = 0; i < stageSequence.length; i++){
                        stageSequence[i].state = null;
                        stageSequence[i].errorMessage = null;
                    }

                    unit.id = unitId;
                    unit.name = unitName;

                    rootStage.action();
                }

                var warmupService =  new WarmupService();

                return warmupService;
            }
        ];
    });
})(angular);

(function (root, factory) {
 if (typeof module !== 'undefined' && module.exports) {
 // CommonJS
 if (typeof angular === 'undefined') {
 factory(require('angular'));
 } else {
 factory(angular);
 }
 module.exports = 'quantacann2';
 } else if (typeof define === 'function' && define.amd) {
 // AMD
 define(['../../bower_components/angular/angular'], factory);
 } else {
 // Global Variables
 factory(root.angular);
 }
 }(this, function (angular) {
 'use strict';


var m = angular.module('quantacann2', [
    'quantacann2.warmup'
])

return m;
}));
