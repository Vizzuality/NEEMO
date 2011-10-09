function Neemo() {
  var args = Array.prototype.slice.call(arguments),
  callback = args.pop(),
  modules = (args[0] && typeof args[0] === "string") ? args : args[0],
  config,
  i;

  if (!(this instanceof Neemo)) {
    return new Neemo(modules, callback);
  }

  if (!modules || modules === '*') {
    modules = [];
    for (i in Neemo.modules) {
      if (Neemo.modules.hasOwnProperty(i)) {
        modules.push(i);
      }
    }
  }

  for (i = 0; i < modules.length; i += 1) {
    Neemo.modules[modules[i]](this);
  }

  callback(this);
  return this;
};

Neemo.modules = {};

Neemo.modules.app = function(neemo) {

  neemo.app = {};

  neemo.app.Instance = Class.extend(
    {
    init: function(config) {
      this._region = -1;
      neemo.log.enabled = config ? config.logging: false;
      this._bus = new neemo.events.Bus();
      //this.ui = new neemo.ui.Engine(config, this._bus);
      this._api = config.api || new neemo.ajax.Api(this._bus);
      //this.map = new neemo.ui.Map.Engine(config, this._bus, this._api, config.region);
      //this.map.start();
      this.userprofile = new neemo.ui.UserProfile.Engine(this._bus, this._api);
      this.userprofile.start();
      this.datalayer = new neemo.ui.DataLayer.Engine(this._bus, this._api);
      this.datalayer.start();
      this.slideshow = new neemo.ui.Slideshow.Engine(this._bus, this._api, config.region);
      this.slideshow.start();
      this.socket = new neemo.socket.Engine(this._bus);
      
    },

    run: function() {
      neemo.log.info('App is now running!');
    },

    getBus: function() {
      return this._control.getBus();
    },
  }
  );
};

Neemo.modules.socket = function(neemo) {
  neemo.socket = {};
  neemo.socket.Engine = Class.extend(
    {
    init: function(bus) {
      this._id = null;
      this.region = -1;
      this.intRegion=-1;
      this.track = 1;
      this._bus = bus;
      this.socket = io.connect();
      this._bindEvents();
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
      
      this._first = true;
      this._tracks =  window.tracks;
    },
    _setupSockets: function(){
      var that = this;
      this.socket.on('connect', function () {
        neemo.log.info('soccket connected!');
        that.socket.send(JSON.stringify({auth: that._socketAuth, username: that._username}));
      });
      this.socket.on('user-metadata',function(data){
        neemo.log.info('recieved user profile for: ' + data.user_id);
        that._id = data.user_id;
        if (that._first) {
            that._bus.fireEvent(new Neemo.env.events.UpdateUserProfile(data));
        }
        if (that.region==-1){
            that.region == data.region;
            that.intRegion = window.tracks[1].indexOf(data.region);
            that._bus.fireEvent(new neemo.events.ChangeRegion({region: that.intRegion}));
        }
      });
      this.socket.on('region-metadata', function (data) {
         neemo.log.info('socket metadata received');
         //data.region = window.tracks[1].indexOf(data.region);
         data.region = that.intRegion;
         that._bus.fireEvent(new Neemo.env.events.RegionOverview(data));
      });
      this.socket.on('region-new-data', function (data) {
        if(data.region == that.region){
            if (data.username == that._username){
                data.mine = true;
            }
            data.region = that.intRegion;
            that._bus.fireEvent(new Neemo.env.events.AddPoints(data));
        }
        //neemo.log.info('socket update received');
       });
    },
    _bindEvents: function(){
      var that = this,
      bus = this._bus;
      /* send the new click data to server */
      bus.addHandler(
        'SubmitData',
        function(event){
          neemo.log.info('data recieved');
          var data = event.getData();
          data.region = that.region;
          data.username = that._username;
          data.auth = that._socketAuth;
          that.socket.emit('submit-data', data);
          that._bus.fireEvent(new Neemo.env.events.PointNotice({
              title: "you have found a new "+data.category+" occurence",
              points: 3
          }));
        }
      );

      /*
      * Change the socket 'room' we are listening to when the region changes
      */
      bus.addHandler(
        'ChangeRegion',
        function(event){
          neemo.log.info('region changed from '+that.region+' to '+event.getRegion());
          that.socket.emit('leave', {region: that.region});
          that.intRegion = event.getRegion();
          that.region = window.tracks[1][that.intRegion];
          that.socket.emit('join', {region: that.region, track: that.track, username: that._username, auth: that.auth} );
        }
      );
      /*
      * Handle up/down votes
      */
      bus.addHandler(
        'Vote',
        function(event){
          var data = event.getData();
          neemo.log.info('User voted on '+data.key);
          data.username = that._username;
          data.auth = that._socketAuth;
          that.socket.emit('submit-vote', data);
          if (data.type=='upvote'){
              that._bus.fireEvent(new Neemo.env.events.PointNotice({
                  title: "you upvoted an existing identification",
                  points: 1
              }));
          } else if (data.type=='downvote'){
              that._bus.fireEvent(new Neemo.env.events.PointNotice({
                  title: "you downvoted an existing identification",
                  points: -4
              }));
          }
        }
      );
    },
  }
  );
};

Neemo.modules.ui = function(neemo) {

  neemo.ui = {};

  /**
  * Interface for UI Engine classes.
  */
  neemo.ui.Engine = Class.extend(
    {
    /**
    * Starts the engine and provides a container for its display.
    *
    * @param container the container for the engine display
    */
    start: function(container) {
      throw neemo.exceptions.NotImplementedError;
    },
  }
  );
  /**
  * Base class for DOM elements.
  */
  neemo.ui.Element = Class.extend(
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
  neemo.ui.Display = neemo.ui.Element.extend(
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
/**
 * AJAX module for communicating with the server.
*/
Neemo.modules.ajax = function(neemo) {
  neemo.ajax = {};

  /**
  * Action.
  */
  neemo.ajax.Action = Class.extend(
    {
    init: function(name, type, params) {
      this.name = name;
      this.type = type;
      this.params = params || {};
    },

    getName: function() {
      return this.name;
    },

    getType: function() {
      return this.type;
    },

    getParams: function() {
      return this.params;
    }
  }
  );

  /**
  * ActionCallback.
  */
  neemo.ajax.ActionCallback = Class.extend(
    {
    init: function(success) {
      this._success = success;
    },

    /**
    * @param actionResponse - the neemo.ajax.ActionResponse for the action
    */
    onSuccess: function(actionResponse) {
      this._success(actionResponse);
    }
  }
  );

  /**
  * The AJAX API.
  */
  neemo.ajax.Api = Class.extend(
    {
    /**
    * Constructs a new Api object with an event bus.
    *
    * @param bus neemo.events.Bus
    * @constructor
    */
    init: function(bus) {
      this._bus = bus;
    },

    /**
    * Executes an action asynchronously.
    *
    * @param action the neemo.ajax.Action
    * @param callback the neemo.ajax. ActionCallback
    */
    execute: function(query, callback ) {
      var self = this
      , req;
      req = $.getJSON('http://andrew.cartodb.com/api/v1/sql?format=geojson&q='+query+'&callback=?',
                      function(res){callback.onSuccess(res)});
    }
  }
  );
};

/**
 * Logging module that writes log messages to the console and to the Speed
 * Tracer API. It contains convenience methods for info(), warn(), error(),
 * and todo().
 *
*/
Neemo.modules.log = function(neemo) {
  neemo.log = {};

  neemo.log.info = function(msg) {
    neemo.log._write('INFO: ' + msg);
  };

  neemo.log.warn = function(msg) {
    neemo.log._write('WARN: ' + msg);
  };

  neemo.log.error = function(msg) {
    neemo.log._write('ERROR: ' + msg);
  };

  neemo.log.todo = function(msg) {
    neemo.log._write('TODO: '+ msg);
  };

  neemo.log._write = function(msg) {
    var logger = window.console;
    if (neemo.log.enabled) {
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
Neemo.modules.exceptions = function(neemo) {
  neemo.exceptions = {};

  neemo.exceptions.Error = Class.extend(
    {
    init: function(msg) {
      this._msg = msg;
    },

    getMessage: function() {
      return this._msg;
    }
  }
  );

  neemo.exceptions.NotImplementedError = neemo.exceptions.Error.extend(
  );

  neemo.exceptions.IllegalArgumentException = neemo.exceptions.Error.extend(
  );
};

