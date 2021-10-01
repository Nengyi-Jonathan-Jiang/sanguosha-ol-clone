function onDrag(container,f,resolve){
	container.addEventListener("touchstart", dragStart, false);
	container.addEventListener("mousedown", dragStart, false);
	document.addEventListener("touchend", dragEnd, false);
	document.addEventListener("mouseup", dragEnd, false);
	document.addEventListener("mousemove", drag, false);
	document.addEventListener("touchmove", drag, false);
  	var selectedEl = null;
	var func = _=>false;
	var elUnder = null;

	function dragStart(e) {
		let el = e.target;

		if(![...el.classList].includes("card") || el.dataset.disabled != 'false') return;

		el.style.setProperty('z-index',2);
		
		selectedEl = el;

		(function(x){
			el.initialX = x.clientX;
			el.initialY = x.clientY;	
		})(e.type === "touchstart" ? e.touches[0] : e)
		func = f(el);
	}

	function dragEnd(e) {
		if (!selectedEl) return;
		console.log("dragEnd: ",elUnder)
		setTranslate(0,0,selectedEl)
		selectedEl.style.setProperty('z-index',1);
		selectedEl.dataset["onTarget"] = "false";

		resolve(selectedEl,elUnder);

		selectedEl = elUnder = null;
	}

	function drag(e) {
		if (selectedEl) {
			e.preventDefault();

			let el = selectedEl; (function(x){
			
			el.currentX = x.clientX - el.initialX;
			el.currentY = x.clientY - el.initialY;

			setTranslate(el.currentX, el.currentY, el);

			el.dataset["onTarget"] = (elUnder = getElUnder(x.clientX,x.clientY,func)) != null;
			
			})(e.type === "touchmove" ? e.touches[0] : e)			
		}
	}

	function getElUnder(x, y, func) {
		var element, elements = [];
		var old_visibility = [];
		while (true) {
			element = document.elementFromPoint(x, y);
			if (!element || element === document.documentElement) break;
			if(func(element)){
				for (var k = 0; k < elements.length; k++) {
					elements[k].style.visibility = old_visibility[k];
				}
				return element;
			}
			elements.push(element);
			old_visibility.push(element.style.visibility);
			element.style.visibility = 'hidden'; // Temporarily hide the element (without changing the layout)
		}
		for (var k = 0; k < elements.length; k++) {
			elements[k].style.visibility = old_visibility[k];
		}
		return null;
	}

	function setTranslate(xPos, yPos, el) {
		el.style.setProperty("--translation-x",xPos + "px");
		el.style.setProperty("--translation-y",yPos + "px");
  	}
}