/**
 * Created by daniil on 13.10.17.
 */
function hideMe(selectorBtn, selectorBlock)
{
	var $block = $(selectorBlock);
	var oldOpacity=getAlpha($block);

	var $blockObjects = $block.find(':not('+selectorBtn+')');
	var $btn = $(selectorBtn);
	var state = 'show';

	$btn.on('click', function ()
	{      // Attach toggle function that fire different
		// callback when clicked.
		if (state == 'show')
		{
			state = 'hide';
			$blockObjects.animate({opacity:0});
			setAlpha($block, 0);
		}
		else
		{
			state = 'show';
			$blockObjects.animate({opacity:1});
			setAlpha($block, oldOpacity);
		}
	});


	function getAlpha($elem)
	{
		var bg=$elem.css('backgroundColor');
		var a=bg.slice(4).split(',');
		return parseFloat(a[3]);
	}

	function setAlpha($elem, newAlpha)
	{
		var bg=$elem.css('backgroundColor');
		var a=bg.slice(4).split(',');
		var newBg='rgba'+a[0]+','+parseInt(a[1])+','+parseInt(a[2])+','+newAlpha+')';
		$elem.css('backgroundColor',newBg);
	}

}