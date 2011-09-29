/* Handles the Slideshow object. I just stubbed this here as a guide
* if this handled the logic of the slideshow, there should be a
* neemo.ui.Slideshow.Display that would handle what came to the screen
* Also, it listens for ChangeRegion event to know when to flip images
*/
Neemo.modules.Slideshow = function(neemo) {
  neemo.ui.Slideshow = {};
  neemo.ui.Slideshow.Engine = Class.extend(
    {
    init: function(bus, api) {
      var that = this;
      this._bus = bus;
      this._api = api;
      this._base_image_url = '/regions/';
      this._width  = 800;
      this._height = 600;
      this._speed  = 500;
      this._canvasid = 'region-focus-image';
      this._region = 1;
    },

    _bindEvents: function(){
      var that = this
      , bus = this._bus;
      bus.addHandler(
        'ChangeRegion',
        function(event){
          neemo.log.info('Change Region happened, I should flip images');
          that._region = event.getRegion();
          that._display.setNewFocus(that._base_image_url, event.getRegion());
        }
      );
      bus.addHandler(
        'RegionClick',
        function(event){
          neemo.log.info('Click Region happened');
        }
      );
    },
    _getClickOffset: function(e){
        var x;
        var y;
        if (e.pageX || e.pageY) { 
          x = e.pageX;
          y = e.pageY;
        }
        else { 
          x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
          y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
        } 
        var el = this._display.getElement(this._canvasid);
        x -= el[0].offsetLeft;
        y -= el[0].offsetTop;
        
        return [x,y];
    },
    _canvasClick: function(event){
      var x, y, c;
      c = this._getClickOffset(event);
      x = c[0]
      y = c[1]
      var lat = 90 - (180.0 * y)/this._height;
      var lon = -180 + (360.0 * x)/this._width;
      var data = {lat: lat, lon: lon, click_x: x, click_y: y};
      ///TODO method not implemented yet
      this._bus.fireEvent(new Neemo.env.events.RegionClick(data));
      //testing here, fireEvent(new Neemo.env.events.RegionClick({region: 2}))
    },
    
    _bindDisplay: function(display, text) {
      var that = this;
      this._display = display;
      display.setEngine(this);
      $('#' + this._canvasid).click(function(e){that._canvasClick(e)});
    },

    start: function() {
      this._bindDisplay(new neemo.ui.Slideshow.Display({width: this._width, height: this._height, speed: this._speed}));
      this._bindEvents();
    },
  }
  );

  /* Since each image in our slideshow is a region
  * I called this element a Region. As the user moves
  * these could be created and unlinked.
  * I would make a BackRegion and a ForeRegion for the surrounding
  */
  neemo.ui.Slideshow.ForeRegion = neemo.ui.Display.extend(
    {
    init: function(config) {
      this._id = 'region-slideshow-image';
      this._image = new Image();
      this._super(this._html());
      this._width  = config.width;
      this._height = config.height;
    },
    start: function(){
      this._cnvs = document.getElementById("region-focus-image");
      this._ctx = this._cnvs.getContext("2d");
    },
    change: function(base_image_url, region){
        var that = this;
        this._image_url = base_image_url + region + '.jpg';
        this._image.src = this._image_url;
        this._image.onload = function() {
            that._ctx.drawImage(that._image, 0, 0);
        }
    },
    _html: function() {
      return  '<div id="'+this._id+'" style="margin-top:200px;">' +
        '<canvas id="region-focus-image" width="'+this._width+'" height="'+this._height+'"></canvas>' +
          '</div>';
    }
  }
  );


  neemo.ui.Slideshow.FocusRegion = neemo.ui.Display.extend(
    {
    init: function(config) {
      this._id = 'region-slideshow-image';
      this._image = new Image();
      this._super(this._html());
      this._width  = config.width;
      this._height = config.height;
      this._speed  = config.speed;
    },
    start: function(){
      this._cnvs = document.getElementById("region-focus-image");
      this._ctx = this._cnvs.getContext("2d");
      $("#" + this._id).fadeIn(this._speed);
    },
    change: function(base_image_url, region){
      var that = this;
      this._image_url = base_image_url + region + '.jpg';
      this._image.src = this._image_url;
      this._image.onload = function() {
        that._ctx.drawImage(that._image, 0, 0);
      }
    },
    _html: function() {
      return  '<div id="'+this._id+'" style="display:none">' +
        '<canvas id="region-focus-image" width="'+this._width+'" height="'+this._height+'"></canvas>' +
          '</div>';
    }
  }
  );

  /**
  * The slideshow display.
  */
  neemo.ui.Slideshow.Display = neemo.ui.Display.extend(
    {
    init: function(config) {
      this._id = 'slideshow';
      this._super($('<div>').attr({'id': this._id}));
      $('body').append(this.getElement());
      this.setInnerHtml(this._html());

      this.Focus = new neemo.ui.Slideshow.FocusRegion(config);
      this.findChild('.focus').append(this.Focus);
      this.Focus.start();
    },
    setNewFocus: function(base_image_url, region){
      this.Focus.change(base_image_url, region);
    },
    _html: function(){
      return '<div>hi, i will grow up to be a slideshow' +
        '<div class="focus"></div>' +
          '</div>';
    }
  }
  );
}
