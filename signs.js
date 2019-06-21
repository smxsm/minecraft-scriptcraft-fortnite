'use strict';

var utils = require('utils'),
    signs = require('signs'),
    slash = require('slash');
 
var onMapChoice1 = function(event){
    var player = event.player;
    if (player && !isOp(player)) {
        echo(player, "Du musst OP sein!");
        return;
    }
    slash("js fnstart(0)", player);
};
var onMapChoice2 = function(event){
    var player = event.player;
    if (player && !isOp(player)) {
        echo(player, "Du musst OP sein!");
        return;
    }
    slash("js fnstart(1)", player);
};

var convertToMapMenu1 = signs.menu('[FN Map 1] ',
    ['Flat world'],
    onMapChoice1);
var convertToMapMenu2 = signs.menu('[FN-Map 2] ',
    ['Tilted'],
    onMapChoice2);
        
exports.mapSign1 = function( player ){
    var sign = signs.getTargetedBy(player);
    if ( !sign ) {
        throw new Error('You must look at a sign');
    } 
    convertToMapMenu1(sign);
};
exports.mapSign2 = function( player ){
    var sign = signs.getTargetedBy(player);
    if ( !sign ) {
        throw new Error('You must look at a sign');
    } 
    convertToMapMenu2(sign);
};
