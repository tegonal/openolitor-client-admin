'use strict';

/**
 */
angular.module('openolitor-admin')
  .controller('RechnungsPositionenOverviewController', ['$q', '$scope', '$filter',
    '$location',
    'RechnungsPositionenModel', 'NgTableParams', '$http', 'FileUtil',
    'DataUtil', 'EnumUtil',
    'OverviewCheckboxUtil', 'API_URL', 'FilterQueryUtil', 'RECHNUNGSPOSITIONSSTATUS',
    'msgBus', 'lodash', 'VorlagenService', 'localeSensitiveComparator',
    function($q, $scope, $filter, $location, RechnungsPositionenModel,
      NgTableParams, $http, FileUtil, DataUtil, EnumUtil,
      OverviewCheckboxUtil, API_URL,
      FilterQueryUtil, RECHNUNGSPOSITIONSSTATUS, msgBus, lodash, VorlagenService,
      localeSensitiveComparator) {

      $scope.entries = [];
      $scope.filteredEntries = [];
      $scope.loading = false;
      $scope.model = {};
      $scope.rechnungsPositionenStatus = EnumUtil.asArray(RECHNUNGSPOSITIONSSTATUS);

      $scope.search = {
        query: '',
        queryQuery: '',
        filterQuery: ''
      };

      $scope.hasData = function() {
        return $scope.entries !== undefined;
      };

      $scope.checkboxes = {
        checked: false,
        checkedAny: false,
        items: {},
        css: '',
        ids: []
      };
        
      $scope.selectRechnungsPosition = function(rechnungsPosition) {
        if ($scope.selectedRechnungsPosition === rechnungsPosition) {
          $scope.selectedRechnungsPosition = undefined;
        } else {
          $scope.selectedRechnungsPosition = rechnungsPosition;
        }
      };
 

      $scope.downloadRechnung = function(rechnung) {
        rechnung.isDownloading = true;
        FileUtil.downloadGet('rechnungen/' + rechnung.id +
          '/aktionen/downloadrechnung', 'Rechnung ' + rechnung.id,
          'application/pdf',
          function() {
            rechnung.isDownloading = false;
          });
      };

      $scope.downloadMahnung = function(rechnung, fileId) {
        rechnung.isDownloadingMahnung = true;
        FileUtil.downloadGet('rechnungen/' + rechnung.id +
          '/aktionen/download/' + fileId, 'Rechnung ' + rechnung.id + ' Mahnung',
          'application/pdf',
          function() {
            rechnung.isDownloadingMahnung = false;
          });
      };


      // watch for check all checkbox
      $scope.$watch(function() {
        return $scope.checkboxes.checked;
      }, function(value) {
        OverviewCheckboxUtil.checkboxWatchCallback($scope, value);
      });

      $scope.projektVorlagen = function() {
        return VorlagenService.getVorlagen('VorlageRechnung');
      };

      // watch for data checkboxes
      $scope.$watch(function() {
        return $scope.checkboxes.items;
      }, function() {
        OverviewCheckboxUtil.dataCheckboxWatchCallback($scope);
      }, true);

      $scope.actions = [{
        labelFunction: function() {
          return 'Rechnung erstellen';
        },
        noEntityText: true,
        iconClass: 'glyphicon glyphicon-plus',
        onExecute: function() {
          return $location.path('/rechnungen/new');
        }
      }, {
        label: 'Rechnungsdokumente erstellen',
        iconClass: 'fa fa-file',
        onExecute: function() {
          $scope.showGenerateRechnungReport = true;
          return true;
        },
        isDisabled: function() {
          return !$scope.checkboxes.checkedAny ||
            alleRechnungenStorniertOderBezahlt($scope.checkboxes.ids,
              $scope.checkboxes.data);
        }
      }, {
        label: 'Mahnungsdokumente erstellen',
        iconClass: 'fa fa-file',
        onExecute: function() {
          $scope.showGenerateMahnungReport = true;
          return true;
        },
        isDisabled: function() {
          return !$scope.checkboxes.checkedAny ||
            alleRechnungenStorniertOderBezahlt($scope.checkboxes.ids,
              $scope.checkboxes.data);
        }
      }, {
        label: 'Rechnungsdokumente herunterladen',
        iconClass: 'fa fa-download',
        onExecute: function() {
          return FileUtil.downloadPost('rechnungen/aktionen/downloadrechnungen', {
            'ids': $scope.checkboxes.ids
          });
        },
        isDisabled: function() {
          return !$scope.checkboxes.checkedAny ||
            !hasRechnungDocument($scope.checkboxes.ids,
              $scope.checkboxes.data);
        }
      }, {
        label: 'Mahnungsdokumente herunterladen',
        iconClass: 'fa fa-download',
        onExecute: function() {
          return FileUtil.downloadPost('rechnungen/aktionen/downloadmahnungen', {
            'ids': $scope.checkboxes.ids
          });
        },
        isDisabled: function() {
          return !$scope.checkboxes.checkedAny ||
            !hasRechnungDocument($scope.checkboxes.ids,
              $scope.checkboxes.data);
        }
      }, {
        label: 'Rechnungen verschickt',
        iconClass: 'fa fa-exchange',
        onExecute: function() {
          return $http.post(API_URL + 'rechnungen/aktionen/verschicken', {
            'ids': $scope.checkboxes.ids
          }).then(function() {
            $scope.model.actionInProgress = undefined;
          });
        },
        isDisabled: function() {
          return !$scope.checkboxes.checkedAny;
        }
      }, {
        label: 'Kundenliste anzeigen',
        iconClass: 'fa fa-user',
        isDisabled: function() {
          return !$scope.checkboxes.checkedAny;
        },
        onExecute: function() {
          var result = lodash.filter($scope.checkboxes.data, function(d) {
            return lodash.includes($scope.checkboxes.ids, d.id);
          });
          result = lodash.map(result, 'kundeId');
          $location.path('/kunden').search('q', 'id=' + result.join());
        }
      }, {
        label: 'Email Versand*',
        iconClass: 'fa fa-envelope-o',
        onExecute: function() {
          return false;
        },
        isDisabled: function() {
          return true;
        }
      }, {
        label: 'Rechnungen löschen',
        iconClass: 'fa fa-times',
        isDisabled: function() {
          return !$scope.checkboxes.checkedAny;
        },
        onExecute: function() {
          var result = lodash.filter($scope.checkboxes.data, function(d) {
            return lodash.includes($scope.checkboxes.ids, d.id);
          });
          angular.forEach(result, function(r) {
            r.$delete();
          });
        }
      }];

      if (!$scope.tableParams) {
        //use default tableParams
        $scope.tableParams = new NgTableParams({ // jshint ignore:line
          page: 1,
          count: 10,
          sorting: {
            name: 'asc'
          },
          filter: {
            status: ''
          }
        }, {
          filterDelay: 0,
          groupOptions: {
            isExpanded: true
          },
          exportODSModel: RechnungsPositionenModel,
          getData: function(params) {
            if (!$scope.entries) {
              return;
            }
            // use build-in angular filter
            var dataSet = $filter('filter')($scope.entries, $scope.search.queryQuery);
            // also filter by ngtable filters
            dataSet = $filter('filter')(dataSet, params.filter());
            dataSet = params.sorting ?
              $filter('orderBy')(dataSet, params.orderBy(), true, localeSensitiveComparator) :
              dataSet;

            $scope.filteredEntries = dataSet;

            params.total(dataSet.length);
            return dataSet.slice((params.page() - 1) *
              params.count(), params.page() * params.count());
          }

        });
      }

      function search() {
        if ($scope.loading) {
          return;
        }
        //  $scope.entries = $scope.dummyEntries;
        $scope.tableParams.reload();

        $scope.loading = true;
        $scope.entries = RechnungsPositionenModel.query({
          f: $scope.search.filterQuery
        }, function() {
          $scope.tableParams.reload();
          $scope.loading = false;
          $location.search('q', $scope.search.query);
        });
      }

      var existingQuery = $location.search().q;
      if (existingQuery) {
        $scope.search.query = existingQuery;
      }

      $scope.$watch('search.query', function() {
        $scope.search.filterQuery = FilterQueryUtil.transform($scope.search
          .query);
        $scope.search.queryQuery = FilterQueryUtil.withoutFilters($scope.search
          .query);
        search();
      }, true);

      $scope.closeRechnungBericht = function() {
        $scope.showGenerateRechnungReport = false;
      };

      $scope.closeMahnungBericht = function() {
        $scope.showGenerateMahnungReport = false;
      };

      msgBus.onMsg('EntityModified', $scope, function(event, msg) {
        if (msg.entity === 'Rechnung') {
          var rechnung = lodash.find($scope.entries, function(r) {
            return r.id === msg.data.id;
          });
          if (rechnung) {
            DataUtil.update(msg.data, rechnung);

            var filteredRechnung = lodash.find($scope.filteredEntries,
              function(r) {
                return r.id === msg.data.id;
              });
            if (filteredRechnung) {
              DataUtil.update(msg.data, filteredRechnung);

              $scope.tableParams.reload();
            }

            $scope.$apply();
          }
        }
      });

      msgBus.onMsg('EntityDeleted', $scope, function(event, msg) {
        if (msg.entity === 'Rechnung') {
          var removed = lodash.remove($scope.entries, function(r) {
            return r.id === msg.data.id;
          });
          if (removed !== []) {
            $scope.tableParams.reload();

            $scope.$apply();
          }
        }
      });
    }
  ]);
