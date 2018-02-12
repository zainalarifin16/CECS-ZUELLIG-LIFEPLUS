/* globals define */
define([
	'knockout',
	'jquery',
	'./viewmodel',
	'text!../template.html'
], function(ko, $, ComponentViewModel, templateHtml) {
	'use strict';

	var CSS_TEMPLATE = "<link type='text/css' rel='stylesheet' href='{0}/css/list.css'>";

    /**
     * Formats a parameterized String, like Java's String.format("{1} {2}", foo, bar)
     * @returns formattedString
     */
    if(String.format === undefined) {
        String.prototype.format = function() {
            var str = this;
            for (var i = 0; i < arguments.length; i++) {
                var reg = new RegExp("\\{" + i + "\\}", "gm");
                str = str.replace(reg, arguments[i]);
            }
            return str;
        }
    }

    var SitesSDK;

	/**
	 * Create a knockout-based component implemention
	 * @param args
	 * @constructor
	 */
	var ComponentImpl = function(args) {
		SitesSDK = args.SitesSDK;
		this.init(args);
	};

	/**
	 * Initialize the component with args passed in.
	 * @param args
	 */
	ComponentImpl.prototype.init = function(args) {
        var self = this;

        // Update self and args with specific values for the component instance
        self.id = args.id;
        self.bindingHandlerName = args.bindingHandlerName = "scsBinding" + self.id;

        // View Model
        self.viewModel = new ComponentViewModel(args);

        // Callbacks
        self.setupCallbacks();
	};

	/**
	 * Setup the callbacks expected by the SDK API
	 */
	ComponentImpl.prototype.setupCallbacks = function() {

		/**
		 * Callback - render: add the component into the page
		 */
		this.render = $.proxy(function(container) {
			var self = this;
			var viewModel = self.viewModel;

			// Append CSS
			SitesSDK.getProperty('assetsURL', function(value) {
				self.assetsURL = value;
				$(container).append(CSS_TEMPLATE.format(self.assetsURL));
			});

            // Pre-format the template with a custom binding handler for just this component instance
            self.template = templateHtml.format(self.id, self.bindingHandlerName);

			// Append template to the container
			$(container).append(self.template);

			// Bind the VM to the template
			ko.applyBindings(viewModel, $('#' + self.id + " .dynContentList")[0]);

            // Announce Rendered
            // Build trigger payload
            var trigger = {
                'triggerName': 'dynContentListReady',
                'triggerPayload': {
                    'id': self.id
                },
                'actions': ['dynContentSearchAnnounce', 'dynContentMenuAnnounce']
            };

            //console.log("Triggering: " + trigger.triggerName, trigger);
            SitesSDK.publish(SitesSDK.MESSAGE_TYPES.TRIGGER_ACTIONS, trigger);

		}, this);

		/**
		 * Callback - update: handle property change event
		 */
		this.update = $.proxy(function(args) {
			var self = this;
			// deal with each property changed
			$.each(args.properties, function(index, property) {
				if (property) {
					if (property.name === 'customSettingsData') {
						self.viewModel.updateCustomSettingsData(property.value);
					}
				}
			});
		}, this);
	};

	return ComponentImpl;
});