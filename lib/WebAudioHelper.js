/**
 *  Copyright 2011 Munkadoo Games LLC
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

/**
 * Create a new AudioClip object from a source URL. This object can be played,
 * paused, stopped, and resumed, like the HTML5 Audio element.
 *
 * @constructor
 * @param {DOMString} src
 * @param {boolean=} opt_autoplay
 * @param {boolean=} opt_loop
 */
AudioClip = function(src, opt_autoplay, opt_loop) {
  // At construction time, the AudioClip is not playing (stopped),
  // and has no offset recorded.
  this.playing_ = false;
  this.startTime_ = 0;
  this.loop_ = opt_loop ? true : false;

  // State to handle pause/resume, and some of the intricacies of looping.
  this.resetTimout_ = null;
  this.pauseTime_ = 0;

  this.autoplay = opt_autoplay;

  // Create an XHR to load the audio data.
  var request = new XMLHttpRequest();
  request.open("GET", src, true);
  request.responseType = "arraybuffer";

  var sfx = this;
  request.onload = function() {
    // When audio data is ready, we create a WebAudio buffer from the data.
    // Using decodeAudioData allows for async audio loading, which is useful
    // when loading longer audio tracks (music).
    AudioClip.context.decodeAudioData(request.response, function(buffer) {
      sfx.buffer_ = buffer;

      if (sfx.autoplay) {
        sfx.play();
      }
    });
  }

  request.send();
}

// Create a global context for all our AudioClips to use and attach it to the
// base object.
AudioClip.context = new webkitAudioContext();

/**
 * Recreates the audio graph. Each source can only be played once, so
 * we must recreate the source each time we want to play.
 * @return {BufferSource}
 * @param {boolean=} loop
 */
AudioClip.prototype.createGraph = function(loop) {
  var source = AudioClip.context.createBufferSource();
  source.buffer = this.buffer_;
  source.connect(AudioClip.context.destination);

  // Looping is handled by the Web Audio API.
  source.loop = loop;

  return source;
}

/**
* Plays the given AudioClip. Clips played in this manner can be stopped
* or paused/resumed.
*/
AudioClip.prototype.play = function() {
  if (this.resetTimeout_ != null || (this.buffer_ && !this.isPlaying())) {
    // Record the start time so we know how long we've been playing.
    this.startTime_ = AudioClip.context.currentTime;
    this.playing_ = true;
    this.resetTimeout_ = null;

    // If the clip is paused, we need to resume it.
    if (this.pauseTime_ > 0) {
      // We are resuming a clip, so it's current playback time is not correctly 
      // indicated by startTime_. Correct this by subtracting pauseTime_.
      this.startTime_ -= this.pauseTime_;
      var remainingTime = this.buffer_.duration - this.pauseTime_;

      if (this.loop_) {
//      // If the clip is paused and looping, we need to resume the clip
//      // with looping disabled. Once the clip has finished, we will re-start
//      // the clip from the beginning with looping enabled
//      this.source_ = this.createGraph(false);
//      this.source_.noteGrainOn(0, this.pauseTime_, remainingTime)

//      // Handle restarting the playback once the resumed clip has completed.
//      var clip = this;
//      this.resetTimeout_ = setTimeout(function() { clip.play() },
//                                      remainingTime * 1000);
        this.source_ = this.createGraph(false);
        this.source_.loop = true;
        this.source_.notOn( 0 );
      } else {
        // Paused non-looping case, just create the graph and play the sub-
        // region using noteGrainOn.
        this.source_ = this.createGraph(this.loop_);
        this.source_.noteGrainOn(0, this.pauseTime_, remainingTime);
      }

      this.pauseTime_ = 0;
    } else {
      // Normal case, just creat the graph and play.
      this.source_ = this.createGraph(this.loop_);
      this.source_.noteOn(0);
    }
  }
}

/**
 * Plays the given AudioClip as a sound effect. Sound Effects cannot be stopped
 * or paused/resumed, but can be played multiple times with overlap. 
 * Additionally, sound effects cannot be looped, as there is no way to stop 
 * them. This method of playback is best suited to very short, one-off sounds.
 */
AudioClip.prototype.playAsSFX = function() {
  if (this.buffer_) {
    var source = this.createGraph(false);
    source.noteOn(0);
  }
}

/**
* Stops an AudioClip , resetting its seek position to 0.
*/
AudioClip.prototype.stop = function() {
  this.autoplay = false;
  if (this.playing_) {
    this.source_.noteOff(0);
    this.playing_ = false;
    this.startTime_ = 0;
    this.pauseTime_ = 0;
    if (this.resetTimeout_ != null) {
      clearTimeout(this.resetTimeout_);
    }
  }
}

/**
* Pauses an AudioClip. The offset into the stream is recorded to allow the
* clip to be resumed later.
*/
AudioClip.prototype.pause = function() {
  if (this.playing_) {
    this.source_.noteOff(0);
    this.playing_ = false;
    this.pauseTime_ = AudioClip.context.currentTime - this.startTime_;
    this.pauseTime_ = this.pauseTime_ % this.buffer_.duration;
    this.startTime_ = 0;
    if (this.resetTimeout_ != null) {
      clearTimeout(this.resetTimeout_);
    }
  }
}

/**
* Indicates whether the sound is playing.
* @return {boolean}
*/
AudioClip.prototype.isPlaying = function() {
  var playTime = this.pauseTime_ +
                 (AudioClip.context.currentTime - this.startTime_);

  return this.playing_ && (this.loop_ || (playTime < this.buffer_.duration));
}
