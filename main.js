var socket = io.connect('http://localhost'),
  $ = document.querySelector.bind(document), id, arena

canvas = $('#c')
canvas.width = 800
canvas.height = 600
ctx = canvas.getContext('2d')

ctx.translate(canvas.width/2, canvas.height/2)
ctx.scale(2, 2)

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
var keymap = {
  38: 'u',
  39: 'r',
  40: 'd',
  37: 'l',
  32: 'a',
  90: 'a'
}
window.onkeydown = function(e) {
  keymap[e.which] && socket.emit('keydown', e.which)
}
window.onkeyup = function(e) {
  keymap[e.which] && socket.emit('keyup', e.which)
}

initialize()

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
  //ctx.save()
  //ctx.translate(canvas.width/2, canvas.height/2)
  for(var i=0;i<players.length;i++) {
    var player = players[i]
    // draw player
    ctx.fillRect((player.x - me.x), (player.y - me.y), 10, 10)
  }
}

function gameState(state) {
  arena = state
  draw()
}
