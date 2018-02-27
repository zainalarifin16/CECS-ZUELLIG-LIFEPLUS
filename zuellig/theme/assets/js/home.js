// start set effect
$(window).scroll(function(){
  var windowWidth = $(this).width();
  var windowHeight = $(this).height();
  var windowScrollTop = $(this).scrollTop();

  // effect categories post
  if (windowScrollTop >= 500) {
    $('#title-categories-post').animate( {'opacity' : '1'}, 500);
    // all section to set opacity to 1
    $('#categories-post')
      .find('.sl-three-columns .scs-component-content .scs-component-container:not(.scs-sectionlayout)')
      .animate( {'opacity' : '1'}, 500);

    // left section animation
    $('#categories-post')
      .find('.sl-three-columns .sl-three-columns-left .scs-component-content .scs-component-container:not(.scs-sectionlayout)')
      .animate( {'margin-left' : '0'}, 500);

    // center section animation set opacity 1000ms
    $('#categories-post')
      .find('.sl-three-columns .sl-three-columns-center .scs-component-content .scs-component-container:not(.scs-sectionlayout)')
      .animate( {'opacity': '1'}, 1000);

    // right section animation
    $('#categories-post')
      .find('.sl-three-columns .sl-three-columns-right .scs-component-content .scs-component-container:not(.scs-sectionlayout)')
      .animate( {'margin-right': '0'}, 500);
  }

  // effect ecoach 
  if (windowScrollTop >= 3000) {
    var element = $('#ecoach-section').find('.sl-two-columns-right .scs-component-container.scs-componentgroup .scs-component-container:not(.scs-sectionlayout)');
    var interval = 1000;
    for (let index = 0; index < element.length; index++) {
      var elem = element[index];
      var id = '#' + elem.id;
      var intervalName = interval + 100;
      var intervalBio = intervalName + 100;
      $(id).animate( {'margin-left': '0'}, interval);
      $(id)
        .find('.coach-name')
        .animate( {'opacity': '1'}, intervalName);
      $(id)
        .find('.coach-bio')
        .animate( {'opacity': '1'}, intervalBio);
      interval += 500;
    }
  }
});
// end set effect

$(document).ready(function(){

  //country section
  $("#menu_toggle").on("click", function(){
    $("#menu_mobile").stop().toggle("slide", { direction: "up" }, 1000);
  });
  //country section
  $("#btn_country").on("click", function(){
    $("#list_country").stop().toggle("slide", { direction: "up" }, 1000);
  });
  //login form
  /*$("#btn_login").on("click", function(){
    $("#form_login").stop().toggle("slide", { direction: "up" }, 1000);
  });*/

  //search box
  $("#search_btn").on("click", function(){
    var is_hidden = $("#search_box").css("display");
    if(is_hidden == "none"){
      $("#search_box").toggle("slide", { direction: "right" }, 1000);
    }else{
      $("#search_box").toggle("slide", { direction: "right" }, 1000);
    }
  });

  // e-shop
  // if(screen.width == 768)
  // {
  //   $('.center-item').slick({
  //     centerMode: true,
  //     centerPadding: '60px',
  //     slidesToShow: 3,
  //     variableWidth: true,
  //     responsive: [
  //     {
  //       breakpoint: 768,
  //       settings: {
  //         arrows: false,
  //         centerMode: true,
  //         centerPadding: '40px',
  //         slidesToShow: 3
  //       }
  //     },
  //     {
  //       breakpoint: 480,
  //       settings: {
  //         arrows: false,
  //         centerMode: true,
  //         centerPadding: '40px',
  //         slidesToShow: 1
  //       }
  //     }
  //     ]
  //   });
  // }else{
    
  // }

  $('.center-item').slick({
    centerMode: true,
    slidesToShow: 3,
    centerMode: true,
    variableWidth: true,
    responsive: [
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  });

  if(screen.width == 375){

    // $(window).on("scroll", function(){
    //   $(".title-section").each(function(){
    //     var posisiScroll = $(window).scrollTop(),
    //       positionDiv = $(this).scrollTop();
    //     $(".title-section").removeClass("fixed");
    //     if( posisiScroll >= positionDiv ){
    //       $(this).addClass("fixed");
    //     }
    //   });
    // });

  }

});