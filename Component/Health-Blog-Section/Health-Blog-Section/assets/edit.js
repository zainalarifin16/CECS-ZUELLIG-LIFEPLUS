/* globals define */

define([
	'jquery'
], function( $ ) {
	'use strict';

	function EditHandlers( params ) {
		this.componentId = params.componentId;
	}

	EditHandlers.prototype = {

		onDragOver: function( evt, dataTransfer ) {
			var response = true; // Allow the drop

			// Only allow the designated number of child components to
			// be added to this component.
			var slData = SCSRenderAPI.getComponentInstanceData( this.componentId );
			if( slData && slData.customSettingsData &&
				( typeof slData.customSettingsData.maxItems === 'number' ) &&
				( slData.customSettingsData.maxItems > 0 ) ) {

				if( Array.isArray( slData.components ) &&
					( slData.components.length >= slData.customSettingsData.maxItems ) ) {
					// To prevent the drop, return a string.  A non-empty string
					// displays in a tooltip.  An empty string just prevents the drop.
					response = 'Maximum Items: ' + slData.customSettingsData.maxItems;
				}
			}

			return response;
		}

	};

	return EditHandlers;
});