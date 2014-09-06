(function() {

  Snap.plugin( function( Snap, Element, Paper, global ) {
	var startDragTarget, startDragElement, startBBox, startScreenCTM;

	// Initialise our slider with its basic transform and drag funcs

	Element.prototype.initSlider = function( params ) {
			var emptyFunc = function() {};
			this.data('origTransform', this.transform().local );
			this.data('onDragEndFunc', params.onDragEndFunc || emptyFunc );
			this.data('onDragFunc', params.onDragFunc || emptyFunc );
			this.data('onDragStartFunc', params.onDragStartFunc || emptyFunc );
		}

	// initialise the params, and set up our max and min. Check if its a slider or knob to see how we deal

        Element.prototype.sliderAnyAngle = function( params ) {
		this.initSlider( params );
		this.data("maxPosX", params.max); this.data("minPosX", params.min);
		this.data("centerOffsetX", params.centerOffsetX); this.data("centerOffsetY", params.centerOffsetY)
		this.data("posX", params.min);
		if( params.type == 'knob' ) {
			this.drag( moveDragKnob, startDrag, endDrag );
		} else {
			this.drag( moveDragSlider, startDrag, endDrag );
		}
        }

	// load in the slider svg file, and transform the group element according to our params earlier.
        // Also choose which id is the cap

	Paper.prototype.slider = function( params ) {
		var myPaper = this,  myGroup;
		var loaded = Snap.load( params.filename, function( frag ) {
				myGroup = myPaper.group().add( frag );
				myGroup.transform("t" + params.x + "," + params.y);
				var myCap = myGroup.select( params.capSelector );
				myCap.data("sliderId", params.sliderId);
				myCap.sliderAnyAngle( params );
				sliderSetAttributes( myGroup, params.attr );
				sliderSetAttributes( myCap, params.capattr );
			} ); 
		return myGroup;
	}

	// Extra func, to pass through extra attributes passed when creating the slider

	function sliderSetAttributes ( myGroup, attr, data ) {
		var myObj = {};
		if( typeof attr != 'undefined' ) {
			for( var prop in attr ) {
				myObj[ prop ] = attr[prop];
				myGroup.attr( myObj );
				myObj = {};
			};
		};
	};

	// Our main slider startDrag, store our initial matrix settings. 
	
        var startDrag = function( x, y, ev ) {
		startDragTarget = ev.target;
		if( ! ( this.data("startBBox") ) ) {
			this.data("startBBox", this.getBBox());
			this.data("startScreenCTM",startDragTarget.getScreenCTM());
		}
        	this.data('origPosX', this.data("posX") ); this.data('origPosY', this.data("posY") );
		this.data("onDragStartFunc")();
    	}
    

	// move the cap, our dx/dy will need to be transformed to element matrx. Test for min/max
	// set a value 'fracX' which is a fraction of amount moved 0-1 we can use later.

    	function updateMovement( el, dx, dy ) {
		// Below relies on parent being the file svg element, 9
		var snapInvMatrix = el.parent().transform().globalMatrix.invert();
		snapInvMatrix.e = snapInvMatrix.f = 0; 
		var tdx = snapInvMatrix.x( dx,dy ), tdy = snapInvMatrix.y( dx,dy );

        	el.data("posX", +el.data("origPosX") + tdx) ; el.data("posY", +el.data("origPosY") + tdy);
		var posX = +el.data("posX"); //var posY = +el.data("posY");
		var maxPosX = +el.data("maxPosX"); 
		var minPosX = +el.data("minPosX"); 

		if( posX > maxPosX ) { el.data("posX", maxPosX ); };
		if( posX < minPosX ) { el.data("posX", minPosX ); };
		el.data("fracX", 1/ ( (maxPosX - minPosX) / el.data("posX") ) );
   	}


	// Call the matrix checks above, and set any transformation

  	function moveDragSlider( dx,dy ) {
        	var posX;
        	updateMovement( this, dx, dy );
        	posX = this.data("posX");
		this.attr({ transform: this.data("origTransform") + (posX ? "T" : "t") + [posX,0] });
		this.data("onDragFunc")(this);
  	};


	// drag our knob. Currently there is no min/max working, need to add a case for testing rotating anticlockwise beyond 0

	function moveDragKnob( dx,dy,x,y, ev ) {
		var pnt = startDragTarget.ownerSVGElement.createSVGPoint();
		pnt.x = ev.clientX; pnt.y = ev.clientY;
		var vPnt = pnt.matrixTransform(this.data("startScreenCTM").inverse());
		var transformRequestObj = startDragTarget.ownerSVGElement.createSVGTransform();

		var deg = Math.atan2(vPnt.x - this.data("startBBox").cx, vPnt.y - this.data("startBBox").cy) * 180 / Math.PI ;
		deg = deg + 180;
		this.transform('r' + -deg + "," + ( this.data("startBBox").cx - this.data("centerOffsetX") ) + "," + parseInt(this.data("startBBox").cy - -this.data("centerOffsetY") )  );
		this.data("fracX", deg/360);
		this.data("onDragFunc")(this);
	}



  	function endDrag() {
		this.data('onDragEndFunc')();
  	};
    
  });

})();


