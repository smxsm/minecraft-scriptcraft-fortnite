var Drone = require('drone')
    blocks = require('blocks'); 
function portafort( player, block, height, baseheight, basewidth ) { 
    if (typeof block == 'undefined') {
        block = blocks.iron;
    }
    if (typeof height == 'undefined') {
        height = 6;
    }
    if (typeof baseheight == 'undefined') {
        baseheight = 7;
    }
    if (typeof basewidth == 'undefined') {
        basewidth = 4;
    }

    if (typeof player != 'undefined') {
        echo(player, "portafort: basewidth: " +  basewidth + " baseheight: " + baseheight + " height: " + height);
    }

    this.chkpt('portafort');
    // draw base walls
    this.box0(block, basewidth, baseheight, basewidth);
    this.move('portafort');
    this.up(baseheight);
    // now draw upside-down pyramid
    for ( var i = 2; i <= height; i += 2) {
        this.back().left();
        this.box0(block, basewidth + i, 1, basewidth + i).up();
    }
    // add door and ladder :)
    this.move('portafort').right(basewidth / 2).door().fwd().left().turn(2).ladder(baseheight);
    
    return this.move('portafort');      
}
Drone.extend( portafort );