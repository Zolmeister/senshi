var app = require('http').createServer(function (req, res) {
  if (req.url.indexOf('main.js') !== -1) return res.end(fs.readFileSync('main.js'))
  if (req.url.indexOf('player.png') !== -1) return res.end(fs.readFileSync('player.png'))
  res.end(fs.readFileSync('index.html'))
  /* -- note, this is premature optimization --
  function (err, data) {
    if (err) {
      return res.end('Error loading index.html');
    }

    res.end(data);
  });*/
}),
  io = require('socket.io').listen(app),
  fs = require('fs');

app.listen(3000)

// list of taken names
var taken = []
io.set('log level', 2)
io.sockets.on('connection', function (socket) {
  var p;

  // on socket connect, start streaming game data to them
  socket.emit('highScores', highScores.slice(0, 10))
  socket.emit('setState', arena)

  // socket join game (gives name), adds them to arena
  socket.on('join', function (name) {
    name = name.substr(0, 17)
    if (/^[a-zA-Z]+$/.test(name) && taken.indexOf(name) == -1) {

      // debug
      // taken.push(name)

      p = new Player(name, socket.id)
      arena.players.push(p)
      diff[0].push(p)
      // socket.emit('name', name)
      socket.emit('id', socket.id)
      return
    }
    socket.emit('taken', name)
  })

  // on socket disconnect, kill them
  socket.on('disconnect', function () {
    if (p) p.health = 0
  })

  // on socket command (movement/attack), update game state
  socket.on('keydown', function (key) {
    if (!p) return

    if (key == 32 || key == 90) return p.attacking = 1
    if (key > 36 && key < 41) {

      // remove key if was in list before
      if (p.keys.indexOf(key) != -1) p.keys.splice(p.keys.indexOf(key), 1)

      // set key to first position
      p.keys.unshift(key)
    }
  })
  socket.on('keyup', function (key) {
    if (!p) return
    p.keys.splice(p.keys.indexOf(key), 1)
  })

  // chat
  socket.on('chat', function (msg) {
    io.sockets.emit('chat', (p && p.name || '☠') + ': ' + msg)
  })
});


//game
var random = (function rng() {
  var x = 123456789,
    y = 362436069,
    z = 521288629,
    w = 88675123,
    t;
  return function rand() {
    t = x ^ (x << 11)
    x = y;
    y = z;
    z = w;
    w = w ^ (w >> 19) ^ (t ^ (t >> 8));
    return (w * 2.3283064365386963e-10) * 2;
  }
})()

// stub to run through RNG
for (var y = -600 / 2; y < 600 / 2; y += 14) {
  for (var x = -800 / 2; x < 800 / 2; x += 14) {
    random()
  }
}

var items = (function generateMap() {
  var m = []
  random()
  for (var y = -600 / 2; y < 600 / 2; y += 14) {
    for (var x = -800 / 2; x < 800 / 2; x += 14) {
      var rand = random()
      if (rand > 0.9996) {
        m.push({
          id: 2,
          x: x,
          y: y
        })
      } else if (rand > 0.998) {
        m.push({
          id: 1,
          x: x,
          y: y
        })
      } else if (rand > 0.995) {
        m.push({
          id: 0,
          x: x,
          y: y
        })
      }
    }
  }
  return m
})();

var arena = {
  players: [],
  bullets: [],
  items: items
};
var highScores = [];

// stub 10 high scores
for (var i = 0; i < 10; i++) {
  highScores.push({
    name: '',
    score: ''
  })
}

function Player(name, id) {
  this.name = name
  this.id = id
  this.x = Math.floor(Math.random() * 300) + 50
  this.y = Math.floor(Math.random() * 100) + 50
  this.health = 100
  this.kills = 0

  // weapons: fists, machete, bow, gun - [-1, 0, 1, 2]
  this.weapon = -1

  // directions: left, up, right, down - 0, 1, 2, 3
  this.dir = 3

  // animation frame
  this.frame = 1

  this.keys = []
  this.attacking = 0

  while (collide(this, arena.players)) {
    this.x = Math.floor(Math.random() * 300) + 50
    this.y = Math.floor(Math.random() * 100) + 50
  }
}

function Bullet(type, x, y, dir, shooter) {
  // types: arrow, bullet - [0, 1]
  this.type = type
  this.shooter = shooter
  this.x = x
  this.y = y
  this.dir = dir
}

// This diff will be sent and applied by the client to sync their arena
// diff[0-2] = players
// diff[0] = new players (append to end)
// diff[1] = del players indicies (splice, starting in reverse order)
// diff[2] = player updates (i:index, updated attrs)
// diff[3-5] = bullets
// diff[6-8] = items
var diff = Array.apply([], new Array(9)).map(function () {
  return []
});

function clone(o) {
  return JSON.parse(JSON.stringify(o))
}

function physics(frame) {
  var players = arena.players
  var bullets = arena.bullets
  var items = arena.items
  var arenaClone = clone(arena)
  
  // dir: [delta x, delta y]
  var keymap = {
    0: [-2, 0], // left
    1: [0, -2], // up
    2: [2, 0], // right
    3: [0, 2], // down
  }

  // player movement
  for (var i = 0; i < players.length; i++) {
    var player = players[i]
    var key = (player.keys[0] || -1) - 37
    if (player.attacking) {
      if (frame % 4 == 0) {
        // maybe remove an attack frame
        if (player.frame == 3) {
          player.frame++;
          player.attacking = (player.attacking + 1) % 5
        } else if (player.frame == 4) {
          // here is where we check for hit (if melee weapon)
          if (player.weapon < 1) {
            var weapon = {
              x: player.x + keymap[player.dir][0] * 5,
              y: player.y + keymap[player.dir][1] * 5
            }
            var hit = collide(weapon, players.slice(0, i).concat(players.slice(i + 1)))
            if (hit) {
              hit.health -= 10
              if (hit.health <= 0) {
                player.kills++
              }
            }
          } else {
            var bullet = new Bullet(player.weapon - 1, player.x, player.y, player.dir, player.id)
            arena.bullets.push(bullet)
            diff[3].push(bullet)
            arenaClone.bullets.push(bullet)
          }
          player.frame++;
          player.attacking = (player.attacking + 1) % 5
        } else {
          player.frame = 3
          player.attacking = (player.attacking + 1) % 5
        }
      }
    } else if (keymap[key]) {
      if (frame % 6 == 0) {
        player.frame = (player.frame + 1) % 4
      }
      player.x += keymap[key][0]
      player.y += keymap[key][1]
      if (player.x < -400 || player.x > (400 - 16) || player.y < -300 || player.y > (300 - 18) || collide(player, players.slice(0, i).concat(players.slice(i + 1)))) {
        player.x -= keymap[key][0]
        player.y -= keymap[key][1]
      }
      player.dir = key;
    } else {
      player.frame = 1
    }
  }

  // bullet movement/collision
  for (var i = bullets.length - 1; i >= 0; i--) {
    var bullet = bullets[i]
    bullet.x += keymap[bullet.dir][0] * 2
    bullet.y += keymap[bullet.dir][1] * 2
    var player = collide(bullet, players)
    if (player && bullet.shooter != player.id) {
      // arrow does 10 dmg, bullet does 20
      player.health -= bullet.type == 0 ? 10 : 20
      if (player.health <= 0) {
        var id = bullet.shooter
        for (var i = 0; i < players.length; i++) {
          if (players[i].id == id) {
            players[i].kills++
            break
          }
        }
      }
      
      diff[4].push(i)
      bullets.splice(i, 1)
    } else if (bullet.x < -400 || bullet.x > 400 || bullet.y < -300 || bullet.y > 300) {
      diff[4].push(i)
      bullets.splice(i, 1)
    }
  }

  // player pickup items
  for (var i = items.length - 1; i >= 0; i--) {
    var item = items[i]
    var player = collide(item, players)

    // if colliding with item, pick it up
    if (player) {

      // item is better than current
      if (player.weapon < item.id) {
        var weapon = item.id

        // pick up the item
        if (player.weapon != -1) {

          // drop current weapon
          item.id = player.weapon
        } else {

          // remove the item
          items.splice(i, 1)
          diff[7].push(i)
        }

        player.weapon = weapon
      }
    }
  }

  // player deaths
  for (var i = players.length - 1; i >= 0; i--) {
    var player = players[i]
    if (player.health <= 0) {
      // drop weapon
      if (player.weapon != -1) {
        var item = {
          id: player.weapon,
          x: player.x,
          y: player.y
        }
        items.push(item)
        arenaClone.items.push(item)
        diff[6].push(item)
      }
      // anounce death
      io.sockets.emit('alert', player.name + ' has been killed')

      // update high scores
      // TODO - only send if top 10 change
      highScores.push({
        name: player.name,
        score: player.kills * 1000
      })

      highScores.sort(function (a, b) {
        return -a.score + b.score
      })

      // send high score list
      io.sockets.emit('highScores', highScores.slice(0, 10))

      players.splice(i, 1)
      diff[1].push(i)
    }
  }

  
  // calculate update diffs
  // apply death diffs to clone
  // players
  for(var i=0;i<diff[1].length;i++) {
    arenaClone.players.splice(i,1)
  }
  var pDiffs = differ(players, arenaClone.players)
  
  // bullets
  for(var i=0;i<diff[4].length;i++) {
    arenaClone.bullets.splice(i,1)
  }
  var bDiffs = differ(bullets, arenaClone.bullets)
  // items
  for(var i=0;i<diff[7].length;i++) {
    arenaClone.items.splice(i,1)
  }
  var iDiffs = differ(items, arenaClone.items)
  
  diff[2] = pDiffs
  diff[5] = bDiffs
  diff[8] = iDiffs
  
  var t = diff
  diff = Array.apply([], new Array(9)).map(function () {
    return []
  })

  return t
}

function differ(current, clone) {
  var diffs = []
  if(current.length != clone.length) {
    console.log('cur', current, 'cl', clone)
    throw new Error("AAAH")
}
  for (var i=0;i<current.length;i++) {
    var update = {i:i}
    var obj = current[i]
    var cloned = clone[i]
    for(var key in obj) {
      if(key=='keys') continue
      if(obj[key]!=cloned[key]) update[key] = obj[key]
    }
    if(Object.keys(update).length>1) diffs.push(update)
  }
  return diffs
}

var pHeight = 18
var pWidth = 12;
function collide(a, bs) {
  for (var i = 0; i < bs.length; i++) {
    var b = bs[i]
    if (!(a.y + pHeight < b.y || a.y > b.y + pHeight || a.x + pWidth < b.x || a.x > b.x + pWidth)) return b
  }
  return false
}

var frame = 0
setInterval(function () {
  // update game state
  var diff = physics(++frame)
  
  // don't send if empty
  if(!diff.reduce(function(total, x) {
    return total + x.length
  }, 0)) return
     
  console.log(diff)
  // send game state data
  io.sockets.emit('diffState', diff)
}, 1000/30)