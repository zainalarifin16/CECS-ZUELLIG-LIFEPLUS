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
				console.log(content.data);
                // Get formatted date
                content.formattedDate = dateToMDY(content.updateddate);
                // Get blog image
                content.imageHeaderURL = contentClient.getRenditionURL({
                    'itemGUID': (content.data["blog-postv2_image_post"] instanceof Object) ? content.data["blog-postv2_image_post"].id : content.data["blog-postv2_image_post"],
                    'contentType': contentType,
                    'secureContent': secureContent
                });
                // Get Title Post
                content.titlePost = content.data["blog-postv2_title"];
                // Get Summary Post
                content.summaryPost = content.data["blog-postv2_summary"];
                // Get Content Post
                content.contentPost = content.data["blog-postv2_content"];
                // Get Category Post
                var textCategoryPost = "";
                var valueCategoryPost = content.data["blog-postv2_category_post"];
                switch (valueCategoryPost) {
                	case "lifestyle-tips":
                		// statements_1
                		textCategoryPost = "Lifestyle Tips";
                		break;
                	case "lifestyle-goal":
                		textCategoryPost = "Lifestyle Goals";
                		break;
                	case "beauty-tips":
                		textCategoryPost = "Beauty Tips";
                		break;
                	case "ecoach":
                		textCategoryPost = "E-Coach";
                		break;
                	case "health-recipes":
                		textCategoryPost = "Health Recipes";
                		break;
                	case "industry-news":
                		textCategoryPost = "Industry News";
                		break;
                	case "disease-awareness":
                		textCategoryPost = "Disease & Awareness";
                		break;
                	case "rewards":
                		textCategoryPost = "Rewards";
                		break;
                	case "events":
                		textCategoryPost = "Events";
                		break;
                	default:
                		// statements_def
                		break;
                }

                content.categoryPost = textCategoryPost;

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