/* Handles the UserProfile object. I just stubbed this here as a guide
* if this handled the logic of the userprofile, there should be a
* neemo.ui.UserProfile.Display that would handle what came to the screen
* Also, it listens for ChangeRegion event to know when to flip images
*/
Neemo.modules.UserProfile = function(neemo) {
  neemo.ui.UserProfile = {};
  neemo.ui.UserProfile.Engine = Class.extend(
    {
    init: function(bus, api) {
      var that = this;
      this._bus = bus;
      this._api = api;
    },

    _bindEvents: function(){
      var that = this
      , bus = this._bus;
      bus.addHandler(
        'UpdateUserProfile',
        function(event){
          neemo.log.info('User update recieved');
        }
      );
    },
    _bindDisplay: function(display, text) {
      var that = this;
      this._display = display;
      display.setEngine(this);
    },
    start: function() {
      this._bindDisplay(new neemo.ui.UserProfile.Display());
      this._bindEvents();
    },
  }
  );
  

  /**
  * The userprofile display.
  */
  neemo.ui.UserProfile.Display = neemo.ui.Display.extend(
      /* UserProfile UI elements */
    {
    init: function() {
      this._super(this._html());
      $('.info').append(this.getElement());
    },
    _html: function() {
      return  '<div class="line-through">'+
              '  <h2>ANDREWXHILL</h2>'+
              '  <div class="line"></div>'+
              '</div>'+
              '<div class="progress-bar">'+
              '  <div class="progress"></div>'+
              '</div>'+
              '<span class="level"> Lvl. 2</span>'+
              '<ul>'+
              '  <li><div class="point">+5</div> <p>you have found a new coral occurence</p></li>'+
              '  <li><div class="point">+5</div> <p>you have found a new coral occurence</p></li>'+
              '  <li><div class="point">+1</div> <p>you have confirmed a  coral occurence<p></li>'+
              '  <li><div class="point">+5</div> <p>you have found a new coral occurence</p></li>'+
              '  <li><div class="point">+5</div> <p>you have found a new coral occurence</p></li>'+
              '</ul>'+
              '<div id="rank-box">'+
              '  <div class="header">'+
              '    <div class="icon trophee"></div>'+
              '    <span class="title">Your rank</span>'+
              '    <div class="line-through">'+
              '      <div class="score">#0013</div>'+
              '      <div class="line"></div>'+
              '    </div>'+
              '  </div>'+
              '</div>';
    }
  }
  );
}

