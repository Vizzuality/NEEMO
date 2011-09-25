
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
                this.ui = new neemo.ui.Engine(config, this._bus);
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
                this._id = -1;
                this._bus = bus;
                this.region = 1;
                this.socket = io.connect();
                this._setupSockets();
                this._bindEvents();
            },
            _setupSockets: function(){
                var that = this;
                this.socket.on('connect', function () {
                                    neemo.log.info('soccket connected!');
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
                //TODO allow for changine region id through event bus
                this.socket.emit('join', {region: 1} );
                
            },
            _bindEvents: function(){
                var that = this,
                    bus = this._bus;
                bus.addHandler(
                    'MapClick',
                    function(event){
                        neemo.log.info('map click recieved');
                        var data = {lat: event.getLat(), 
                                    lon: event.getLon(), 
                                    region: 1, 
                                    title: 'test click',
                                    category: 'tests',
                                    type: 'click',
                                    id: that._id,
                                    notes: 'delete this row' } 
                        that._bus.fireEvent(new Neemo.env.events.AddPoint(data));
                        that.socket.emit('poi', data);
                    }
                );
                
            },
        }
    );
};

Neemo.modules.ui = function(neemo) {
    neemo.ui = {};
    neemo.ui.Engine = Class.extend(
        {
            init: function(config, bus) {
                var that = this;
                this._bus = bus;
                neemo.ui.markersArray = new Array();
                neemo.ui.map = new google.maps.Map(document.getElementById(config.container), config.mapOptions);
                google.maps.event.addListener(neemo.ui.map, 'click', function(event) {
                    neemo.log.info('map click');
                    that._bus.fireEvent(new Neemo.env.events.MapClick(event));
                    //console.log(event);
                });
                
                this._bindEvents();
            },
            _bindEvents: function(){
                var bus = this._bus;
                
                bus.addHandler(
                    'AddPoint',
                    function(event){
                        neemo.log.info('map click recieved');
                        marker = new google.maps.Marker({
                            position: new google.maps.LatLng(event.getLat(),event.getLon()),
                            map: neemo.ui.map
                        });
                        neemo.ui.markersArray.push(marker);
                    }
                );
                
            },
        }
    );
};



/**
 * Events module for working with application events. Contains a Bus object that
 * is used to bind event handlers and to trigger events.
 */
Neemo.modules.events = function(neemo) {
    neemo.events = {};
     
    /**
     * Base class for events. Events can be fired on the event bus.
     */
    neemo.events.Event = Class.extend(
        {
            /**
             * Constructs a new event.
             * 
             * @param type the type of event
             */
            init: function(type, action) {
                var IllegalArgumentException = neemo.exceptions.IllegalArgumentException;
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
     * Click event.
     */
    neemo.events.MapClick = neemo.events.Event.extend(
        {
            init: function(location, action) {
                this._super('MapClick', action);
                this._location = location;
                this._latLng = location.latLng;
            },
 
            getLocation: function() {
                return this._location;
            },
 
            getLat: function() {
                return this._latLng.lat();
            },
 
            getLon: function() {
                return this._latLng.lng();
            }
        }
    );
    neemo.events.MapClick.TYPE = 'map_click';
    
    /**
     * Add point event.
     */
    neemo.events.AddPoint = neemo.events.Event.extend(
        {
            init: function(data, action) {
                this._super('AddPoint', action);
                this._data = data;
                console.log(data);
            },
 
            getPoint: function() {
                return this._data;
            },
 
            getLat: function() {
                return this._data.lat;
            },
            
            getLon: function() {
                return this._data.lon;
            }
        }
    );
    neemo.events.AddPoint.TYPE = 'add_point';
    /**
     * The event bus.
     */
    neemo.events.Bus = function() {
        if (!(this instanceof neemo.events.Bus)) {
            return new neemo.events.Bus();
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

