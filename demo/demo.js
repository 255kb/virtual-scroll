'use strict';

let randomColor = function () {
    return Math.floor(Math.random()*16777215).toString(16);
};

let testCollection = new Mongo.Collection('testCollection');

if (Meteor.isClient) {
    Template.container.onCreated(function () {
        let template = this;

        template.autorun(function () {
            if(Session.get('255kb.virtualScroll.example1')) {
                template.subscribe('allItems', Session.get('255kb.virtualScroll.example1').subLimit);
            }
        });
    });

    Template.container.helpers({
        virtualScrollParams: function () {
            return {
                namespace: 'example1',
                collection: {
                    name: testCollection,
                    selector: {}
                },
                itemHeight: 200,
                subPreloadedItems: 10,
                preloadedItems: 5
            };
        }
    });

    Template.body.events({
        'click .hot-reload': function (evznt, template) {
            Meteor._reload.reload();
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        if(testCollection.find().count() === 0) {
            for(var i = 0; i < 1000; i++) {
                testCollection.insert({name: 'item' + i, color1: randomColor(), color2: randomColor()});
            }
        }

        Meteor.publish('allItems', function (limit) {
            return testCollection.find({}, {limit: limit});
        });
    });
}
