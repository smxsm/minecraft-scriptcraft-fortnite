var Drone = require('drone')
    blocks = require('blocks'); 
/**
 * Build stairs
 */    
function fstairs( height, width, block ) {
    if (typeof block == 'undefined') {
        block = blocks.oak;
    }
    if (typeof height == 'undefined') {
        height = 3;
    }
    if (typeof width == 'undefined') {
        width = 3;
    }
    this.chkpt('fstairs');
    for ( var i = height; i > 0; i -= 1) {
        this.box(block, width, 1, i).up().fwd();
    }
    this.down().box(block, width, 1, 1);
    return this.move('fstairs');      
}
Drone.extend( fstairs );