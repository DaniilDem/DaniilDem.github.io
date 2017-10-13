/**
 * Created by daniil on 12.10.17.
 */
var supports3DTransforms =  document.body.style['webkitPerspective'] !== undefined ||
	document.body.style['MozPerspective'] !== undefined;

function rollLinks( selector ) {
	if( supports3DTransforms ) {

		var nodes = document.querySelectorAll( selector );

		for( var i = 0, len = nodes.length; i < len; i++ ) {
			var node = nodes[i];

			if( !node.className || !node.className.match( /roll/g ) ) {
				node.className += ' roll';
				node.innerHTML = '<span data-title="'+ node.text +'">' + node.innerHTML + '</span>';
			}
		};
	}
}
