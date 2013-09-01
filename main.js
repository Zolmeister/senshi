var socket = io.connect('http://localhost'),
  $ = document.querySelector.bind(document), id, arena

canvas = $('#c')
canvas.width = 800
canvas.height = 600
ctx = canvas.getContext('2d')

image = new Image()
image.src = 'player.png'
image.onload = initialize

ctx.webkitImageSmoothingEnabled = false
ctx.mozImageSmoothingEnabled = false
ctx.translate(canvas.width/2, canvas.height/2)
ctx.scale(4, 4)
//ctx.scale(2,2)

socket.on('taken', taken)
// on id, set id for user tracking purposes
socket.on('id', function(d) {
  id = d
  hideInstructions()
})
// on death, draw instructios
socket.on('dead', drawInstructions)
// on game data, display on canvas
socket.on('state', gameState)

// on keypress, send command to server
// left, up, right, down, space, z
var keys=[37, 38, 39, 40, 32, 90]
window.onkeydown = function(e) {
  keys.indexOf(e.which)!=-1 && socket.emit('keydown', e.which)
}
window.onkeyup = function(e) {
  keys.slice(0,4).indexOf(e.which)!=-1 && socket.emit('keyup', e.which)
}

// start by drawing instructions (+ name inputs over canvas?)
function drawInstructions() {
  $('#overlay').style.display = 'block'
}

function hideInstructions() {
  $('#overlay').style.display = 'none'
}

function initialize() {
  $('form').onsubmit = join
  
  //debug
  $('#name').value = 'Zolmeister'
  join({preventDefault:function(){}})
}

function join(e) {
  e.preventDefault()
  var name = $('#name').value
  if(/^[a-zA-Z]+$/.test(name)) {
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
  ctx.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height)
  var players = arena && arena.players
  
  id = id || players && players[0] && players[0].id
  if (!id) return
  var me;
  
  ctx.fillStyle='#fff'
  for(var i=0;i<players.length;i++) {
    var player = players[i]
    if(player.id == id) me = player
  }
  
  //draw terrain
  drawTerrain(me.x, me.y)
  
  //ctx.save()
  //ctx.translate(canvas.width/2, canvas.height/2)
  for(var i=0;i<players.length;i++) {
    var player = players[i]
    // draw player
    drawPlayer(player.x - me.x, player.y - me.y, player.name, player.health, player.dir, player.frame)
    //ctx.fillRect((player.x - me.x), (player.y - me.y), 10, 10)
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
    x = y; y = z; z = w;
    w = w ^ (w >> 19) ^ (t ^ (t >> 8));
    return (w * 2.3283064365386963e-10)*2;
  }
})()

var map=(function generateMap(){
  var m = []
  for(var y=-canvas.height/2;y<canvas.height/2;y+=14) {
    var temp = []
    for(var x=-canvas.width/2;x<canvas.width/2;x+=14) {
      var rand = random()
      if(rand>0.99) {
        temp.push(3)
      } else if (rand>0.95) {
        temp.push(2)
      } else if(rand>0.8) {
        temp.push(1)
      } else {
        temp.push(0)
      }
    }
    m.push(temp)
  }
  return m
})()

function drawTerrain(offsetX, offsetY) {
  var row = 0
  var col = 2

  for(var y = -canvas.height/2;y<canvas.height/2;y+=14) {
    for(var x = -canvas.width/2;x<canvas.width/2;x+=14) {
      //if(map[(y+300)/14]+1 && map[(y+300)/14][(x+400)/14]+1)
      //if(x-offsetX<-canvas.width/4/2 || x+offsetX>canvas.width/4/2 ||
      //   y-offsetY<-canvas.height/4/2 || y+offsetY>canvas.height/4/2)
      if(x-offsetX+14 < -canvas.width/4/2 || 
         y-offsetY+14 < -canvas.height/4/2 || 
         y-offsetY > canvas.height/4/2 ||
         y-offsetY > canvas.height/4/2) continue
      ctx.drawImage(image, image.width - col*14, map[(y+300)/14][(x+400)/14]*14, 14, 14, x-offsetX, y-offsetY, 14, 14)
      //break
    }
    //break
  }
  
  /*for(var y=-canvas.height/2;y<canvas.height/2;y+=14) {
    for(var x=-canvas.width/2;x<canvas.width/2;x+=14) {
      
      if(x%3==0 && x*3%4==0 && y/2%6==0 && y%3==0) row=1
      if(x%4==0 && y%5==0 && x/2%4==0) row=2
      ctx.drawImage(image, image.width - col*14, row*14, 14, 14, x-offsetX, y-offsetY, 14, 14)
    }
  }*/
}

function drawPlayer(x, y, name, health, dir, frame) {
  
  // 22 x 20, with +10 x-offset
  var row = dir == 0 ? 1 : dir-1
  var col = frame == 3 ? 1 : frame
  col=col+7*3
  x+=10
  
  // draw name
  ctx.fillStyle = '#fff'
  ctx.font = '4px sans'
  ctx.fillText(name, (x - name.length+11), y-2)
  
  // draw health bar
  ctx.fillStyle='#3a3'
  ctx.fillRect(x+1, y-1, health/5, 1)
  ctx.fillStyle='#a33'
  ctx.fillRect(x+1+health/5, y-1, 100/5-health/5, 1)
  
  ctx.save()
  if(dir==0) {
    ctx.translate(44, 0)
    ctx.scale(-1,1)
    x = 22-x
  }
  ctx.fillStyle='#fff'
  //ctx.fillRect(x,y,22,20)
  
  //draw character
  ctx.drawImage(image, col*22, row*20, 22, 20, x, y, 22, 20)
  ctx.restore()
  
}

function gameState(state) {
  arena = state
  draw()
}
