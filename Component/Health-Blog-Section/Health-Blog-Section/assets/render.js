/* globals define, SCSRenderAPI */

define([
	'jquery',
	'./jquery-ui.min',
	'css!./layout.css',
	'css!./layoutBlogPost.css'	
], function( $ ) {
	'use strict';

	function SectionLayout( params ) {
		this.sectionLayoutData = params.sectionLayoutData || {};
		this.renderMode = params.renderMode || SCSRenderAPI.getRenderMode();
	}

	function ItemBlogAnimation(){
		$(".item-blog").hover(function(){
	        var children = $(this).find(".action-blog");
	        $(children).stop(true,true).toggle("slide", { direction: "up" }, 500);
	    }, function(){
	    	var children = $(this).find(".action-blog");
	        $(children).stop(true,true).toggle("slide", { direction: "up" }, 500);
	    });
	}

	SectionLayout.prototype = {

		render: function( parentObj ) {
			var html = '';
			var maxItems = 0;
			var emptyClass;
			var components = this.sectionLayoutData.components || [];

			if( this.sectionLayoutData.customSettingsData &&
				( typeof this.sectionLayoutData.customSettingsData.maxItems === 'number' ) &&
				( this.sectionLayoutData.customSettingsData.maxItems > 0 ) ) {
				maxItems = this.sectionLayoutData.customSettingsData.maxItems;
			}

			try {
				// Add the child components to the section layout.  For each of the child 
				// components, add a <div> to the page.  The child components will be 
				// rendered into these <div>s.
				html += '<div class="col-lg-12" style="margin-bottom: 15px;" ><div class="row" >';


				$.each( components, function( index, value ) {
					if( !maxItems || ( index < maxItems ) ) {
						html += '<div id="' + value + '" class="home-health-blog ';
						if(index == 0 || index % 3 == 0){
							if(index == 0){
								html += 'headline ';
							}
							html += 'col-sm-12 col-md-12 col-lg-12';
						}else{
							html += 'col-sm-12 col-md-6 col-lg-6';
						}
						html += ' item-blog" ></div>';
					}
				});

				html += '</div></div>';

				// Add a drop zone to the section layout in edit mode, if applicable
				if( ( this.renderMode === SCSRenderAPI.RENDER_MODE_EDIT )  &&
					( ( maxItems === 0 ) || ( components.length < maxItems ) ) ) {
					emptyClass = ( components.length > 0 ) ? '' : 'sl-empty';
					$(parentObj).append( '<div class="sl-list-drop-zone ' + emptyClass + '">Add Post</div>' );
				}

				if( html ) {
					$(parentObj).append( html );
					ItemBlogAnimation();
				} 
			} catch( e ) {
				console.error( e );
			}
		}

	};

	return SectionLayout;
});