var socket = io.connect(),
  $ = document.querySelector.bind(document),
  name, arena;

canvas = $('#c')
canvas.width = 800
canvas.height = 600
ctx = canvas.getContext('2d')

image = new Image()
image.src = 'player.png'
image.onload = initialize

ctx.webkitImageSmoothingEnabled = false
ctx.mozImageSmoothingEnabled = false
ctx.translate(canvas.width / 2, canvas.height / 2)
ctx.scale(4, 4)
//ctx.scale(2,2)

socket.on('taken', taken)
// on id, set id for user tracking purposes
socket.on('name', function (n) {
  name = n
  hideInstructions()
})
// on death, draw instructios
socket.on('dead', drawInstructions)
// on game data, display on canvas
socket.on('setState', setState)
socket.on('diffState', mergeDiff)
// on item diff data, update item list

var alerts = []
socket.on('highScores', function (scores) {
  var $s = $('#scores')
  $s.innerHTML = '<h3>Top 10</h3>'

  // This is sage because names are guarenteed to only be letters
  for (var i = 0; i < scores.length; i++) {
    var len = (scores[i].name + scores[i].score).length
    $s.innerHTML += '<h5>' + scores[i].name + repeat('&nbsp;', 22 - len) + scores[i].score + '</h5>'
  }
});

function repeat(s, n) {
  return new Array(n + 1).join(s)
}
socket.on('alert', function alert(msg) {
  // split alert string into many msgs
  while (msg) {
    var m = msg.substr(0, 27)
    msg = msg.substring(27)
    alerts.push({
      msg: m,
      time: 200
    })
  }
})

socket.on('chat', function (msg) {
  var c = $('#chatBox')
  c.innerHTML = c.innerHTML.replace(/<br>/g, '\n')
  c.textContent += msg + '\n'
  c.innerHTML = c.innerHTML.replace(/\n/g, '<br>')
  c.scrollTop = 10e5
})
var instructionsVisible = true
// on keypress, send command to server
// left, up, right, down, space, z
var keys = [37, 38, 39, 40, 32, 90]
window.onkeydown = function (e) {
  keys.indexOf(e.which) != -1 && socket.emit('keydown', e.which)
}
window.onkeyup = function (e) {
  keys.slice(0, 4).indexOf(e.which) != -1 && socket.emit('keyup', e.which)
}

// start by drawing instructions (+ name inputs over canvas?)
function drawInstructions() {
  if(!instructionsVisible){
    $('#overlay').style.display = 'block'
    instructionsVisible = true
  }
}

function hideInstructions() {
  if(instructionsVisible){
    $('#overlay').style.display = 'none'
    $('#red').style.visibility = 'hidden'
    instructionsVisible = false
  }
}

function initialize() {
  $('#join').onsubmit = join
  $('#chatInput').onsubmit = chat
  //debug
  //$('#name').value = 'Zolmeister'
  //join({
  //  preventDefault: function () {}
  //})
}

function chat(e) {
  e.preventDefault()
  var msg = $('#msg').value
  $('#msg').value = ''
  socket.emit('chat', msg)
}

function join(e) {
  e.preventDefault()
  var name = $('#name').value
  if (/^[a-zA-Z]+$/.test(name)) {
    console.log('joining as', name)
    socket.emit('join', name)
    //taken(name)
    return
  }
  badName(name)
}

function taken(name) {
  $('#red').style.visibility = 'visible'
  $('#taken').innerText = name + ' is dead or taken'
}

function badName(name) {
  $('#red').style.visibility = 'visible'
  $('#taken').innerText = 'Only letters allowed'
}
// as soon as user id appears in player list, remove instructions


//game

function draw() {
  //ctx.restore()
  ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
  var players = arena && arena.players

  var me;
  ctx.fillStyle = '#fff'
  for (var i = 0; i < players.length; i++) {
    var player = players[i]
    if (player.n == name) me = player
  }
  
  me = me || players[0]
  if (!me) return

  //draw terrain
  drawTerrain(me.x, me.y)

  // draw items
  drawItems(me.x, me.y)

  //draw bullets
  drawBullets(me.x, me.y)

  //ctx.save()
  //ctx.translate(canvas.width/2, canvas.height/2)
  for (var i = 0; i < players.length; i++) {
    var player = players[i]
    // draw player
    drawPlayer(player.x - me.x - 11, player.y - me.y - 5, player.n, player.h, player.d, player.f, player.w, player.s)
    //ctx.fillRect((player.x - me.x), (player.y - me.y), 10, 10)
  }

  drawAlerts()
}

function drawAlerts() {
  for (var i = alerts.length - 1; i >= 0; i--) {
    var alert = alerts[i]
    alert.time--
    if (alert.time <= 0) {
      alerts.splice(i, 1)
      continue
    }
    ctx.font = '5px sans'
    ctx.fillStyle = '#faa'
    ctx.fillText(alert.msg, (400 - 300) / 4, (-300 + 30 + 5 * 4 * i) / 4)
  }
}

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

var map = (function generateMap() {
  var m = []
  for (var y = -canvas.height / 2; y < canvas.height / 2; y += 14) {
    var temp = []
    for (var x = -canvas.width / 2; x < canvas.width / 2; x += 14) {
      var rand = random()
      if (rand > 0.99) {
        temp.push(3)
      } else if (rand > 0.95) {
        temp.push(2)
      } else if (rand > 0.8) {
        temp.push(1)
      } else {
        temp.push(0)
      }
    }
    m.push(temp)
  }
  return m
})();

function drawTerrain(offsetX, offsetY) {
  var row = 0
  var col = 2

  for (var y = -canvas.height / 2; y < canvas.height / 2; y += 14) {
    for (var x = -canvas.width / 2; x < canvas.width / 2; x += 14) {
      if (x - offsetX + 14 < -canvas.width / 4 / 2 || y - offsetY + 14 < -canvas.height / 4 / 2 || x - offsetX > canvas.width / 4 / 2 || y - offsetY > canvas.height / 4 / 2) continue
      ctx.drawImage(image, image.width - col * 14, map[(y + canvas.height / 2) / 14][(x + canvas.width / 2) / 14] * 14, 14, 14, x - offsetX, y - offsetY, 14, 14)
    }
  }
}

function drawItems(offsetX, offsetY) {
  var items = arena.items
  var row = 0
  var col = 1
  for (var i = 0; i < items.length; i++) {
    var item = items[i]
    if (item.x - offsetX + 14 < -canvas.width / 4 / 2 || item.y - offsetY + 14 < -canvas.height / 4 / 2 || item.x - offsetX > canvas.width / 4 / 2 || item.y - offsetY > canvas.height / 4 / 2) continue
    ctx.drawImage(image, image.width - col * 14, item.n * 14, 14, 14, item.x - offsetX, item.y - offsetY, 14, 14)
  }
}

function drawBullets(offsetX, offsetY) {
  var bullets = arena.bullets

  var row = 3
  var col = 1
  for (var i = 0; i < bullets.length; i++) {
    var bullet = bullets[i]
    if (bullet.x - offsetX + 14 < -canvas.width / 4 / 2 || bullet.y - offsetY + 14 < -canvas.height / 4 / 2 || bullet.x - offsetX > canvas.width / 4 / 2 || bullet.y - offsetY > canvas.height / 4 / 2) continue
    if (bullet.t == 0) {
      ctx.save()
      ctx.translate(bullet.x - offsetX + 7, bullet.y - offsetY + 7)
      // left, up, right, down - 0, 1, 2, 3
      var rotate = [1, -.5, 0, .5]
      ctx.rotate(rotate[bullet.d] * Math.PI)
      ctx.drawImage(image, image.width - col * 14, row * 14, 14, 14, -7, -7, 14, 14)
      ctx.restore()
    } else {
      ctx.fillStyle = '#666'
      ctx.fillRect(bullet.x - offsetX + (bullet.d == 1 ? 10 : 5), bullet.y - offsetY + 7, bullet.d % 2 == 0 ? 5 : 2, bullet.d % 2 == 0 ? 2 : 5)
    }
  }
}

function drawPlayer(x, y, name, health, dir, frame, weapon, kills) {

  // 22 x 20, with +10 x-offset
  var row = dir == 0 ? 1 : dir - 1
  var col = frame == 3 ? 1 : frame
  col += (weapon + 1) * 7
  x += 10

  // draw name
  ctx.fillStyle = '#fff'
  ctx.font = '3px sans'
  ctx.fillText(name + ' (' + kills + ')', (x - name.length + 12), y - 2)

  // draw health bar
  ctx.fillStyle = '#3a3'
  ctx.fillRect(x + 1, y - 1, health / 5, 1)
  ctx.fillStyle = '#a33'
  ctx.fillRect(x + 1 + health / 5, y - 1, 100 / 5 - health / 5, 1)

  ctx.save()
  if (dir == 0) {
    ctx.translate(44, 0)
    ctx.scale(-1, 1)
    x = 22 - x
  }
  ctx.fillStyle = '#fff'
  //ctx.fillRect(x,y,22,20)

  //draw character
  ctx.drawImage(image, col * 22, row * 20, 22, 20, x, y, 22, 20)
  ctx.restore()

}

function setState(state) {
  arena = state
  draw()
}

// This diff will be sent and applied by the client to sync their arena
// diff[0-2] = players
// diff[0] = new players (append to end)
// diff[1] = del players indicies (splice, starting in reverse order)
// diff[2] = player updates (i:index, updated attrs)
// diff[3-5] = bullets
// diff[6-8] = items
function mergeDiff(diff) {

  // players
  for(var i=0;i<diff[0].length;i++) {
    arena.players.push(diff[0][i])
  }
  for(var i=0;i<diff[1].length;i++) {
    if(arena.players[diff[1][i]].n == name) drawInstructions()
    arena.players.splice(diff[1][i], 1)
  }
  for(var i=0;i<diff[2].length;i++) {
    var update = diff[2][i]
    var index = update.i
    delete update.i
    for(var key in update) {
      arena.players[index][key] = update[key]
    }
  }
  
  // bullets
  for(var i=0;i<diff[3].length;i++) {
    arena.bullets.push(diff[3][i])
  }
  for(var i=0;i<diff[4].length;i++) {
    arena.bullets.splice(diff[4][i], 1)
  }
  for(var i=0;i<diff[5].length;i++) {
    var update = diff[5][i]
    var index = update.i
    delete update.i
    for(var key in update) {
      arena.bullets[index][key] = update[key]
    }
  }
  
  // items
  for(var i=0;i<diff[6].length;i++) {
    arena.items.push(diff[6][i])
  }
  for(var i=0;i<diff[7].length;i++) {
    arena.items.splice(diff[7][i])
  }
  for(var i=0;i<diff[8].length;i++) {
    var update = diff[8][i]
    var index = update.i
    delete update.i
    for(var key in update) {
      arena.items[index][key] = update[key]
    }
  }
  
  draw()
}