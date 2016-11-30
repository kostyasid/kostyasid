angular.module('quantacann2').run(['$templateCache', function($templateCache) {$templateCache.put('src/templates/quantacann2-warmup.tpl.html','<div>\r\n    <style>\r\n        .icon-style{\r\n            font-size: 40px;\r\n            vertical-align: middle;\r\n        }\r\n        .icon-width{\r\n            width: 40px;\r\n        }\r\n        .icon-start{\r\n            color: grey;\r\n        }\r\n        .icon-success{\r\n            color: forestgreen;\r\n        }\r\n        .icon-error{\r\n            color: firebrick;\r\n        }\r\n        .status-style{\r\n            margin-left: 10px;\r\n        }\r\n        .error-message {\r\n            color: #d9230f !important;\r\n        }\r\n        .margin-content {\r\n            margin-left: 10px;\r\n        }\r\n        .stage-items{\r\n            padding-top: 10px;\r\n            padding-bottom: 10px;\r\n        }\r\n    </style>\r\n    <div ng-show="warmup">\r\n        <div>\r\n            <h3>Warmup {{warmup.getUnit().name}}</h3>\r\n        </div>\r\n        <div ng-repeat="stage in warmup.getStages()">\r\n            <div ng-show="stage.state" class="stage-items">\r\n                <div ng-show="stage.state == \'start\' || stage.state == \'finish\'">\r\n                    <i class="fa icon-style icon-width"\r\n                       ng-class="(stage.state == \'start\')? \'icon-start fa-circle-o\' : (stage.state == \'finish\')?\'icon-success fa-check-circle-o\' : \'\'"/>\r\n                    <label class="status-style">{{stage.getCurrentStateDescription()}}</label>\r\n                </div>\r\n                <div ng-show="stage.state == \'error\'">\r\n                    <div>\r\n                        <i class="fa fa-times-circle-o icon-style icon-error icon-width"></i>\r\n                        <label class="status-style">{{stage.getCurrentStateDescription()}}</label>\r\n                    </div>\r\n                    <div>\r\n                        <i class="fa fa-fw icon-width">&nbsp;</i>\r\n                        <span class="error-message margin-content">{{stage.errorMessage}}</span>\r\n                    </div>\r\n                    <div class="m-t-xs">\r\n                        <i class="fa fa-fw icon-width">&nbsp;</i>\r\n                        <button type="button"\r\n                                class="btn btn-primary btn-sm margin-content"\r\n                                ng-click="stage.action()">\r\n                            Retry\r\n                        </button>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>');}]);