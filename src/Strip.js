/*!
* ..Strip.js, uly may2012..
*
* organized in a similar fashion to jQuery v1.7.2
*
* most of the Strip methods are intended to work with the "cascading-jsp-style".
*
*/
(function( window, undefined ){ 

//---------------------------------------------------------------------------
//
// (internal) utilities
//
//---------------------------------------------------------------------------
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

var assert = function( expression, msg ) {
  if ( !expression ) {
    msg && warn( msg );
    throw new Exception( msg );
  }
  try {
    console.log( "DEBUG::"+msg );
  }
  catch ( e ) {
    //..
  } 
};
//---------------------------------------------------------------------------

var Strip = (function() {
  debug("Strip..");

// "Local" copy of Strip.
var Strip = function(canvas) {
    debug("Strip local init..");
    return new Strip.fn.init(canvas);
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

    /** 
    * Strip.fn.init 
    * @param canvas - optional, sets the canvas/2dcontext.
    * @return Strip
    **/
    init: function(canvas) { 
      var strip = this;
      canvas && strip.setCanvas( canvas );
      return strip;
    },

    /**
    * @public
    * Strip.load_from_json
    *
    * TODO:does NOT expect npe
    *
    * setup our strip configuration from json.
    * @param data (json)
    */
    load_from_json: function( data ) {
      var strip = this,
        image, 
        lines;
      strip.title = data.title;
      strip.sequence = strip.newSequence();    

      $.each( data.scenes, function( idx, scene ) {
        image = new Image();
        image.src = scene.image;
        lines = [];
        $.each( scene.lines, function( idx2, line ) {
          lines.push( line.text.toString() );
        });
        strip.addNewScene( image, lines );
      });
      return strip;
    },

    load_from_json_string: function( s ) {
      var strip = this;
      return strip.load_from_json( JSON.parse( s ) );
    },

    /**
    * @public
    * Strip.to_json
    *
    * return our strip's current configuration as json.
    * to be used with rails to persist our state.
    *
    * TODO:does NOT expect npe (x2).
    *
    * @return json object.
    */
    to_json: function() {
      var data = {},
        strip = this,
        scenes = [],
        lines;

      data.title = strip.title.toString();

      $.each( strip.sequence.scenes, function( idx, scene ) {
        lines = [];
        $.each( scene.dialogue.texts, function( idx2, text ) {
          lines.push( { "text": text.message.toString() } );
        }); 

        console.debug( "scene:"+scene );
        console.debug( "scene.shot:"+scene.shot );
        console.debug( "scene.shot.image:"+scene.shot.image );
        console.debug( "scene.shot.image.src:"+scene.shot.image.src );
        console.debug( "lines:"+lines );

        scenes.push( 
          { 
            "image": scene.shot.image.src.toString(),
            "lines": lines
          }); 
      });

      data.scenes = scenes;
  
      return data;
    },

    to_json_string: function() {
      var strip = this;
      return JSON.stringify( strip.to_json() );
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
      for ( ; i<len; i++ ) {
        image = images[i];
        debug( "image:"+image );
        // TODO:newShot @image param
        scene = new Scene.fn.init();
        shot =  new Shot.fn.init();
        window.image3 = image;
        shot = shot.setImage( image );
        scene.setShot( shot );
        sequence.pushScene( scene );
      }
      this.loadSequence( sequence );
      return this;
    },

    /*
    * Strip.fn.draw_buttons
    * draw the previous/next buttons for the strip.
    * @param ctx - the 2d drawing context.
    */
    draw_buttons: function( ctx ) { 
      assert(ctx);
      var strip = this,
        h = this.canvas.height,
        w = this.canvas.width,
        bh = this.button_height,
        bw = this.button_width;

      var has_next = strip.sequence.selected_scene_index !== strip.sequence.END_SCENE_INDEX,
        has_prev = strip.sequence.selected_scene_index !== strip.sequence.TITLE_SCENE_INDEX;

      var prev_x = 0,
        prev_y = h - bh,
        next_x = w - bw,
        next_y = h - bh,
        mid_bh = bh / 2,
        mid_bw = bw / 2,
        guess = 20;

      ctx.save();

      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#0000aa'; 
      has_next && ctx.fillRect( next_x, next_y, bw, bh );
      has_prev && ctx.fillRect( prev_x, prev_y, bw, bh );

      ctx.globalAlpha = 1; 
      has_prev && ctx.fillText( '<-- prev',
          prev_x + mid_bw - guess, 
          prev_y + mid_bh );
      has_next && ctx.fillText( 'next -->', 
          next_x + mid_bw - guess , 
          next_y + mid_bh );
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
      window.addEventListener('keyup', 
        function(e){strip.handle_canvas_keypress(strip,e)}, false ); 
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
      var x = e.offsetX,
        y = e.offsetY,
        button_height = strip.button_height,
        button_width =  strip.button_width,
        height = strip.canvas_height,
        width = strip.canvas_width;
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

    /*
    * @private,
    *
    * handle canvas keyboard presses.
    *
    * @param strip - the passed in strip scope.
    * @param e - the keypress event.
    */
    handle_canvas_keypress: function( strip, e ) {
      debug("handle_canvas_keypress");
      var button_height = strip.button_height,
        button_width =  strip.button_width,
        height = strip.canvas_height,
        width = strip.canvas_width;
      window.keypress_event = e;  // TODO:remove
      console.log( "keyCode:"+e.keyCode );

      //
      // see http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
      //
      switch ( e.keyCode ) {
        case 39:  // -->
        case 32:  // spacebar
          strip.go_forward.apply(strip);
          break;
        case 37:  // <--
        case 8:   // backspace
          strip.go_back.apply(strip);
          break;
        default:
          console.warn( "TODO: handle keyCode:"+e.keyCode );
          break;
      } 
    }, 

    /**
    * Strip.fn.action
    * synonymous with "start".
    */
    action: function() {
      var strip = this,
        seq = this.sequence;
      if ( !seq ) {
        debug( "sequence is null!" );
      }
      // TODO use multiple canvases to separate out the different layers.
      strip.clear_canvas();
      if ( seq ) {
        if ( seq.TITLE_SCENE_INDEX === seq.selected_scene_index ) {
          strip.show_title();
        } else if ( seq.END_SCENE_INDEX === seq.selected_scene_index ) { 
          strip.show_fin();
        } else {
          seq.setContext(strip.ctx).action();
        }
      }
      strip.draw_buttons(strip.ctx);
      return strip;
    },

    /**
    * Strip.clear_canvas.
    */
    clear_canvas: function() {
      var ctx = this.ctx,
        h = this.canvas.height,
        w = this.canvas.width;
      ctx.save();
      ctx.clearRect( 0, 0, w, h );
      ctx.fillStyle = '#000000';
      ctx.fillRect( 0, 0, w, h );
      ctx.restore();
      return this;
    },

    // synonimous with "stop".
    cut: function() {
      this.sequence.cut();
      return this;
    },

    /* 
    * Strip.fn.next
    * go to the next scene.
    */
    next: function() { 
      var sequence = this.sequence,
        strip = this;
      if ( sequence.is_at_end_of_current_scene() ) {
        if ( sequence.has_next_scene() ) {
          strip.change_scenes(true);
        } else {
          sequence.selected_scene_index = sequence.END_SCENE_INDEX;
          strip.show_fin(); // TODO call action?
          strip.draw_buttons(strip.ctx);
        }
      } else {
        sequence.move_dialogue_forward();
      }
      return strip; 
    },

    /* 
    * Strip.previous
    * go to the previous scene.
    */ 
    previous: function() { 
      var sequence = this.sequence; 
      this.change_scenes(false);
      return this;
    },

    /*
    * Strip.change_scenes
    * change scenes for our strip, called by next/previous.
    *
    * @param next - boolean, when true will increment the selected scene, 
    *               otherwise it will go backwards.
    */
    change_scenes: function( next ) {
      next = ( typeof next !== 'undefined' )? next : true;

      var strip = this,
        sequence = this.sequence,
        scene_incrementor = (next)? 1 : -1,
        idx = this.sequence.selected_scene_index;
      debug( "change_scenes, scene index was:"+idx );

      if ( idx !== sequence.END_SCENE_INDEX
          && idx !== sequence.TITLE_SCENE_INDEX ) {
        sequence.selected_scene_index += scene_incrementor;
      } else if ( !next && idx === sequence.END_SCENE_INDEX ) { 
        sequence.selected_scene_index = sequence.number_of_scenes - 1; 
      } else if ( next && idx === sequence.TITLE_SCENE_INDEX ) {
        sequence.selected_scene_index = 0;
      }

      idx = sequence.selected_scene_index;
      // catch falling off edges beyond title/fin.
      if ( idx > sequence.number_of_scenes ) {
        sequence.selected_scene_index = sequence.END_SCENE_INDEX; 
      } else if ( idx.selected_scene_index < 0 
        && idx !== sequence.END_SCENE_INDEX ) { 
        sequence.selected_scene_index = sequence.TITLE_SCENE_INDEX;
      } 

      idx = sequence.selected_scene_index;
      if ( idx > -1 
          && idx < sequence.number_of_scenes - 1 ) {
        sequence.load_current_scene( strip.ctx );
      }

      debug( "change_scenes, scene index is now:"+idx );
      return strip.action(); 
    },

    /** Strip.fn.newSequence */
    newSequence: function() {
      var strip = this;
      strip.show_title();
      debug("Strip.newSequence");
      return new Sequence.fn.init();
    },

    newShot: function( image ) {
      debug("Strip.newShot");
      var shot = new Shot.fn.init();
      image && shot.setImage( image );
      return shot;
    },

    newScene: function( image, lines ) {
      debug("Strip.newScene()");
      var scene = new Scene.fn.init(),
        strip = this,
        image = image,
        lines = lines;

      image && scene.setShot(     strip.newShot(     image ) );
      lines && scene.setDialogue( strip.newDialogue( lines ) ); 
      return scene;
    },

    /**
    * add a new scene to our strip, 
    * and automatically include it into our current scene sequence.
    *
    * @return (Scene) - the newly created scene.
    */
    addNewScene: function( image, lines ) { 
      var scene,
        strip = this,
        image = image,
        lines = lines; 
      scene = strip.newScene( image, lines );
      strip.sequence = strip.sequence || strip.newSequence();
      strip.sequence.pushScene( scene );

      return scene;
    },

    newDialogue: function( lines ) {
      debug("Strip.newDialogue()");
      var dialogue = new Dialogue.fn.init();
      lines && dialogue.addLines( lines );      
      return dialogue;
    },

    newText: function(msg) {
      debug("strip.newText");
      return ( new Text.fn.init() ).setMessage(msg);
    },

    /**
    * Strip.fn.show_title
    * show the beginning title "scene".
    */
    show_title: function() {
      var strip = this,
        title = this.title || 'untitled';
      strip.draw_black_and_white_text( title );
      return strip; 
    },

    /**
    * Strip.fn.show_fin
    * show the ending "scene".
    */ 
    show_fin: function() {
      var strip = this;
      strip.draw_black_and_white_text( 'fin' );
      return strip;
    },

    /* 
    * @private 
    * Strip.fn.draw_black_and_white_text
    *
    */
    draw_black_and_white_text: function( label ) {
      assert( this.ctx );
      assert( this.canvas ); 
      var strip = this,
        ctx = this.ctx 
        h = this.canvas.height,
        w = this.canvas.width;

      // TODO center the text.
      var x = w / 2,
        y = h / 2;
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.fillRect( 0, 0, w, h );
      ctx.fillStyle = '#ffffff';
      ctx.font = "italic 24pt Calibri";
      ctx.textAlign = 'center';
      ctx.fillText( label, x, y );  // TODO use dialogue's word wrap
      ctx.restore();
      return strip; 
    }

  };

//---------------------------------------------------------------------------
/*
*   the Sequence "class".
*   represents an ordered collection of scenes to be drawn by the strip.
*/
Sequence.fn = Sequence.prototype = {

  constructor: Sequence,

  /** Sequence.fn.init */ 
  init: function( previous_sequence ) { 
    var seq = this;
    seq.scenes = [];
    seq.selected_scene_index = seq.TITLE_SCENE_INDEX;
    if ( previous_sequence ) {
      seq.ctx =    previous_sequence.ctx;
      seq.canvas = previous_sequence.canvas;
    } else {
      seq.ctx = null;
      seq.canvas = null;
    }
    return seq;
  },

  TITLE_SCENE_INDEX: -1,
  END_SCENE_INDEX:   -2, 
  selected_scene_index: null, 
  canvas: null, 
  ctx: null,  // the drawing context.  
  scenes: [],

  /** Sequence.fn.action */
  action: function() {
    debug("sequence, action");
    this.load_current_scene();
    return this;
  },

  /**
  * return the sequence's currently selected scene.
  * @return Scene - may be null.
  */
  get_current_scene: function() {
    var scene,
      idx = this.selected_scene_index; 
    scene = this.scenes[ idx ]; 
    return scene;
  },

  /**
  * Sequence.has_next_scene
  * is there another scene that comes after this one?
  * in other words, are we at the end of our sequence?
  *
  * @return boolean
  */
  has_next_scene: function() {
    var seq = this,
      idx = this.selected_scene_index,
      len = this.scenes.length;
    return ( idx < (len - 1) ) && idx !== seq.END_SCENE_INDEX;
  },

  /**
  * is the currently selected scene in our sequence all played out?
  * in other words, are we ready for the next scene to be displayed?
  *
  * @return boolean
  */ 
  is_at_end_of_current_scene: function() {
    var seq = this,
      scene = this.get_current_scene();
    return ( scene )? scene.is_at_end() : true; 
  },

  /**
  * is the currently selected scene in the sequence at the very beginning?
  *
  * @return boolean
  */ 
  is_at_beginning_of_current_scene: function() {
    var seq = this,
      scene = this.get_current_scene();
    return ( scene )? scene.is_at_beginning() : true; 
  },

  /* 
  * @private 
  * Sequence.fn.move_dialogue_forward
  * @return boolean 
  */
  move_dialogue_forward: function() {
    var seq = this,
      scene = this.get_current_scene();
    return scene && scene.move_dialogue_forward();
  },

  /* 
  * @private 
  * Sequence.fn.move_dialogue_backward
  * @return boolean 
  */ 
  move_dialogue_backward: function() {
    var seq = this,
      scene = this.get_current_scene();
    return scene && scene.move_dialogue_backward(); 
  },

  /*
  * Sequence.fn.load_current_scene
  * load the currently selected scene by index.
  */
  load_current_scene: function( ctx ) {
    var scene = this.get_current_scene(),
      ctx = ctx || this.ctx; 
    assert( ctx );
    scene.dialogue && scene.dialogue.reset();
    scene.setup( ctx ); 
    return this;
  },

  number_of_scenes: 0,

  // add a scene to the sequence stack.
  pushScene: function( scene ) {
    var sequence = this;
    sequence.scenes = sequence.scenes || [];
    sequence.scenes.push( scene );
    sequence.number_of_scenes = sequence.scenes.length;
    return sequence;
  },

  clearScenes: function() {
    this.scenes = [];
    this.number_of_scenes = 0;
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

  /**
  * Scene.is_at_end
  * is the currently selected scene in our sequence all played out?
  * in other words, are we ready for the next scene to be displayed?
  *
  * @return boolean
  */
  is_at_end: function() {
    var dialogue = this.dialogue;
    if ( 'undefined' === typeof dialogue ) {
      return true; 
    } 
    return dialogue.texts.length - 1 === dialogue.selected_index;
  },

  /**
  * Scene.is_at_beginning
  * is the currently selected scene in the sequence at the very beginning?
  *
  * @return boolean
  */
  is_at_beginning: function() {
    var dialogue = this.dialogue;
    if ( 'undefined' === typeof dialogue ) {
      return true; 
    }
    return 0 === dialogue.selected_index;
  },

  /**
  * Scene.move_dialogue_forward
  * move the dialogue forward by one speech bubble.
  * called by parent Sequence.
  */
  move_dialogue_forward: function() {
    return this.move_dialogue( true );
  },

  /**
  * Scene.move_dialogue_backward
  * move the dialogue backward by one speech bubble.
  * called by parent Sequence.
  */
  move_dialogue_backward: function() {
    return this.move_dialogue( false );
  },

  /**
  * Scene.move_dialogue
  * move our dialogue and redraw our speech bubble.
  */
  move_dialogue: function( forward ) {
    debug( "Scene.move_dialogue" );
    var dialogue = this.dialogue,
      max_text_index = this.dialogue.texts.length - 1;
    if ( 'undefined' === typeof dialogue ) { 
      warn( "no dialogue!" );
      return this; 
    }

    debug( "Scene.move_dialogue, dialogue.selected_index was:"+dialogue.selected_index );

    if ( forward ) {
      dialogue.selected_index += 1;
    } else { 
      dialogue.selected_index -= 1;
    }

    if ( dialogue.selected_index < 0 ) {
      dialogue.selected_index = 0;
    } else if ( dialogue.selected_index > max_text_index  ) {
      dialogue.selected_index = max_text_index;
    } 

    debug( "Scene.move_dialogue, dialogue.selected_index is now:"+dialogue.selected_index );
    dialogue.draw( this.ctx );

    return this; 
  },

  /*
  * @protected
  * Scene.fn.setup
  */
  setup: function( ctx ) {
    debug( "scene.setup, ctx:"+ctx );
    assert( ctx );
    this.ctx = ctx;
    if ( !this.shot ) {
      warn( "missing shot" );
    }
    this.shot && this.shot.draw( ctx ); 
    if ( this.dialogue ) {
      this.dialogue.selected_index = 0;
      this.dialogue.draw( ctx );  
    }

    return this;
  },

  /* the shot used in this scene. */
  shot: null,
  dialogue: null,
  ctx: null,

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
    this.texts = [];
    this.selected_index = 0;
    this.reset();
    return this;
  },

  /*
  * Dialogue.reset
  * reset our dialogue speech-bubbles drawing, etc.
  */
  reset: function() {
    debug( "Dialogue.reset" );
    this.prev_x = 0;
    this.prev_y = 0; 
  },

  prev_x: null,
  prev_y: null,

  texts: null,

  /* the currently selected text index. */
  selected_index: null, 

  //
  // TODO:allow different word-bubble strategies...
  //
  get_x: function() { 
    return this.prev_x += 32;  // TODO:alternative left and right.
  },

  get_y: function() {
    return this.prev_y += 32;  // TODO:needs to be lower on the canvas!
  },

  /* 
  * Dialogue.draw
  * draw the dialogue's words/text onto the stage. 
  */ 
  //
  //  TODO:how do we know where to put the text relative to the image?
  //
  draw: function( context, width, height ) {
    debug("dialogue.draw");
    assert( context );
    var text = this.texts[this.selected_index], 
      words,
      i = 0,
      get_fill_style,
      colour,
      x, 
      y,
      get_x, 
      get_y,
      number_of_lines,
      max_width = 150;
  
    words = text.message; 

    get_fill_style = function() {
      switch ( i ) {
        case 0:
//        colour = 'black';
          colour = 'blue';
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
    debug( "colour"+colour );

    x = this.get_x();
    y = this.get_y(); 
    
    var _canvas = document.createElement('canvas');
    // TODO
    _canvas.height = 350;
    _canvas.width =  500;
    var _ctx = _canvas.getContext('2d')

    number_of_lines = this.draw_words( _ctx, words, 
                                       x, y, colour, max_width );
    this.draw_speech_bubble( context, x, y, 
                             colour, number_of_lines, max_width );  
    context.drawImage( _canvas, 0, 0 );

    return this;
  },

  /*
  * Dialogue.draw_words
  * draws words on to the canvas and does text wrapping!
  *
  * @param ctx - the canvas 2d drawing context.
  * @param s - (String) the words to draw.
  * @param x - the top left x coordinate of where to draw words.
  * @param y - the top left y coordinate of where to draw words.
  * @param colour - (String) the fillStyle to use.
  *
  * @return (int) number of lines.
  */
  draw_words: function( ctx, s, x, y, colour, max_width ) {
    var lines = [],
      line,
      words = s.split(' '),
      len, 
      i = 0,
      word,
      metrix,
      line_height = 12,
      line_length = 0,
      line_idx = 0;

    ctx.save();
    ctx.globalAlpha = 1.0;

    lines[0] = line = [];
    len = words.length;
    for ( ; i < len; i++ ) {
      word = words[ i ]; 
      metrix = ctx.measureText( word ); 

      if ( metrix.width + line_length > max_width ) {
        line_length = 0;
        lines[ ++line_idx ] = line = [];
      } 
      line_length += metrix.width;
      line.push( word );
    }

    for ( i = 0, len = lines.length; i < len; i++ ) {
      ctx.fillText( lines[ i ].join(' '), 
        x, 
        y + ( i * line_height ) );
    }

    window.lines = lines; // TODO

    ctx.restore();
    return lines.length;
  }, 

  /*
  * Dialogue.draw_speech_bubble
  * draw a speech bubble large enough to fit a given message.
  * TODO:account for word wrap.
  *
  * @param ctx - 2d canvas context.
  * @param s - String, the proposed text to make room for.
  * @param x - number
  * @param y - number
  */
  draw_speech_bubble: function( ctx, x, y, colour, number_of_lines, max_width ) {
    debug("draw_speech_bubble, colour:"+colour);

    var padding = 12;  // TODO: parameterize based on fontSize.

    var bubble_width = ~~(1 + 2*padding + max_width),
      bubble_height = number_of_lines * 12 + padding; // TODO: text height
    ctx.save();

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'white'; 

    ctx.fillRect( x - padding, 
        y - padding, 
        bubble_width, bubble_height ); 

    ctx.globalAlpha = 1;  // TODO assume this is the defualt?
    ctx.restore();
    return this;
  },

  /**
  * Dialogue.addLines
  * add a list of speech lines (strings) to our dialogue.
  *
  * @param lines - string array 
  */
  addLines: function( lines ) {
    var i = 0, 
      lines = lines,
      len = lines && lines.length,
      dialogue = this;

    for ( ; i < len; i++ ) {
      dialogue.addLine( lines[i] );
    }

    return this;
  },

  /**
  * Dialogue.addLine
  * add a single speech line (string) to our dialogue.
  *
  * @param msg - string
  */
  addLine: function( msg ) {
    if ( !msg ) {
      warn( "dialogue addLine given empty message/speech-line." );
    } 
    var text = new Text.fn.init(),
      dialogue = this; 
    return dialogue.pushText( text.setMessage( msg ) ); 
  },

  /*
  * add a text object to our list of texts.
  * @param text (Text).
  */
  pushText: function( text ) {
    debug("pushText, text:"+text);
    this.texts.push( text );
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
