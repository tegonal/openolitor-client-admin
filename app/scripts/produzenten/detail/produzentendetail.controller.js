'use strict';

/**
 */
angular.module('openolitor-admin')
  .controller('ProduzentenDetailController', ['$scope', '$rootScope', '$filter', '$routeParams',
    '$location', '$uibModal', 'gettext', 'ProduzentDetailModel', '$log', 'alertService', 'gettextCatalog','ProduzentenModel', 'lodash',
    function($scope, $rootScope, $filter, $routeParams, $location, $uibModal, gettext,
      ProduzentDetailModel, $log, alertService, gettextCatalog, ProduzentenModel, lodash) {
      $rootScope.viewId = 'D-Pzt';

      var defaults = {
        model: {
          id: undefined,
          aktiv: true,
          mwst: false
        }
      };
    
      ProduzentenModel.getProduzenten(function(result){
          $scope.produzenten = result;
      });

      if (!$routeParams.id) {
        $scope.produzent = new ProduzentDetailModel(defaults.model);
      } else {
        ProduzentDetailModel.get({
          id: $routeParams.id
        }, function(result) {
          $scope.produzent = result;
          $scope.produzentForm.$setPristine();
        });
      }

      $scope.produzentBezeichnung = function() {
        if (angular.isDefined($scope.produzent) && angular.isDefined($scope.produzent.name)) {
          var ret = $scope.produzent.name;
          if (angular.isDefined($scope.produzent.vorname)) {
            ret = ret  + ' ' + $scope.produzent.vorname;
          }
          return ret;
        }
        return undefined;
      };

      $scope.isExisting = function() {
        return angular.isDefined($scope.produzent) && angular.isDefined($scope.produzent
          .id);
      };

      $scope.produzentExists = function(produzent) {
          var exists = false;
            lodash.forEach($scope.produzenten, function(p){
                if (p.kurzzeichen === produzent.kurzzeichen){
                    exists = true;
                }
            })
          return exists; 
        };

      $scope.save = function(produzent) {
           if ($scope.produzentExists(produzent)){
                    alertService.addAlert('lighterror', gettextCatalog.getString(
                    'The producer acronym must be unique'));
                    return '';
           } else {
                return $scope.produzent.$save(function() {
                    $scope.produzentForm.$setPristine();
                });
            };
      };

      $scope.created = function(id) {
        $location.path('/produzenten/' + id);
      };

      $scope.backToList = function() {
        $location.path('/produzenten');
      };

      $scope.delete = function() {
        return $scope.produzent.$delete();
      };

    }
  ]);
