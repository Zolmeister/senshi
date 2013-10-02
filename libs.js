(function(){function p(d,a,b){1>=arguments.length&&(a=d||0,d=0);b=arguments[2]||1;for(var c=Math.max(Math.ceil((a-d)/b),0),f=0,k=Array(c);f<c;)k[f++]=d,d+=b;return k}function q(){var d=this.length,a,b,c;if(0===d)return this;for(;--d;)a=Math.a(d),b=this[d],c=this[a],this[d]=c,this[a]=b;return this}function m(d){if("number"===typeof d||-1===d.indexOf(":")){var a=(this.length+parseInt(d,10))%this.length;return this[a]}d=d.split(":").map(function(a){return parseInt(a,10)});var a=parseInt(d[0],10)||0,
a=0>a?Math.max(a,-this.length):Math.min(a,this.length),b=parseInt(d[1],10)||this.length,b=0>b?Math.max(b,-this.length):Math.min(b,this.length);0>a&&0<b&&(b=0);var c=parseInt(d[2],10)||1;0>c&&a<b&&(a=-1*a-1,b=-1*b-1);0>b&&0<=a&&(b=(this.length+b)%this.length);d=[];for(var b=p(a,b,c),c=0,f=b.length;c<f;c++)a=b[c],d.push(m.bind(this)(a));return this instanceof Array?d:d.join("")}var l=this,r=Math.min.bind(Math);Object.defineProperty(Math,"min",{value:function(){if(arguments[0]instanceof Array){if(1==
arguments.length)return r.apply(Math,arguments[0]);for(var d=arguments[0],a=1,b=arguments.length;a<b;a++)arguments[a]<d&&(d=arguments[a]);return d}return r.apply(Math,arguments)}});var s=Math.max.bind(Math);Object.defineProperty(Math,"max",{value:function(){if(arguments[0]instanceof Array){if(1>=arguments.length)return s.apply(Math,arguments[0]);for(var d=arguments[0],a=1,b=arguments.length;a<b;a++)arguments[a]>d&&(d=arguments[a]);return d}return s.apply(Math,arguments)}});Object.defineProperty(Math,
"randInt",{value:function(d,a){a||(a=d,d=0);return d+Math.floor(Math.random()*(a-d+1))}});var n=[];Object.defineProperty(Math,"factorial",{value:function a(b){return 0==b||1==b?1:0<n[b]?n[b]:n[b]=a(b-1)*b}});Object.defineProperty(Math,"isPrime",{value:function(a){return isNaN(a)||!isFinite(a)||a%1||2>a?!1:a==Math.e(a)?!0:!1}});Object.defineProperty(Math,"leastFactor",{value:function(a){if(isNaN(a)||!isFinite(a))return NaN;if(0==a)return 0;if(a%1||2>a*a)return 1;if(0==a%2)return 2;if(0==a%3)return 3;
if(0==a%5)return 5;for(var b=Math.sqrt(a),c=7;c<=b;c+=30){if(0==a%c)return c;if(0==a%(c+4))return c+4;if(0==a%(c+6))return c+6;if(0==a%(c+10))return c+10;if(0==a%(c+12))return c+12;if(0==a%(c+16))return c+16;if(0==a%(c+22))return c+22;if(0==a%(c+24))return c+24}return a}});var e=l.b||{};Object.defineProperty(l,"Polish",{value:e});e.strings={f:"abcdefghijklmnopqrstuvwxyz",g:"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",d:"0123456789"};e.combinations=function(a,b,c){function f(a,h){if(!(b&&
a.length>=b))for(var g=0,e=h.length;g<e;g++)b&&a.length+1!==b||k.push(a.concat(h[g])),f(a.concat(h[g]),c?h:h.slice(g+1))}var k=[];f([],a);return k};e.combinationsReplace=function(a,b){return l.b.c(a,b,!0)};e.permutations=function(a){var b=[],c=[];return function k(a){for(var h,g=0,e=a.length;g<e;g++)h=a.splice(g,1)[0],c.push(h),0===a.length&&b.push(c.slice()),k(a),a.splice(g,0,h),c.pop();return b}(a)};Object.defineProperty(l,"range",{value:p});e.clone=function(a){return JSON.parse(JSON.stringify(a))};
Object.defineProperty(l,"zip",{value:function(){if(1===arguments.length&&arguments[0]instanceof Array&&arguments[0][0]instanceof Array)return zip.apply(this,arguments[0]);var a=[].slice.call(arguments);return(0==a.length?[]:a.reduce(function(a,c){return a.length<c.length?a:c})).map(function(b,c){return a.map(function(a){return a[c]})})}});Object.defineProperty(Math,"sum",{value:function b(){if(1===arguments.length&&arguments[0]instanceof Array)return b.apply(this,arguments[0]);for(var c=0,f=0,e=arguments.length;f<
e;f++)c+=arguments[f];return c}});Object.defineProperty(Array.prototype,"choice",{value:function(){return this[Math.a(this.length-1)]}});Object.defineProperty(String.prototype,"choice",{value:function(){return this.charAt(Math.a(this.length-1))}});Object.defineProperty(Array.prototype,"shuffle",{value:q});Object.defineProperty(String.prototype,"shuffle",{value:function(){return q.apply(this.split("")).join("")}});var t=Array.prototype.pop;Object.defineProperty(Array.prototype,"pop",{value:function(b){return b&&
this[b]?this.splice(b,1)[0]:t.call(this)}});Object.defineProperty(Array.prototype,"remove",{value:function(b){this.pop(this.indexOf(b));return this}});Object.defineProperty(Array.prototype,"insert",{value:function(b,c){this.splice(b,0,c);return this}});Object.defineProperty(Array.prototype,"-1",{get:function(){return this[this.length-1]}});Object.defineProperty(String.prototype,"-1",{get:function(){return this[this.length-1]}});Object.defineProperty(String.prototype,"reverse",{value:function(){return this.split("").reverse().join("")}});
Object.defineProperty(Array.prototype,"g",{value:m});Object.defineProperty(String.prototype,"g",{value:m})})();
  (function() {
    var d = {}, c = 0,
      a, b;
    this.Events = {
      on: function(a, c, b) {
        d[a] = d[a] || [];
        d[a].push({
          f: c,
          c: b
        })
      },
      off: function(b, e) {
        a = d[b] || [];
        if (!e) return a.length = 0;
        for (c = a.length; 0 <= --c;) e == a[c].f && a.splice(c, 1)
      },
      emit: function() {
        b = Array.apply([], arguments);
        a = d[b.shift()] || [];
        b = b[0] instanceof Array && b[0] || b;
        for (c = a.length; 0 <= --c;) a[c].f.apply(a[c].c, b)
      }
    }
  })()