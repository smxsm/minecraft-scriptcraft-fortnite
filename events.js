var slash = require('slash'),
    items = require('items'),
    utils = require('utils'),
    Drone = require('drone'),
    blocks = require('blocks'); 

/**
 * Click Callback
 * @param {*} event 
 */
function onFnEntityRightClick(event) {
  var player = event.player;
  var worldName = player.getWorld().getName();
  // worlds where flying is allowed
  var allowedWorlds = ["flat_world", "Tilted"];
  // disable in other worlds
  if (allowedWorlds.indexOf(worldName) === -1) {
    return;
  }

  var item = event.player.getItemInHand();
  var etype = '';
  if (item != null && (event.getAction() == "RIGHT_CLICK_BLOCK" || event.getAction() == "RIGHT_CLICK_AIR")) {
      var cancel = true;
      if(item.getType() == "BEDROCK") {
        etype = 'portafort';
      } else if (item.getType() == "WOOD_STAIRS") {
        etype = 'stairs';
      } else if (item.getType() == "WOOD") {
        etype = 'wall';
      } else if (item.getType() == "WOOD_STEP") {
        etype = 'floor';
      } else if (item.getType() == "IRON_INGOT") {
        etype = 'minigun';
      } else {
        cancel = false;
      }
      if (cancel) {
        spawnElement(event, etype);
        event.setCancelled(true); 
      }
  }
}

/**
 * Get the player location
 * @param {*} event 
 */
function getFnPlayerLoc(event) {
    var player = event.player;
    var world  = player.world;
  
    // place in front of you
    var eyelocation = player.getEyeLocation();
    var loc = player.getLocation();
    var h = player.getEyeHeight();

    var dir = loc.getDirection().normalize().multiply(1.5); 
    //var frontlocation = eyelocation.add(dir);
    var frontlocation = loc.add(dir);
    //echo(player, "x: " + frontlocation.getX() + " y: " + frontlocation.getY() +  " z: " + frontlocation.getZ());
    return frontlocation;    
}

/**
 * Correct placement, depending on direction
 * @param {*} drone 
 * @param {*} dir 
 */
function correctAlignment(drone, dir, etype) {
    if (etype == "stairs") {
        if (dir == 'N') {
            //drone.left();
        } else if (dir == 'S') {
            drone.left();
        } else if (dir == 'E') {
            //drone.right();
        } else if (dir == 'W'){
            drone.left();
        }    
    } else if (etype == "floor") {
        if (dir == 'N') {
            drone.left();
        } else if (dir == 'S') {
            drone.left(2);
        } else if (dir == 'E') {
            //drone.right();
        } else if (dir == 'W'){
            drone.left();
        }    
    }
}

/**
 * Spawn a new element
 * @param {*} event 
 */
function spawnElement(event, etype) {

    var ploc = getFnPlayerLoc(event);
    var player = event.player;
    //var d = new Drone(player);
    var d = new Drone(ploc);
    var dir = getPlayerDir(player);

    /*
    var eyelocation = player.getEyeLocation();
    var loc = player.getLocation();
    var h = player.getEyeHeight();
    var x = eyelocation.getX();
    var y = eyelocation.getY() - (2 * h);
    var z = eyelocation.getZ();
    var a = 2;
    if (dir == 'S') {
        a = 3;
    } else if (dir == 'W') {
        a = 0;
    } else if (dir == 'N') {
        a = 1;
    }
    var d = new Drone(x, y, z, a, player.getWorld());
    */
    
    //player.sendMessage(dir);
    switch(etype) {
        case "portafort":
            d.up();
            d.portafort(player);
            break;
        case "stairs":
            correctAlignment(d, dir, etype);
            d.up();
            d.fstairs();
            break;
        case "floor":
            correctAlignment(d, dir, etype);
            d.ffloor();
            break;
        case "wall":
            correctAlignment(d, dir, etype);
            d.up();
            d.fwall();
            break;
        case "minigun":
            shootMinigun(player, 14);
            break;
        default:
            break;
    }
  }

  /**
   * Minigun test
   * @param {*} player
   */ 
  function shootMinigun(player, numshots, i)
  {
    if (typeof i == "undefined") {
        i = 1;
    }
    setTimeout(function () {
        //var ball = player.launchProjectile(org.bukkit.entity.WitherSkull.class);
        var ball = player.launchProjectile(org.bukkit.entity.SmallFireball.class);
        ball.setShooter(player);
        ball.setVelocity(player.getEyeLocation().getDirection().multiply(2));
        i++;
        if (i < numshots) {
            shootMinigun(player, numshots, i);
        }
     }, 100)
      // org.bukkit.entity.EntityType.SNOWBALL
    }
  /**
   * Get direction the player is facing
   * @param {*} player 
   */
  function getPlayerDir(player)
  {
    var rotation = player.getLocation().getYaw();
    //player.sendMessage(rotation);
    if (rotation < 0) {
        rotation += 360.0;
    }
    if (0 <= rotation && rotation < 22.5) {
        return "N";
    }
    if (22.5 <= rotation && rotation < 67.5) {
        return "NE";
    }
    if (67.5 <= rotation && rotation < 112.5) {
        return "E";
    }
    if (112.5 <= rotation && rotation < 157.5) {
        return "SE";
    }
    if (157.5 <= rotation && rotation < 202.5) {
        return "S";
    }
    if (202.5 <= rotation && rotation < 247.5) {
        return "SW";
    }
    if (247.5 <= rotation && rotation < 292.5) {
        return "W";
    }
    if (292.5 <= rotation && rotation < 337.5) {
        return "NW";
    }
    if (337.5 <= rotation && rotation <= 360) {
        return "N";
    }      
  }

  // event to listen to
  events.playerInteract(onFnEntityRightClick);
  