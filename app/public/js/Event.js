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
  * Focus click event.
  */
  neemo.events.FocusClick = neemo.events.Event.extend(
    {
    init: function(location, action) {
      this._super('FocusClick', action);
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
  neemo.events.FocusClick.TYPE = 'focus_click';

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

