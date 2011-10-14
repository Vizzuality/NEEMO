function Scoreboard() {
  var args = Array.prototype.slice.call(arguments),
  callback = args.pop(),
  modules = (args[0] && typeof args[0] === "string") ? args : args[0],
  config,
  i;

  if (!(this instanceof Scoreboard)) {
    return new Scoreboard(modules, callback);
  }

  if (!modules || modules === '*') {
    modules = [];
    for (i in Scoreboard.modules) {
      if (Scoreboard.modules.hasOwnProperty(i)) {
        modules.push(i);
      }
    }
  }

  for (i = 0; i < modules.length; i += 1) {
    Scoreboard.modules[modules[i]](this);
  }

  callback(this);
  return this;
};

Scoreboard.modules = {};

Scoreboard.modules.app = function(scoreboard) {

  scoreboard.app = {};

  scoreboard.app.Instance = Class.extend(
    {
    init: function(config) {
      var region = 1;
      scoreboard.log.enabled = config ? config.logging: false;
      this._bus = new scoreboard.events.Bus();
      this.userrank = new scoreboard.ui.UserRank.Engine(this._bus, this._api);
      this.userrank.start();
      this.rankinglist = new scoreboard.ui.RankingList.Engine(this._bus, this._api);
      this.rankinglist.start();
      this.socket = new scoreboard.socket.Engine(this._bus);
    },

    run: function() {
      scoreboard.log.info('Scoreboard is now running!');
    },

    getBus: function() {
      return this._control.getBus();
    },
  }
  );
};

Scoreboard.modules.ui = function(scoreboard) {

  scoreboard.ui = {};

  /**
  * Interface for UI Engine classes.
  */
  scoreboard.ui.Engine = Class.extend(
    {
    /**
    * Starts the engine and provides a container for its display.
    *
    * @param container the container for the engine display
*/
    start: function(container) {
      throw scoreboard.exceptions.NotImplementedError;
    },
  }
  );
  /**
  * Base class for DOM elements.
*/
  scoreboard.ui.Element = Class.extend(
    {
    /**
    * Constructs a new Element from an element.
*/
    init: function(element) {
      if (!element) {
        element = '<div>';
      }
      this._element = $(element);
    },
    //TODO add all selector events etc here if we don't want
    //to be hooked to jquery specific. this might be a bit much.
    //if so we can just scope jquery and use it fully. what it is
    //nice for is swapping out jquery for another. used example,

    getElement: function() {
      return this._element;
    },
  }
  );
  /**
  * Base class for Displays.
*/
  scoreboard.ui.Display = scoreboard.ui.Element.extend(
    {
    /**
    * Constructs a new Display with the given DOM element.
*/
    init: function(element) {
      this._super(element);
    },

    /**
    * Sets the engine for this display.
    *
    * @param engine a mol.ui.Engine subclass
*/
    setEngine: function(engine) {
      this._engine = engine;
    }
  }
  );
};

Scoreboard.modules.socket = function(scoreboard) {
  scoreboard.socket = {};
  scoreboard.socket.Engine = Class.extend(
    {
    init: function(bus) {
      this._bus = bus;
      this.socket = io.connect(window.location.origin + '/scoreboard');
      //this._bindEvents();
      this._setupSockets();
      this._cookie = document.cookie.split('; ');
      for (i in this._cookie){
          var tmp = this._cookie[i].split('=');
          if (tmp[0]=='socketAuth'){
              this._socketAuth = tmp[1];
          } else if (tmp[0]=='neemoUser'){
              this._username = tmp[1];
          }
      }

    },
    _setupSockets: function(){
      var that = this;
      this.socket.on('connect', function (client) {
        that.socket.send(JSON.stringify({auth: that._socketAuth, username: that._username}));
        scoreboard.log.info('soccket connected!');
        that.socket.emit('join', {page: 1} );
      });
      this.socket.on('user-ranking',function(data){
        scoreboard.log.info('user ranking data recieved!');
        that._bus.fireEvent(new scoreboard.events.UpdateUserRank(data));
      });
      this.socket.on('scoreboard-update',function(data){
        //{"time":0.002,"total_rows":4,"rows":[{"user_id":"unknooooown","user_rank":4,"user_lvl":1},{"user_id":"anon","user_rank":3,"user_lvl":2},{"user_id":"capndave","user_rank":2,"user_lvl":4},{"user_id":"andrewxhill","user_rank":1,"user_lvl":11}]}
        scoreboard.log.info('new rankings!');
        that._bus.fireEvent(new scoreboard.events.UpdateRankingList(data, that._username));
      });
    },
    _bindEvents: function(){
      var that = this,
      bus = this._bus;
      /* send the new click data to server */
      bus.addHandler(
        'FormSubmit',
        function(event){
          scoreboard.log.info('form recieved');
          var data = event.getData();
          data.id = that._id;
          data.region = that.region;
          that.socket.emit('poi', data);
        }
      );

    /*
    * Change the socket 'room' we are listening to when the region changes
    */
      bus.addHandler(
        'ChangeRegion',
        function(event){
          scoreboard.log.info('region changed from '+that.region+' to '+event.getRegion());
          that.socket.emit('leave', {region: that.region});
          that.region = event.getRegion();
          that.socket.emit('join', {region: that.region} );
        }
      );
    },
  }
  );
};

Scoreboard.modules.UserRank = function(scoreboard) {
  scoreboard.ui.UserRank = {};
  scoreboard.ui.UserRank.Engine = Class.extend(
    {
    init: function(bus, region) {
      var that = this;
      this._bus = bus;
    },
    _bindDisplay: function(display, text) {
      var that = this;
      this._display = display;
      display.setEngine(this);
    },

    _bindEvents: function(){
      var that = this
      , bus = this._bus;

      bus.addHandler(
        'UpdateUserRank',
        function(data){
          data = data.getData();
          var strString = '' + data.user_rank;
          while(strString.length<4){
            strString = '0' + strString;
          }
          that._display.getRank().text('#' + strString);
          that._display.bindUserRankLink(data.user_id);
        }
      );

    },
    start: function() {
      this._bindDisplay(new scoreboard.ui.UserRank.Display({ }));
      this._bindEvents();
    },
  }
  );
  /**
  * The userrank display.
  */
  scoreboard.ui.UserRank.Display = scoreboard.ui.Display.extend(
    /* Provides the slideshow wrapper, append, prepend, and remove options */
    {
      init: function(config) {
        this.config = config;
        this._super(this._html());
        $('#rank-box').append(this.getElement());
        this._rank = null;
      },
      bindUserRankLink:function(user_id) {
        $("#rank-box .footer a").click(function() {
          $("html, body").animate({scrollTop:$("#"+user_id).offset().top}, 500);
        });
      },
      getRank: function(){
        if (! this._rank){
          this._rank = $(this.getElement()).find('.score');
        }
        return this._rank;
      },
      _html: function() {
        return  '<div class="header">' +
          '<div class="icon trophee"></div>' +
            '<span class="title">Your rank</span>' +
              '<div class="line-through">' +
                '  <div class="score">not avail.</div>' +
                  '   <div class="line"></div>' +
                    '</div>' +
                      '</div>' +
                        '<div class="footer">' +
                          '  <a href="#">VIEW YOUR POSITION</a>' +
                            '</div>';
      }
    }
  );
}

Scoreboard.modules.RankingList = function(scoreboard) {
  scoreboard.ui.RankingList = {};
  scoreboard.ui.RankingList.Engine = Class.extend(
    {
    init: function(bus, region) {
      var that = this;
      this._bus = bus;
    },
    _bindDisplay: function(display, text) {
      var that = this;
      this._display = display;
      display.setEngine(this);
    },
    _bindEvents: function(){
      var that = this
      , bus = this._bus;

      bus.addHandler(
        'UpdateRankingList',
        function(input){
          var data = input.getData()
          username = input.getUser();
          $(that._display.getElement()).empty();

          for (i in data.rows){

            var u = new scoreboard.ui.RankingList.User();

            u.getRankName().text(data.rows[i].user_rank + "#. "+data.rows[i].user_id.toUpperCase());
            u.getScore().text(data.rows[i].user_score + " [LVL."+data.rows[i].user_lvl+"]");
            u.getElement().attr("id", data.rows[i].user_id);

            u.getProgress().css({width: 0});

            var progress = data.rows[i].user_progress;

            // A progress smaller than 1.3 looks bad, so we fix it
            progress = (progress < 1.3 && progress > 0) ?  1.3 : progress;

            u.getProgress().animate({width: progress + "%"}, 300, 'easeOutQuad');

            if(username.toUpperCase() == data.rows[i].user_id.toUpperCase() ){
              u.getElement().append('<div class="icon-container">' +
                                    '<div class="icon trophee"></div>' +
                                      '</div>');
              u.getElement().addClass('selected');
            }
            $(that._display.getElement()).append(u.getElement());
          }
        }
      );

    },
    start: function() {
      this._bindDisplay(new scoreboard.ui.RankingList.Display({ }));
      this._bindEvents();
    },
  }
  );
  scoreboard.ui.RankingList.User = scoreboard.ui.Display.extend(
    {
    init: function(bus) {
      this._super(this._html());
    },
    getRankName: function(){
      return $(this.getElement()).find('.rank_name');
    },
    getScore: function(){
      return $(this.getElement()).find('.score');
    },
    getProgress: function(){
      return $(this.getElement()).find('.progress');
    },
    _html: function() {
      return  '<li>' +
        '  <h2 class="rank_name">1#. STUART_LYNN</h2> <div class="score">17,312 [LVL.3]</div>' +
          '  <div class="progress-bar">' +
            '    <div class="progress" style="width:99.7%"></div>' +
              '  </div>' +
                '</li>';
    }
  }
  );
  /**
  * The slideshow display.
  */
  scoreboard.ui.RankingList.Display = scoreboard.ui.Display.extend(
      /* Provides the slideshow wrapper, append, prepend, and remove options */
    {
      init: function(config) {
        this.config = config;
        this._super($("#ranking ul"));
      },
    }
  );
}


/**
 * Logging module that writes log messages to the console and to the Speed
 * Tracer API. It contains convenience methods for info(), warn(), error(),
 * and todo().
 *
*/
Scoreboard.modules.log = function(scoreboard) {
  scoreboard.log = {};

  scoreboard.log.info = function(msg) {
    scoreboard.log._write('INFO: ' + msg);
  };

  scoreboard.log.warn = function(msg) {
    scoreboard.log._write('WARN: ' + msg);
  };

  scoreboard.log.error = function(msg) {
    scoreboard.log._write('ERROR: ' + msg);
  };

  scoreboard.log.todo = function(msg) {
    scoreboard.log._write('TODO: '+ msg);
  };

  scoreboard.log._write = function(msg) {
    var logger = window.console;
    if (scoreboard.log.enabled) {
      if (logger && logger.markTimeline) {
        logger.markTimeline(msg);
      }
      console.log(msg);
    }
  };
};
/**
* Exceptions module for handling exceptions.
*/
Scoreboard.modules.exceptions = function(scoreboard) {
  scoreboard.exceptions = {};

  scoreboard.exceptions.Error = Class.extend(
    {
    init: function(msg) {
      this._msg = msg;
    },

    getMessage: function() {
      return this._msg;
    }
  }
  );

  scoreboard.exceptions.NotImplementedError = scoreboard.exceptions.Error.extend(
  );

  scoreboard.exceptions.IllegalArgumentException = scoreboard.exceptions.Error.extend(
  );
};

/**
* Events module for working with application events. Contains a Bus object that
 * is used to bind event handlers and to trigger events.
*/
Scoreboard.modules.events = function(scoreboard) {
  scoreboard.events = {};

  /**
     * Base class for events. Events can be fired on the event bus.
*/
  scoreboard.events.Event = Class.extend(
    {
    /**
    * Constructs a new event.
    *
    * @param type the type of event
*/
    init: function(type, action) {
      var IllegalArgumentException = scoreboard.exceptions.IllegalArgumentException;
      if (!type) {
        throw IllegalArgumentException;
      }
      this._type = type;
      this._action = action;
    },

    /**
    * Gets the event type.
    *
    * @return the event type string
*/
    getType: function() {
      return this._type;
    },

    /**
    * Gets the action.
    *
    * @return action
*/
    getAction: function() {
      return this._action;
    }
  }
  );

  /**
  * User Rank update event.
*/
  scoreboard.events.UpdateUserRank = scoreboard.events.Event.extend(
    {
    init: function(data, action) {
      this._super('UpdateUserRank', action);
      this._data = data;
    },

    getData: function() {
      return this._data;
    },
  }
  );
  scoreboard.events.UpdateUserRank.TYPE = 'update_user_rank';
  /**
  * Score list update event.
  */
  scoreboard.events.UpdateRankingList = scoreboard.events.Event.extend(
    {
    init: function(data, username, action) {
      this._super('UpdateRankingList', action);
      this._data = data;
      this._username = username;
    },

    getData: function() {
      return this._data;
    },
    getUser: function() {
      return this._username;
    },
  }
  );
  scoreboard.events.UpdateRankingList.TYPE = 'update_ranking_list';
  /**
  * The event bus.
*/
  scoreboard.events.Bus = function() {
    if (!(this instanceof scoreboard.events.Bus)) {
      return new scoreboard.events.Bus();
    }
    _.extend(this, Backbone.Events);

    /**
    * Fires an event on the event bus.
    *
    * @param event the event to fire
*/
    this.fireEvent = function(event) {
      this.trigger(event.getType(), event);
    };

    /**
    * Adds an event handler for an event type.
    *
    * @param type the event type
    * @param handler the event handler callback function
*/
    this.addHandler = function(type, handler) {
      this.bind(
        type,
        function(event) {
          handler(event);
        }
      );
    };
    return this;
  };
};

