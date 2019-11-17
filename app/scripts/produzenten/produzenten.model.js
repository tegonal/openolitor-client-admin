'use strict';

/**
 */
angular.module('openolitor-admin')
  .factory('ProduzentenModel', ['$resource', 'API_URL', 'exportODSModuleFunction', function($resource, API_URL, exportODSModuleFunction) {
    return $resource(API_URL + 'produzenten/:id:exportType', {
      id: '@id'
    }, {
      'exportODS': exportODSModuleFunction ,
      'getProduzenten': {
        method: 'GET',
        isArray: true,
        url: API_URL + 'produzenten'
      },
    });
  }]);
