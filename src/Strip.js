/*!
* ..Strip.js, uly may2012..
*
* organized like jQuery v1.7.2
*
* most of the Strip methods are intended to work with the "cascading-jsp-style".
*
*/
(function( window, undefined ){ 

var warn = function( msg ) {
  try {
    console.warn( "DEBUG::"+msg );
  }
  catch ( e ) {
    //..
  } 
};

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
  Shot =     function() {},
  Scene =    function() {},
  Text =     function() {},
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

    /**
    * chainable,
    * add a bunch of images and automagically 
    * setup the internal sequence/scene model.
    *
    * @param images - an array of html5 images.
    */
    addImages: function( images ) {
      debug("..addImages..");
      var sequence = this.sequence || this.newSequence(),
        scene,
        shot,
        image,
        i = 0,
        len = images.length;
      debug( "len:"+len );
//    $.each(images, function(idx, image) {
      for ( ; i<len; i++ ) {
        image = images[i];
        debug( "image:"+image );
        // TODO:newShot @image param
        scene = new Scene.fn.init();
        shot =  new Shot.fn.init();
        window.image3 = image;
        shot = shot.setImage( image );
        //scene.setShot( shot.setImage( image ) );
        scene.setShot( shot );
        sequence.pushScene( scene );
//    });
      }
      this.loadSequence( sequence );
      return this;
    },

    /*
    * draw the previous/next buttons for the strip.
    * @param ctx - the 2d drawing context.
    */
    draw_buttons: function( ctx ) { 
      var h = this.canvas.height,
        w = this.canvas.width,
        bh = this.button_height,
        bw = this.button_width;

      var next_x = 0,
        next_y = h - bh,
        prev_x = w - bw,
        prev_y = h - bh;

      ctx.save();

      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#0000aa';
      ctx.fillRect( next_x, next_y, bw, bh );
      ctx.fillRect( prev_x, prev_y, bw, bh );

      ctx.globalAlpha = 1;
      ctx.fillText( '<--', prev_x, prev_y );
      ctx.fillText( '-->', next_x, next_y );

      ctx.restore(); 
    },

    /*
    * dimensions for our Strip next/previous buttons.
    */
    button_height: 25, 
    button_width: 75,
    canvas_height: -1,
    canvas_width: -1,

    /*
    * is point x,y within the bounds of box, xy 1~4
    * where x1,y1 is the top left corner, and it goes clockwise
    * (ie. bottom left corner is designated as x4, y4).
    *
    * TODO:this does not anticipate none orthogonal shapes.
    *
    * @return boolean
    */
    is_coords_within_box: function( x,  y, 
                          x1, y1, ///* top left */
                          x2, y2, ///* top right */
                          x3, y3, ///* bottom right */
                          x4, y4  ///* bottom left */ 
                          ) { 
//    debug( "x,y:"+x+","+y );
//    debug( "x1,y1:"+x1+","+y1 );
//    debug( "x2,y2:"+x2+","+y2 );
//    debug( "x3,y3:"+x3+","+y3 );
//    debug( "x4,y4:"+x4+","+y4 );
      return ( x >= x1
        && x <= x2
        && y >= y1
        && y <= y4 );
    },

    /*
    * is point x,y within the region of a rectangle,
    * the rectangle is described by it's top left coordinates (x1,y1),
    * and it's dimensions of width and height.
    *
    * @param x - the x coordinate of the point of interest.
    * @param y - the y coordinate of the point of interest.
    * @param x1 top left x coordinate of the rectangle.
    * @param y1 top left y coordinate of the rectangle
    * @param w width of the rectangular region.
    * @param h height of the rectangular region.
    *
    * @return boolean
    */
    is_coords_within_rectangle: function( x, y, x1, y1, w, h ) {
      return this.is_coords_within_box( 
        x,    y,  
        x1,   y1,
        x1+w, y1,
        x1+w, y1+h,
        x1,   y1+h ); 
    },

    go_back: function() {
      debug( "go_back" );
      this.previous(); 
      return this;
    },

    go_forward: function() {
      debug( "go_forward" );
      this.next();
      return this;
    },

    // public setter for our Strip's canvas.
    setCanvas: function( canvas ) {
      var strip = this;
      debug("canvas:"+canvas); 

      // TODO:remove listeners...
      canvas.parent_strip = this; // TODO:i feel dirty about this...
      canvas.addEventListener('click', 
        function(e){strip.handle_canvas_click(strip,e)}, false );
      this.canvas = canvas;
      this.ctx =    canvas.getContext('2d');
      this.canvas_height = canvas.height;
      this.canvas_width =  canvas.width;
      debug("strip.setCanvas, ctx:"+this.ctx); 
      return this;
    },

    /*
    * @private
    * handle canvas mouse clicks.
    *
    * we have to carefully bind the scope here back to strip...
    *
    * @param e - mouse click event.
    * @param strip - the strip handling the mouse click.
    */
    handle_canvas_click: function( strip, e ) {
      debug("handle_canvas_click");
      debug( "strip:"+strip );
      debug( "e:"+e );
      var x = e.offsetX,
        y = e.offsetY,
        button_height = strip.button_height,
        button_width =  strip.button_width,
        height = strip.canvas_height,
        width = strip.canvas_width;
      debug( "x:"+x );
      debug( "y:"+y );
      window.canvas_click = e;  // TODO:remove

      // TODO abstract button click regions...

      //
      // the <- button on the bottom left.
      //
      if ( strip.is_coords_within_rectangle.apply( strip, [ x, y,
          0, height - button_height,
          button_width, button_height ] ) ) {
        strip.go_back.apply(strip);
      //
      // the -> button on the bottom right.
      //
      } else if ( strip.is_coords_within_rectangle.apply( strip, [ x, y,  
          width - button_width, height - button_height,
          button_width, button_height ] ) ) {
        strip.go_forward.apply(strip);
      } 
    },


    // synonymous with "start".
    action: function() {
      debug("strip.action");
      if ( !this.sequence ) {
        debug( "sequence is null!" );
      }
      this.sequence.setContext(this.ctx).action();
      this.draw_buttons(this.ctx);
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
      //scene && this.sequence.loadScene( scene ).setContext( this.ctx ).action(); //TODO
      this.action();
      return this;
    },

    // go to the previous scene.
    previous: function() { 
      var scene = sequence.scenes[ sequence.selected_scene_index - 1 ];
      scene = scene || sequence.scenes[0];
      //scene && this.sequence.loadScene( scene ).setContext( this.ctx ).action(); //TODO
      this.action();
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
    },

    newText: function(msg) {
      debug("strip.newText");
      return ( new Text.fn.init() ).setMessage(msg);
    }

  };

//---------------------------------------------------------------------------
/*
*   the Sequence "class".
*   represents an ordered collection of scenes to be drawn by the strip.
*/
Sequence.fn = Sequence.prototype = {

  constructor: Sequence,

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
/*
* A Scene represents a visual, and possibly some text;
* parent to Shot, and Dialogue.
* 1+ Scenes make up a Sequence.
*/
Scene.fn = Scene.prototype = { 
  constructor: Scene, 
  init: function() { 
    return this;
  },

  setShot: function( shot ) {
    this.shot = shot;
    return this;
  }, 

// TODO, this would be a nice wrapper...
//addWords: function( s ) {
//  dialogue = dialogue || Strip.newDialogue();
//  dialogue.addText( Text..newText( s ) ); //TODO:this will fail
//  return this;
//},

  setup: function( ctx ) {
    debug( "scene.setup, ctx:"+ctx );
    if ( !this.shot ) {
      warn( "missing shot" );
    }
    this.shot && this.shot.draw( ctx ); 
    if ( !this.dialogue ) {
      warn( "missing dialogue" );
    }
    this.dialogue && this.dialogue.draw( ctx );  

    return this;
  },

  /* the shot used in this scene. */
  shot: null,
  dialogue: null,

  setDialogue: function( dialogue ) {
    this.dialogue = dialogue;
    return this;
  } 
};
//---------------------------------------------------------------------------
Shot.fn = Shot.prototype = { 
  constructor: Shot,
  init: function() { 
    return this;
  }, 
  draw: function( context ) {
    var image = this.image;
    if ( !image ) {
      warn( "image is missing!!!" ); // TODO:blank out?
    } else {
      debug( "drawing image file:"+image.src );
    }
    if ( !context ) {
      warn( "context is missing!" ); 
    } 
    context && image && context.drawImage( image, 0, 0 );  // TODO 

    return this;
  }, 
  setImage: function( image ) {
    this.image = image;
    return this;
  } 
};
//---------------------------------------------------------------------------
/*
* Dialogue represents an ordered grouping of Texts.
* ie. 2 people talking can be represented by alternating blue vs red Text.
*/
Dialogue.fn = Dialogue.prototype = { 
  constructor: Dialogue, 
  init: function() { 
    return this;
  },

  texts: [],

  /* the currently selected text index. */
  selected_index: 0, 

  /* draw the dialogue's words/text onto the stage. */
  //
  //  TODO:how do we know where to put the text relative to the image?
  //
  draw: function( context, width, height ) {
    debug("dialogue.draw");
    var text = this.texts[this.selected_index], 
      words,
      prev_x = ~~(width*0.5), 
      prev_y = 16,
      i = 0,
      get_fill_style,
      colour,
      x, 
      y,
      get_x, 
      get_y;
  
    words = text.message;

    // TODO:allow different word-bubble strategies...
    // TODO:move this outside of draw...
    get_x = function() {
      return prev_x += 16;  // TODO:alternative left and right.
    }

    get_y = function() {
      return prev_y += 32;  // TODO:needs to be lower on the canvas!
    }

    get_fill_style = function() {
      switch ( i ) {
        case 0:
          colour = 'aqua';
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
          colour = 'fuchsia';
          break;
      }

      i++;
      if ( i > 3 ) {
        i = 0;
      }
      return colour;
    }

    colour = get_fill_style(); // TODO:set larger font size

    x = get_x();
    y = get_y();
    this.draw_speech_bubble( context, words, x, y, colour );

    // TODO:text color alternation...
    // TODO:probably need to loop through and 
    // re-draw all the words from previous texts.
    context.fillStyle = colour;
    context.fillText( words, x, y );
    return this;
  },

  /*
  * draw a speech bubble large enough to fit a given message.
  * TODO:account for word wrap.
  *
  * @param ctx - 2d canvas context.
  * @param s - String, the proposed text to make room for.
  * @param x - number
  * @param y - number
  */
  draw_speech_bubble: function( ctx, s, x, y, colour ) {
    debug("draw_speech_bubble");
    var bubble_width,
      bubble_height,
      padding = 16,
      text_metrics = ctx.measureText( s ); 

    bubble_width =  ~~(text_metrics.width + padding + 1);
    bubble_height = 32; // TODO:more thorough text height measuring!

    ctx.save();

    ctx.globalAlpha = 0.2;
    ctx.fillStyle = colour;
    ctx.fillRect( x - padding, 
        y - bubble_height/2, 
        bubble_width, bubble_height );

    ctx.restore();
    return this;
  },

  /*
  * add a text object to our list of texts.
  * @param text (Text).
  */
  pushText: function( text ) {
    debug("pushText, text:"+text);
    var texts = this.texts || []; 
    texts.push( text );
    this.texts = texts;
    return this;
  }
}; 
//---------------------------------------------------------------------------
/*
* Text represents a message we want to show/deliver to the audience.
*/
Text.fn = Text.prototype = { 
  constructor: Text, 
  init: function() { 
    return this;
  },
  setMessage: function(s) {
    this.message = s;
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
  Text    .fn.init.prototype = Text.fn; 

  return Strip; 
})(); 
//--------------------------------------------------------------------------- 
window.Strip = Strip; 
})(window);
