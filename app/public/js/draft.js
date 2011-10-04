$(function() {

  var
  currentRegion = 0,
  width = 800,
  height = 600,
  margin = -196,
  moving = false,
  easingMethod = null, // 'easeInExpo',
  numberOfRegions = 5;

  function hideAside(callback) {
    $("#slideshow div.selected aside").animate({opactiy:0, right:"100px"}, 250, function() {
      $(this).animate({height:300}, 0, callback);
      $(this).hide();
    });
  }

  function showAside() {
    $("#slideshow div.selected aside").css({height:"400px", right:"59px"});

    $("#slideshow div.selected aside").show(0, function() {
      $("#slideshow div.selected aside").delay(200).animate({opacity:1, right:"-59px"}, 250);
    });
  }

  function selectBox(i) {
    $("#slideshow div.selected").removeClass("selected");
    $("#slideshow .image:eq("+i+")").addClass("selected");
  }

  function fwd() {
    if (!moving) {
      moving = true;
      selectBox(++currentRegion);
      $("#container").scrollTo("+="+(width/2 + margin) +"px", {duration:250, easing:easingMethod, onAfter: function() {
        moving = false;
        showAside();
      }});
    }
  }

  function back() {
    if (!moving) {
      moving = true;
      selectBox(--currentRegion);
      $("#container").scrollTo("-="+(width/2 + margin) +"px", {duration:250, easing:easingMethod, onAfter: function() {
        moving = false;
        showAside();
      }});
    }
  }

  $(".next").click(function() {
    if (currentRegion < numberOfRegions - 1) {
      hideAside(fwd);
    }
  });

  $(".previous").click(function() {
    if (currentRegion >= 1) {
      hideAside(back);
    }
  });

  showAside();
});
