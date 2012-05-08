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
  Sequence = function() {},
  Shot = function() {},
  Scene = function() {},
  Dialogue = function() {};

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

    ctx: null,

    // public setter for our Strip's canvas.
    setCanvas: function( canvas ) {
      debug("canvas:"+canvas);
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      debug("strip.setCanvas, ctx:"+this.ctx);
      return this;
    },

    // synonymous with "start".
    action: function() {
      debug("strip.action");
      if ( !this.sequence ) {
        debug( "sequence is null!" );
      }
      this.sequence.setContext(this.ctx).action();
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
      scene && this.sequence.loadScene( scene ).setContext( this.ctx ).action();
      return this;
    },

    // go to the previous scene.
    previous: function() { 
      var scene = sequence.scenes[ sequence.selected_scene_index - 1 ];
      scene = scene || sequence.scenes[0];
      scene && this.sequence.loadScene( scene ).setContext( this.ctx ).action();
      return this; 
    },

    newSequence: function() {
      debug("Strip.newSequence");
      return new Sequence.fn.init();
    },

    newShot: function() {
      debug("Strip.newShot");
      return new Shot.fn.init();
    },

    newScene: function() {
      debug("Strip.newScene()");
      return new Scene.fn.init();
    },

    newDialogue: function() {
      debug("Strip.newDialogue()");
      return new Dialogue.fn.init();
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
    if ( this.current_scene_index < 0 ) {
      this.current_scene_index = 0;
    }
    this.load_current_scene();
    return this;
  },

  //
  //  load the currently selected scene by index.
  //
  load_current_scene: function() {
    debug("load_current_scene");
    var scene,
      idx = this.current_scene_index,
      ctx = this.ctx;

    debug( "idx:"+idx );
    scene = this.scenes[ idx ]; 

    debug( "scene:"+scene );
    debug( "ctx:"+ctx );    

    scene.setup( ctx );

    return this;
  },

  // load/setup a scene.
  loadScene: function( scene ) { 
    var i = 0, 
      len = this.scenes.length, 
      scenes = this.scenes,
      selected_scene_index = -1;

    for ( ;i < len; i++ ) {
      if ( scene === scenes[i] ) {  // TODO does this work?  
        selected_scene_index = i; 
      }
    }

    scene.setup( ctx );

    return this;
  },

  // add a scene to the sequence stack.
  pushScene: function( scene ) {
    this.scenes = this.scenes || [];
    this.scenes.push( scene );
    return this;
  },

  clearScenes: function() {
    this.scenes = [];
    return this;
  },

  setContext: function( ctx ) { 
    debug( "sequence.setContext, ctx:"+ctx );
    this.ctx = ctx; 
    return this;
  } 
};
//---------------------------------------------------------------------------
Scene.fn = Scene.prototype = { 
  constructor: Strip.Scene, 
  init: function() { 
    return this;
  },

  setShot: function( shot ) {
    this.shot = shot;
    return this;
  }, 

  addWords: function( s ) {
    dialogue = dialogue || Strip.newDialogue();
    dialogue.addText( Strip.newText( s ) ); //TODO:this will fail
    return this;
  },

  setup: function( ctx ) {
    debug( "scene.setup" );
    debug( "scene.setup, ctx:"+ctx );
    this.shot.draw( ctx );
//  this.dialogue.draw( ctx );  // TODO
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
      debug( "image is missing!!!" ); // TODO:blank out?
    } 
    window.image2 = image;
    window.context2 = context;
    context.drawImage( this.image, 0, 0 );  // TODO
//  context.strokeStyle = "#000000";
//  context.fillStyle = "#FFFF00";
//  context.beginPath();
//  context.arc(100,100,50,0,Math.PI*2,true);
//  context.closePath();
//  context.stroke();
//  context.fill();

    return this;
  }, 
  setImage: function( image ) {
    this.image = image;
    return this;
  } 
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

  //
  //  setup our namespaced-classes
  //  note:order matters here...
  //
  Shot    .fn.init.prototype = Shot.fn; 
  Sequence.fn.init.prototype = Sequence.fn; 
  Scene   .fn.init.prototype = Scene.fn; 
  Dialogue.fn.init.prototype = Dialogue.fn; 
  Strip   .fn.init.prototype = Strip.fn; 

//Strip.fn.newShot =     Shot.fn.init;

  return Strip; 
})(); 
//--------------------------------------------------------------------------- 
window.Strip = Strip; 
})(window);
