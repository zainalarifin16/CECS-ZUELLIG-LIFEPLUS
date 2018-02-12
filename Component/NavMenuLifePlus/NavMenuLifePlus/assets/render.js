/* globals define */
define([
	'knockout',
	'jquery',
	'css!./css/nav-menu.css',
	'text!./template.html',
	'scs-components/comp/component-context'
], function(ko, cecsJQuery, css, navMenuTemplate, compCtx) { // TODO: remove dependency on component-context
	'use strict';

	// Set $ to the jQuery defined by theme if available, because that jQuery can access the Bootstrap plugin from theme
	// $ falls back to the jQuery provided by CECS product, so the component can still work when hosting site's theme
	// doesn't have jQuery plugin included.
	var $ = (typeof jQuery === 'function') ? jQuery : cecsJQuery;
	
	// -------------------
	// Sub Menu ViewModel
	// -------------------
	var Submenu = function(label, destination, target, classes, submenus) {
		var self = this;
		self.label = ko.observable(label);
		self.destination = ko.observable(destination);
		self.target = ko.observable(target);
		self.classes = ko.observable(classes);
		self.submenus = ko.observableArray(submenus);
	};
	
	// --------------------
	// Component ViewModel
	// --------------------
	var ComponentViewModel = function(args) {

		var self = this;
		self.dependencyMissing = false;

		// Verify jQuery is available
		if (typeof $ !== 'function') {
			console.error("jQuery plugin is not available");
			self.dependencyMissing = true;
			return;
		}
		
		// Verify Bootstrap is available
		if (typeof $.fn.modal !== 'function') {
			console.error("Bootstrap plugin is not available");
			self.dependencyMissing = true;
			return;			
		}
		
		var SitesSDK = args.SitesSDK,
			renderAPI = compCtx.getRenderApi();
		
		self.viewMode = args.viewMode;
		
		self.templateDfd = $.Deferred(); // TODO: still required for NavMenu component?
		
		// component observables
		self.navMenus = ko.observableArray();
		self.externalSiteEnabled = ko.observable();
		self.externalSites = ko.observableArray();
				
		// handle initialization
		self.customSettingsDataInitialized = ko.observable(false);
		self.initialized = ko.computed(function() {
			return self.customSettingsDataInitialized();
		}, self);

		// Handle property changes
		self.updateCustomSettingsData = function(customData) {
			//console.log("render.js UPDATECUSTOMSETTINGSDATA, customData = ", JSON.stringify(customData));
			if (customData) {
				self.externalSiteEnabled(customData.hasOwnProperty('externalSiteEnabled') ? customData.externalSiteEnabled : false);
				if (customData.hasOwnProperty('externalSites')) {
					self.externalSites(customData.externalSites);
				}
			}
						
			if (self.customSettingsDataInitialized()) { // Already initialized
				// Update observables to re-render the nav menu
				self.setupMenus();
			}
			else {
				self.customSettingsDataInitialized(true);
			}
		};

		// Listen for changes to the settings data.
		self.updateSettings = function(settings) {
			if (settings.property === 'customSettingsData') {
				self.updateCustomSettingsData(settings.value);
			}
		};

		// Recursively check whether the given page is an ancestor of the current page
		self.checkCurrentParent = function(pageId) {
			var navNode = SCS.structureMap[pageId];
			var isCurrentParent = false;
			var c, subcurrent;
			
			if (navNode.children.length > 0) {
				for (c = 0; c < navNode.children.length; c++) {
					subcurrent = (SCS.navigationCurr === navNode.children[c]) ? true : self.checkCurrentParent(navNode.children[c]);
					if (subcurrent) {
						isCurrentParent = true;
						break;
					}
				}
			}
			
			return isCurrentParent;
		};
			
		// Fetch configured external site URL for the given page or null
		self.getExternalUrl = function(pageName) {
			var externalUrl = null;
			
			if (self.externalSiteEnabled() && self.externalSites()) {
				for (var i = 0; i < self.externalSites().length; i ++) {
					if (self.externalSites()[i].name &&
						self.externalSites()[i].name.toUpperCase() === pageName.toUpperCase()) {
						externalUrl = self.externalSites()[i].url;
						break;
					}
				}
			}
			
			return externalUrl;
		}

		// Recursively build sub menus for a given top page.
		self.buildSubmenus = function(navNode) {
			var submenus = [];
			
			if (navNode.children.length > 0) {
				for (var c = 0; c < navNode.children.length; c ++) {
					var childNodeId = navNode.children[c];
					var isCurrent = (SCS.navigationCurr === childNodeId) ? true: false;
					var isLast = (c === navNode.children.length - 1) ? true: false;
					var childNode = (childNodeId >= 0) ? SCS.structureMap[childNodeId] : null;
					if (childNode && (typeof childNode.hideInNavigation != "boolean") || (childNode.hideInNavigation === false)) {
						var name = childNode.name;
						var classes = (childNode.children.length > 0) ? "dropdown-submenu" : "dropdown";
						if (isCurrent) {
							classes += " current";
						} else if (self.checkCurrentParent(childNodeId)) {
							classes += " currParent";
						}
						if (isLast) {
							classes += " last";
						}
						var externalUrl = self.getExternalUrl(name);
						var target = externalUrl ? "_blank" : "_self";
						var destination = externalUrl ? externalUrl : null;
						if (destination === null) {
							var linkData = SCSRenderAPI.getPageLinkData(childNode.id) || {};
							destination = linkData.href ? linkData.href : "";
						}
						var childSubmenus = self.buildSubmenus(childNode);
						submenus.push(new Submenu(name, destination, target, classes, childSubmenus));
					}
				}
			}
			
			return submenus;
		};
		
		// Construct a top page menu.
		self.addNavMenu = function(pageId, isCurrent, isLast, showSubmenus) {
			var navNode = SCS.structureMap[pageId];
			var name, externalUrl, linkData, destination, target, classes;
			var submenus = [];
			
			if (navNode && ((typeof navNode.hideInNavigation != "boolean") || (navNode.hideInNavigation === false))) {
				name = navNode.name;
				target = "_self";
				externalUrl = self.getExternalUrl(name);
				if (externalUrl) {
					destination = externalUrl;
					target = "_blank";
				} else {
					linkData = SCSRenderAPI.getPageLinkData(navNode.id) || {};
					destination = linkData.href ? linkData.href : "";
				}
				classes = "dropdown";
				
				if (isCurrent) {
					classes += " current";
				} else if (pageId !== SCS.navigationRoot && self.checkCurrentParent(pageId)) {
					classes += " currTop";
				}
				if (isLast) {
					classes += " last";
				}
								
				if (showSubmenus) {
					submenus = self.buildSubmenus(navNode);
				}
					
				console.log(navNode);

				self.navMenus.push(
					{name: name, destination: destination, target: target, classes: classes, submenus: ko.observableArray(submenus)}
				);
			}
		};
				
		// Initialize UI bound observables
		self.setupMenus = function() {
			// Clear observables first
			self.navMenus([]);
										
			var i;
			var isCurrent, isLast, children;
							
			// Go through site structure map to set up top level navigation menus
			// First add HOME menu
			isCurrent = (SCS.navigationCurr === SCS.navigationRoot) ? true : false;
			self.addNavMenu(SCS.navigationRoot, isCurrent, false /*isLast*/, false /*showSubmenus*/);
			console.log(SCS.navigationRoot);
			// Then add menus for sub pages under HOME
			children = SCS.structureMap[SCS.navigationRoot].children;
			for (i = 0; i < children.length; i++) {
				isCurrent = (SCS.navigationCurr === children[i]) ? true : false;
				isLast = (i === children.length - 1) ? true : false;
				self.addNavMenu(children[i], isCurrent, isLast, true /*showSubmenus*/);
			}

			//console.log("navMenus: ", JSON.stringify(self.navMenus()));
				
			// The following listener registration code must be run after the component template is added in DOM
			self.templateDfd.done(function() {
				// Remove rightarrow character on empty dropdown-submenu ('.dropdown-submenu > a:after')
				$('.dropdown-submenu > a').each(function() {
					//console.log("<a> next sibling's tag name: ", $(this).next().prop('tagName'));
					if ($(this).next().prop('tagName') !== 'UL') {
						$(this).addClass('no-arrow');
					}
				});
						
				$('.navbar-collapse')
					.on('shown.bs.collapse', function() {
						$('.navbar-toggle').addClass('dropped')
					})
					.on('hidden.bs.collapse', function() {
						$('.navbar-toggle').removeClass('dropped')
					});
					
				// Listener on menus with external site navigation
				$(".dropdown-toggle[target='_blank']").click(function(event) {
					//console.log("EXTERNAL SITE MENU clicked");
					$(this).blur(); // remove focus on the menu after it is clicked so it is not highlighted
					$(this).next(".dropdown-menu").css('display', ''); // reenable menu's dropdown if it is present
				});
			});
		};
						
		// Get the current customSettingsData values
		SitesSDK.getProperty('customSettingsData', self.updateCustomSettingsData);

		// Listen for settings change
		SitesSDK.subscribe('SETTINGS_UPDATED', self.updateSettings);

//		// TODO: Need to listen for any EXECUTE ACTION request to handle custom actions?
//		SitesSDK.subscribe(SitesSDK.MESSAGE_TYPES.EXECUTE_ACTION, $.proxy(self.executeActionListener, self));
	};

	// ----------------------------------------------
	// Create a knockout-based component implemention
	// ----------------------------------------------
	var ComponentImpl = function(args) {
		// Initialze the custom component
		this.init(args);
	};

	// initialize all the values within the component from the given argument values
	ComponentImpl.prototype.init = function(args) {
		this.createViewModel(args);
		this.createTemplate(args);
		this.setupCallbacks();
	};

	// create the viewModel from the initial values
	ComponentImpl.prototype.createViewModel = function(args) {
		this.viewModel = new ComponentViewModel(args);
	};

	// create the template based on the initial values
	ComponentImpl.prototype.createTemplate = function(args) {
		// create a unique ID for the div to add, this will be passed to the callback
		this.contentId = args.id + '_content_' + args.mode;
		// create a hidden custom component template that can be added to the DOM
		var template = (typeof $ === 'function' && typeof $.fn.modal === 'function') ? navMenuTemplate :
			'<div style="margin: 20px;">The Site\'s theme must contain jQuery and Bootstrap plugins in order for this ContentNavMenu component to work.</div>';
		this.template = 
			'<div id="' + this.contentId + '">' +
				template +
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
			//console.log("render CALLBACK");
			var self = this;
			
			// Set up nav menus
			this.viewModel.setupMenus();

			// add the custom component template to the DOM
			$(container).append(this.template);
			
			// apply the bindings
			ko.applyBindings(this.viewModel, $('#' + this.contentId)[0]);
			
			if (!this.viewModel.dependencyMissing) {
				// notify view model that the template is added in the DOM
				this.viewModel.templateDfd.resolve(true);

				// TODO: Is this still required for NavMenu component?
				// Overwrite 'overflow: hidden;' style on div.scs-custom-component-wrapper element.
				// Otherwise, dropdown menus are clipped.
				$(container).closest(".scs-custom-component-wrapper").css("overflow", "visible");
				if (SCS.renderMode === 'edit') {
					$(container).closest(".scs-component-bounding-box").css("overflow", "visible");
				}

				// register other listeners
				$(document).on({
					mouseenter: function() {
						$(this).parents('.dropdown').addClass('curfocus');
					},
					mouseleave: function() {
						$(this).parents('.dropdown').removeClass('curfocus');
					}
				}, ".dropdown-toggle");
			}
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
						self.viewModel.updateCustomSettingsData(property.value);
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
	// Create the factory object for the component
	// ----------------------------------------------
	var componentFactory = {
		createComponent: function(args, callback) {
			// return a new instance of the component
			return callback(new ComponentImpl(args));
		}
	};

	return componentFactory;
});