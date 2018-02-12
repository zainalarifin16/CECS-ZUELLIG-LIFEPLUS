/** header.js
 *
 * @version 1.0
 * @requires bootstrap.min.js
 * @requires bootstrap.css
 * @requires header.css
 */

// TODO: Hard coded data for now. To convert to real caas searches when 'Product Catalog' content type is defined.
var catalogData = {
	catalog: [
		{
			category: "Drinks",
			label: "Drinks",
			items: [ "Bottled Drinks", "Freshly Brewed Coffee", "Iced Coffee", "Chocolate Beverages",
				 "Espresso Beverages", "Blended Beverages", "Kids' Drinks & Others", "Smoothies",
				 "Sodas", "Teas", "Cold Brew Coffee" ]
		},
		{
			category: "Food",
			label: "Food",
			items: [ "Bakery", "Starbucks Petites", "Bistro Boxes", "Hot Breakfast",
					 "Sandwiches, Paninis & Salads", "Yogurt and Fruit", "Starbucks Snack Collection" ]
		},
		{
			category: "Nutrition",
			label: "Nutrition",
			items: [ "Food Nutrition", "Drink Nutrition", "Delicious Drinks Under 200 Calories",
					 "Favorite Foods Under 350 Calories" ]
		}
	]	
};

/** renderNode()
 *
 * Facilitates creations of navigation menus by building properly structured
 * and linked navigation nodes. Recursive functionality allows this menu
 * to build sub-elements to an unlimited depth.
 *
 * @param {int} id - the id of the menu item as retrieved from SCS object
 * @param (int) detailPageId - the id of a detail page in the site
 * @param (Object) contentTypes - content type data
 * @param {HTMLElement} navBar - navbar DOM object
 * @param {bool} top - adds "dropdown-submenu" class if false, "dropdown" class if true
 * @param {bool} last - adds "last" class to menu item for styling
 * @param {bool} current - adds current class to menu item for styling
 * @param {bool} recursive - toggle recursive fucntion to build sub-menu items
 * @returns {bool} elementSelected - true if sub-menu item has been selected
 */
function renderNode(id, detailPageId, contentTypes, navBar, top, last, current, recursive) {
	var elementSelected = false;
	if (id >= 0) {
		var navNode = SCS.structureMap[id];
		if (navNode && ((typeof navNode.hideInNavigation != "boolean") || (navNode.hideInNavigation === false))) {
			var navItem = document.createElement("li");
			if (navNode.children.length > 0 && !top) {
				navItem.classList.add("dropdown-submenu");
			} else {
				navItem.classList.add("dropdown");
			}

			/*  Flag menu with class "current" if the page is active */
			if (current) {
				navItem.classList.add("current");
			}

			/*  Flag menu with class "last" if this is the last navigation item */
			if (last) {
				navItem.classList.add("last");
			}

			/*  Add text node which will display navigation item name */
			var navText = document.createTextNode(navNode.name);
			/*  Create href link for menu item and add styling flags */
			var navLink = document.createElement("a");
			navLink.classList.add("dropdown-toggle");
			navLink.setAttribute('data-hover', 'dropdown');
			/*  Add text node which will display navigation item name */
			var linkData = SCSRenderAPI.getPageLinkData(navNode.id) || {};
			if (linkData.href) {
				navLink.href = linkData.href;
			}
			if (linkData.target) {
				navLink.target = linkData.target;
			}

			navLink.appendChild(navText);
			navItem.appendChild(navLink);
			
			var contentTypeDef = null;
			var li, headerP, headerLink;
			var itemOl, itemLi, itemLink;
			var contentData, category, contentItem, top10OfCategoryUrl;
			var items; // TODO: delete it after product catalog data is returned from caas
			var i, j;
			
			for (i = 0; i < contentTypes.types.length; i ++) {
				if (navNode.name.toUpperCase() === contentTypes.types[i].name.toUpperCase()) {
					contentTypeDef = contentTypes.types[i];
					break;
				}
			}
			
			if (contentTypeDef && contentTypeDef.hasCategoryField) {
				navItem.classList.add("content-link");
				navItem.classList.add(contentTypeDef.menuDivId + "-link");
				
				// Register mouseenter and mouseleave handlers on top menus and dropdown menus.
				// For edit mode, we want the dropdown menu to stay up when mouse leaves so that users can drag&drop
				// a Sites component to the slot on dropdown menu. A click is required to dismiss a dropdown menu in edit mode.
				$(navItem)
					.mouseenter(function() {
						$(".dropdown-menu.content-menu").hide();
						$('.dropdown.content-link').removeClass('currDropdownTop');
						$("#" + contentTypeDef.menuDivId + ".dropdown-menu.content-menu").show();
						$('.dropdown.content-link.' + contentTypeDef.menuDivId + "-link").addClass('currDropdownTop');
					})
					.mouseleave(function() {
						if (SCSRenderAPI.renderMode !== 'edit') {
							$("#" + contentTypeDef.menuDivId + ".dropdown-menu.content-menu").hide();
							$(this).removeClass('currDropdownTop');
						}
					});
				$("#" + contentTypeDef.menuDivId + ".dropdown-menu.content-menu")
					.mouseenter(function() {
						$(this).show();
						$('.dropdown.content-link.' + contentTypeDef.menuDivId + "-link").addClass('currDropdownTop');
					})
					.mouseleave(function() {
						if (SCSRenderAPI.renderMode !== 'edit') {
							$(this).hide();
							$('.dropdown.content-link').removeClass('currDropdownTop');
						}
					});
				
				// TODO: HARDCODED FOR 'PRODUCT CATALOG' MENU
				if (navNode.name === 'PRODUCT CATALOG') {
					for (i = 0; i < catalogData.catalog.length; i ++) {
						category = catalogData.catalog[i].category;
						items = catalogData.catalog[i].items;

						li = document.createElement("li");
						$("#" + contentTypeDef.menuDivId + ".content-menu .block-container>ol").append($(li));

						headerP = document.createElement("p");
						li.appendChild(headerP);

						headerLink = document.createElement("a");
						headerLink.textContent = catalogData.catalog[i].label;
						headerP.appendChild(headerLink);

						if (items.length > 0) {
							itemOl = document.createElement("ol");
							li.appendChild(itemOl);

							for (j = 0; j < items.length; j ++) {
								itemLi = document.createElement("li");
								itemOl.appendChild(itemLi);

								itemLink = document.createElement("a");
								itemLink.textContent = items[j];
								itemLi.appendChild(itemLink);
							}
						}
					}									
				} else {
				
					// Set up content categories
					contentData = setupContentCategories(contentTypeDef);
					
					for (i = 0; i < contentData.contentItems.length; i ++) {
						category = contentData.contentItems[i].category;

						li = document.createElement("li");
						$("#" + contentTypeDef.menuDivId + ".content-menu .block-container>ol").append($(li));
						
						headerP = document.createElement("p");
						li.appendChild(headerP);

						headerLink = document.createElement("a");
						headerLink.textContent = contentData.contentItems[i].label;
						headerLink.dataset.category = category;
						headerP.appendChild(headerLink);

						// Find top 10 most recent content items under each category
						top10OfCategoryUrl = '/content/management/api/v1/items?field:type:equals=' + contentTypeDef.name +
							'&field:' + contentTypeDef.name.toLowerCase() + '_category="' + category +
							'"&fields=ALL&orderBy=updateddate:des&links=&limit=10';
						$.ajax({
							type: 'GET',
							url: top10OfCategoryUrl,
							dataType: 'json'
						}).done(function(data, textStatus, jqXHR) {
							contentItem = setupContentItemsForOneCategory(contentTypeDef.name, data, contentData);

							if (contentItem && contentItem.items.length > 0) {
								itemOl = document.createElement("ol");
								// li points to the last category, which cannot be used here. Need to relocate the proper li element
								//li.appendChild(itemOl);
								$("#" + contentTypeDef.menuDivId + ".content-menu a[data-category='" + contentItem.category + "']").parent().after($(itemOl));

								for (j = 0; j < contentItem.items.length; j ++) {
									itemLi = document.createElement("li");
									itemOl.appendChild(itemLi);

									itemLink = document.createElement("a");
									itemLink.textContent = contentItem.items[j].name;
									itemLink.href = getDetailPageLinkForContent(detailPageId, contentTypeDef.name, contentItem.items[j]);
									itemLi.appendChild(itemLink);
								}
							}
						}).fail(function(jqXHR, textStatus, errorThrown) {
							console.log("Can't get content items under category " + category, textStatus, errorThrown);
						});					
					}
				}

				// Mark top content menu if its sub page is the current page
				// NOTE: content sub page should hide from navigation.
				if (navNode.children.length > 0 && recursive) {
					for (var c = 0; c < navNode.children.length; c++) {
						var subcurrent = (SCS.navigationCurr === navNode.children[c]) ? true : false;
						if (subcurrent) {
							navItem.classList.add("currParent");
							elementSelected = true;
							break;
						}

//						// No handling of recursive sub pages
//						if (renderNode(navNode.children[c], detailPageId, contentTypes, navSub, false, false, subcurrent, true)) {
//							navItem.classList.add("currParent");
//							elementSelected = true;
//						}
					}
				}
			}
			else {
				$(navItem).mouseenter(
					function() {
						$(".dropdown-menu.content-menu").hide();
						$('.dropdown.content-link').removeClass('currDropdownTop');
					});
					
				// Set up sub menus for sub pages recursively
				if (navNode.children.length > 0 && recursive) {
					var navSub = document.createElement("ul");
					navSub.classList.add("dropdown-menu");
					for (var c = 0; c < navNode.children.length; c++) {
						var subcurrent = (SCS.navigationCurr === navNode.children[c]) ? true : false;
						if (subcurrent) {
							navItem.classList.add("currParent");
							elementSelected = true;
						}

						if (renderNode(navNode.children[c], detailPageId, contentTypes, navSub, false, false, subcurrent, true)) {
							navItem.classList.add("currParent");
							elementSelected = true;
						}
					}

					navItem.appendChild(navSub);
				}
			}
			
			navBar.appendChild(navItem);
		}
	}
	return elementSelected;
}

function setupContentCategories(contentTypeDef) {
	var contentItems = [];
	var i;
	for (i = 0; i < contentTypeDef.categoryOptions.length; i ++) {
		contentItems.push(
			{ category: contentTypeDef.categoryOptions[i].category,
			  label: contentTypeDef.categoryOptions[i].label, 
			  items: [] });		
	}
	
	return { contentItems: contentItems };
}

function setupContentItemsForOneCategory(contentTypeName, data, contentData) {
	var itemCount = data.hasOwnProperty('items') ? data.items.length : 0;
	var category, item, it, fld;
	var contentItem = null;
	
	if (itemCount > 0) {
		category = data.items[0].data[contentTypeName.toLowerCase() + '_category'];
		for (fld = 0; fld < contentData.contentItems.length; fld ++) {
			if (contentData.contentItems[fld].category === category) {
				contentItem = contentData.contentItems[fld];
				break;
			}
		}
		
		for (it = 0; it < itemCount; it ++) {
			item = data.items[it];
			contentItem.items.push(
				{ id : item.id,
				  name: item.name,
				  description: item.description,
				  link: item.link.href });
		}
	}
	
	return contentItem;
}

// Gets the detail page id for the given content type or any detail page id or -l if there is no detail page defined.
function getDetailPageId(contentType) {
	var detailPageId = -1,
		contentDetailPageId = -1;
	
	for (var prop in SCS.structureMap) {
		if (SCS.structureMap.hasOwnProperty(prop)) {
			if (SCS.structureMap[prop].isDetailPage) {
				if (detailPageId === -1) {
					detailPageId = SCS.structureMap[prop].id;
				}
				if (!contentType || contentDetailPageId !== -1) {
					break;
				}
				if (SCS.structureMap[prop].name.toUpperCase().indexOf(contentType.toUpperCase()) >= 0) {
					contentDetailPageId = SCS.structureMap[prop].id;
					break;
				}
			}
		}
	}
	
	return (contentDetailPageId !== -1) ? contentDetailPageId : detailPageId;
}

// Gets the detail page URL for the given Content Item or null if no detail page is defined
function getDetailPageLinkForContent(detailPageId, contentType, contentItem) {
	return (detailPageId === -1) ? null :
		SCSRenderAPI.getPageLinkData(detailPageId,
			{ contentType: contentType, contentId: contentItem.id, contentName: contentItem.name }).href;
}

function getContentTypes() {
	var dfd = $.Deferred();
	
	// We cache parsed result from 'aggregates/types' in session storage, as that CAAS call could be quite expensive.
	if (window.sessionStorage && window.sessionStorage.getItem('oracle.cecs.contentTypes')) {
		dfd.resolve(JSON.parse(window.sessionStorage.getItem('oracle.cecs.contentTypes')));
	} else {
		// Fetch all content types
		$.ajax({
			type: 'GET',
			url: '/content/management/api/v1/aggregates/types?links=',
			dataType: 'json'
		}).done(function(data, textStatus, jqXHR) {
			//console.log("Content Types: ", data);
			var contentTypes = {};
			var types = [];
			var menuIndex = 0; 
			var i, j, k, name, hasCategoryField, catOps, categoryOptions, menuDivId;
			for (i = 0; i < data.items.length; i ++) {
				name = data.items[i].name;
				hasCategoryField = false;
				categoryOptions = [];
				for (j = 0; j < data.items[i].fields.length; j ++) {
					if (data.items[i].fields[j].name === (name.toLowerCase() + '_category')) {
						hasCategoryField = true;
						menuDivId = 'contentmenu' + (++ menuIndex);
						catOps = data.items[i].fields[j].settings.caas.editor.options;
						if (catOps  && catOps.valueOptions) {
							for (k = 0; k < catOps.valueOptions.length; k ++) {
								categoryOptions.push(
									{ category: catOps.valueOptions[k].value,
									  label: catOps.valueOptions[k].label });
							}
						}
						
						break;
					}
				}
				types.push({ name: name, hasCategoryField: hasCategoryField,
							 categoryOptions: categoryOptions, menuDivId: menuDivId });
			}
			
			// TODO: REMOVE! HARDCODED FOR NOW!
			types.push( { name: 'Product Catalog', hasCategoryField: true,
				categoryOptions: [], menuDivId: 'contentmenu' + (++ menuIndex) });
			
			contentTypes = { types: types };
			if (window.sessionStorage) {
				window.sessionStorage.setItem('oracle.cecs.contentTypes', JSON.stringify(contentTypes));
			}
			dfd.resolve(contentTypes);
		}).fail(function(jqXHR, textStatus, errorThrown) {
			console.log("Can't get content types: ", textStatus, errorThrown);
			dfd.reject(); // TODO: fail callback?
		});		
	}
	
	return dfd.promise();
}

/** renderNav()
 *
 *	Main method for instantiating menu.  It must be called using event listener
 *	to ensure that both the DOM and the SCS object are available.  Navigation items are
 *	derived from the SCS object and iteratively constructed using renderNode method.  The
 *	result is appended to an empty div in the DOM with id of "topnav"
 **/

function renderNav()
{
	var detailPageId = -1;
	var topnav = document.getElementById("topnav"); // expected to be an empty <div>
	if (topnav) {
		detailPageId = getDetailPageId('Blog'); // TODO: remove hardcoded content type
		
		getContentTypes().done(function(contentTypes) {
			//console.log("done():", contentTypes);
			var navBar = document.createElement("ul");
			navBar.classList.add("nav");
			navBar.classList.add("navbar-nav");
			//Add Home page menu to navbar
			var current = (SCS.navigationCurr === SCS.navigationRoot) ? true : false;
			renderNode(SCS.navigationRoot, detailPageId, contentTypes, navBar, true, false, current, false);
			var children = SCS.structureMap[SCS.navigationRoot].children;
			for (var i = 0; i < children.length; i++) {
				current = (SCS.navigationCurr === children[i]) ? true : false;
				var last = (i === children.length - 1) ? true : false;
				renderNode(children[i], detailPageId, contentTypes, navBar, true, last, current, true);
			}

			topnav.appendChild(navBar);
		});
	}
}

/**	linkNavigation()
 *
 *	Creates a link that is attached to the site's "logo" corporate identity element.
 *	This method is necessary because URL structures are very different in public and
 *	edit modes
 *
 **/

function linkNavigation() {
	var sitesRoot = SCSRenderAPI.getPageLinkData(SCS.navigationRoot).href;
	$(".logocontainer").wrap("<a href='" + sitesRoot + "'>");
}

/***
 *	The following code will provide the necessary delays to ensure that both DOM
 *	and SCS properties are available to the script.
 *
 *	To use this code in another template, simply include /path/to/header.js in a template.
 **/

if (document.addEventListener) {
	document.addEventListener('scsrenderstart', renderNav, false);
} else if (document.attachEvent) {
	document.documentElement.scsrenderstart = 0;
	document.documentElement.attachEvent("onpropertychange", function(event) {
		if (event && (event.propertyName == "scsrenderstart"))
		{
			renderNav();
			linkNavigation();
		}
	});
}

$(document).mouseup(function (e) {        
	$(".dropdown-menu").each(function() {
		if (!$(this).is(e.target) // if the target of the click isn't the container...
			&& $(this).has(e.target).length === 0) { // ... nor a descendant of the container
			// Hide the dropdown menu
			$(this).hide();
			// Remove highlight on correspondent top menu
			var id = $(this).attr('id');
			$('.dropdown.content-link.' + id + '-link').removeClass('currDropdownTop');
		}  
	});
});
