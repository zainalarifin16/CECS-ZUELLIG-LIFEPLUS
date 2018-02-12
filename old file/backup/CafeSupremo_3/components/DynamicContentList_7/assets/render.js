/* globals define */
define(['./js/component'], function(ComponentImpl) {
	'use strict';

	/**
	 * Return a factory for the component.
	 */
	var componentFactory = {
		createComponent: function(args, callback) {
			// return a new instance of the component
			return callback(new ComponentImpl(args));
		}
	};

	return componentFactory;
});