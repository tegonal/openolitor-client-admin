'use strict';

/**
 */
angular.module('openolitor-admin')
  .controller('MailvorlagenController', ['$scope', 'MailvorlagenModel', 'msgBus',
    'DataUtil', 'lodash', 'NgTableParams', 'gettext', 'Upload', 'API_URL',
    'FileUtil', 'MailvorlagenService',

    function($scope, MailvorlagenModel, msgBus, DataUtil, lodash, NgTableParams,
      gettext, Upload, API_URL, FileUtil, MailvorlagenService) {
      $scope.template = {
        typ: $scope.typ
      };
      $scope.title = $scope.typ.replace('Vorlage', '');

      $scope.addVorlage = function() {
        var vorlage = new MailvorlagenModel($scope.template);
        vorlage.$save();
        $scope.template.creating = true;
      };

      $scope.saveVorlage = function(vorlage) {
        vorlage.$save();
        vorlage.mailvorlagenupdating = true;
      };

      $scope.selectVorlage = function(vorlage, itemId) {
        var allRows = angular.element('div[name="vorlageTable"] table tbody tr');
        allRows.removeClass('row-selected');

        if ($scope.selectedVorlage === vorlage) {
          $scope.selectedVorlage = undefined;
        } else {
          $scope.selectedVorlage = vorlage;
          var row = angular.element('#' + itemId);
          row.addClass('row-selected');
        }
      };

      $scope.unselectVorlage = function() {
        $scope.selectedVorlage = undefined;
        var allRows = angular.element('div[name="vorlageTable"] table tbody tr');
        allRows.removeClass('row-selected');
      };

      $scope.unselectVorlageFunct = function() {
        return $scope.unselectVorlage;
      };

      $scope.inProgress = function(vorlage) {
        return !angular.isUndefined(vorlage) && (vorlage.deleting || vorlage.updating);
      };

      $scope.deleteVorlage = function(vorlage) {
        vorlage.deleting = true;
        vorlage.$delete();
      };

      var unwatch = $scope.$watch(function() {
        return MailvorlagenService.getVorlagen($scope.typ);
      }, function() {
        if ($scope.tableParams) {
          $scope.tableParams.reload();
        }
      });
      $scope.$on('destroy', function() {
        unwatch();
      });

      if (!$scope.tableParams) {
        //use default tableParams
        $scope.tableParams = new NgTableParams({ // jshint ignore:line
          page: 1,
          count: 1000,
          sorting: {
            name: 'asc'
          }
        }, {
          filterDelay: 0,
          groupOptions: {
            isExpanded: true
          },
          getData: function(params) {
            //concat with default vorlage
            var values = [{
              name: gettext('Standardvorlage'),
              default: true
            }];

            var vorlagen = MailvorlagenService.getVorlagen($scope.typ);

            var allValues = (vorlagen) ? lodash.concat(values, vorlagen) : values;

            params.total(allValues.length);
            return allValues;
          }

        });
      }

      msgBus.onMsg('MailTemplateCreated', $scope, function(event, msg) {
        if ($scope.typ === msg.vorlage.typ) {
          $scope.template.creating = false;
          $scope.tableParams.reload();
          $scope.$apply();
        }
      });

      msgBus.onMsg('MailTemplateModified', $scope, function(event, msg) {
        if ($scope.typ === msg.vorlage.typ) {
          msg.vorlage.editing = false;
          msg.vorlage.updating = false;
          $scope.unselectVorlage();
          $scope.tableParams.reload();
        }
      });

      msgBus.onMsg('MailTemplateDeleted', $scope, function(event, msg) {
        if ($scope.typ === msg.vorlage.typ) {
          $scope.tableParams.reload();
          $scope.$apply();
        }
      });
    }
  ]);
