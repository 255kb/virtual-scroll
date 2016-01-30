'use strict';

/**
 * Default values declaration
 */
const scrollThrottle = 10,
    sessionVarName = '255kb.virtualScroll.',
    defaultSkipNumber = 0,
    defaultLimitNumber = 10,
    defaultSubPreloadedItems = 10,
    defaultPreloadedItems = 2;


/**
 * Virtual scroll API
 */
virtualScrollPackage = {
    /**
     * Reset the scroll state of a virtual scroller.
     *
     * @param namespace {String} - Scroller's namespace of which you want to reset scroll state.
     */
    resetState: function (namespace) {
        let scroller = $(`#virtual-scroll-${namespace}`);

        if(scroller.length) {
            scroller.scrollTop(0);
        }

        let currentState = Session.get(sessionVarName + namespace);
        currentState.skip = currentState.initialState.skip;
        currentState.limit = currentState.initialState.limit;
        currentState.subLimit = currentState.initialState.subLimit;
        Session.set(sessionVarName + namespace, currentState);
    }
};


/**
 * Virtual scroll template
 */
Template.virtualScroll.onCreated(function () {
    let template = this;
    const errorPrefix = 'Virtual-scroll: ';

    /**
     * Parameters validation
     */
    if (!Match.test(template.data.params, Object)) {
        throw new Meteor.Error(errorPrefix + 'parameters are missing');
    }
    if (!template.data.params.namespace) {
        throw new Meteor.Error(errorPrefix + 'a `namespace` parameter is missing');
    }
    if (!template.data.params.collection) {
        throw new Meteor.Error(errorPrefix + 'a `collection` parameter is missing');
    }
    if (!template.data.params.collection.name) {
        throw new Meteor.Error(errorPrefix + 'the `collection.name` parameter is missing');
    }
    if (!template.data.params.itemHeight) {
        throw new Meteor.Error(errorPrefix + '`itemHeight` parameter is missing');
    }

    //set session var name
    template.stateSessionName = sessionVarName + template.data.params.namespace;

    //get current state
    let currentState = null;
    if (Session.get(template.stateSessionName)) {
        currentState = Session.get(template.stateSessionName);
    }

    //init scroller parameters
    template.preloadedItems = template.data.params.preloadedItems || defaultPreloadedItems;
    template.subPreloadedItems = template.data.params.subPreloadedItems || defaultSubPreloadedItems;
    template.itemHeight = template.data.params.itemHeight || 0;
    template.limit = new ReactiveVar(defaultLimitNumber + template.preloadedItems);
    template.scrollLastTime = new Date();
    template.scrolledToLastPosition = false;
    template.scroll = (currentState && currentState.scroll) || 0;
    template.skip = new ReactiveVar((currentState && currentState.skip) || defaultSkipNumber);

    let subLimit = template.limit.get() + template.skip.get() + template.subPreloadedItems;

    //save new state
    Session.set(template.stateSessionName, {
        skip: template.skip.get(),
        scroll: template.scroll,
        subLimit: subLimit,
        initialState: {
            skip: (currentState) ? currentState.initialState.skip : template.skip.get(),
            scroll: (currentState) ? currentState.initialState.scroll : template.scroll,
            subLimit: (currentState) ? currentState.initialState.subLimit : subLimit
        }
    });

    //reactive var counting items rendered
    template.itemsRendered = new ReactiveVar(0);
});

Template.virtualScroll.onRendered(function () {
    let template = this;

    let onResize = function () {
        //set limit of items depending on container height
        let itemsNeededNumber = Math.ceil(template.$('.virtual-scroll').height() / template.itemHeight);

        //*2 at the bottom because we skip less items at the top
        template.limit.set(itemsNeededNumber + (template.preloadedItems * 2));
    };

    //initial run
    onResize();
    $(window).on('resize', onResize);

    //set tracker to scroll as soon as old state items are rendered
    template.autorun(function (computation) {
        if (template.itemsRendered.get() >= template.limit.get()) {
            let scroller = template.$('.virtual-scroll');

            //scroll to last known position
            scroller.scrollTop(template.scroll);
            template.scrolledToLastPosition = true;
            computation.stop();
        }
    });
});

Template.virtualScroll.helpers({
    items: function () {
        return this.params.collection.name.find(this.params.collection.selector, {
            skip: Template.instance().skip.get(),
            limit: Template.instance().limit.get()
        });
    },
    virtualIndex: function (index) {
        return Template.instance().skip.get() + index;
    },
    topFillerHeight: function () {
        return Template.instance().skip.get() * Template.instance().itemHeight;
    },
    bottomFillerHeight: function () {
        let count = this.params.collection.name.find(this.params.collection.selector).count() - (Template.instance().skip.get() + Template.instance().limit.get());
        if (count > 0) {
            return count * Template.instance().itemHeight;
        }
        return 0;
    },
    itemsRenderedVar: function () {
        return Template.instance().itemsRendered;
    }
});

Template.virtualScroll.events({
    'scroll .virtual-scroll': function (event, template) {
        //trigger only if we already scroll to the last known position
        if (template.scrolledToLastPosition) {
            //throttle scroll event
            if (new Date() - template.scrollLastTime >= scrollThrottle) {
                template.scrollLastTime = new Date();

                //calculate number of items to skip (scroll distance / size of an item) - preloaded items
                let topHiddenItems = Math.floor(event.target.scrollTop / template.itemHeight) - template.preloadedItems;

                //check if offset does not give a negative skip number
                if (topHiddenItems <= 0) {
                    topHiddenItems = 0;
                }

                template.skip.set(topHiddenItems);
                template.scroll = event.target.scrollTop;

                //only increase sublimit
                let currentSession = Session.get(template.stateSessionName);
                let newSubLimit = template.limit.get() + template.skip.get() + template.subPreloadedItems;

                Session.set(template.stateSessionName, {
                    skip: topHiddenItems,
                    scroll: event.target.scrollTop,
                    subLimit: (currentSession.subLimit >= newSubLimit) ? currentSession.subLimit : newSubLimit,
                    initialState: {
                        skip: currentSession.initialState.skip,
                        scroll: currentSession.initialState.scroll,
                        subLimit: currentSession.initialState.subLimit
                    }
                });
            }
        }
    }
});

Template.virtualScrollItem.onRendered(function () {
    //increment parent reactiveVar as soon as an item is rendered
    this.data.itemsRenderedVar.set(this.data.itemsRenderedVar.get() + 1);
});
