/* globals define */
define(['knockout', 'jquery'], function(ko, $) {
	'use strict';
	// ----------------------------------------------
	// Define a Knockout Template for component
	// ----------------------------------------------
	var componentTemplate = '<!-- ko if: initialized -->' +
			'<div class="userArea">' +
			'     <div class="userAvatar" data-bind="visible: displayAvatar">' +
			'       <img class="userAvatarImage"/>' +
			'     </div>' +
			'     <div class="welcomeMsg scs-text" id="welcomeMessage" data-bind="text: welcomeMessage"></div>' +
			'     <div class="userName scs-text" id="userName" data-bind="text: person"></div>' +
			'</div>' +
			'<!-- /ko -->';

	// ----------------------------------------------
	// Define a Knockout ViewModel for your template
	// ----------------------------------------------
	var ComponentViewModel = function(args) {
		var self = this,
				SitesSDK = args.SitesSDK;
		// store the args
		self.mode = args.viewMode;
		self.id = args.id;
		// handle initialization
		self.customSettingsDataInitialized = ko.observable(false);
		self.initialized = ko.computed(function() {
			return self.customSettingsDataInitialized();
		}, self);
		self.displayAvatar = ko.observable(true);
		self.welcomeMessage = ko.observable('Welcome');
		self.person = ko.observable();
		// Handle property changes
		//
		self.updateCustomSettingsData = function(customData) {
			//console.log('READING: customSettingsData: ' + JSON.stringify(customData));
			self.displayAvatar(((customData.hasOwnProperty('displayAvatar') ? customData.displayAvatar : 'true') === 'true' ? true : false));
			self.welcomeMessage(customData.hasOwnProperty('welcomeMessage') ? customData.welcomeMessage : 'Welcome');
			if (self.welcomeMessage().trim() === "") {
				//Remove welcome message element
				$("#welcomeMessage").remove();
			}
			self.customSettingsDataInitialized(true);
		};
		// Get the current customSettingsData values
		//
		SitesSDK.getProperty('customSettingsData', self.updateCustomSettingsData);
		//
		//  Listen for changes to the settings data.
		//      e.g.: When the Settings Panel changes the data
		//
		self.updateSettings = function(settings) {
			if (settings.property === 'customSettingsData') {
				self.updateCustomSettingsData(settings.value);
			}
		};
		SitesSDK.subscribe('SETTINGS_UPDATED', self.updateSettings);

		$.ajax({
			type: 'GET',
			url: '/documents/web?IdcService=GET_USER_INFO'
		}).done(function(data, textStatus, jqXHR) {
			if (data.LocalData.StatusCode !== "-1") {
				self.person(data.LocalData.dUserFullName);
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			console.error("Can't get user informatiion.", jqXHR, textStatus, errorThrown);
		});
	};

	// ----------------------------------------------
	// Create a knockout based component implemention
	// ----------------------------------------------
	var ComponentImpl = function(args) {
		// Initialze the custom component
		this.init(args);
	};
	// initialize all the values within the component from the given argument values
	ComponentImpl.prototype.init = function(args) {
		var me = this;
		args.SitesSDK.getProperty('assetsURL', function(value) {
			me.assetsURL = value;
			//console.log("Assets URL =" + value);
		});
		this.createViewModel(args);
		this.createTemplate(args);
		this.setupCallbacks();
	};
	// create the viewModel from the initial values
	ComponentImpl.prototype.createViewModel = function(args) {
		// create the viewModel
		this.viewModel = new ComponentViewModel(args);
	};
	// create the template based on the initial values
	ComponentImpl.prototype.createTemplate = function(args) {
		// create a unique ID for the div to add, this will be passed to the callback
		this.contentId = args.id + '_content_' + args.mode;
		// create a hidden custom component template that can be added to the DOM
		this.template = '<div id="' + this.contentId + '">' +
				componentTemplate +
				'</div>';
	};
	//
	// SDK Callbacks
	// setup the callbacks expected by the SDK API
	//
	ComponentImpl.prototype.setupCallbacks = function() {
		//
		// callback - render: add the component into the page
		//
		this.render = $.proxy(function(container) {
			var $container = $(container);
			$container.append("<link type=\"text/css\" rel=\"stylesheet\" href=\"" + this.assetsURL + "/css/current-user.css\">")
			// add the custom component template to the DOM
			$container.append(this.template);
			$container.find(".userAvatarImage").attr("src", this.assetsURL + "/images/avatar.png");
			// apply the bindings
			ko.applyBindings(this.viewModel, $('#' + this.contentId)[0]);
		}, this);
		//
		// callback - update: handle property change event
		//
		this.update = $.proxy(function(args) {
			var self = this;
			// deal with each property changed
			$.each(args.properties, function(index, property) {
				if (property) {
					if (property.name === 'customSettingsData') {
						self.viewModel.updateComponentData(property.value);
					} else if (property.name === 'componentLayout') {
						self.viewModel.updateLayout(property.value);
					}
				}
			});
		}, this);
		//
		// callback - dispose: cleanup after component when it is removed from the page
		//
		this.dispose = $.proxy(function() {
			// nothing required for this component since knockout disposal will automatically clean up the node
		}, this);
	};
	// ----------------------------------------------
	// Create the factory object for your component
	// ----------------------------------------------
	var componentFactory = {
		createComponent: function(args, callback) {
			// return a new instance of the component
			return callback(new ComponentImpl(args));
		}
	};
	return componentFactory;
});