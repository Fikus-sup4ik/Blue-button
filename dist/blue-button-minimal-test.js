/* Blue-button minimal Lampa loader test; intentionally ES5 and dependency-free. */
(function (window) {
    'use strict';
    var action = {
        type: 'video',
        name: 'Blue-button Minimal Test',
        description: 'Minimal Manifest/load test',
        onContextMenu: function () { return true; },
        onContextLauch: function () {
            if (window.Lampa && window.Lampa.Noty && window.Lampa.Noty.show) {
                window.Lampa.Noty.show('Blue-button minimal test запущен');
            }
        }
    };

    /* Literal namespace reference required by Lampa extension validation. */
    if (typeof Lampa !== 'undefined' && Lampa.Manifest) {
        Lampa.Manifest.plugins = action;
        window.BlueButtonMinimalTest = true;
        if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show('Blue-button minimal test загружен');
    }
}(window));
