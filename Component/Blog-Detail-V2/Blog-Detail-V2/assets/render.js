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
            try {
				
                var template,
                    content = $.extend({}, this.contentItemData),
                    contentType;

                if (this.scsData) {
                    content = $.extend(content, { 'scsData': this.scsData });
                    contentType = content.scsData.showPublishedContent === true ? 'published' : 'draft';
                }

                console.log("blog detail", content.data);

				// Check blog-post_content availability
				if (!content.data.hasOwnProperty('blog-postv3_content')) {
					console.warn("blog_post_content field is not available in a ContentList component.");
					content.data.blog_post_content = "<b>Warning: This blog's content is not available when it is shown in a list.</b>"
				}

				//get author
				content.author = content.data["blog-postv3_author"];
				// Get formatted date
                content.formattedDate = dateToMDY(content.updateddate);
				//get category post
				content.category_post = content.data["blog-postv3_category_post"];
				//get title
				content.title = content.data["blog-postv3_title"];
				//get content
				content.blog_post_content = content.data["blog-postv3_content"];
				//get image
				content.image_header = content.data["blog-postv3_media_post"][0];
				content.image_1  = content.data["blog-postv3_media_post"][1];
				content.image_2  = content.data["blog-postv3_media_post"][2];

				
                // Append HTML to DOM
                var template = Mustache.render(templateHtml, content);
                $(parentObj).append(template);

            } catch (e) {
                console.error("Content Layout Component error: ", e);
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
