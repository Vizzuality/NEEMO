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
        'RegionClick',
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
