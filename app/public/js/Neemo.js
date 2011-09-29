
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
                this._width = 800;
                this._height = 600;
            },
            
            _bindEvents: function(){
                var that = this
                   , bus = this._bus;
                bus.addHandler(
                    'ChangeRegion',
                    function(event){
                        neemo.log.info('Change Region happened, I should flip images');
                        that._display.setNewFocus(that._base_image_url, event.getRegion());
                    }
                );
            },
            _canvasClick: function(event){
                console.log(event);
                var lat = -90 + (180.0 * event.column)/this._height;
                var lon = -360 + (360.0 * event.row)/this._width;
                var data = {lat: lat, lon: lon};
                ///TODO method not implemented yet
                this._bus.fireEvent(new Neemo.env.events.FocusClick(data));
            },
            
            _bindDisplay: function(display, text) {                
                var that = this;
                this._display = display;
                display.setEngine(this); 
                $('#region-focus-image').click(function(e){that._canvasClick(e)});
            },
            
            start: function() {
                this._bindDisplay(new neemo.ui.Slideshow.Display({width: this._width, height: this._height}));
                
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
            init: function(config) {
                this._id = 'region-slideshow-image';
                this._image = new Image();
                this._super(this._html());
                this._width = config.width;
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
                return  '<div id="'+this._id+'">' +
                        '    <canvas id="region-focus-image" width="'+this._width+'" height="'+this._height+'"></canvas>' +
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
            init: function(data, action) {
                this._super('ChangeRegion', action);
                this._region = data.region;
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

