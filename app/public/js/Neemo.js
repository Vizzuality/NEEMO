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
      neemo.log.enabled = config ? config.logging: false;
      this._bus = new neemo.events.Bus();
      neemo.config = config;
      //this.ui = new neemo.ui.Engine(config, this._bus);
      this._api = config.api || new neemo.ajax.Api(this._bus);
      //this.map = new neemo.ui.Map.Engine(config, this._bus, this._api, config.region);
      //this.map.start();
      this.form = new neemo.ui.Form.Engine(this._bus, this._api);
      this.form.start();
      this.slideshow = new neemo.ui.Slideshow.Engine(this._bus, this._api);
      this.slideshow.start();
      this.socket = new neemo.socket.Engine(this._bus, config.region);
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
    init: function(bus, region) {
      this._id = -1;
      this._bus = bus;
      this.region = null;
      this.socket = io.connect();
      this._bindEvents();
      this._setupSockets();
    },
    _setupSockets: function(){
      var that = this;
      this.socket.on('connect', function () {
        neemo.log.info('soccket connected!');
        //TODO allow for changine region id through event bus
        if (that.region === null) {
          that.region = 1;
          //tell everyone that we are at a new region, 1
          that._bus.fireEvent(new Neemo.env.events.ChangeRegion({region: that.region}));
        }
      });
      this.socket.on('message',function(data){
        that._id = data;
      });
      this.socket.on('update', function (data) {
        if(data.id != that._id){
          that._bus.fireEvent(new Neemo.env.events.AddPoint(data));
        }
        neemo.log.info('socket update received');
      }, this);
    },
    _bindEvents: function(){
      var that = this,
      bus = this._bus;
      /* send the new click data to server */
      bus.addHandler(
        'FormSubmit',
        function(event){
          neemo.log.info('form recieved');
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
          neemo.log.info('region changed from '+that.region+' to '+event.getRegion());
          that.socket.emit('leave', {region: that.region});
          that.region = event.getRegion();
          that.socket.emit('join', {region: that.region} );
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

