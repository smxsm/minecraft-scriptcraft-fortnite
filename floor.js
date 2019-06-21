var Drone = require('drone')
    blocks = require('blocks'); 
/**
 * Build a floor
 */    
function ffloor( depth, width, block ) {
    if (typeof block == 'undefined') {
        block = blocks.oak;
    }
    if (typeof depth == 'undefined') {
        depth = 3;
    }
    if (typeof width == 'undefined') {
        width = 3;
    }
    this.chkpt('floor');
    this.box(block, width, 1, depth).up().fwd();
    return this.move('floor');      
}
Drone.extend( ffloor );