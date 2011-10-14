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
  neemo.events.RegionClick = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('RegionClick', action);
      this._data = data;
    },

    getLat: function() {
      return this._data.lat;
    },
    getLon: function() {
      return this._data.lon;
    },
    getX: function() {
      return this._data.click_x;
    },
    getY: function() {
      return this._data.click_y;
    },
    getRegion: function() {
      return this._data.region;
    }
  }
  );
  neemo.events.RegionClick.TYPE = 'region_click';

  /**
     * Change Region event.
*/
  neemo.events.ChangeRegion = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('ChangeRegion', action);
      this._region = data.region;
      this._track = data.track;
    },

    getRegion: function() {
      return this._region;
    },

    getTrack: function() {
      return this._track;
    }
  }
  );
  neemo.events.ChangeRegion.TYPE = 'change_region';;

  /**
     * Update user profile.
  */
  neemo.events.UpdateUserProfile = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('UpdateUserProfile', action);
      this._data = data;
    },

    getData: function() {
      return this._data;
    }
  }
  );

  neemo.events.UpdateUserProfile.TYPE = 'update_user_profile';
  /**
     * Update user profile.
  */
  neemo.events.NewUser = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('NewUser', action);
      this._data = data;
    }
  }
  );
  neemo.events.NewUser.TYPE = 'new_user';

  /**
     * Start new track.
  */
  neemo.events.ChangeTrack = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('ChangeTrack', action);
      this._data = data;
    }
  }
  );
  neemo.events.ChangeTrack.TYPE = 'change_track';


  neemo.events.RegionOverview = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('RegionOverview', action);
      this._data = data;
    },

    getData: function() {
      return this._data;
    }
  }
  );
  neemo.events.RegionOverview.TYPE = 'region_overview';

  neemo.events.RepositionPanels = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('RepositionPanels', action);
      this._data = data;
    },
    getData: function() {
      return this._data;
    },
  }
  );
  neemo.events.RepositionPanels.TYPE = 'reposition_panels';

  neemo.events.HideSelector = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('HideSelector', action);
      this._data = data;
    },
    getData: function() {
      return this._data;
    },
  }
  );
  neemo.events.HideSelector.TYPE = 'hide_selector';
  /**
     * Add point event.
*/
  neemo.events.AddPoints = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('AddPoints', action);
      this._data = data;
    },
    getData: function() {
      return this._data;
    },
  }
  );
  neemo.events.AddPoints.TYPE = 'add_points';

  neemo.events.Vote = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('Vote', action);
      this._data = data;
    },
    getData: function() {
      return this._data;
    },
  }
  );
  neemo.events.Vote.TYPE = 'vote';

  /**
  * New data submission event.
  */
  neemo.events.DataSubmit = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('DataSubmit', action);
      this._data = data;
    },

    getData: function() {
      return this._data;
    },
  }
  );
  neemo.events.DataSubmit.TYPE = 'data_submit';

  /**
  * New data creation event.
  */
  neemo.events.ImageClick = neemo.events.Event.extend(
    {
    init: function(event, action) {
      this._super('ImageClick', action);
      this._event = event;
    },

    getEvent: function() {
      return this._event;
    },
  }
  );
  neemo.events.ImageClick.TYPE = 'image_click';

  /**
  * New data submission event.
  */
  neemo.events.SubmitData = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('SubmitData', action);
      this._data = data;
    },

    getData: function() {
      return this._data;
    },
  }
  );
  neemo.events.SubmitData.TYPE = 'submit_data';

  /**
  * New user point update.
  */
  neemo.events.PointNotice = neemo.events.Event.extend(
    {
    init: function(data, action) {
      this._super('PointNotice', action);
      this._data = data;
    },

    getData: function() {
      return this._data;
    },
  }
  );
  neemo.events.PointNotice.TYPE = 'point_notice';

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

