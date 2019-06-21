var Drone = require('drone')
    blocks = require('blocks'); 
/**
 * Build a wall
 */    
function fwall( height, width, block ) {
    if (typeof block == 'undefined') {
        block = blocks.oak;
    }
    if (typeof height == 'undefined') {
        height = 3;
    }
    if (typeof width == 'undefined') {
        width = 3;
    }
    this.chkpt('wall');
    this.box(block, width, height, 1).up().fwd();
    return this.move('wall');      
}
Drone.extend( fwall );