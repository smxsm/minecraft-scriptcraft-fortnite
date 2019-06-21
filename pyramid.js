var Drone = require('drone'); 
function pyramid( block, height ) { 
    this.chkpt('pyramid');
    for ( var i = height; i > 0; i -= 2) {
        this.box(block, i, 1, i).up().right().fwd();
    }
    return this.move('pyramid');      
}
Drone.extend( pyramid );