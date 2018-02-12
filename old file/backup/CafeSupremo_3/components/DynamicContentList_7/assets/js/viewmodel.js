/* globals define */
define([
    'knockout',
    'jquery',
    'scs-components/comp/component-context',
    'scs-components/comp/content/system-default-layout',
    'scs-components/comp/components-default',
], function(ko, $, compCtx, scsSystemDefaultLayout, defaultComponents) {
    'use strict';

    // Keep references to SDK and APIs
    var SitesSDK,
        renderAPI,
        caasApi,
        sectionLayouts;

    // Get section layouts
    var sectionLayouts = defaultComponents.components.filter(function (category) {
        return category.name === 'COMP_CONFIG_SECTION_LAYOUTS_CATEGORY_NAME';
    });
    sectionLayouts = (sectionLayouts && sectionLayouts[0] && sectionLayouts[0].list) || [];

    /**
     * Knockout view model for the dynamic content list.
     * @param args
     * @constructor
     */
    var ComponentViewModel = function (args) {
        var self = this;

        // Keep references to SDK and APIs
        SitesSDK = args.SitesSDK;
        renderAPI = compCtx.getRenderApi();
        caasApi = compCtx.caasApi;

        //console.log("args: ", args);

        // Init self
        self.id = args.id;
        self.bindingHandlerName = args.bindingHandlerName;
        self.viewMode = args.viewMode;
        self.sectionLayoutId = undefined;
        self.detailPageIds = {};

        // Define observables for Knockout bindings
        self.initialized = ko.observable(false);
        self.sectionLayout = ko.observable();
        self.sectionComponentId = ko.observable();
        self.contentComponentIds = ko.observableArray([]);
        self.queryAttempted = ko.observable(false);
        self.showNoResults = ko.computed(function(){
           return (self.queryAttempted() || self.viewMode==='edit') && self.contentComponentIds().length==0;
        });
        self.isInitialized = ko.computed(function(){
            return self.initialized();// && self.layoutInitialized();
        });

        // Functions for getting elements via jquery
        self.$root = function () {
            return $("#" + self.id + "-content");
        };

        self.$renderList = function () {
            return $("#" + self.id + "-render");
        };

        self.$spinner = function () {
            return $("#" + self.id + "-spinner");
        };

        // ViewModel properties
        var properties = self.properties = [
            'contentQuery',
            'sectionLayoutId',
            'contentLayoutId',
            'limit',
            'offset',
            'minHeight',
            'noResultsMessage',
            'breakpoint',
            'stackColumns'
        ];

        // Create observables for properties
        $.each(properties, function (i, propName) {
            self[propName] = ko.observable();
        });

        // Register component's unique binding handler referenced in component template
        ko.bindingHandlers[self.bindingHandlerName] = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                $.proxy(self.getContentItems, self)
            }
        }

        // Get the current customSettingsData values
        SitesSDK.getProperty('customSettingsData', $.proxy(self.updateCustomSettingsData, self));

        //  Listen for changes to the settings data.
        SitesSDK.subscribe('SETTINGS_UPDATED', function (settings) {
            if (settings.property === 'customSettingsData') {
                self.updateCustomSettingsData(settings.value);
            }
        });

        // Listen for queryChange actions
        SitesSDK.subscribe(SitesSDK.MESSAGE_TYPES.EXECUTE_ACTION, $.proxy(self.executeActionListener, self));

        // Update description when query changes
        self.updateDescription = ko.computed(function () {
            SitesSDK.setProperty('description', self.contentQuery());
        });

        // If in editor, compose layoutNames for use in settings page, store in localStorage
        try {
            if (self.viewMode === 'edit') {
                // Convert names for use in settings page, store in localStorage
                var commonResources = require('ojL10n!scs-components/comp/common/nls/CommonResources');
                var layoutNames = [];
                $.each(sectionLayouts, function (i, layout) {
                    var name = layout.name;
                    if (name && commonResources[name]) {
                        name = commonResources[name];
                    }
                    layoutNames.push({
                        id: layout.id,
                        name: name
                    });
                });
                localStorage.setItem('dynContentListLayoutNames', JSON.stringify(layoutNames));
            }
            //console.log("layoutNames:", localStorage.getItem('dynContentListLayoutNames'));
        } catch (err) {
            console.error("Error getting layouts: " + err);
        }
    };

    /**
     * Update custom settings.
     * @param data
     */
    ComponentViewModel.prototype.updateCustomSettingsData = function (data) {
        var self = this;
        //console.log("Component got customSettingsData: ", data);

        // Update observable values
        $.each(self.properties, function (i, propName) {
            self[propName](data[propName]);
        });

        // Lookup section layout when id changes
        self.sectionLayoutId.subscribe(function(){
            self.updateLayout();
            self.getContentItems();
        });

        // Update height when it changes
        self.minHeight.subscribe(self.updateHeight);

        self.updateHeight();
        self.updateLayout();
        self.getContentItems();
        self.initialized(true);
    }

    /**
     * Get the detail page id for the content type.
     * @param contentType
     * @returns {pageId}
     */
    ComponentViewModel.prototype.getDetailPageId = function(contentType) {

        var self = this;

        if(!self.detailPageIds[contentType]) {
            var detailPageId = -1,
                contentDetailPageId = -1;
            for (var prop in SCS.structureMap) {
                if (SCS.structureMap.hasOwnProperty(prop)) {
                    if (SCS.structureMap[prop].isDetailPage) {
                        if (detailPageId === -1) {
                            detailPageId = SCS.structureMap[prop].id;
                        }
                        if (!contentType || contentDetailPageId !== -1) {
                            break;
                        }
                        if (SCS.structureMap[prop].name.toUpperCase().indexOf(contentType.toUpperCase()) >= 0) {
                            contentDetailPageId = SCS.structureMap[prop].id;
                            break;
                        }
                    }
                }
            }

            var pageId = (contentDetailPageId !== -1) ? contentDetailPageId : detailPageId;

            if(!pageId || pageId==-1) {
                console.error("Fallback to defaultDetailPage for " + contentType);
                pageId = compCtx.getDefaultDetailPage();
            }

            self.detailPageIds[contentType] = pageId;
        }

        return self.detailPageIds[contentType];
    }

    /**
     * Update the minimum height for the list.
     */
    ComponentViewModel.prototype.updateHeight = function () {
        var self = this;
        if(self.$renderList) {
            var minHeight = parseInt(self.$renderList().height());
            if (minHeight > 0) {
                self.$renderList().parent().css("min-height", minHeight + "px");
            }
        }
    }

    /**
     * Update the layout used for content items
     */
    ComponentViewModel.prototype.updateLayout = function () {
        var self = this;
        var layoutId = self.sectionLayoutId();
        var layout = sectionLayouts[0]; // default
        $.each(sectionLayouts, function (i, sectionLayout) {
            if (sectionLayout.id === layoutId) {
                layout = sectionLayout;
                return false;
            }
        });
        //console.log('using layout:' + layout);
        self.sectionLayout(layout);
    }

    /**
     * Get Content Items
     * @param cb callback
     */
    ComponentViewModel.prototype.getContentItems = function (typeFilter) {
        var self = this;

        var query = self.contentQuery();

        // Check settings
        if (!query) {
            return;
        }

        // Show spinner
        $("#" + self.id + " .spinner").show();

        // Derive contentType from query, since the caas api wants it as a seperate parameter
        var contentType = [];
        var params = query.split("&");
        $.each(params, function (i, param) {
            var kv = param.split("=");
            if (kv[0].trim() == "field:type") {
                contentType.push(kv[1].trim());
                return false;
            }
        });

        // Replace magic words
        if (~query.indexOf("$PLACEHOLDER_CONTENT_ID")) {
            try {
                if(renderAPI && renderAPI.getPlaceholderContent()) {
                    var val = renderAPI.getPlaceholderContent().contentId;
                    if (val) {
                        query = query.replace("\$PLACEHOLDER_CONTENT_ID", val);
                    }
                } else {
                    console.log("No $PLACEHOLDER_CONTENT_ID in mode " + self.viewMode);
                }
            } catch (err) {
                console.error("Error getting $PLACEHOLDER_CONTENT_ID:", err);
            }
        }

        // Use filters if specified to filter results by type afterward
        var filters = [];
        if(typeFilter) {
            if (Array.isArray(typeFilter)) {
                filters = typeFilter;
            } else if (typeof(typeFilter) === 'string') {
                // Removes whitespace around commas, then splits on the commas
                filters = typeFilter.replace(/^\s+|\s+$/g,"").split(/\s*,\s*/);
            }
        }
        // console.log("filters: ", filters);

        // Workaround: If contentType and free text search both specified, CAAS breaks,
        // So we'll just do the free text search and then filter results by the contentType after.
        if(contentType.length>0 && (~query.indexOf("q="))) {
            filters = filters.concat(contentType);
            contentType = [];
        }

        // CAAS query options
        var options = {
            queryString: query,
            searchOptions: {
                'fields': 'ALL',
                'limit': self.limit(),
                'offset': self.offset(),
                'links': []
            }
        };

        // Callback after CAAS API called
        var callback = function (searchResults) {
            if(filters.length>0) {
                var filteredItems = searchResults.items.filter(function (searchResultsItem) {
                    return filters.includes(searchResultsItem.type);
                });
                searchResults.items = filteredItems;
            }
            self.renderList(self, searchResults);
        };

        // Error Callback after CAAS API call fails
        var errorCallback = function (xhr, textStatus, err) {
            console.error('Failed to GET the search results due to ' + textStatus + ': ' + err);
        };

        // Determine which API call to make
        if (contentType.length>0) {
            // Call CAAS API normally
            compCtx.caasApi.getContentItems(contentType, options, callback, errorCallback);
        } else {
            // TODO: This is a workaround because search is broken; can't use freetext search and restrict by field type
            compCtx.caasApi.getContentClient().getItems({
                'search': self.getQueryString(options)
            }).then(callback, errorCallback);
        }
    }

    /**
     * Borrowed from caasApi until searches can have free text and restrict by type
     */
    ComponentViewModel.prototype.getQueryString = function (options) {
        var query = Object.keys(options.searchOptions).filter(function (key) {
            return options.searchOptions[key];
        }).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(options.searchOptions[key]);
        }).join('&');

        // Append the additional query parameters, if any
        if (options.queryString) {
            query = query + "&" + options.queryString;
        }
        return query;
    }

    /**
     * Reset the rendered list.
     */
    ComponentViewModel.prototype.clearContent = function () {
        var self = this;

        self.queryAttempted(true);

        var sectionComponentId = self.sectionComponentId();
        var componentIds = (self.contentComponentIds()).concat(sectionComponentId);

        // Clear variables
        self.sectionComponentId(undefined);
        self.contentComponentIds([]);

        // Clear DOM immediately
        if(sectionComponentId) {
            self.updateHeight();
            $("#" + sectionComponentId).empty();
            //console.log("Cleared DOM from #" + sectionComponentId);
        }

        // Delay removing component ids from page model so rendering isn't slowed
        if(componentIds.length>0) {
            setTimeout(function () {
                // Remove content from pageModel
                $.each(componentIds, function (index, id) {
                    if (typeof(id) === 'string') {
                        try {
                            renderAPI.setComponentInstanceObject(id, undefined, {});
                            //console.log("Removed component from pageModel: ", id);
                        } catch (err) {
                            console.error("Error removing componentId from pageModel: ", id, err);
                        }
                    }
                });
            }, 2000);
        }
    }

    /**
     * Render the list of content items
     */
    ComponentViewModel.prototype.renderList = function (self, searchResultsObject) {

        var seededLayout = self.sectionLayout();
        if(!seededLayout) {
            console.error("No layouts found");
            return;
        }

        var $spinner = $("#" + self.id + " .spinner");

        if(searchResultsObject.items.length==0) {
            //console.log('No search results');
            $spinner.hide();
            self.clearContent();
            return;
        }

        var tempSectionComponentId;
        var tempComponentIds = [];

        // Create a temporary 'contentitem' component for each item in the result set
        searchResultsObject.items.forEach(function (searchResultsItem) {
            // create and store the transient component to be used in the section layout
            tempComponentIds.push(
                renderAPI.addComponentToPageModel({
                'type': 'scs-component',
                'id': 'scsCaaSLayout',
                'data': {
                    'componentId': '',
                    'componentName': 'scsContentQueryItemInstance', // used to prevent drop into this component (see: component-edit.js)
                    'contentId': searchResultsItem.id,
                    'contentLayoutCategory': self.contentLayoutId() || 'Default',
                    'contentPlaceholder': false,
                    'contentTypes': [searchResultsItem.type],
                    'contentViewing': 'published',
                    'isCaaSLayout': true,
                    'detailPageId': self.getDetailPageId(searchResultsItem.type),
                    'contentItemData': searchResultsItem,
                    'marginBottom': 0,
                    'marginLeft': 0,
                    'marginRight': 0,
                    'marginTop': 0
                },
                'isTemporary': true
            }));
        });

        var sectionLayoutCustomSettings = $.extend({}, seededLayout.initialData.customSettingsData);
        if(typeof(self.breakpoint()!=='undefined')){
            sectionLayoutCustomSettings.breakpoint = self.breakpoint();
        }
        if(typeof(self.stackColumns()!=='undefined')){
            sectionLayoutCustomSettings.stackColumns = self.stackColumns();
        }

        //console.log("sectionLayoutCustomSettings", sectionLayoutCustomSettings);

        var sectionLayoutComponent = {
            'type': 'scs-sectionlayout',
            'id': seededLayout.id, // name of the section layout in the server
            'data': {
                components: tempComponentIds,
                customSettingsData: sectionLayoutCustomSettings,
                componentFactory: seededLayout.initialData.componentFactory
            },
            'isTemporary': true
        }

        // Create section layout in page model
        tempSectionComponentId = renderAPI.addComponentToPageModel(sectionLayoutComponent);

        // Remove old content from DOM and pagemodel
        self.clearContent();
        
        // Update content ids
        self.contentComponentIds(tempComponentIds);
        self.sectionComponentId(tempSectionComponentId);

        // renderAPI.renderComponentInstance(componentId, slotId, position, isEditMode, columnNode, renderStyles, parentContentItemId, componentRenderMode, callback) {
        renderAPI.renderComponentInstance(tempSectionComponentId, self.id + "-render", {}, false, self.$renderList()[0], undefined, undefined, 'navigate');

        // Update height after components added to DOM - prevents page resize spazz
        var tid = setTimeout(function(){
            self.updateHeight();
            self.$spinner().hide();
        }, 200);

    };

    /**
     * Select a menu item
     * @param itemid
     */
    ComponentViewModel.prototype.executeActionListener = function(args) {
        var self = this;

        var payload = args.payload,
            action = args.action,
            actionName = action && action.actionName;

        if ((actionName === 'dynContentListUpdate') && payload && payload.query) {
            //console.log("Executing action: " + actionName, args);
            self.contentQuery(payload.query);
            self.getContentItems(payload.typeFilter);
        }
    };

    // Return the view model
    return ComponentViewModel;
});