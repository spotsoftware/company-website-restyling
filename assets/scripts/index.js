$(document).ready(function() {
    /**
     *   Global variables.
     */
    var pageHeight = $(window).height();
    var pageWidth = $(window).width();
    var navigationHeight = $("#navigation").outerHeight();

    /**
     *   ON RESIZE, check again
     */
    $(window).resize(function() {
        pageWidth = $(window).width();
        pageHeight = $(window).height();
    });

    $(window).trigger('scroll');

    var $navbar = $('div.navbar');
    var navbarHeight = $navbar.outerHeight(true);

    /*
     * Fixes the navbar container so that it will only appear when scrolling down the page.
     */
    $navbar.fixedonlater({
        speedDown: 250,
        speedUp: 100
    });

    /*
     * This initializes the jquery-easing plugin for a smooth scroll of the page sections.
     */
    $('a').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1000, 'easeInOutExpo');
        event.preventDefault();
    });

    /* Scroll spy and scroll filter */
    $('#main-menu').onePageNav({
        currentClass: "active",
        changeHash: false,
        scrollOffset: navigationHeight - 10,
        scrollThreshold: 0.5,
        scrollSpeed: 750,
        filter: "",
        easing: "swing"
    });

    $('.skills-wrapper .skills').bxSlider({
        mode: 'vertical',
        auto: true,
        minSlides: 1,
        responsive: true,
        touchEnabled: true,
        pager: false,
        controls: false,
        useCSS: false,
        pause: 10000
    });
});