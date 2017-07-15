'use strict';

angular.module('game').component('redox', {
  templateUrl: 'views/redox.html',
  controller: 'ct_redox',
  controllerAs: 'ct'
});

angular.module('game').controller('ct_redox', ['state', 'data', 'visibility', 'util', 'format', 'reaction',
  function (state, data, visibility, util, format, reaction) {
    let ct = this;
    ct.state = state;
    ct.data = data;
    ct.visibility = visibility;
    ct.util = util;
    ct.format = format;
    ct.reaction = reaction;

    function update(player) {
      for (let redox of player.redox) {
        if (!redox.resource || !redox.active) {
          continue;
        }

        let reactant = ct.generateName(redox.element, redox.from);
        let power = ct.redoxPower(player);
        let number = Math.min(power, player.resources[reactant].number);
        let react = ct.redoxReaction(redox);

        ct.reaction.react(number, react, player);
      }
    }

    ct.redoxPower = function(player) {
      let level = player.global_upgrades.redox_bandwidth;
      let upgrade = data.global_upgrades.redox_bandwidth;
      let basePower = upgrade.power;
      let polynomial = upgrade.power_poly;
      return basePower * Math.floor(Math.pow(level, polynomial));
    }

    ct.redoxReaction = function (redox) {
      let reactant = ct.generateName(redox.element, redox.from);
      let product = ct.generateName(redox.element, redox.to);
      let energy = redoxEnergy(redox.from, redox.to, redox.element);

      let react = {
        'reactant': {},
        'product': {}
      };

      react.reactant[reactant] = 1;
      react.product[product] = 1;
      if (energy > 0) {
        react.reactant.eV = energy;
      } else if (energy < 0) {
        react.product.eV = -energy;
      }

      let electron = redox.from - redox.to;
      if (electron > 0) {
        react.reactant['e-'] = electron;
      } else if (electron < 0) {
        react.product['e-'] = -electron;
      }

      return react;
    };

    function redoxEnergy(from, to, element) {
      let energyFrom = cumulativeEnergy(element, from);
      let energyTo = cumulativeEnergy(element, to);
      let energy = energyTo - energyFrom;

      return energy;
    }

    function cumulativeEnergy(element, level) {
      let energy = 0;
      let start = Math.min(0, level);
      let end = Math.max(0, level);
      for (let i = start; i <= end; i++) {
        energy += data.redox[element][i];
      }
      if (level < 0) {
        energy = -energy;
      }
      return energy;
    }

    // Generates the name of a ion, e.g. O3+
    ct.generateName = function (element, i) {
      if (i === 0) {
        return data.elements[element].main;
      }
      let postfix = '';
      if (Math.abs(i) > 1) {
        postfix = Math.abs(i);
      }
      postfix += getSign(i);
      let name = element + postfix;
      // special case!! H+ is just a proton
      if (name === 'H+') {
        name = 'p';
      }
      return name;
    };

    function getSign(number) {
      return number > 0 ? '+' : '-';
    }

    ct.redoxSlots = function (player) {
      let level = player.global_upgrades.redox_slots;
      let upgrade = data.global_upgrades.redox_slots;
      let basePower = upgrade.power;
      let multiplier = upgrade.power_mult;
      return basePower * Math.floor(multiplier * level);

    };

    ct.redoxSize = function (player) {
      return player.redox.length;
    }

    ct.addRedox = function (player) {
      if(ct.redoxSize(player) >= ct.redoxSlots(player)){
        return;
      }
      player.redox.push({
        resource: data.elements[ct.state.currentElement].main,
        active: false,
        element: ct.state.currentElement,
        from: 0,
        to: 1
      });
    };

    ct.removeRedox = function (player, index) {
      player.redox.splice(index, 1);
    };

    state.registerUpdate('redox', update);
  }
]);
