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

			try {
				console.log(content.data);
                // Get formatted date
                // content.formattedDate = dateToMDY(content.updateddate);
                // Get coach image
                content.imageHeaderURL = contentClient.getRenditionURL({
                    'itemGUID': (content.data["coach_profile_picture_coach"] instanceof Object) ? content.data["coach_profile_picture_coach"].id : content.data["coach_profile_picture_coach"],
                    'contentType': contentType,
                    'secureContent': secureContent
                });
                // Get name Coach
                content.nameCoach = content.data["coach_name_coach"];
                // Get bio Coach
                content.bioCoach = content.data["coach_bio_coach"];

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
