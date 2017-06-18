(function (window, document, undefined) {

    var feed = new Instafeed({
        clientId: '0122364ea4484220a141d3ad3f26cded',
        accessToken:'2262603067.1677ed0.6b8de62624684410b4470cf656a05561',
        get: 'user',
        userId: '2262603067',
        resolution: 'thumbnail',
        limit:20
    });
    feed.run();

    var wall = new Freewall("#instafeed");
    wall.reset({
        selector: 'a',
        animate: true,
        cellW: 150,
        cellH: 150,
        onResize: function() {
            wall.fitWidth();
        }
    });
    wall.fitWidth();
    // for scroll bar appear;
    setTimeout(function () {
        feed.next();
    }, 500);
    setTimeout(function () {
        feed.next();
    }, 1500);
    setTimeout(function () {
        $(window).trigger("resize");
    }, 2000);


})(window, document);