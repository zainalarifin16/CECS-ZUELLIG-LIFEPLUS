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
                    contentType;

                if (this.scsData) {
                    content = $.extend(content, { 'scsData': this.scsData });
                    contentType = content.scsData.showPublishedContent === true ? 'published' : 'draft';
                }

                // Get formatted date
                content.formattedDate = dateToMDY(content.updateddate);

				// Check blog_content availability
				if (!content.data.hasOwnProperty('blog_content')) {
					console.warn("blog_content field is not available in a ContentList component.");
					content.data.blog_content = "<b>Warning: This blog's content is not available when it is shown in a list.</b>"
				}
				
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