/* Radial selector configuration */
var
canvasWidth  = 275,
canvasHeight = 275,

sectorNum = 8,
sector,
sectors = [],
cx = -60,
cy = -11.7,
centerX = 138,
centerY = 138,
sectorPath = "M230.301,135.651c3.62,8.709,3.48,18.071,0.301,26.23l93.729,36.011c12.09-31.82,11.98-68.321-3.16-101.931l-0.21-0.46L230.301,135.651z",
sectorOpacity = .40,
sectorOpacityDisabled = .25,
sectorOpacityActive = .5,
selectedOption,
selectedSector;

var coordinates = {};

/* Object to store a selection window */

function SelectionWindow(opt){
  this.x = opt.x;
  this.y = opt.y;
  this.name = opt.name;
  this.$el = $('<div class="selection_window">'+
               '<div class="controls">'+
                 '<div class="name">' + this.name + '</div>' +
                 '<a href="#" class="submit">Submit</a>' +
                 '<a href="#" class="close">x</a>' +
                 '<a href="#" class="agree"><div class="icon"></div></a>' +
                 '<a href="#" class="disagree"><div class="icon"></div></a>' +
                 '</div>' +
               '</div>');
  this.transitionSpeed = 250;
}

SelectionWindow.prototype.clear = function($region){
  this.$el.fadeOut(this.transitionSpeed, function() {
    $(this).clear();
  });
}

SelectionWindow.prototype.draw = function($region){
  var that = this;
  // We create the selection window and place it over the image
  $region.append(this.$el);

  // Centering of the box
  var left = this.x - (this.$el.width() / 2);
  var top  = this.y - (this.$el.height() / 2);

  console.log("Drawing a selection for a " + this.name  + " "  + left + " " + top );
  this.$el.css({left:0, top:0, height:0, width:0}); // initial position

  // Now we just move the window to its place
  this.$el.animate({width:200, height:200, opacity:1, left:left, top:top}, 200);
  this.$el.draggable({ handle:"controls", containment: 'parent', stop: function(e) { that.onDragEnd(); } });
  this.$el.resizable({ minWidth: 80, minHeight: 18, handles: 'nw, se' });
};

SelectionWindow.prototype.updateCoordinates = function(){
  this.x = this.$el.position().left + this.$el.width() / 2;
  this.y = this.$el.position().top  + this.$el.height() / 2;
}

SelectionWindow.prototype.onDragEnd = function(){
  this.updateCoordinates();
  console.log(this.name, this.x, this.y);
}

$(function() {

  var selectorID = "radial_selector";
  var $radial_selector = $("#"+ selectorID);

  var svg = Raphael(selectorID, canvasWidth, canvasHeight);
  var circle = svg.circle(centerX, centerY, 0).attr({ stroke:"#333", "stroke-width":"4px", fill: "none" });
  svg.rect(centerX -1, centerY - 5, 2, 10).attr({ stroke:"none", fill: "#333" });
  svg.rect(centerX-5 , centerY -1, 10, 2).attr({ stroke:"none", fill: "#333" });
  //svg.rect(centerX , centerY -1, 10, 2).attr({ stroke:"none", fill: "#333" });

  /* Options for the radial selector */
  var options = [
    { action: function(e) { selectOption(e, "barrel"); }, text: "BARREL\nSPONGES", angle: 0, cX: centerX - 50, cY: 0},
    { action: function(e) { selectOption(e, "coral"); }, text: "CORAL HEAD", angle: 315, cX: centerX - 80, cY: cy - 50},
    { action: function(e) { selectOption(e, "gorgonians"); }, text: "GORGONIANS", angle: -90, cX: 0, cY: cy - 75}, null, null,
    { action: closeRadialSelector, text: "CLOSE", angle: 315, cX: -60, cY: 60}, null,
    { action: function(e) { selectOption(e, "other"); }, text: "OTHER", angle: 45, cX: 60, cY: 60}, null
  ];

  /* Sector events */
  function onFocusSector(event) {
    this.animate({ opacity:sectorOpacityActive}, 250);
  }

  function onBlurSector(event) {
    this.animate({ opacity:sectorOpacity}, 250);
  }


  function addSelectWindow(opt) {
    var $selectedRegion = $(".image.selected");

    var selection = new SelectionWindow({x:opt.x, y:opt.y, name:opt.name});
    selection.draw($selectedRegion);

    closeRadialSelector();
  }

  function selectOption(e, name) {
    e.preventDefault();
    e.stopPropagation();

    selectedOption = name;
    addSelectWindow({x: coordinates.x, y: coordinates.y, name:name});
  }

  /* This function should be called on changing the region */
  function clearSelection() {
    // TODO
  }

  /* Drawing of the radial selector */
  for (i = 0; i <= sectorNum - 1; i++) {

    if (options[i]) {

      var attr = { cursor:"hand", fill: "#000", stroke: "none", opacity: sectorOpacity };

      var sectorSVG = svg.path(sectorPath);

      // Event binding
      //sectorSVG.hover(onFocusSector, onBlurSector);
      sectorSVG.click(options[i].action);

      var option = svg.text(centerX, centerY, options[i].text).attr({ opacity:0, cursor:"hand", fill: "#fff" });
      option.translate(options[i].cX, options[i].cY);
      option.rotate(options[i].angle);
      option.click(options[i].action);

    } else {
      var attr = { fill: "#000", stroke: "none", opacity: sectorOpacityDisabled };
      var sectorSVG = svg.path(sectorPath);

      // If there's no option, there's no action
      sectorSVG.click(function(e) { e.preventDefault(); e.stopPropagation(); });
    }

    sectorSVG.attr(attr);
    sectorSVG.translate(cx, cy);
    sectorSVG.rotate(0, centerX, centerY);
    sectors.push({ sector:sectorSVG, option:option});
  }

  function closeRadialSelector(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    $radial_selector.removeClass("open");
    $radial_selector.fadeOut(300, function() {
    circle.animate({r:0}, 300, '<>');

    // We hide each of the sectors
      for (i = 0; i <= sectorNum - 1; i++) {
        sectors[i].sector.animate({ rotation: (0) + " " + centerX + " " + centerY }, 300, '<>');
      }
    });
  }

  function moveRadialSelector(e) {
    $radial_selector.animate({ left: e.clientX - $radial_selector.width() / 2, top: e.clientY - $radial_selector.height() / 2 }, 500, "easeOutExpo");
  }

  function toggleRadialSelector(e) {
    if (!$radial_selector.hasClass("open")) {

      $radial_selector.fadeIn(0);
      $radial_selector.css({ left: e.clientX - 133, top: e.clientY - 133 }).animate({ opacity: 1 });

      circle.animate({opacity:.7, r:30}, 300, '<>');

      for (i = 0; i <= sectorNum - 1; i++) {
        $(sectors[i].option.node).delay(1000).animate( {opacity: 1 });
        sectors[i].sector.animate({
          rotation: (360 - 45 * i) + " " + centerX + " " + centerY
        }, 300, '<>');
      }
      $radial_selector.addClass("open");

    } else {
      closeRadialSelector(e);
    }
  }

  //  $radial_selector.click(toggleRadialSelector);
  $(".image.selected img").click(function(e) {

    // Coordinates of the user's click event
    coordinates.x = e.offsetX;
    coordinates.y = e.offsetY;

    if ($radial_selector.hasClass("open")) {
      moveRadialSelector(e);
    } else {
      toggleRadialSelector(e);
    }
  });
});
