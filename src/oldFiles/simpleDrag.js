/**
 * Created by daniil on 12.10.17.
 */
function simpleDrag(selectorId, marginX = 0, marginY = 0)
{
	var selected = null, // Object of the element to be moved
		x_pos = 0, y_pos = 0, // Stores x & y coordinates of the mouse pointer
		x_elem = 0, y_elem = 0; // Stores top, left values (edge) of the element

// Will be called when user starts dragging an element
	function _drag_init(elem, e)
	{
		// Store the object of the element which needs to be moved
		selected = elem;
		x_elem = e.offsetX;
		y_elem = e.offsetY;
	}

// Will be called when user dragging an element
	function _move_elem(e)
	{
		x_pos = document.all ? window.event.clientX : e.pageX;
		y_pos = document.all ? window.event.clientY : e.pageY;
		if (selected !== null)
		{
			selected.style.left = (x_pos - marginX - x_elem) + 'px';
			selected.style.top = (y_pos - marginY - y_elem) + 'px';
		}
	}

// Destroy the object when we are done
	function _destroy()
	{
		selected = null;
	}

// Bind the functions...
	document.getElementById(selectorId).onmousedown = function (e)
	{
		if (e.target == this)
		{
			_drag_init(this, e);
		}
		return false;
	};

	document.onmousemove = _move_elem;
	document.onmouseup = _destroy;
}