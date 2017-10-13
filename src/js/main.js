(function (window, document, undefined) {

    var feed = new Instafeed({
        clientId: '0122364ea4484220a141d3ad3f26cded',
        accessToken:'2262603067.1677ed0.955c2166073349f0abd578eb2d08ea1d',
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

        hideMe('#hideBtn', '#info-block');

    });



    // register sw script in supporting browsers
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js', { scope: '/' }).then(() => {
            console.log('Service Worker registered successfully.');
    }).catch(error => {
            console.log('Service Worker registration failed:', error);
    });
    }


})(window, document);
