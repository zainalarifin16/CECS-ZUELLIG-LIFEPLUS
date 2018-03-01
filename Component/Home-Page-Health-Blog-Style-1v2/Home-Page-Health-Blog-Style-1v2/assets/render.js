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


			try {
				console.log(content.data);
                // Get formatted date
                content.formattedDate = dateToMDY(content.updateddate);
                // Get blog image

                var headerImage = content.data["blog-postv3_media_post"][0];
                console.log(headerImage);
                content.imageHeaderURL = contentClient.getRenditionURL({
                    'itemGUID': (headerImage instanceof Object) ? headerImage.id : headerImage,
                    'contentType': contentType,
                    'secureContent': secureContent
                });
                // Get Title Post
                content.titlePost = content.data["blog-postv3_title"];
                // Get Summary Post
                content.summaryPost = content.data["blog-postv3_summary"];
                // Get Content Post
                content.contentPost = content.data["blog-postv3_content"];
                // Get Category Post
                var textCategoryPost = "";
                var valueCategoryPost = content.data["blog-postv3_category_post"];
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

	return ContentLayout;
});
