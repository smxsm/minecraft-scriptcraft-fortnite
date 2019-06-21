'use strict';

var utils = require('utils'),
    signs = require('signs'),
    slash = require('slash');

var onWarpChoice = function(event){
    var player = event.player;
    if (player) {
        slash("mv tp Wartelobby", player);
    }
};
// signs.menu returns a function which can be called for one or more signs in the game.
var convertToWarpMenu = signs.menu('[Fortnite]', ['Lobby'], onWarpChoice);

exports.warpSign = function( player ){
    var sign = signs.getTargetedBy(player);
    if ( !sign ) {
        throw new Error('You must look at a sign');
    } 
    convertToWarpMenu(sign);
};
