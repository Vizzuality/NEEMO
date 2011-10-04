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
function SelectionWindow(coordinates){
  this.x = coordinates.x;
  this.y = coordinates.y;
}

SelectionWindow.prototype.draw = function($region){
  // We create the selection window and place it over the image
  var $selectionWindow = $('<div class="selection_window"></div>');
  $region.append($selectionWindow);

  var left = this.x - ($selectionWindow.width() / 2);
  var top  = this.y - ($selectionWindow.height() / 2);

  $selectionWindow.css({left:0, top:0, height:0, width:0});

  // Now we just move the window to its place
  $selectionWindow.animate({width:200, height:200, opacity:1, left:left, top:top}, 200);
};

$(function() {

  var selectorID = "radial_selector";
  var $radial_selector = $("#"+ selectorID);

  var svg = Raphael(selectorID, canvasWidth, canvasHeight);
  var circle = svg.circle(centerX, centerY, 0).attr({ stroke:"none", fill: "r(0.75, 0.75)#000-#333" });

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

  function selectOption(e, name) {
    e.preventDefault();
    e.stopPropagation();

    selectedOption = name;
    addSelectWindow(coordinates.x, coordinates.y);
  }

  /* This function should be called on changing the region */
  function clearSelection() {
    $(".selection_window").hide(250, function() {
      $(this).clear();
    });
  }

  /* Drawing of the radial selector */
  for (i = 0; i <= sectorNum - 1; i++) {

    if (options[i]) {

      var option = svg.text(centerX, centerY, options[i].text).attr({ opacity:0, fill: "#333" });
      option.translate(options[i].cX, options[i].cY);
      option.rotate(options[i].angle);

      var attr = { cursor:"hand", fill: "#000", stroke: "none", opacity: sectorOpacity };

      var sectorSVG = svg.path(sectorPath);

      // Event binding
      sectorSVG.hover(onFocusSector, onBlurSector);
      sectorSVG.click(options[i].action);

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
    $radial_selector.delay(500).animate({ opacity: 0 });
    circle.animate({r:0}, 1000, '<>');

    // We hide each of the sectors
    for (i = 0; i <= sectorNum - 1; i++) {
      sectors[i].sector.animate({ rotation: (0) + " " + centerX + " " + centerY }, 1000, '<>');
    }
  }

  function toggleRadialSelector(e) {
    if (!$radial_selector.hasClass("open")) {

      $radial_selector.css({ left: e.clientX - 133, top: e.clientY - 133 }).animate({ opacity: 1 });

      circle.animate({opacity:.7, r:30}, 1000, '<>');

      for (i = 0; i <= sectorNum - 1; i++) {
        $(sectors[i].option.node).delay(1000).animate( {opacity: 1 });
        sectors[i].sector.animate({
          rotation: (360 - 45 * i) + " " + centerX + " " + centerY
        }, 1000, '<>');
      }
      $radial_selector.addClass("open");

    } else {
      closeRadialSelector(e);
    }
  }

  function addSelectWindow(x, y) {
    var $selectedRegion = $(".image.selected");

    var selection = new SelectionWindow({x:x, y:y});
    selection.draw($selectedRegion);

    closeRadialSelector();
  }

  $radial_selector.click(toggleRadialSelector);
  $(".image.selected img").click(function(e) {

    // Coordinates of the user's click event
    coordinates.x = e.offsetX;
    coordinates.y = e.offsetY;

    toggleRadialSelector(e);
  });
});
