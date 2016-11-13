
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        // CommonJS
        if (typeof angular === 'undefined') {
            factory(require('angular'));
        } else {
            factory(angular);
        }
        module.exports = 'quantacann2-message';
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['angular'], factory);
    } else {
        // Global Variables
        factory(root.angular);
    }
}(this, function (angular) {
    'use strict';

    var m = angular.module('quantacann2-message', []);

    m.component('quantacann2', {
        bindings: {
            message: '@'
        },
        template: '<p>{{ $ctrl.message }}</p>'
    });

    return m;
}));


