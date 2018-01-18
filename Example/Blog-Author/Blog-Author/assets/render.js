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
		this.contentClient = params.contentClient || params.scsData.contentClient;
	}

	ContentLayout.prototype = {
		render: function(parentObj) {
			try {
				
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

				contentClient.getItem({
					'itemGUID': content.data.blog_author.id
				}).then(function(authorData) {
					try {
						content.author = authorData;

						// Get blog author's detail page.
						// Bit of a hack since it is not given by default
						content.author.detailPageLink = content.scsData.detailPageLink.replace(content.type + "/" + content.id, content.author.type + "/" + content.author.id);

						// Get blog author's image
						content.imageAvatarURL = contentClient.getRenditionURL({
							'itemGUID': content.author.data.author_image_avatar.id,
							'contentType': contentType,
							'secureContent': secureContent
						});

						// Append HTML to DOM
						template = Mustache.render(templateHtml, content);
						$(parentObj).append(template);

					} catch (e) {
						console.error("Content Layout Component error: ", e);
					}
				}, function(xhr, textStatus, err) {
					console.error('Error retrieving author data: ' + textStatus + ' : ' + err);
				});
			} catch (e) {
                console.error("Content Layout Component error: ", e);
			}
		}
	};

	return ContentLayout;
});