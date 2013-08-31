var app = require('http').createServer(function (req, res) {
  if(req.url.indexOf('main.js')!==-1) return res.end(fs.readFileSync('main.js'))
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
  socket.on('join', function(name) {
    name = name.substr(0,20)
    if(/^[a-zA-Z]+$/.test(name) && taken.indexOf(name)==-1) {
      
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
  socket.on('disconnect', function() {
    for(var i=arena.players.length-1;i>=0;i--) {
      if(arena.players[i] == p) {
        arena.players.splice(i,1)
      }
    }
  })
  
  // on socket command (movement/attack), update game state
  
})


//game

function Player(name, id) {
  this.name = name
  this.id = id
  this.x = Math.floor(Math.random() * 700) + 50
  this.y = Math.floor(Math.random() * 500) + 50
  
  // directions: up, right, down, left - 1, 2, 3, 4
  this.dir = 3
  
  // animation frame
  this.animation = 2
}

var arena = {
  players: []
}
setInterval(function(){
  // update game state
  // send game state data
  io.sockets.emit('state', arena)
}, 20)
