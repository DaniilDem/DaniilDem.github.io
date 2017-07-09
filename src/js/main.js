(function (window, document, undefined) {

    var feed = new Instafeed({
        clientId: '0122364ea4484220a141d3ad3f26cded',
        accessToken:'2262603067.1677ed0.6b8de62624684410b4470cf656a05561',
        get: 'user',
        userId: '2262603067',
        resolution: 'low_resolution',
        limit:20
    });
    $(document).ready(function () {
        feed.run();
        // for scroll bar appear;
        setTimeout(function () {
            feed.next();
        }, 1000);
    });



    // register sw script in supporting browsers
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/dist/js/sw.js', { scope: '/' }).then(() => {
            console.log('Service Worker registered successfully.');
    }).catch(error => {
            console.log('Service Worker registration failed:', error);
    });
    }


})(window, document);
