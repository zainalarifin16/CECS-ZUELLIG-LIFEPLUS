/* globals define */
define([
    'knockout',
    'jquery',
    'scs-components/comp/component-context'
], function(ko, $, compCtx) {
    'use strict';

    // Keep references to SDK and APIs
    var SitesSDK;

    // Function to build bootstrap popover from an element
    var buildPopover = function(element, placement) {
        // If we use the one provided by sites (via requirejs), there's no bootstrap loaded
        // Must use theme's jQuery, since it has the bootstrap plugin.
        var $ = window.jQuery;
        if(!(typeof $().popover == 'function')) {
            console.error("jQuery " + $().jquery + " does not have Bootstrap loaded. It should be provided by the Theme.");
            return;
        }

        var $searchTrigger = $(element);
        var $searchButtonComponent = $searchTrigger.parent();

        // Setup popopver behavior when user clicks search icon
        $searchTrigger.popover({
            placement: placement(),
            trigger: 'manual',
            html: true,
            animation: false,
            content: function () {
                // Use copy of html from searchPopover div as contents of popover
                return $searchButtonComponent.find('.searchPopover').html();
            }
        }).on('focus', function (focusEvt) {
            // User clicked/tapped/tabbed on search icon
            // Use a custom attribute 'data-haspopover' to track whether a popover is showing
            if($searchButtonComponent.attr('data-haspopover')!=='true') {
                $searchButtonComponent.attr('data-haspopover', 'true');
                $searchTrigger.popover('show');
            } else {
                $searchTrigger.popover('hide');
            }

        }).on('shown.bs.popover', function () {
            // Popover is now completely visible.

            // Move focus to search input
            var $input = $searchButtonComponent.find('input');
            $input.focus();

            // Set event handling on the search input
            $input.on('blur', function () {
                // User clicked outside or tabbed out
                $searchTrigger.popover('hide');
            }).on('keyup', function (keyEvt) {
                if (keyEvt.which == 27) {
                    // User pressed ESC key, force blur()
                    this.blur();
                }
            });

        }).on('hidden.bs.popover', function () {
            // Popover is no longer visible.
            // Use timeout to let other events finish propagating first
            setTimeout(function () {
                $searchButtonComponent.attr('data-haspopover', 'false');
                // Blur the trigger so new focus events can be received.
                $searchTrigger.blur();
            }, 100);
        });
    }

    // Custom binding handler uses bootstrap behaviors on the element passed in
    ko.bindingHandlers.searchButtonTriggerBinding = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            //buildPopover(element, valueAccessor());
        },
        update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            buildPopover(element, valueAccessor());
        }
    }

    /**
     * Knockout view model for the menu.
     * @param args
     * @constructor
     */
    var ComponentViewModel = function(args) {
        var self = this;
        self.id = args.id;
        SitesSDK = args.SitesSDK;

        // Define observables for Knockout bindings
        self.initialized = ko.observable(false);
        self.isInitialized = ko.pureComputed(function () {
            return self.initialized();
        }, self);
        self.usePopover = ko.pureComputed(function () {
            return self.popover()!=='none';
        }, self);
        self.hiddenInputs = ko.observableArray([]);

        // ViewModel properties
        var properties = [
            'url',
            'method',
            'target',
            'urlParam',
            'placeholderText',
            'popover'
        ];

        // Create observables for properties
        $.each(properties, function(i, propName){
            self[propName] = ko.observable();
        });

        // Handle property changes
        self.updateCustomSettingsData = function(data) {

            // Update observable values
            $.each(properties, function(i, propName){
                self[propName](data[propName]);
            });

            // Default target if not set
            if(!self.target()) {
                self.target('_self');
            }

            // Default popover if not set
            if(typeof(self.popover())==='undefined') {
                self.popover('left');
            }

            // Ensure urlParm is usable
            self.urlParam(encodeURIComponent($.trim(self.urlParam())));

            // Construct hidden inputs from any parameters on the url
            var hiddenInputsArr = [];
            self.url().replace(/[?&]+([^=&]+)=([^&]*)/gi, function (str, key, value) {
                if(key!==self.urlParam()) {
                    hiddenInputsArr.push({
                        "name": encodeURIComponent(key),
                        "value": encodeURIComponent(value)
                    });
                }
            });
            self.hiddenInputs(hiddenInputsArr);

            self.initialized(true);
        };

        // Get the current customSettingsData values
        SitesSDK.getProperty('customSettingsData', self.updateCustomSettingsData);

        //  Listen for changes to the settings data.
        SitesSDK.subscribe('SETTINGS_UPDATED', function(settings) {
            if (settings.property === 'customSettingsData') {
                self.updateCustomSettingsData(settings.value);
            }
        });

        // Listen for actions
        SitesSDK.subscribe(SitesSDK.MESSAGE_TYPES.EXECUTE_ACTION, $.proxy(self.executeActionListener, self));
    };

    // Return the view model
    return ComponentViewModel;
});