'use strict';

/**
 */
angular.module('openolitor-admin')
  .factory('KundenDetailService', ['$http', 'API_URL',
    function($http, API_URL) {
      var service = {
        deletePerson: deletePerson,
        disableLogin: disableLogin,
        enableLogin: enableLogin,
        sendEinladung: sendEinladung,
        changeRolle: changeRolle,
        isUniqueEmail : isUniqueEmail
      };

      return service;

      function deletePerson(kundeId, personId) {
        return $http.delete(API_URL + 'kunden/' + kundeId + '/personen/' + personId);
      };

      function disableLogin(kundeId, personId) {
        return $http.post(API_URL + 'kunden/' + kundeId + '/personen/' + personId + '/aktionen/logindeaktivieren');
      };

      function enableLogin(kundeId, personId) {
        return $http.post(API_URL + 'kunden/' + kundeId + '/personen/' + personId + '/aktionen/loginaktivieren');
      };

      function sendEinladung(kundeId, personId) {
        return $http.post(API_URL + 'kunden/' + kundeId + '/personen/' + personId + '/aktionen/einladungsenden');
      };

      function changeRolle(kundeId, personId, rolle) {
        return $http.post(API_URL + 'kunden/' + kundeId + '/personen/' + personId + '/aktionen/rollewechseln', '"' + rolle + '"');
      };

      function isUniqueEmail(email) {
        return $http.get(API_URL + 'kunden/isEmailUnique/' + email);
      };
    }
  ]);
