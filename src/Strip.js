/*!
* ..Strip.js, uly may2012..
*
* organized like jQuery v1.7.2
*
* most of the Strip methods are intended to work with the "cascading-jsp-style".
*
*/
(function( window, undefined ){ 

var debug = function( msg ) {
  try {
    console.log( "DEBUG::"+msg );
  }
  catch ( e ) {
    //..
  } 
};

var Strip = (function() {
  debug("Strip..");

// "Local" copy of Strip.
var Strip = function() {
    debug("Strip local init..");
    return new Strip.fn.init();
  },
  Sequence = function() { return new Sequence.fn.init() }, 
  Shot =     function() { return new Shot    .fn.init() },
  Scene =    function() { return new Scene   .fn.init() },
  Dialogue = function() { return new Dialogue.fn.init() };

/*
*   public methods
*/
Strip.fn = Strip.prototype = {

    constructor: Strip,

    init: function() { 
      return this;
    },

    // (Strip.Sequence) the particular sequence we are representing now.
    sequence: null,

    //
    //  load a sequence/chapter onto our stage.
    //
    loadSequence: function( sequence ) {
      debug( "strip.loadSequence, sequence:"+sequence );
      this.sequence = sequence;
      return this;
    },

    // the html5 canvas we will draw on.
    canvas: null,

    // public setter for our Strip's canvas.
    setCanvas: function( canvas ) {
      this.canvas = canvas;
      return this;
    },

    // synonymous with "start".
    action: function() {
      debug("strip.action");
      if ( !this.sequence ) {
        debug( "sequence is null!" );
      }
      this.sequence.action();
      return this;
    },

    // synonimous with "stop".
    cut: function() {
      this.sequence.cut();
      return this;
    },

    // go to the next scene.
    next: function() { 
      var scene = sequence.scenes[ sequence.selected_scene_index + 1 ];
      scene = scene || sequence.scenes[0];
      scene && this.sequence.loadScene( scene ).setCanvas( canvas ).action();
      return this;
    },

    // go to the previous scene.
    previous: function() { 
      var scene = sequence.scenes[ sequence.selected_scene_index - 1 ];
      scene = scene || sequence.scenes[0];
      scene && this.sequence.loadScene( scene ).setCanvas( canvas ).action();
      return this; 
    },

    newSequence: function() {
      debug("Strip.newSequence");
      return new Sequence.fn.init();
    },

    newShot: function() {
      debug("Strip.newShot");
      return new Shot.fn.init();
    }
  };

//---------------------------------------------------------------------------
/*
*   the Sequence "class".
*   represents an ordered collection of scenes to be drawn by the strip.
*/
Sequence.fn = Sequence.prototype = {

  constructor: Strip.Sequence,

  init: function() { 
    return this;
  },

  selected_scene_index: 0, 

  canvas: null,

  // the drawing context.
  ctx: null,  

  current_scene_index: -1, 

  scenes: [],

  action: function() {
    debug("sequence, action");
    return this;
  },

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
    return this;
  },
 
  setCanvas: function( canvas ) {
    this.canvas = canvas;
    return this;
  } 
};
//---------------------------------------------------------------------------
Scene.fn = Scene.prototype = { 
  constructor: Strip.Scene, 
  init: function() { 
    return this;
  },

  setImage: function( image ) {
    this.shot( new Shot.fn.init() );
    this.shot.image = image;
    return this;
  },

  addWords: function( s ) {
    dialogue = dialogue || Strip.newDialogue();
    dialogue.addText( Strip.newText( s ) ); //TODO:this will fail
    return this;
  },

  setup: function() {
    //..
    return this;
  },

  /* the shot used in this scene. */
  shot: null,
  dialogue: null
};
//---------------------------------------------------------------------------
Shot.fn = Shot.prototype = { 
  constructor: Strip.Shot,
  init: function() { 
    return this;
  }, 
  draw: function( context ) {
    if ( !this.image ) {
      debug( "show with missing image" ); // TODO:blank out?
    } 
    context.drawImage( this.image, 0, 0 );
    return this;
  }, 
  setImage: function( image ) {
    this.image = image;
    return this;
  }, 
  image: null
};
//---------------------------------------------------------------------------
Dialogue.fn = Dialogue.prototype = { 
  constructor: Strip.Dialogue, 
  init: function() { 
    return this;
  },

  texts: [],

  /* the currently selected text index. */
  selected_index: 0, 

  /* draw the dialogue's words/text onto the stage. */
  draw: function( context, width, height ) {
    var text = texts[this.selected_index], 
      words,
      prev_x = ~~(width*0.5), 
      prev_y = 16,
      i = 0,
      get_fill_style,
      get_x, 
      get_y;
  
    words = text.words;

    // TODO:allow different word-bubble strategies...
    get_x = function() {
      return prev_x += 16;  // TODO:alternative left and right.
    }

    get_y = function() {
      return prev_y += 32; 
    }

    get_fill_style = function() {
      switch ( i ) {
        case 0:
          colour = 'black';
          break;
        case 1:
          colour = 'red';
          break; 
        case 2:
          colour = 'green';
          break; 
        case 3:
          colour = 'blue';
          break; 
        default:
          colour = 'black';
          break;
      }

      i++;
      if ( i > 3 ) {
        i = 0;
      }
      return colour;
    }

    // TODO:text color alternation...
    // TODO:probably need to loop through and 
    // re-draw all the words from previous texts.
    context.fillStyle = get_fill_style();
    context.fillText( words, get_x(), get_y() );
    return this;
  }
}; 
//--------------------------------------------------------------------------- 

  Strip   .fn.init.prototype = Strip.fn; 
  Sequence.fn.init.prototype = Sequence.fn; 
  Scene   .fn.init.prototype = Scene.fn; 
  Shot    .fn.init.prototype = Shot.fn; 
  Dialogue.fn.init.prototype = Dialogue.fn; 

  Strip.fn.newSequence = Sequence.fn.init;
  Strip.fn.newScene =    Scene.fn.init;
  Strip.fn.newShot =     Shot.fn.init;
//Strip.fn.newScene =    Scene.fn.init;

  return Strip; 
})(); 
//--------------------------------------------------------------------------- 
window.Strip = Strip; 
})(window);
