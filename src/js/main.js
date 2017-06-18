(function (window, document, undefined) {

    var feed = new Instafeed({
        clientId: '0122364ea4484220a141d3ad3f26cded',
        accessToken:'2262603067.1677ed0.6b8de62624684410b4470cf656a05561',
        get: 'user',
        userId: '2262603067',
        resolution: 'thumbnail',
        limit:20
    });

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

    $(document).ready(function () {
        feed.run();
        // for scroll bar appear;
        setTimeout(function () {
            feed.next();
        }, 1000);
        setTimeout(function () {
            feed.next();
        }, 2000);
        setTimeout(function () {
            wall.fitWidth();
            $(window).trigger("resize");
        }, 3000);
    });



})(window, document);