# Virtual Scroll

## What is it?

Virtual Scroll is a package for Blaze allowing to scroll a big number of items without losing performances, especially on mobile devices.
No matter how many items you have in your collection, Virtual Scroll will only display the needed number of items.

Check the [live demo](http://virtual-scroll.meteor.com).

_This is still a work in progress. Some features are missing and things may not always behave as expected._

## Installation

Add the package in your Meteor application with this command:

```
meteor add 255kb:virtual-scroll
```

## Usage

1. Enclose your item object template within the `virtualScroll` template in any container.
2. Pass the required parameters (see below) through a helper using the `params` variable.
3. Use `virtualIndex` to access the index number of your item and `item` to access the current collection item.

Example:

    ...
    <div class="your-container">
    
        {{#virtualScroll params=virtualScrollParams}}
        
            <div class="your-item">
                Current item no. {{virtualIndex}}
                {{item.property1}}
                {{item.property2}}
                {{...}}
            </div>
            
        {{/virtualScroll}}
        
    </div>
    ...

## Parameters

You can easily pass the required parameters to the scroller through a helper: 

    Template.mytemplate.helpers({
       virtualScrollParams: function () {
       
           return {
               namespace: 'namespace1',
               collection: {
                   name: myCollection,
                   selector: {} //optional
               },
               itemHeight: 200,
               subPreloadedItems: 10, //optional
               preloadedItems: 5 //optional
           };
           
       }
    });

- _namespace_ {String} - Name of your scroller instance. Use unique namespaces, but you can use the same one if you want to share the scroll position between multiple scrollers.
- _collection.name_ {String} - Name of the collection of which you want to show the items.
- _collection.selector_ {Object} - (optional) Selector to be used when querying the collection. You can use any selector as you would in a `collection.find()`.
- _itemHeight_ {Number} - Height of the items you want to display.
- _subPreloadedItems_ {Number} - (optional) Number of items to preload in the subscription in addition to the number of displayed items.
- _preloadedItems_ {Number} - (optional) Number of items to preload in the scroller before and after displayed items.


## Scroller API

### resetState(namespace)

Reset the scroll state of a virtual scroller instance (the scroll position and the number of preloaded items in the subscription).

_Arguments:_

**namespace** String: Scroller's namespace of which you want to reset scroll state.

## Controlling the subscription

You can either load a great number of items through your subscription once and for all or control the subscription limit.
A Session variable stores the scroller state in an object and especially the `subLimit` value which you can use to increase the number of items loaded through your subscription. The value increase when the user scrolls depending on the `subPreloadedItems` param.

To get the current `subLimit`: 

    Session.get('255kb.virtual-scroll.[namespace]').subLimit

You can use it as follow in order to increase your subscription limit reactively when the user scrolls:

    ...
    Template.myTemplate.onCreated(function () {
        let template = this;

        template.autorun(function () {
            if(Session.get('255kb.virtualScroll.[namespace]')) {
                template.subscribe('myItems', Session.get('255kb.virtualScroll.[namespace]').subLimit); //considering that your subscription only takes the limit as a parameter
            }
        });
    });
    ...
        
## Remarks

- You can pass any type of content inside the `virtualScroll` template.
- You should use fixed height contents or you may experience weird scroll jumps when items are entering/leaving the virtual scroller.
- You can put the virtual scroller in any container. The scroller will fill your container on both width and height.
- The state of each scroller is saved in a Session variable to allow hot reloads or route changes without losing the scroll position.
- The amount of items needed to fill the container is automatically defined by the scroller and updated when the viewport is resized.

## Changelog

### v0.1.0:
- First release
