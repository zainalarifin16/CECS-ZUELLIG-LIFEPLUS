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