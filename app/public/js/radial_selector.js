var canvasWidth  = 275;
var canvasHeight = 275;

var sectorNum = 8;
var sector;
var sectors = [];
var cx = -60;
var cy = -11.7;
var centerX = 138;
var centerY = 138;
var sectorPath = "M230.301,135.651c3.62,8.709,3.48,18.071,0.301,26.23l93.729,36.011c12.09-31.82,11.98-68.321-3.16-101.931l-0.21-0.46L230.301,135.651z";

$(function() {

  var svg = Raphael("radial_selector", canvasWidth, canvasHeight);

  var circle = svg.circle(centerX, centerY, 0).attr({ stroke:"none", fill: "r(0.75, 0.75)#000-#333" });

  var sectorOpacity = .40;
  var sectorOpacityDisabled = .25;
  var sectorOpacityActive = .5;

  var options = [
    { action: function(e) { selectOption("GORGONIANS", e); }, text: "BARREL\nSPONGES", angle: 0, cX: centerX - 50, cY: 0},
    { action: function(e) { selectOption("coral", e); }, text: "CORAL HEAD", angle: 315, cX: centerX - 80, cY: cy - 50},
    { action: function(e) { selectOption("barrel", e); }, text: "GORGONIANS", angle: -90, cX: 0, cY: cy - 75}, null, null,
    { action: close, text: "CLOSE", angle: 315, cX: -60, cY: 60}, null,
    { action: function(e) { selectOption("other", e); }, text: "OTHER", angle: 45, cX: 60, cY: 60}, null
  ];

  function onFocusSector(event) {
    this.animate({ opacity:sectorOpacityActive}, 250);
  }

  function onBlurSector(event) {
    this.animate({ opacity:sectorOpacity}, 250);
  }

  for (i = 0; i <= sectorNum - 1; i++) {

    if (options[i]) {

      var option = svg.text(centerX, centerY, options[i].text).attr({ opacity:0, fill: "#333" });
      option.translate(options[i].cX, options[i].cY);
      option.rotate(options[i].angle);

      var sectorSVG = svg.path(sectorPath).attr({ cursor:"hand", fill: "#000", stroke: "none", opacity: sectorOpacity });
      sectorSVG.hover(onFocusSector, onBlurSector);

      sectorSVG.click(options[i].action);

    } else {
      var sectorSVG = svg.path(sectorPath).attr({ fill: "#000", stroke: "none", opacity: sectorOpacityDisabled });
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

  var _open = false;

  function selectOption(name, e) {
    e.preventDefault();
    e.stopPropagation();
    alert(name);
  }

  function close(e) {
    e.preventDefault();
    e.stopPropagation();

    _open = false;

    $("#radial_selector").delay(500).animate({ opacity: 0 });

    circle.animate({r:0}, 1000, '<>');
    for (i = 0; i <= sectorNum - 1; i++) {
      sectors[i].sector.animate({ rotation: (0) + " " + centerX + " " + centerY }, 1000, '<>');
    }
  }

  function open(e) {
    console.log(e);
    if (!_open) {
      _open = true;

      $("#radial_selector").css({ left: e.clientX - 133, top: e.clientY - 133 }).animate({ opacity: 1 });

      circle.animate({opacity:.7, r:30}, 1000, '<>');


      for (i = 0; i <= sectorNum - 1; i++) {
        $(sectors[i].option.node).delay(1000).animate( {opacity: 1 });
        sectors[i].sector.animate({
          rotation: (360 - 45 * i) + " " + centerX + " " + centerY
        }, 1000, '<>');
      }

    } else {
      close(e);
    }
  }


  $("#radial_selector").click(open);
  $(".photo").click(open);


});
