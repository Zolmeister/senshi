 var $ = document.querySelectorAll.bind(document)

 var grid = $('#grid')[0]
 var labels = $('#labels')[0]
 var gridText = ''
 var gridLabels = ''


 // D minor pentatonic
 var scale = [174.61, 196, 220, 261.63, 293.66, 349.23, 392, 440]
 var waves = ['square', 'sine', 'saw', 'ramp']
 var song = JSON.parse(localStorage.save) || Array.apply([], new Array(480)).map(function () {
   return new Array(scale.length * 4)
 })
 
 $('#start')[0].value = 0
 $('#end')[0].value = song.length - 1 


 for (var y = 0; y < scale.length * 4; y++) {
   var freq = scale[y % scale.length]
   var wave = waves[Math.floor(y / scale.length)]
   gridText += '<tr>'
   gridLabels += '<tr><td>' + wave + '</td><td>' + y%scale.length + '</td><tr>'
   for (var x = 0; x < song.length; x++) {
     gridText += '<td class="note" data-freq="' + freq + '" data-wave="' + wave + '" data-x="' + x + '" data-y="' + y + '">' + x + '</td>'
   }
   gridText += '</tr>'
 }
 grid.innerHTML += gridText
 labels.innerHTML += gridLabels

 var $notes = Array.apply([], $('.note'))

 // apply bindings
 $notes.forEach(function (el) {
   var self = this,
     x = el.getAttribute('data-x'),
     y = el.getAttribute('data-y');

   if (song[x][y] && song[x][y].freq) {
     el.style.backgroundColor = '#666'
   }

   el.onclick = function (e) {
     var selected = song[x][y] && song[x][y].freq
     setNote(x, y, selected ? {
       freq: 0,
       wave: 'square'
     } : {
       freq: +this.getAttribute('data-freq'),
       wave: this.getAttribute('data-wave')
     })
     el.style.backgroundColor = !selected ? '#666' : '#c1c1c1'
   }

   Events.on(x + ':' + y + ':highlight', function () {
     el.style.backgroundColor = '#2b2ba7'
   })

   function reset() {
     el.style.backgroundColor = song[x][y] && song[x][y].freq ? '#666' : '#c1c1c1'
   }
   Events.on(x + ':' + y + ':unhighlight', reset)
   Events.on('reset', reset)
 });

 function setNote(x, y, note) {
   song[x][y] = note
   save()
 }

 function save() {
   localStorage.save = JSON.stringify(song)
 }

 function clearNotes() {
   song = Array.apply([], new Array(song.length)).map(function () {
     return new Array(song[0].length)
   })
   Events.emit('reset')
   save()
 }

 var note = ~~$('#start')[0].value - 1
 var playing = false;

 function play() {

   if (!playing) {
     note = ~~$('#start')[0].value
     playRealNotes()
     playing = true
   }

   // animation
   for (var i = 0; i < song[0].length; i++) {
     Events.emit(note + ':' + i + ':highlight')
     setTimeout((function (note, i) {
       return function () {
         Events.emit(note + ':' + i + ':unhighlight')
       }
     })(note, i), 250 / 2)
   }

   note++
   if (note === ~~$('#end')[0].value+1 || note === song.length) {
     playing = false
     return note = -1
   }
   setTimeout(play, 250 / 2)
 }

 function playRealNotes() {
   var tracks = [];
   var noteMap = JSON.parse(JSON.stringify(song))

   // merge down to reduce track count
   for (var x = ~~$('#start')[0].value; x < ~~$('#end')[0].value+1/*noteMap.length*/; x++) {
     var flatNotes = noteMap[x].filter(function (note) {
       return note && note.freq
     })
     tracks.push(flatNotes.concat(Array.apply([], new Array(noteMap[x].length - flatNotes.length)).map(function () {
       return 0
     })))
   }

   tracks = zip(tracks).filter(function (arr) {
     return arr.some(function (note) {
       return !!note.freq
     })
   })

   function sawtooth(x) {
     var pi = Math.PI
     var tn = Math.ceil((x + pi) / (2 * pi));
     var y = ((x - tn * 2 * pi) + 2 * pi) / pi;
     return y
   }

   var players = []
   for (var i = 0; i < tracks.length; i++) {
     var track = tracks[i]
     var bytes = track.reduce(function (trackStr, note) {
       var samples = Math.floor(11025 / 2)
       for (var s = samples; s--;) {
         var byte;
         if (note.wave === 'square') {

           /* Square wave */
           byte = (Math.sin(s / 44100 * 2 * Math.PI * note.freq) > 0 ? 1 : -1) * Math.min((samples - s) / 83, s / samples) * 127 + 128
         } else if (note.wave === 'sine') {

           /* sine wave */
           byte = Math.sin(s / 44100 * 2 * Math.PI * note.freq) * Math.min((samples - s) / 83, s / samples) * 127 + 128
         } else if (note.wave === 'saw') {

           /* sawtooth wave */
           byte = sawtooth(s / 44100 * note.freq) * Math.min((samples - s) / 83, s / samples) * 127 + 128
         } else if (note.wave === 'ramp') {

           /* ramp wave */
           byte = Math.abs(s % (note.freq) - note.freq) / note.freq * Math.min((samples - s) / 83, s / samples) * 127 + 128
         }
         /* triangle wave - utter crap */
         //byte = Math.abs(s%(freq*2)-freq)/freq/2 * Math.min((samples - s) / 83, s / samples) * 127 + 128




         trackStr += String.fromCharCode(byte);
       }
       return trackStr
     }, '')

     var player = new Audio('data:audio/wav;base64,UklGRjUrAABXQVZFZm10IBAAAAA\
BAAEARKwAAESsAAABAAgAZGF0YREr' + btoa('\5\0' + bytes))
     //player.volume = 1
     players.push(player)
   }
   console.log(players.length)
   players.map(function (p) {
     p.play()
   })

 }