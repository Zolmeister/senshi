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

  // socket join game (gives name), adds them to arena
  socket.on('join', function (name) {
    name = name.substr(0, 20)
    if (/^[a-zA-Z]+$/.test(name) && taken.indexOf(name) == -1) {

      // debug
      // taken.push(name)

      p = new Player(name, socket.id)
      arena.players.push(p)
      socket.emit('id', socket.id)
      return
    }
    socket.emit('taken', name)
  })

  // on socket disconnect, kill them
  socket.on('disconnect', function () {
    for (var i = arena.players.length - 1; i >= 0; i--) {
      if (arena.players[i] == p) {
        arena.players.splice(i, 1)
      }
    }
  })

  // on socket command (movement/attack), update game state
  socket.on('keydown', function (key) {
    if(key == 32 || key == 90) return p.attacking = 1
    p.key = key
  })
  socket.on('keyup', function (key) {
    p.key = -1
  })
})


//game

  function Player(name, id) {
    this.name = name
    this.id = id
    this.x = Math.floor(Math.random() * 300) + 50
    this.y = Math.floor(Math.random() * 100) + 50
    this.health = 75
    
    // weapons: fists, machete, bow, gun - [0, 1, 2, 3]
    this.weapon = 0

    // directions: left, up, right, down - 0, 1, 2, 3
    this.dir = 3

    // animation frame
    this.frame = 0

    this.key = -1
    this.attacking = 0
  }

var arena = {
  players: []
};

function physics(frame) {
  var players = arena.players
  // key: [delta x, delta y]
  var keymap = {
    37: [-1, 0], // left
    38: [0, -1], // up
    39: [1, 0], // right
    40: [0, 1], // down
  }
  
  // player movement
  for (var i = 0; i < players.length; i++) {
    var player = players[i]
    var key = player.key
    if (player.attacking) {
      if (frame % 4 == 0) {
        // maybe remove an attack frame
        if (player.frame == 3) {
          player.frame++
          player.attacking = (player.attacking + 1) % 5
        } else if(player.frame == 4){
          // here is where we check for hit (if melee weapon)
          if(player.weapon < 2) {
            var weapon = {
              x: player.x+keymap[player.dir+37][0]*5,
              y: player.y+keymap[player.dir+37][1]*5
            }
            var hit = collide(weapon, players.slice(0,i).concat(players.slice(i+1)))
            if(hit) {
              hit.health -= 10
            }
          }
          player.frame++
          player.attacking = (player.attacking + 1) % 5
        } else {
          player.frame = 3
          player.attacking = (player.attacking + 1) % 5
        }
      }
    } else {
      if (keymap[key]) {
        if (frame % 6 == 0) {
          player.frame = (player.frame + 1) % 4
        }
        player.x += keymap[key][0]
        player.y += keymap[key][1]
        if(player.x<-400 || player.x>(400-16) || player.y<-300 || player.y>(300-18) || collide(player, players.slice(0,i).concat(players.slice(i+1)))){
          player.x -= keymap[key][0]
          player.y -= keymap[key][1]
        }
        player.dir = key - 37
      } else {
        player.frame = 1
      }
    }
  }
  // player deaths
  for (var i = players.length-1; i >=0 ; i--) {
    var player = players[i]
    if (player.health <= 0) {
      players.splice(i,1)
    }
  }
  // bullet movement
}
var pHeight = 18
var pWidth = 12
function collide(a, bs) {
  for(var i=0;i<bs.length;i++) {
    var b = bs[i]
    if(!(a.y + pHeight < b.y
     || a.y > b.y + pHeight
     || a.x + pWidth < b.x
     || a.x > b.x + pWidth)) return b
  }
  return false
}

var frame = 0
setInterval(function () {
  // update game state
  physics(++frame)
  // send game state data
  io.sockets.emit('state', arena)
}, 20)