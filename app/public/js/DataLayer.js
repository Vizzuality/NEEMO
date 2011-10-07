/* Handles the DataLayer object. I just stubbed this here as a guide
* if this handled the logic of the datalayer, there should be a
* neemo.ui.DataLayer.Display that would handle what came to the screen
* Also, it listens for ChangeRegion event to know when to flip images
*/
Neemo.modules.DataLayer = function(neemo) {
  neemo.ui.DataLayer = {};
  neemo.ui.DataLayer.Engine = Class.extend(
    {
    init: function(bus, api) {
      var that = this;
      this._bus = bus;
      this._api = api;
      this._region = -1;
      this._annotations = [];
    },

    _bindKeyboard: function() {
      var that = this;

      $(document).mousemove(function(e) {
        that.mouseX = e.pageX;
        that.mouseY = e.pageY;
      });

      $(document).keyup(function(e) {
        if (e.keyCode >= 49 && e.keyCode <= 51) {

          var $selectedRegion = $(".image.selected");

          var left = that.mouseX - $selectedRegion.offset().left;
          var top  = that.mouseY - $selectedRegion.offset().top;

          if (e.keyCode == 49) {
            categoryName = "gorgonian";
          }
          else if (e.keyCode == 50) {
            categoryName = "coral";
          }
          else if (e.keyCode == 51) {
            categoryName = "barrel";
          }
          else if (e.keyCode == 52) {
            categoryName = "other";
          }

          var selection = new neemo.ui.Annotation.Engine(that._bus, that._api, {x:left, y:top });
          selection.start($selectedRegion);
          selection.enableSubmit();
        }
      });
    },
    _bindEvents: function(){
      var that = this
      , bus = this._bus;
      bus.addHandler(
        'ImageClick',
        function(data){
          neemo.log.info('Image Click Recieved');
          that._radial_selector.handleClick(data.getEvent());
        }
      );

      var that = this
      , bus = this._bus;
      bus.addHandler(
        'ChangeRegion',
        function(data){
          neemo.log.info('Clearing annotations');
          that._region = data.getRegion();
          that._radial_selector.clearAnnotations();
          that.clearAnnotations();
        }
      );
      bus.addHandler(
        'AddPoints',
        function(data){
            data = data.getData();
            if (data.region == that._region){
                var activeRegion = $("#region_" + data.region);
                var annotation = new neemo.ui.Annotation.Engine(that._bus, that._api, data);
                annotation.start(activeRegion, true);
                annotation.enableVote();
                that._annotations.push(annotation);
            }
        }
      );
    },
    clearAnnotations: function(){
        while(this._annotations.length > 0){
            var t = this._annotations.pop();
            t.remove();
            t = null;
        }
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
      this._radial_selector = new neemo.ui.DataLayer.RadialSelector(this._bus);
      this._radial_selector.start();
      this._bindEvents();
      this._bindKeyboard();
    },
  }
  );

  neemo.ui.DataLayer.RadialSelector = neemo.ui.Display.extend(
    {
    init: function(bus) {
        this._bus = bus;
        this.selectorID = "radial_selector";
        this.$element = $("#"+ this.selectorID);
        this._super(this.$element);
        this.canvasWidth  = 275;
        this.canvasHeight = 275;

        this.sectorNum = 8;
        this.sector;
        this.sectors = [];
        this.cx = -60;
        this.cy = -11.7;
        this.centerX = 138;
        this.centerY = 138;
        this.sectorPath = "M230.301,135.651c3.62,8.709,3.48,18.071,0.301,26.23l93.729,36.011c12.09-31.82,11.98-68.321-3.16-101.931l-0.21-0.46L230.301,135.651z";
        this.sectorOpacity = .40;
        this.sectorOpacityDisabled = .25;
        this.sectorOpacityActive = .5;
        this.selectedOption;
        this.selectedSector;
        this.coordinates = {};

        this._annotations = [];
    },
    start: function(){
        that = this;
        this.svg = Raphael(this.selectorID, this.canvasWidth, this.canvasHeight);
        this.circle = this.svg.circle(this.centerX, this.centerY, 0).attr({ stroke:"#333", "stroke-width":"4px", fill: "none" });
        this.svg.rect(this.centerX -1, this.centerY - 5, 2, 10).attr({ stroke:"none", fill: "#333" });
        this.svg.rect(this.centerX-5 , this.centerY -1, 10, 2).attr({ stroke:"none", fill: "#333" });
        //svg.rect(centerX , centerY -1, 10, 2).attr({ stroke:"none", fill: "#333" });

        /* Options for the radial selector */
        this.options = [
            { action: function(e) { that.selectOption(e, "barrel"); }, text: "BARREL\nSPONGES", angle: 0, cX: that.centerX - 50, cY: 0},
            { action: function(e) { that.selectOption(e, "coral"); }, text: "CORAL HEAD", angle: 315, cX: this.centerX - 80, cY: that.cy - 50},
            { action: function(e) { that.selectOption(e, "gorgonian"); }, text: "GORGONIAN", angle: -90, cX: 0, cY: that.cy - 75}, null, null,
            //{ action: that.closeRadialSelector(), text: "CLOSE", angle: 315, cX: -60, cY: 60}, null,
            { action: function(){that.closeRadialSelector()}, text: "CLOSE", angle: 315, cX: -60, cY: 60}, null,
            { action: function(e) { that.selectOption(e, "other"); }, text: "OTHER", angle: 45, cX: 60, cY: 60}, null
        ];


        /* Drawing of the radial selector */
        for (i = 0; i <= this.sectorNum - 1; i++) {

            if (this.options[i]) {

                var attr = { cursor:"hand", fill: "#000", stroke: "none", opacity: this.sectorOpacity };

                var sectorSVG = this.svg.path(this.sectorPath);

                // Event binding
                //sectorSVG.hover(onFocusSector, onBlurSector);
                sectorSVG.click(this.options[i].action);

                var option = this.svg.text(this.centerX, this.centerY, this.options[i].text).attr({ opacity:0, cursor:"hand", fill: "#fff" });
                option.translate(this.options[i].cX, this.options[i].cY);
                option.rotate(this.options[i].angle);
                option.click(this.options[i].action);

            } else {
                var attr = { fill: "#000", stroke: "none", opacity: this.sectorOpacityDisabled };
                var sectorSVG = this.svg.path(this.sectorPath);

                // If there's no option, there's no action
                sectorSVG.click(function(e) { e.preventDefault(); e.stopPropagation(); });
            }

            sectorSVG.attr(attr);
            sectorSVG.translate(this.cx, this.cy);
            sectorSVG.rotate(0, this.centerX, this.centerY);
            this.sectors.push({ sector:sectorSVG, option: option});
        }

    },
    clearAnnotations: function(){
      while(this._annotations.length > 0){
        var t = this._annotations.pop();
        t.remove();
        t = null;
      }
    },
    handleClick: function(e) {
        // Coordinates of the user's click event
        this.coordinates.x = e.offsetX;
        this.coordinates.y = e.offsetY;

        if (this.$element.hasClass("open")) {
          this.moveRadialSelector(e);
        } else {
          this.toggleRadialSelector(e);
        }
    },

    /* Sector events */
    onFocusSector: function(event) {
        this.animate({ opacity: this.sectorOpacityActive}, 250);
    },

    onBlurSector: function(event) {
        this.animate({ opacity: this.sectorOpacity}, 250);
    },

    addSelectWindow: function(opt) {
        var selectedRegion = $(".image.selected");
        opt = $.extend(opt, {hideCategory:true});
        var selection = new neemo.ui.Annotation.Engine(this._bus, this._api, opt);
        selection.start(selectedRegion);
        selection.enableSubmit();
        this._annotations.push(selection);
        this.closeRadialSelector();
    },

    selectOption: function(e, category) {
        e.preventDefault();
        e.stopPropagation();

        this.selectedOption = category;
        this.addSelectWindow({x: this.coordinates.x, y: this.coordinates.y, category:category});
    },

    /* This function should be called on changing the region */
    clearSelection: function() {
    // TODO
    },

    closeRadialSelector: function(e) {
        var that = this;
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        this.$element.removeClass("open");
        this.$element.fadeOut(300, function() {
            that.circle.animate({r:0}, 300, '<>');

            // We hide each of the sectors
            for (i = 0; i <= that.sectorNum - 1; i++) {
                that.sectors[i].sector.animate({ rotation: (0) + " " + that.centerX + " " + that.centerY }, 300, '<>');
            }
        });
    },

    moveRadialSelector: function(e) {
        this.$element.animate({ left: e.clientX - this.$element.width() / 2, top: e.clientY - this.$element.height() / 2 }, 500, "easeOutExpo");
    },
    openAtMousePosition: function() {
      this.openRadialSelector(left, top);
    },
    openAtCenter: function() {
      var selectedRegion = $(".image.selected");
      var left = selectedRegion.offset().left + selectedRegion.width() / 2 - (this.$element.width() / 2);
      var top = selectedRegion.offset().top + selectedRegion.height() / 2 - (this.$element.height() / 2);

      this.openRadialSelector(left, top);
    },
    openRadialSelector: function(left, top) {
      if (!this.$element.hasClass("open")) {

        this.$element.fadeIn(0);
        this.$element.css({ left: left, top: top }).animate({ opacity: 1 });

        this.circle.animate({opacity:.7, r:30}, 300, '<>');

        for (i = 0; i <= this.sectorNum - 1; i++) {
          $(this.sectors[i].option.node).delay(1000).animate( {opacity: 1 });
          this.sectors[i].sector.animate({
            rotation: (360 - 45 * i) + " " + this.centerX + " " + this.centerY
          }, 300, '<>');
        }
        this.$element.addClass("open");

      }
    },

    toggleRadialSelector: function(e) {
      if (!this.$element.hasClass("open")) {

        var left = e.clientX - (this.$element.width() / 2);
        var top = e.clientY - (this.$element.height() / 2);
        this.openRadialSelector(left, top);

      } else {
        this.closeRadialSelector(e);
      }
    }
  }
  );
}
