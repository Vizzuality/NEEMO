/*
* Controls the behaviour of the navigation menu
* */
jQuery.fn.navigationHover = function(opt) {

  var speed  = (opt && opt.speed) || 100;
  var easingMethod = (opt && opt.easingMethod) || "easeOutExpo";
  var $currentOption;

  function select($option) {
    var l = $option.position().left;
    var w = $option.width();

    $option.parent().siblings("li.selected").removeClass("selected");
    $option.parent().addClass("selected");

    $(".bar").animate({opacity:1, width:w, left:l}, speed, easingMethod);
  }

  this.each(function() {

    if ($(this).find(".selected")) {
      $currentOption = $(this).find("li.selected a");

      $currentOption.click(function(e) {
        e.preventDefault();
      });

      var sel = function() { select($currentOption, speed);}
      setTimeout(sel, 200);
    }

    $(this).mouseleave(function(e){
      select($currentOption);
    });

    $(this).find("a").hover(function(e){
      select($(this), speed);
    });
  });
}
