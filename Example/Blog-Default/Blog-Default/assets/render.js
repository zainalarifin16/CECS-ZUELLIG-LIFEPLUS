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


			try {
                // Get formatted date
                content.formattedDate = dateToMDY(content.updateddate);

                // Get blog image
                content.imageHeaderURL = contentClient.getRenditionURL({
                    'itemGUID': (content.data.blog_image_thumbnail instanceof Object) ? content.data.blog_image_thumbnail.id : content.data.blog_image_thumbnail,
                    'contentType': contentType,
                    'secureContent': secureContent
                });

                // I Mustache you to bind this
                var template =  Mustache.render(templateHtml, content);
                $(parentObj).append(template);

            } catch (err) {
                console.error("Couldn't render content:", err);
            }
		}
	};

	function dateToMDY(date) {
		var dateObj = new Date(date.value);
		var options = {year: 'numeric', month: 'long', day: 'numeric'};
		var formattedDate = dateObj.toLocaleDateString('en-US', options);
		return formattedDate;
	}

	return ContentLayout;
});