/*..audiophile, uly, aug2012..*/
/*
*  Copyright 2012 Ulysses Levy
* 
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
* 
*      http://www.apache.org/licenses/LICENSE-2.0
* 
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/
/*
* The Audiophile is stupid helper class for playing sound/music;
* it stands on the shoulders of AudioContext and AudioClip.
*
* references:
* https://github.com/Munkadoo/oss/blob/master/WebAudio/WebAudioHelper.js
*/
Audiophile = function() {
  var that = this; 

  /*
  * @private,
  * Audiophile.clips stores all of our AudioClip instances that we want to manage.
  */
  that.clips = [];
};

/*
* clear our audio clips.
*/
Audiophile.prototype.clear = function() {
  var that = this;
  $.each( that.clips, function( idx, audio_clip ) {
    audio_clip.stop();  
  }); 
  that.clips = [];
}

/**
* @public
* play a music loop.
* @return AudioClip
*/
Audiophile.prototype.play_loop = function( src, params ) {
  var that = this,
    loop;
  // TODO transitions!
  that.clear();
  return that.add_loop( src );
} 

/*
* add a looping (auto-playing) audio clip.
*
* @param src - music src.
* @return AudioClip
*/
Audiophile.prototype.add_loop = function( src ) {
  var that = this,
    clip;

  clip = new AudioClip( src, 
      true,   // auto play
      true ); // looping

  that.clips.push( clip );

  return clip;
}


