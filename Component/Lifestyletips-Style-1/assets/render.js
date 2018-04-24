/* globals define */

define([
	'jquery',
	'mustache',
	'text!./layout.html',
	'css!./design.css'
], function($, Mustache, templateHtml, css) {
	'use strict';

	function ContentLayout(params) {
		this.contentItemData = params.contentItemData || {};
		this.scsData = params.scsData;
		this.contentClient = params.contentClient;
	}

	function dateToMDY(date) {
		var dateObj = new Date(date);

		var options = { year: 'numeric', month: 'long', day: 'numeric' };
		var formattedDate = dateObj.toLocaleDateString('en-US', options);

		return formattedDate;
	}

	function isDigitalAsset(id) {
		return /^DigitalAsset_/i.test(id) || (id.length === 36 && (/^CONT/.test(id) || /^CORE/.test(id)));
	}

	ContentLayout.prototype = {

		render: function(parentObj) {
			var template,
				content = $.extend({}, this.contentItemData),
				contentClient = this.contentClient,
				contentType,
				secureContent = false;

			if (this.scsData) {
				content = $.extend(content, { 'scsData': this.scsData });
				contentType = content.scsData.showPublishedContent === true ? 'published' : 'draft';
				secureContent = content.scsData.secureContent;
			}

			content.render = {};
			content.render.items = [];

			function addItem(p) {
				if (typeof p === 'string' && isDigitalAsset(p) && contentClient) {
					var params = { 'itemGUID': p, 'contentType': contentType, 'secureContent': secureContent },
						renditionURL = contentClient.getRenditionURL(params);
					content.render.items.push({ 'image': renditionURL });
				} else if (typeof p === 'object') {
					// Digital Asset
					if (p.type === 'DigitalAsset' && contentClient) {
						var params = { 'itemGUID': p.id, 'contentType': contentType, 'secureContent': secureContent },
							renditionURL = contentClient.getRenditionURL(params);
						content.render.items.push({ 'image': renditionURL });
					}
					// Reference
					else if (p.type != null) {
						content.render.items.push({ 'text': p.id });
					}
					// Date Object
					else if (p.timezone !== undefined) {
						content.render.items.push({ 'text': dateToMDY(p.value) });
					}
				} else if (typeof p === 'string' || typeof p === 'number' || typeof p === 'boolean') {
					content.render.items.push({ 'text': p });
				}

			}

			for (var property in content.data) {
				if (content.data.hasOwnProperty(property)) {
					var p = content.data[property];
					if (p !== null) {
						// add property id
						content.render.items.push({ 'label': property });

						// add property value(s)
						if ($.isArray(p)) {
							for (var i in p) {
								addItem(p[i]);
							}
						} else {
							addItem(p);
						}
					}
				}
			}

			// handle no items
			if (content.render.items.length === 0) {
				content.render.items.push({ 'text': content.name });
			}

			// Link to data
			for (var l in content.links) {
				var link = content.links[l];
				if (link.rel === 'self') {
					content.render.self = link.href;
					break;
				}
			}

			try {
				// Mustache
				template = Mustache.render(templateHtml, content);

				if (template) {
					$(parentObj).append(template);
				}
			} catch (e) {
				console.error(e.stack);
			}
		}
	};

	return ContentLayout;
});
