/* globals define */
define([
    'knockout',
    'jquery',
    'scs-components/comp/component-context'
], function(ko, $, compCtx) {
    'use strict';

    // Keep references to SDK and APIs
    var SitesSDK, renderAPI, caasApi;

    // Not ideal to have CSS here.
    var RESPONSIVE_CSS ="@media screen and (max-width: [breakpoint]px) { a.dynContentMenuItem {font-size: 12px; font-weight: 600;}}"

    /**
     * Knockout view model for the menu.
     * @param args
     * @constructor
     */
    var ComponentViewModel = function(args) {
        var self = this;
        self.id = args.id;
        SitesSDK = args.SitesSDK;
        renderAPI = compCtx.getRenderApi();
        caasApi = compCtx.caasApi;

        self.viewMode = args.viewMode;
        self.alertShown = false;

        // Define observables for Knockout bindings
        self.initialized = ko.observable(false);
        self.saveData = ko.observable(false);
        self.menuItems = ko.observableArray();
        self.decoratedMenuItems = ko.observableArray();
        self.notConfigured = ko.computed(function () {
            return !self.menuItems() || self.menuItems().length==0;
        }, self);

        // ViewModel properties
        var properties = [
            'showAllOption',
            'allLabel',
            'allValue',
            'defaultOption',
            'contentType',
            'fieldName',
            'autoTriggerList',
            'breakpoint',
            'menuItems'
        ];

        // Create observables for properties
        $.each(properties, function(i, propName){
            if(self[propName]===undefined) {
                self[propName] = ko.observable();
            }
        });;

        // Redecorate menu items if they change
        self.menuItems.subscribe(function(){
           self.decorateMenuItems(self.menuItems());
        });

        // Update responsive style if breakpoint set
        self.responsiveStyle = ko.computed(function(){
            if(parseInt(self.breakpoint())>0) {
                return RESPONSIVE_CSS.replace("\[breakpoint\]", self.breakpoint());
            } else {
                return "";
            }
        }, self);

        // Handle property changes
        self.updateCustomSettingsData = function(data) {

            //console.log("Component got customSettingsData: ", data);

            // Update observable values
            $.each(properties, function(i, propName){
                self[propName](data[propName]);
            });

            var menuItemsArr = [];
            try {
                if(data.menuItems) {
                    menuItemsArr = JSON.parse(JSON.stringify(data.menuItems));
                }
            } catch (err) {
                console.error("Unable to parse menuItems from settings: " + data.menuItems);
            }

            self.saveData(true);
            self.initialized(true);

            if(self.viewMode==='edit') {
                // Only check for changing menu if Settings Dialog isn't currently open.
                var settingsDialog = 'iframe#settings-' + self.id + '.scs-component-settings';
                //console.log("Checking for settingsDialog " + settingsDialog);
                if($(settingsDialog, window.parent.document).length==0) {
                    self.updateMenuItems(menuItemsArr);
                }
            }
        };

        // Set customSettingsData
        self.save = ko.computed(function () {
            if (self.saveData()) {

                // Set custom setting
                var saveconfig = {};
                $.each(properties, function (i, propName) {
                    if (self[propName]) {
                        saveconfig[propName] = self[propName]();
                    }
                });
                //console.log("Saved");
                SitesSDK.setProperty('customSettingsData', saveconfig);
            }
        }, self);

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

    ComponentViewModel.prototype.selectDefaultMenuItem = function () {
        var self = this;

        $.each(self.menuItems(), function(idx, option) {
            if(option.isDefault) {
                self.selectMenuItem(option, false);
                return false;
            }
        });
    }

    /**
     * Select a menu item
     * @param itemid
     */
    ComponentViewModel.prototype.selectMenuItem = function (option, scroll) {
        var self = this;

        // Add selection css class to element for option
        $("#" + self.id + " .dynContentMenu span.current").removeClass("current");

        if(option) {
            $("#" + option.id).addClass("current");

            // Build a querystring
            var queryString = 'field:type:equals=' + self.contentType();
            if (self.fieldName() && $.trim(option.value)) {
                queryString += ('&field:' + self.fieldName() + '=' + '"' + option.value + '"');
            }

            // Build trigger payload
            var trigger = {
                'triggerName': 'dynamicContentMenuClick',
                'triggerPayload': {
                    'contentType': self.contentType(),
                    'fieldName': self.fieldName(),
                    'query': queryString
                },
                actions: ['dynContentSearchClear']
            };

            if (self.autoTriggerList()) {
                trigger.actions.push('dynContentListUpdate');
            }

            //console.log("Triggering: ", trigger);
            SitesSDK.publish(SitesSDK.MESSAGE_TYPES.TRIGGER_ACTIONS, trigger);

            if (scroll) {
                $('html,body').animate({scrollTop: $("#" + self.id).offset().top}, 250);
            }
        }

        return false;
    };

    ComponentViewModel.prototype.updateMenuItems = function(menuItemsArr){

        var self = this;
        var dfd = $.Deferred();
        var accessToken;

        // Get accessToken for CAAS
        var accessTokens = renderAPI.getSiteProperty('targetAccessTokens');
        if (accessTokens) {
            for (var i = 0; i < accessTokens.length; i++) {
                if (accessTokens[i].name === 'defaultToken') {
                    accessToken = accessTokens[i].value;
                    break;
                }
            }
        }

        if(accessToken) {
            $.ajax({
                type: 'GET',
                url: '/content/management/api/v1/types/' + self.contentType() + '/fields?links=&access-token=' + accessToken,
                dataType: 'json'
            }).fail(function (jqXHR, textStatus, errorThrown) {
                console.error("Can't get content types: ", textStatus, errorThrown);
            }).done(function (fields, textStatus, jqXHR) {

                var contentType = self.contentType();
                var fieldname = self.fieldName();
                var menuUpdated = false;
                var field = fields[self.fieldName()];

                if(field) {
                    try {
                        var arr = (((field.settings.caas || {}).editor || {}).options || {}).valueOptions;
                        if (Array.isArray(arr)) {

                            var newMenuItemsArr = [];

                            if (self.showAllOption() == true) {
                                newMenuItemsArr.push({
                                    label: self.allLabel(),
                                    value: self.allValue()
                                });
                            }

                            $.each(arr, function (idx, option) {
                                newMenuItemsArr.push({
                                    label: option.label,
                                    value: option.value
                                });
                            });

                            var saveNeeded = (JSON.stringify(newMenuItemsArr)!==JSON.stringify(menuItemsArr));
                            if(saveNeeded) {
                                self.menuItems(newMenuItemsArr);
                                self.save();
                                if (!self.alertShown) {
                                    var msg = ['The "', self.contentType(), '.', self.fieldName(),
                                        '" Content Type values have changed in the "DynamicContentMenu" Component on this page. ',
                                        'In order for these changes to take effect, the Site must be saved and re-published.'
                                    ].join('');
                                    alert(msg);
                                    self.alertShown = true;
                                }
                            }
                            dfd.resolve();
                            return;
                        } else {
                            console.error("field didn't have options: " + self.fieldName());
                        }
                    } catch (err) {
                        console.error("Error setting menuItems: ", err);
                    }
                } else {
                    console.error("fieldname not found on Content Type: " + self.fieldName());
                }

                console.error("failed to update menu items");
                dfd.resolve();
            });
        } else {
            dfd.resolve();
        }

        return dfd.promise();
    }

    ComponentViewModel.prototype.decorateMenuItems = function(menuItemsArr) {
        var self = this;

        var menuItems = JSON.parse(JSON.stringify(menuItemsArr));

        if(!menuItems || !Array.isArray(menuItems) || menuItems.length==0) {
            menuItems = [];
        } else {
            $.each(menuItems, function(idx, option) {
                option.id = self.id + "_opt" + idx;
                option.onClick = $.proxy(self.selectMenuItem, self);
                option.isDefault = (self.defaultOption()===option.value || self.defaultOption()===option.label);
                option.cssClass = (option.isDefault) ? 'current' : '';
            });
        }
        self.decoratedMenuItems(menuItems);
    }

    /**
     * Execute announce search
     */
    ComponentViewModel.prototype.executeActionListener = function(args) {
        var self = this;

        var payload = args.payload,
            action = args.action,
            actionName = action && action.actionName;

        if ((actionName === 'dynContentMenuAnnounce')) {
            //console.log("Executing action: " + actionName, args);
            self.selectDefaultMenuItem();
        }

        if ((actionName === 'dynContentMenuClear')) {
            //console.log("Executing action: " + actionName, args);
            self.selectMenuItem(undefined);
        }
    };

    // Return the view model
    return ComponentViewModel;
});