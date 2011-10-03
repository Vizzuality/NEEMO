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
      this.width  = 800;
      this.height = 600;
      this.speed  = 500;
      this.i = 0;
      this.margin = -196;
      this.moving = false;
      this.easingMethod = 'easeInExpo';
      this.numberOfRegions = 5;
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
          var old_region = that._region;
          that._region = event.getRegion();

          $("#slideshow div.selected").removeClass("selected");

          var url = [that._base_image_url, event.getRegion(), '.jpg'].join('');
          if (old_region < that._region){
              that._display.scrollForward(url, event.getRegion());
          }else{
              that._display.scrollBack(url, event.getRegion());
          }
        }
      );
      bus.addHandler(
        'RegionClick',
        function(event){
          neemo.log.info('Click Region happened');
        }
      );
      this._nav.getNextButton().click(function(){
          that._bus.fireEvent(new Neemo.env.events.ChangeRegion({region: that._region + 1}));
        }
      );
      this._nav.getPreviousButton().click(function(){
          that._bus.fireEvent(new Neemo.env.events.ChangeRegion({region: that._region - 1}));
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
      //$('#' + this._canvasid).click(function(e){that._canvasClick(e)});
    },
    _bindNav: function(nav) {
      var that = this;
      this._nav = nav;
      nav.setEngine(this);
      //$('#' + this._canvasid).click(function(e){that._canvasClick(e)});
    },

    start: function() {
      this._bindDisplay(new neemo.ui.Slideshow.Display({
            width: this.width,
            height: this.height,
            speed: this.speed,
            i: this.i,
            margin: this.margin,
            moving: this.moving,
            easingMethod: this.easingMethod,
            numberOfRegions: this.numberOfRegions,
        }));
      ///NEXT 3 ADDS ARE FOR TESTING
      var url = [this._base_image_url, 1, '.jpg'].join('');
      this._display.addRegion(url, 1);
      var url = [this._base_image_url, 2, '.jpg'].join('');
      this._display.addRegion(url, 2);
      var url = [this._base_image_url, 3, '.jpg'].join('');
      this._display.addRegion(url, 3);

      this._bindNav(new neemo.ui.Slideshow.Nav());
      this._bindEvents();
    },
  }
  );
  neemo.ui.Slideshow.Region = neemo.ui.Display.extend(
    {
    init: function(url) {
      this._image = new Image();
      this._image.src = url;
      this._super(this._html());
      $(this.getElement()).find('.photo').append(this._image);
    },
    start: function(url){
      var that = this;
      this._image.onload = function() {
      }
      //this._cnvs = document.getElementById("region-focus-image");
      //this._ctx = this._cnvs.getContext("2d");
      //$("#" + this._id).fadeIn(this._speed);
    },
    focus: function(){
        $(this.getElement()).addClass('selected');
    },

    _html: function() {
      return  '<div class="image">' +
                '<div class="photo"></div>' +
                '<aside></aside>' +
               '</div>';
    }
  }
  );

  neemo.ui.Slideshow.Nav = neemo.ui.Display.extend(
    {
    init: function() {
      this._super($('<nav>'));
      this.getElement().html(this._html());
      $('body').append(this.getElement());
      this._next;
      this._previous;
    },
    getNextButton: function(){
        if (! this._next){
            this._next = $(this.getElement()[0]).find('#next');
        }
        return this._next;
    },
    getPreviousButton: function(){
        if(! this._previous){
            this._previous = $(this.getElement()).find('#previous');
        }
        return this._previous;
    },
    _html: function() {
      return  '<a href="#" id="previous">Previous</a>' +
                    '<a href="#" id="next">Next</a>';
    }
  }
  );

  /**
  * The slideshow display.
  */
  neemo.ui.Slideshow.Display = neemo.ui.Display.extend(
    {
    init: function(config) {
      this.config = config;
      this._id = 'slideshow';
      this._super($('<div>').attr({'id': this._id}));
      $('#container').append(this.getElement());
      this._regions = {};
      this._first = true;
      //this.setInnerHtml(this._html());
    },
    addRegion: function(url, id){
      if (!(id in this._regions)) {
          var Region = new neemo.ui.Slideshow.Region(url);
          $(this.getElement()).append($(Region.getElement()));
          Region.start();
          this._regions[id] = Region;
      }
    },
    _hideAside: function(callback) {
      $("#slideshow div.selected aside").animate({opactiy:0, right:"100px"}, 250, function() {
        $(this).animate({height:300}, 0, callback);
        $(this).hide();
      });
    },
    scrollForward: function(url, id){
      var that = this;
      if (!(id in this._regions)){
          this.addRegion(url, id);
      }
      this._regions[id].focus();
      if(this._first === false){
          this._hideAside(this._forward);
      } else {
          this._first = false;
      }
    },
    _forward: function(){
      var that = this;
      $("#container").scrollTo("+="+(this.config.width/2 + this.config.margin) +"px", {duration:250, easing:this.config.easingMethod, onAfter: function() {
        moving = false;
        that._showAside();
        //showAside();
      }});
    },
    scrollBack: function(url, id){
        var that = this;
        this._hideAside(this.back);
      },
    _back: function(){
        var that = this;
        if (!this.config.moving) {
            this.config.moving = true;
            $("#container").scrollTo("-="+(this.config.width/2 + this.config.margin) +"px", {duration:250, easing:this.config.easingMethod, onAfter: function() {
                moving = false;
                that._showAside();
            }});
        }
    },
     _showAside: function() {
      $("#slideshow div.selected aside").css({height:"400px", right:"100px"});

      $("#slideshow div.selected aside").show(0, function() {
        $("#slideshow div.selected aside").delay(200).animate({opacity:1, right:"-100px"}, 250);
      });
    },

    _hideAside: function(callback) {
      $("#slideshow div.selected aside").animate({opactiy:0, right:"100px"}, 250, function() {
        $(this).animate({height:300}, 0, callback);
        $(this).hide();
      });
    },

  }
  );
}
