/*
* Controls the behaviour of the navigation menu
* */
jQuery.fn.navigationHover = function(opt) {

  var speed  = (opt && opt.speed) || 100;
  var easingMethod = (opt && opt.easingMethod) || "easeOutExpo";

  function select($option) {

    var l = $option.position().left;
    var w = $option.width();

    $option.parent().siblings("li.selected").removeClass("selected");
    $option.parent().addClass("selected");

    $(".bar").animate({opacity:1, width:w, left:l}, speed, easingMethod);
  }

  this.each(function() {

    if (opt.select) {
      var $option = $(this).find("li." + opt.select + " a");
      var sel = function() { select($option, opt.speed);}
      setTimeout(sel, 200);
    }

    $(this).mouseleave(function(e){
      var $option = $(this).find("li."+opt.select+" a");
      select($option);
    });

    $(this).find("a").hover(function(e){
      select($(this), opt.speed);
    });
  });
}



