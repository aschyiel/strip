/*!
* ..Strip.js, uly may2012..
*
* organized like jQuery v1.7.2
*
* most of the Strip methods are intended to work with the "cascading-jsp-style".
*
*/
(function( window, undefined ){

var Strip = (function() {

// "Local" copy of Strip.
var Strip = function() {
    return new Strip.fn.init();
  }; 

return Strip;

})();

/*
*   public methods
*/
Strip.fn = Strip.prototype = {

  constructor: Strip,

  init: function() { 
    return this;
  },

  // (Strip.Sequence) the particular sequence we are representing now.
  sequence,

  //
  //  load a sequence/chapter onto our stage.
  //
  loadSequence = function( sequence ) {
    this.sequence = sequence;
    return this;
  },

  // the html5 canvas we will draw on.
  canvas,

  // public setter for our Strip's canvas.
  setCanvas = function( canvas ) {
    this.canvas = canvas;
    return this;
  },

  // synonymous with "start".
  action = function() {
    this.sequence.action();
    return this;
  },

  // synonimous with "stop".
  cut = function() {
    this.sequence.cut();
    return this;
  },

  // go to the next scene.
  next = function() { 
    var scene = sequence.scenes[ sequence.selected_scene_index + 1 ];
    scene = scene || sequence.scenes[0];
    scene && this.sequence.loadScene( scene ).setCanvas( canvas ).action();
    return this;
  },

  // go to the previous scene.
  prev = previous = function() { 
    var scene = sequence.scenes[ sequence.selected_scene_index - 1 ];
    scene = scene || sequence.scenes[0];
    scene && this.sequence.loadScene( scene ).setCanvas( canvas ).action();
    return this; 
  }

};

//---------------------------------------------------------------------------
/*
*   the Sequence "class".
*   represents an ordered collection of scenes to be drawn by the strip.
*/
Strip.Sequence.prototype = {

  constructor: Strip.Sequence,

  selected_scene_index: 0, 

  canvas,

  // the drawing context.
  ctx,  

  current_scene_index: -1, 

  scenes: [],
 
  // load/setup a scene.
  loadScene: function( scene ) { 
    var i = 0, len = scenes.length;
    selected_scene_index = -1;
    for ( ;i < len; i++ ) {
      if ( scene === scenes[i] ) {  // TODO does this work?  
        selected_scene_index = i; 
      }
    }

    scene.setup();
    scene.shot.draw( ctx );
    scene.dialogue.draw( ctx );

    return this;
  },

  // add a scene to the sequence stack.
  pushScene: function( scene ) {
    scenes = scenes || [];
    scenes.push( scene );
    return this;
  },

  clearScenes: function() {
    scenes = [];
    return this,
  },
 
  setCanvas: function( canvas ) {
    canvas = canvas;
    return this;
  } 
};
//---------------------------------------------------------------------------
Strip.Scene.prototype = {

};
//---------------------------------------------------------------------------

