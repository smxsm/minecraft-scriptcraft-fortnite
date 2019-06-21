'use strict';
/**
 * Fortnite gameplay script for SpigotMC servers
 * 
 * Uses Multiverse, QuickBoard, InstantReset plugins - and of course ScriptCraft
 * Assumes you have at least the worlds "Wartelobby", "flat_world" and "Tilted"
 * 
 * Make sure to copy the original worlds as templates for InstantReset so that the original
 * worlds can be restored after a game is finished/reset.
 * 
 * Signs (see https://github.com/walterhiggins/ScriptCraft/blob/master/docs/API-Reference.md#signs-module)
 * are used to load the Fortnite maps.
 * Create a new sign, look at it and call "/js warpSign()" to convert it to a Fortnite sign (see "warpsign.js")
 * With every right click, the sign will then bring you to the Fortnite lobby.
 * The map launching signs inside the "Wartelobby" map can be created with
 * "/js mapSign1()" and "/js mapSign2()", see "signs.js"
 * 
 * https://www.spigotmc.org/resources/quickboard-free-scoreboard-plugin-scroller-changeable-text-placeholderapi-anti-flicker.15057/
 * https://www.spigotmc.org/resources/instantreset.1257/
 */

var store = {},
  // minimum number of player before game starts
  minPlayers = 2,
  // name of waiting lobby
  lobbyName = "Wartelobby",
  // names of fortnite maps
  allowedWorlds = ["flat_world", "Tilted"],
  // join running games as spectator (gm 3)
  joinRunningGameAsSpectator = true,
  ////////////// DO NOT CHANGE ANYTHING BELOW! ////////////
  // index of world to use for the game
  activeWorldIndex = -1,
  // flag if game is running
  gameRunning = false,
  bkBukkit = org.bukkit.Bukkit,
  items = require('items'),
  slash = require('slash'),
  inventory = require('inventory'),
  bkOfflinePlayer = org.bukkit.OfflinePlayer;

/**
 * TODO: scoreboard
 * s. https://minecraft-de.gamepedia.com/Anzeigetafel
 *
 * /scoreboard players list DerSchnubbi
 */
var sb = function (cmd) {
  bkBukkit.dispatchCommand(server.consoleSender, 'scoreboard ' + cmd);
};

/**
 * Check if valid Fortnite world
 * @param {*} worldName 
 */
var isFnWorld = function (worldName) {
  if (allowedWorlds.indexOf(worldName) === -1 && worldName != lobbyName) {
    return false;
  }
  return true;
};

/**
 * Get the world to play in
 */
var getFnPlayWorld = function() {
  if (activeWorldIndex != -1) {
    return allowedWorlds[activeWorldIndex];
  } else {
    var randomNumber = Math.floor(Math.random() * Math.floor(allowedWorlds.length));
    return allowedWorlds[randomNumber];
  }
};

/**
 * Get number of players in game
 */
var getNumPlayers = function() {
  return Object.keys(store).length;
};

/**
 * Set game rules etc.
 * @param {*} player 
 */
var setGameSettings = function(player) {
  if (player) {
    slash("gm 0 " + player.name);
  }
  slash("butcher");
  slash("day");
  slash("gamerule doMobSpawning false");
  slash("gamerule doDaylightCycle false");
  slash("difficulty 1");
};

/**
 * The winner takes it all
 * @param Player player 
 */
var _rewardWinner = function(player) {
  slash("heal " + player.name);
};

/**
 * Death callback
 * @param {*} event 
 */
var onFnPlayerDeath = function (event) {
  var player = event.getEntity();
  var worldName = player.getWorld().getName();
  if (isFnWorld(worldName)) {
    echo(player, "[Fortnite]".bold().gold() + " Ah, Pech!".gray());
    var killer = player.getKiller();
    if (killer) {
      echo(killer, "[Fortnite]".bold().gold() + " Du hast ".red() + player.getName() + " erledigt!".red());
      store[killer.name].score++;
      sb('players set ' + killer.name + ' Kills ' + store[killer.name].score);
    }
    _removePlayer(player, true, true);
    var numPlayers = getNumPlayers();
    if (numPlayers <= 1) {
      setTimeout( function() {
        _stopGame(true);
      }, 3000);
    }
  }
};

/**
 * Damage callback
 * @param {*} event 
 */
var onFnEntityDamage = function (event) {
  var player = event.entity;
  var worldName = player.getWorld().getName();
  if (isFnWorld(worldName) && !gameRunning) {
    echo(player, "[Fortnite]".bold().gold() + " Kein Schaden, Spiel läuft noch nicht.".gray());
    event.setCancelled(true);
  }
};

/**
 * Set fortnite inventory
 * @param {*} player 
 */
var setInventory = function(player) {
  var inv = player.inventory;
  var hasInv = inventory(player).contains( new org.bukkit.inventory.ItemStack(blocks.stairs.oak, 64) );
  // set inventory
  inv.clear();
  inventory(player).add(new org.bukkit.inventory.ItemStack(blocks.stairs.oak, 64));
  inventory(player).add(new org.bukkit.inventory.ItemStack(blocks.slab.oak, 64));
  inventory(player).add(new org.bukkit.inventory.ItemStack(blocks.oak, 64));
  //inventory(player).add(new org.bukkit.inventory.ItemStack(blocks.bedrock, 64));
  inventory(player).add(items.stoneAxe(1));
};

/**
 * Join function
 * @param {*} event 
 */
var onFnPlayerJoin = function (event) {
  var player = event.player;
  var inv = player.inventory;
  var worldName = player.getWorld().getName();
  // disable in other worlds
  if (!isFnWorld(worldName)) {
    if (store[player.name]) {
      inv.clear();
      // reload quickboard, doesn't turn off in disabled worlds!?
      slash("qb reload");
      echo(player, "[Fortnite]".bold().gold() + " Entferne Dich aus Fortnite!".gray());
      _removePlayer(player, true, false);
    }
    return;
  }
  setGameSettings(player);

  var numPlayers = getNumPlayers();
  var gamePlayer = store[player.name];
  if (!gamePlayer) {
    _addPlayer(player, 0);
    numPlayers++;
  }
  // start the game?
  if (gameRunning === false) {
      if (numPlayers >= minPlayers) {
        echo(player, "[Fortnite]".bold().gold() + " Spieler vollständig, starte zufällige Map in 20 Sekunden!".green());
        setTimeout(function() {
          _startGame();
        }, 20000);
    } else {
      echo(player, "[Fortnite]".bold().gold() + " Warte auf Spieler, bisher ".gray() + numPlayers + " von " + minPlayers + "".gray());
    }
  } else {
    var currentPlayWorld = getFnPlayWorld();
    if (player.getWorld().getName() != currentPlayWorld) {
      echo(player, "[Fortnite]".bold().gold() + " Es läuft schon ein Spiel!".red());   
      if (joinRunningGameAsSpectator) {
        echo(player, "[Fortnite]".bold().gold() + "Joine als Zuschauer ...".green());   
        // tp to the running game?
        setTimeout(function() {
          // specatator mode
          slash("gm 3 " + player.name);
          slash("mv tp " + player.name + " " + currentPlayWorld);
        }, 2000);
      } 
    }
}
};

/**
 * Start the game!
 */
var _startGame = function (idx) {
  if (typeof idx == "undefined") {
    idx = -1;
  }
  if (idx >= 0 && idx <= allowedWorlds.length) {
    activeWorldIndex = idx;
  }
  var p,
    player;
  if (gameRunning === true) {
    echo("Spiel läuft bereits!");
    return;
  }

  var n = getNumPlayers();
  if (n < 1) {
    echo("Keine Spieler vorhanden!");
    return;
  }
  gameRunning = true;

  // inform all players
  for (p in store) {
    player = server.getPlayer(p);
    if (player) {
      setInventory(player);
      echo(player, "[Fortnite]".bold().gold() + " Starte Fortnite game ...".green());
      // check if player is in active FN world
      var currentPlayWorld = getFnPlayWorld();
      if (player.getWorld().getName() != currentPlayWorld) {
        slash("mv tp " + player.name + " " + currentPlayWorld);
      }
    }
  }
};

/**
 * Adding player to game
 * @param {*} player 
 * @param {*} score 
 */
var _addPlayer = function (player, score) {
  if (typeof score == 'undefined') {
    score = 0;
  }
  var worldName = player.getWorld().getName();
  store[player.name] = {
    score: score,
    world: worldName
  };
  // scoreboard: https://bukkit.org/threads/tutorial-scoreboards-teams-with-the-bukkit-api.139655/
  //scoreboard.update( 'fortnite', player, store[ player.name ].score);
  sb('objectives add Kills dummy Kills');
  sb('players set ' + player.name + ' Kills ' + store[player.name].score);
  sb('objectives setdisplay sidebar Fortnite');
};

/**
 * Remove player from game
 * @param {*} player 
 * @param {*} notify 
 */
var _removePlayer = function (player, notify, backToLobby) {
  if (player instanceof bkOfflinePlayer && player.player) {
    player = player.player;
  }
  if (!store[player.name]) {
    return;
  }
  var playerScore = store[player.name].score;
  sb('players set ' + player.name + ' Kills ' + 0);

  // clear inventory?
  var inv = player.inventory;
  inv.clear();
  
  delete store[player.name];
  if (notify && player) {
    echo(player, "[Fortnite]".bold().gold() + " Deine Kills: ".yellow() + playerScore);
  }

  // move player back to lobby
  if (backToLobby) {
    slash("mv tp " + player.name + " " + lobbyName);
  }

  // end game?
  var numPlayers = getNumPlayers();
  if (numPlayers <= 1 && gameRunning) {
    setTimeout( function() {
      _stopGame(true);
    }, 3000);
  }  
};

/**
 * Remove all the players
 * @param {*} notify 
 */
var _removeAllPlayers = function (notify) {
  if (typeof notify == 'undefined') {
    notify = false;
  }
  for (var p in store) {
    // getOfflinePlayer() returns ALL players, online AND offline!
    var player = server.getOfflinePlayer(p);
    if (player) {
      _removePlayer(player, notify, true);
    }
  }
};

/**
 * Stop the fun!
 * @param {*} removePlayers 
 */
var _stopGame = function (removePlayers) {
  var worldName = '';
  if (gameRunning === false) {
    echo("Es läuft kein Spiel!");
    return;
  }
  gameRunning = false;
  if (typeof removePlayers == 'undefined') {
    removePlayers = true;
  }
  var numPlayers = getNumPlayers();
  // reset score
  for (var p in store) {
    var player = server.getOfflinePlayer(p);
    if (player) {
      worldName = player.getWorld().getName();
      if (numPlayers == 1) {
        echo(player, "[Fortnite]".bold().gold() + "#1 Epischer Sieg!".bold().yellow() + " Deine Kills: ".yellow() + store[player.name].score);
        _rewardWinner(player);
      } else {
        echo(player, "[Fortnite]".bold().gold() + " Fortnite Spiel beendet, Deine Kills: ".green() + store[player.name].score);
        for (var a in store) {
          if (a != player.name) {
            echo(player, "[Fortnite]".bold().gold() + " Kills von ".gray() + a + ": " + store[a].score);
          }
        }
      }     
      store[player.name].score = 0;
      sb('players set ' + player.name + ' Kills ' + 0);
    }
  }
  // reset map
  setTimeout(function() {
    if (worldName == '') {
      worldName = getFnPlayWorld();
    }
    echo("Setze Fortnite Welt zurück: " + worldName);
    slash("ir reset " + worldName);
  }, 2000);
  
  if (!removePlayers) {
    return;
  }
  _removeAllPlayers(true);
};

/**
 * Player quit
 * @param {*} event 
 */
var onFnPlayerQuit = function (event) {
  _removePlayer(event.player, false, false);
};

/*
 stop the game when ScriptCraft is unloaded.
 */
addUnloadHandler(function () {
  if (gameRunning) {
    _stopGame(true);
  }
});

command( 'hellorand', function( parameters, player ) {
  var randomNumber = Math.floor(Math.random() * Math.floor(allowedWorlds.length));
  echo( player, 'Hello ' + player.name + " random number is: " + randomNumber );
});

/**
 * jsp command to list all players
 * @param {*} sender 
 */
function fnListPlayers(params, sender) {
  var players = '';
  for (var p in store) {
    var player = server.getOfflinePlayer(p);
    if (player) {
      players = players + p +  " ";
    }  
  }
  echo(sender, "[Fortnite]".bold().gold() + " Players: ".gray() + players);
}
command(fnListPlayers);

/*
 * start/stop game via console
 */
exports.fnstart = function(idx) {
  _startGame(idx);
};
exports.fnstop = function() {
  _stopGame(true);
};
exports.fnRandom = function() {
  var randomNumber = Math.floor(Math.random() * Math.floor(allowedWorlds.length));
  activeWorldIndex = randomNumber;
};
exports.fnrestart = function(idx) {
  _stopGame(true);
  setTimeout(function(idx) {
    _startGame(idx);
  }, 5000);
};

events.playerQuit(onFnPlayerQuit);
events.playerDeath(onFnPlayerDeath);
events.playerChangedWorld(onFnPlayerJoin);
events.entityDamage(onFnEntityDamage);