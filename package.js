Package.describe({
    name: '255kb:virtual-scroll',
    version: '0.1.1',
    summary: 'Virtual scroller for Blaze',
    git: 'https://github.com/255kb/virtual-scroll.git',
    documentation: 'README.md'
});

Package.onUse(function(api) {
    api.versionsFrom('1.2');
    api.use(['ecmascript', 'templating', 'reactive-var', 'tracker', 'check', 'session', 'jquery'], 'client');

    api.addFiles(['virtualScroll.html', 'virtualScroll.css', 'virtualScroll.js'], 'client');

    api.export('virtualScrollPackage', 'client');
});