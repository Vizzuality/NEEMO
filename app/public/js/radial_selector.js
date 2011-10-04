
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

  var _mode;


$(function() {

  var selectorID = "radial_selector";
  var $radial_selector = $("#"+ selectorID);

  var svg = Raphael(selectorID, canvasWidth, canvasHeight);
  var circle = svg.circle(centerX, centerY, 0).attr({ stroke:"none", fill: "r(0.75, 0.75)#000-#333" });

  /* Options for the radial selector */
  var options = [
    { action: function(e) { selectOption("barrel"); }, text: "BARREL\nSPONGES", angle: 0, cX: centerX - 50, cY: 0},
    { action: function(e) { selectOption("coral"); }, text: "CORAL HEAD", angle: 315, cX: centerX - 80, cY: cy - 50},
    { action: function(e) { selectOption("gorgonians"); }, text: "GORGONIANS", angle: -90, cX: 0, cY: cy - 75}, null, null,
    { action: closeRadialSelector, text: "CLOSE", angle: 315, cX: -60, cY: 60}, null,
    { action: function(e) { selectOption("other"); }, text: "OTHER", angle: 45, cX: 60, cY: 60}, null
  ];

  /* Sector events */
  function onFocusSector(event) {
    this.animate({ opacity:sectorOpacityActive}, 250);
  }

  function onBlurSector(event) {
    this.animate({ opacity:sectorOpacity}, 250);
  }

  function selectOption(name) {
    selectedOption = name;
    _mode = "select";

    // TODO: add click event

    _mode = "selecting";
    addSelectWindow();
  }

  function highlightSector(sector) {
    sector.attr("fill", "red");
  }

  function unHighlightSector(sector) {
    sector.attr("fill", "#000");
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
      sectorSVG.attr(attr);
      sectorSVG.hover(onFocusSector, onBlurSector);
      //sectorSVG.click(options[i].action);

      var action = options[i].action;

      sectorSVG.click(function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (selectedSector) {
          unHighlightSector(selectedSector);
        }

        selectedSector = this;
        highlightSector(selectedSector);

        action.apply();
      });

    } else {
      var attr = { fill: "#000", stroke: "none", opacity: sectorOpacityDisabled };
      var sectorSVG = svg.path(sectorPath);
      sectorSVG.attr(attr);

      sectorSVG.click(function(e) {
        e.preventDefault();
        e.stopPropagation();
      });
    }

    sectorSVG.translate(cx, cy);
    sectorSVG.rotate(0 * i, centerX, centerY);
    var sector = { sector:sectorSVG, option:option};
    sectors.push(sector);
  }

  function closeRadialSelector(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    unHighlightSector(selectedSector);
    $radial_selector.removeClass("open");

    $radial_selector.delay(500).animate({ opacity: 0 });

    circle.animate({r:0}, 1000, '<>');
    for (i = 0; i <= sectorNum - 1; i++) {
      sectors[i].sector.animate({ rotation: (0) + " " + centerX + " " + centerY }, 1000, '<>');
    }
    _mode = null;
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

  function addSelectWindow() {
    var $element = $(".image.selected img");
    var x = $element.offset().left;
    var y = $element.offset().top;

    var $selection = $('<div class="selection_window"></div>');
    $element.parent().append($selection);

    console.log(($element.height() / 2), $selection.height());
    $selection.css("left", ($element.width() / 2) - $selection.width() / 2);
    $selection.css("top",  ($element.height() / 2) - $selection.height() / 2 );
    closeRadialSelector();
  }

  //function selectSomething($element, e) {
  //  var x = e.offsetX;
  //  var y = e.offsetY;

  //  var $selection = $('<div class="selection_window"></div>');
  //  $element.append($selection);
  //  $selection.css({left: x - $selection.width() / 2 , top:y - $selection.height() / 2});;
  //  closeRadialSelector();
  //}

  $radial_selector.click(toggleRadialSelector);
  $(".image.selected img").click(toggleRadialSelector);
});
