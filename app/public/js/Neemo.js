
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
                this.map = new neemo.ui.Map.Engine(config, this._bus, this._api, config.region);
                this.map.start();
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
            append: function(widget) {
                this._element.append(widget.getElement());
            },
            find: function(id) {
                var res = new Array();
                this._element.find(id).each(function(c,v){
                    res.push(new neemo.ui.Element(v));
                });
                return res;
            },
            findChild: function(identfier){
                return new neemo.ui.Element(this._element.find(identfier));
            },
            getElement: function() {
                return this._element;
            },
            setInnerHtml: function(html) {
                this._element.html(html);
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

Neemo.modules.socket = function(neemo) {
    neemo.socket = {};
    neemo.socket.Engine = Class.extend(
        {
            init: function(bus, region) {
                this._id = -1;
                this._bus = bus;
                this.region = region;
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
                this.socket.emit('join', {region: this.region} );
                
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
                        data.region =that.region;
                        that.socket.emit('poi', data);
                    }
                );
                /* Change the socket 'room' we are listening to when the region changes
                 * 
                 */
                bus.addHandler(
                    'ChangeRegion',
                    function(event){
                        that.socket.emit('leave', {region: that.region});
                        that.region = event.getRegion();
                        that.socket.emit('join', {region: that.region} );
                    }
                );
                
            },
        }
    );
};
/* Handles the form object for adding information to clicks
 * Not filled in with any display elements yet, so it simply
 * transforms the click event into a dummy form submit object (data)
 * and triggers the FormSubmit event so it will be put on the map
 * and transmitted
 */
Neemo.modules.Form = function(neemo) {
    neemo.ui.Form = {};
    neemo.ui.Form.Engine = Class.extend(
        {
            init: function(bus, api) {
                var that = this;
                this._bus = bus;
                this._api = api;
                
                this._bindEvents();
            },
            
            _bindEvents: function(){
                var that = this
                   , bus = this._bus;
                
                bus.addHandler(
                    'MapClick',
                    function(event){
                        neemo.log.info('map click recieved');
                        var data = {lat: event.getLat(), 
                                    lon: event.getLon(), 
                                    title: 'test click',
                                    category: 'tests',
                                    type: 'click',
                                    notes: 'delete this row' } 
                        that._bus.fireEvent(new Neemo.env.events.AddPoint(data));
                        that._bus.fireEvent(new Neemo.env.events.FormSubmit(data));
                    }
                );
            },
            
            /**
             * Binds the display.
             */
            _bindDisplay: function(display, text) {                
                var self = this;
                this._display = display;
                display.setEngine(this);            
            },
            
            start: function() {
                this._bindDisplay(new neemo.ui.Form.Display());
            },
        }
    );
    /**
     * The Form display.
     */
    neemo.ui.Form.Display = neemo.ui.Display.extend(
        {
            init: function(config) {
                this._super();
                this.setInnerHtml(this._html());
            },  
            _html: function(){
                return "<div>hi, i'll grow up to be a form</div>";
            }
        }
    );
}
            
           
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
                this._bindEvents();
            },
            
            _bindEvents: function(){
                var that = this
                   , bus = this._bus;
                
                bus.addHandler(
                    'ChangeRegion',
                    function(event){
                        neemo.log.info('Change Region happened, I should flip images');
                    }
                );
            },
            
            _bindDisplay: function(display, text) {                
                var self = this;
                this._display = display;
                display.setEngine(this);            
            },
            
            start: function() {
                this._bindDisplay(new neemo.ui.Slideshow.Display());
            },
        }
    );
    /* Since each image in our slideshow is a region
     * I called this element a Region. As the user moves
     * these could be created and unlinked.
     * I would make a BackRegion and a ForeRegion for the surrounding
     */
    neemo.ui.Slideshow.FocusRegion = neemo.ui.Display.extend(

        {
            init: function(base_image_url, region) {
                this._image_url = image_url;
                this._super(this._html());
            },
            _html: function() {
                return  '<div class="region-slideshow-image">' +
                        '    <img src="' + this._image_url + '" />' +
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
                this._super();
                this.setInnerHtml(this._html());
            },  
            setNewFocus: function(base_image_url, region){
                var Focus = neemo.ui.Slideshow.FocusRegion,
                    r = new Focus(base_image_url, region);
                this.findChild('.focus').append(r);
                return r;
            },      
            _html: function(){
                return '<div>hi, i will grow up to be a slideshow' +
                            '<div class="focus"></div>' +
                        '</div>';
            }
        }
    );
}
            
            
/* Handles the map object. Also listens for placemark add events and
 * draws them to the map.
 */
Neemo.modules.Map = function(neemo) {
    neemo.ui.Map = {};
    neemo.ui.Map.Engine = Class.extend(
        {
            init: function(config, bus, api, region) {
                var that = this;
                this._bus = bus;
                this._api = api;
                neemo.ui.Map.region = region;
                neemo.ui.Map.map = new google.maps.Map(document.getElementById(config.container), config.mapOptions);
                google.maps.event.addListener(neemo.ui.Map.map, 'click', function(event) {
                    neemo.log.info('map click');
                    that._bus.fireEvent(new Neemo.env.events.MapClick(event));
                });
                
                this._bindEvents();
            },
            _bindEvents: function(){
                var that = this
                   , bus = this._bus;
                
                bus.addHandler(
                    'AddPoint',
                    function(event){;
                        that._drawPlacemark({lat: event.getLat(), lng: event.getLon()})
                    }
                );
                bus.addHandler(
                    'ChangeRegion',
                    function(event){;
                        neemo.ui.Map.region = event.getRegion();
                        //TODO, redraw map based on new region bbox. 
                        //      release old points
                        //      query new points
                    }
                );
                
            },
            
            _drawPlacemark: function(data){
                marker = new google.maps.Marker({
                    position: new google.maps.LatLng(data.lat, data.lng),
                    map: neemo.ui.Map.map
                });
                neemo.ui.Map.markersArray.push(marker);
            },
            updateRegion: function() {
                throw neemo.exceptions.NotImplementedError;
            },
            start: function() {
                var  that = this
                   , api = this._api
                   , PointLayer = neemo.ajax.PointLayer
                   , query
                   , callback;
                neemo.ui.Map.markersArray = new Array();
                neemo.ui.Map.drawPlacemark = this._drawPlacemark;
                /* Add existing points to the map
                 * Based on the current region of the user
                 */
                query = 'SELECT * FROM neemo WHERE region='+neemo.ui.Map.region;
                callback = new this._pointLayerCallback;
                api.execute(query, callback);  
            },
            _pointLayerCallback: function() {
                var  ActionCallback = neemo.ajax.ActionCallback
                   , that = this;
                return new ActionCallback(
                    function(response) {
                        for (r in response.features){
                            neemo.ui.Map.drawPlacemark({
                                lng: response.features[r]['geometry']['coordinates'][0],
                                lat: response.features[r]['geometry']['coordinates'][1]
                            })
                        }
                    }
                );
            },
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
     * Change Region event.
     */
    neemo.events.ChangeRegion = neemo.events.Event.extend(
        {
            init: function(region, action) {
                this._super('ChangeRegion', action);
                this._region = region;
            },
 
            getRegion: function() {
                return this._region;
            }
        }
    );
    neemo.events.MapClick.TYPE = 'change_region';
    
    /**
     * Add point event.
     */
    neemo.events.AddPoint = neemo.events.Event.extend(
        {
            init: function(data, action) {
                this._super('AddPoint', action);
                this._data = data;
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
     * Form submission event.
     */
    neemo.events.FormSubmit = neemo.events.Event.extend(
        {
            init: function(data, action) {
                this._super('FormSubmit', action);
                this._data = data;
            },
 
            getData: function() {
                return this._data;
            },
        }
    );
    neemo.events.FormSubmit.TYPE = 'form_submit';
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

