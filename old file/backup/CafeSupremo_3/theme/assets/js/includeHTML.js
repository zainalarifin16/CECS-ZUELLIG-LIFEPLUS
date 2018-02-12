/**	includeHTML.js
 *
 *  @version 1.0
 *	@param {str} urlPrefix Prefix for SCS substitution engine, usually "_scs_theme_root_"  REQUIRED
 *	@param {str} includeFile Path to file to include, eg "/assets/html/xxfilenamexx.html"  REQUIRED
 *
 *	The method takes the specified file and includes it in an SCS layout page by replacing
 *  the an HTML element in the template called <includeHTML>
 *
 * 	exampleFile.html:
 *  <html>
 *		<body>
 *	 		<includeHTML urlPrefix="_scs_theme_root_" includeFile="/assets/html/includefile.html"></includeHTML>
 *			<script type="text/javascript" src="_scs_theme_root_/assets/js/includeHTML.js"></script>
 *  	</body>
 *	</html>
 *
 *	includefile.html
 *	<link rel="stylesheet" href="_scs_theme_root_/assets/css/footer.css">
 *  <footer>
 *		<div class="footer scs-slot scs-responsive" id="footer"></div>
 *	</footer>
 */

function includeHTML() {
	$('includeHTML').each(function() {
		var $this = $(this);
		if ($this.attr('includeFile')) {

			$.ajax({
				url: $this.attr('urlPrefix') + $this.attr('includeFile'),
				dataType: 'html',
				async: false,
				success: function(content) {
					content = content.replace(new RegExp('_scs_theme_root_', 'g'), $this.attr('urlPrefix'));
					$($this).replaceWith(content);
				}
			});
		}
	});
}

includeHTML();