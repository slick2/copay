'use strict';

angular.module('copayApp.controllers').controller('MoreController',
  function($scope, $rootScope, $location, $filter, balanceService, notification, rateService) {
    var w = $rootScope.wallet;
    $scope.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

    $rootScope.title = 'Settings';

    $scope.unitOpts = [{
      name: 'Satoshis (100,000,000 satoshis = 1BTC)',
      shortName: 'SAT',
      value: 1,
      decimals: 0
    }, {
      name: 'bits (1,000,000 bits = 1BTC)',
      shortName: 'bits',
      value: 100,
      decimals: 2
    }, {
      name: 'mBTC (1,000 mBTC = 1BTC)',
      shortName: 'mBTC',
      value: 100000,
      decimals: 5
    }, {
      name: 'BTC',
      shortName: 'BTC',
      value: 100000000,
      decimals: 8
    }];

    $scope.selectedAlternative = {
      name: w.settings.alternativeName,
      isoCode: w.settings.alternativeIsoCode
    };
    $scope.alternativeOpts = rateService.isAvailable() ?
      rateService.listAlternatives() : [$scope.selectedAlternative];

    rateService.whenAvailable(function() {
      $scope.alternativeOpts = rateService.listAlternatives();
      for (var ii in $scope.alternativeOpts) {
        if (w.settings.alternativeIsoCode === $scope.alternativeOpts[ii].isoCode) {
          $scope.selectedAlternative = $scope.alternativeOpts[ii];
        }
      }
    });


    for (var ii in $scope.unitOpts) {
      if (w.settings.unitName === $scope.unitOpts[ii].shortName) {
        $scope.selectedUnit = $scope.unitOpts[ii];
        break;
      }
    }

    $scope.hideAdv = true;
    $scope.hidePriv = true;
    $scope.hideSecret = true;
    if (w) {
      $scope.priv = w.privateKey.toObj().extendedPrivateKeyString;
      $scope.secret = w.getSecret();
    }

    setTimeout(function() {
      $scope.$digest();
    }, 1);

    $scope.save = function() {
      var w = $rootScope.wallet;
      w.changeSettings({
        unitName: $scope.selectedUnit.shortName,
        unitToSatoshi: $scope.selectedUnit.value,
        unitDecimals: $scope.selectedUnit.decimals,
        alternativeName: $scope.selectedAlternative.name,
        alternativeIsoCode: $scope.selectedAlternative.isoCode,
      });
      notification.success('Success', $filter('translate')('settings successfully updated'));
      balanceService.update(w, function() {
        $rootScope.$digest();
      });
    }; 

    $scope.purge = function(deleteAll) {
      var removed = w.purgeTxProposals(deleteAll);
      if (removed) {
        balanceService.update(w, function() {
          $rootScope.$digest();
        }, true);
      }
      notification.info('Transactions Proposals Purged', removed + ' ' + $filter('translate')('transaction proposal purged'));
    };

    $scope.updateIndexes = function() {
      var w = $rootScope.wallet;
      notification.info('Scaning for transactions', 'Using derived addresses from your wallet');
      w.updateIndexes(function(err) {
        notification.info('Scan Ended', 'Updating balance');
        if (err) {
          notification.error('Error', $filter('translate')('Error updating indexes: ') + err);
        }
        balanceService.update(w, function() {
          notification.info('Finished', 'The balance is updated using the derived addresses');
          w.sendIndexes();
          $rootScope.$digest();
        }, true);
      });
    };
  });
