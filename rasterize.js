"use strict";
var page = require('webpage').create(),
    system = require('system'),
    address, output, size, pageWidth, pageHeight;

if (system.args.length < 3 || system.args.length > 5) {
    console.log('Usage: rasterize.js URL filename');
    slimer.exit(1);
} else {
    address = system.args[1];
    output = system.args[2];

    page.settings.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36';
    page.settings.javascriptEnabled = false;


    page.viewportSize = { width: 1280, height: 1080 };

    page.zoomFactor = 1;


    page.open(address, function(status){ // executed after loading
        if (status !== 'success') {
            console.log('Unable to load the address!');
            slimer.exit(1);
        } else {
            // store a screenshot of the page
            page.viewportSize =
                { width:1280, height:1080 };
            page.render(output,
                   {onlyViewport:true});
            slimer.exit();
        }
    });
}
