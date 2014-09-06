
(function() {

	Snap.plugin( function( Snap, Element, Paper, global ) {
		var lineAttributes = { stroke: 'red', strokeWidth: 2, strokeDasharray: "5,5" };

		var ftOption = {
			handleFill: "silver",
			handleStrokeDash: "5,5",
			handleStrokeWidth: "2",
			handleLength: "75",
			handleRadius: "7",
			handleLineWidth: 2,
		};

		Element.prototype.setHandles = function( set ) {
			if( set == true) {
				this.data('freetransform', true)
			} else {
				this.removeData('freetransform');
			}
			return this.data('freetransform');
		};

		Element.prototype.hasHandles = function() {
			return this.data('freetransform');
		};

		Element.prototype.ftCreateHandles = function( optionalPaper ) {
			if( isFtElement( this ) ) {	//we dont want to freetransform our own handles
				return;
			}
			this.setHandles( true );
			var paper = optionalPaper || this.paper;
			this.ftInit();
			var freetransEl = this;
			var bb = freetransEl.getBBox(0);
			var tbb = transformedBoundingBox( this.node, this.paper.node );
			var rotateDragger = paper.circle(tbb.cx + tbb.width + ftOption.handleLength, tbb.cy, ftOption.handleRadius )
						.attr({ fill: ftOption.handleFill, class: 'freetransform' });

			var translateDragger = paper.circle(tbb.cx, tbb.cy, ftOption.handleRadius )
						.attr({ fill: ftOption.handleFill, class: 'freetransform' });

			var joinLine = freetransEl.ftDrawJoinLine( rotateDragger, translateDragger )
						.attr({ class: 'freetransform' });
			var handlesGroup = paper.g( joinLine, rotateDragger, translateDragger );

			handlesGroup.data('owner', this );
			doubleClickRemove( handlesGroup );

			freetransEl.data( "handlesGroup", handlesGroup );
			freetransEl.data( "joinLine", joinLine);

			freetransEl.data( "scaleFactor", calcDistance( tbb.cx, tbb.cy, rotateDragger.attr('cx'), rotateDragger.attr('cy') ) );

			translateDragger.drag( 	elementDragMove.bind(  translateDragger, freetransEl ), 
						elementDragStart.bind( translateDragger, freetransEl ),
						elementDragEnd.bind( translateDragger, freetransEl ) );

			rotateDragger.drag( 
				dragHandleRotateMove.bind( rotateDragger, freetransEl ), 
				dragHandleRotateStart.bind( rotateDragger, freetransEl  ),
				dragHandleRotateEnd.bind( rotateDragger, freetransEl  ) 
			);
			freetransEl.ftStoreInitialTransformMatrix();

			freetransEl.ftHighlightBB();
			return this;
		};

		Element.prototype.ftInit = function() {
			this.data("angle", 0);
			this.data("scale", 1);
			this.data("tx", 0);
			this.data("ty", 0);
			return this;
		};

		Element.prototype.ftGetScale = function() {
			return this.data("scale");
		};

		Element.prototype.ftGetRotation = function() {
			return this.data("angle");
		};

		Element.prototype.ftGetTranslation = function() {
			return { tx: this.data("tx"), ty: this.data("ty") };
		};

		Element.prototype.ftCleanUp = function() {
			var myClosureEl = this;
			var myData = ["angle", "scale", "scaleFactor", "tx", "ty", "otx", "oty", "bb", "bbT", "initialTransformMatrix", "handlesGroup", "joinLine"];
			myData.forEach( function( el ) { myClosureEl.removeData([el]) });
			return this;
		};

		Element.prototype.ftStoreStartCenter = function() {
			this.data('ocx', this.attr('cx') );
			this.data('ocy', this.attr('cy') );
			return this;
		}
		
		Element.prototype.ftStoreInitialTransformMatrix = function() {
			this.data('initialTransformMatrix', this.transform().localMatrix );
			return this;
		};

		Element.prototype.ftGetInitialTransformMatrix = function() {
			return this.data('initialTransformMatrix');
		};

		Element.prototype.ftRemoveHandles = function() {
			if( isFtElement( this ) ) {       //we want to remove elements freetransform not freetransforms own freetransform
                                return;
                        };
			this.setHandles( false );
			this.data( "handlesGroup").remove();
			this.data( "bbT" ) && this.data("bbT").remove();
			this.data( "bb" ) && this.data("bb").remove();
			this.ftCleanUp();
			return this;
		};

		Element.prototype.ftDrawJoinLine = function( rotateHandle, dragHandle ) { // note, handle could be either dragger or rotater
			var lineAttributes = { stroke: ftOption.handleFill, strokeWidth: ftOption.handleStrokeWidth, strokeDasharray: ftOption.handleStrokeDash };

			if( this.data("joinLine") ) {
				this.data("joinLine").attr({ x1: dragHandle.attr('cx'), y1: dragHandle.attr('cy'), x2: rotateHandle.attr('cx'), y2: rotateHandle.attr('cy') });
			} else {
				return this.paper.line( dragHandle.attr('cx'), dragHandle.attr('cy'), rotateHandle.attr('cx'), rotateHandle.attr('cy') ).attr( lineAttributes );
			};

			return this;
		};

		Element.prototype.ftTransformedPoint = function( x, y ) {
			var transform = this.transform().diffMatrix;
			return { x:  transform.x( x,y ) , y:  transform.y( x,y ) };
		};

		
		Element.prototype.ftUpdateTransform = function() {
			var tstring = "t" + this.data("tx") + "," + this.data("ty") + this.ftGetInitialTransformMatrix().toTransformString() + "r" + this.data("angle") + 'S' + this.data("scale" );		
			this.attr({ transform: tstring });
			this.data("bb") && this.ftHighlightBB();
			return this;
		};

		Element.prototype.ftHighlightBB = function() {
			this.data("bb") && this.data("bb").remove();
			var tbb = transformedBoundingBox( this.node, this.paper.node );
			this.data("bb", this.paper.rect( rectObjFromBB( tbb ) )
							.attr({ fill: "none", stroke: ftOption.handleFill, strokeDasharray: ftOption.handleStrokeDash }) ) 
			return this;
		};
	
		function hasClass(element, cls) {
                        return (' ' + element.className.baseVal + ' ').indexOf(' ' + cls + ' ') > -1;
                };

                function isFtElement( el ) {
                        if( hasClass( el.node, 'freetransform' ) ) {  //we dont want to freetransform our own handles
                                return true;
                        } else { return false; };
                };

                function doubleClickRemove( el ) {
                        el.dblclick( function() {
                                console.log( 'want to remove?', this, this.data('owner') );
                                this.data('owner').ftRemoveHandles();
                                el.undblclick();
                        } );
                };

	        function transformedBoundingBox(el, svg){
        	        var bb  = el.getBBox(),
                	m   = el.getTransformToElement( svg );

                	// Create an array of all four points for the original bounding box
                	var pts = [
                        	svg.createSVGPoint(), svg.createSVGPoint(),
                        	svg.createSVGPoint(), svg.createSVGPoint()
                	];
                	pts[0].x=bb.x;          pts[0].y=bb.y;
                	pts[1].x=bb.x+bb.width; pts[1].y=bb.y;
                	pts[2].x=bb.x+bb.width; pts[2].y=bb.y+bb.height;
                	pts[3].x=bb.x;          pts[3].y=bb.y+bb.height;

                	// Transform each into the space of the parent,
                	// and calculate the min/max points from that.    
                	var xMin=Infinity,xMax=-Infinity,yMin=Infinity,yMax=-Infinity;
                	pts.forEach(function(pt){
                        	pt = pt.matrixTransform(m);
                        	xMin = Math.min(xMin,pt.x);
                        	xMax = Math.max(xMax,pt.x);
                        	yMin = Math.min(yMin,pt.y);
                        	yMax = Math.max(yMax,pt.y);
                	});

                	// Update the bounding box with the new values
                	bb.x = xMin; bb.width  = xMax-xMin;
               	 	bb.y = yMin; bb.height = yMax-yMin;
                	bb.cx = bb.x + bb.width / 2;
                	bb.cy = bb.y + bb.height / 2;
                	return bb;
        	}

		function rectObjFromBB ( bb ) {
                	return { x: bb.x, y: bb.y, width: bb.width, height: bb.height }
        	}

        	function elementDragStart( mainEl, x, y, ev ) {
                	this.parent().selectAll('circle').forEach( function( el, i ) {
                        	        el.ftStoreStartCenter();
                	} );
                	mainEl.data("otx", mainEl.data("tx") || 0);
                	mainEl.data("oty", mainEl.data("ty") || 0);
        	};

        	function invTransformPoint( el, x, y ) {
                	var tdx, tdy;
                	var snapInvMatrix = el.transform().diffMatrix.invert();
                	snapInvMatrix.e = snapInvMatrix.f = 0;
                	return {
                        	tx: snapInvMatrix.x( x,y ),
                        	ty: snapInvMatrix.y( x,y )
                	}
        	}

	     	 function elementDragMove( mainEl, dx, dy, x, y ) {
                	var dragHandle = this;
                	var ip = invTransformPoint( this, dx, dy );
                	this.parent().selectAll('circle').forEach( function( el, i ) {
                        	el.attr({ cx: +el.data('ocx') + ip.tx, cy: +el.data('ocy') + ip.ty });
                	} );    

                	ip = invTransformPoint( mainEl, ip.tx, ip.ty );

                	mainEl.data("tx", mainEl.data("otx") + +ip.tx);
                	mainEl.data("ty", mainEl.data("oty") + +ip.ty);

                	mainEl.ftUpdateTransform();
                	mainEl.ftDrawJoinLine( dragHandle.parent()[1], dragHandle );
        	}

        	function elementDragEnd( mainEl, dx, dy, x, y ) {
        	};

        	function dragHandleRotateStart( mainElement,x,y,ev ) {
                	this.ftStoreStartCenter();
        	};      


      		function dragHandleRotateEnd( mainElement ) {
        	};

        	function dragHandleRotateMove( mainEl, dx, dy, x, y, event ) {
                	var handle = this;
                	var mainBB = mainEl.getBBox();
                	var tbb = transformedBoundingBox( mainEl.node, this.paper.node );
                
                	var ip = invTransformPoint( this, dx, dy );
                
                	handle.attr({ cx: +handle.data('ocx') + ip.tx, cy: +handle.data('ocy') + ip.ty });
                
                	mainEl.data("angle", Snap.angle( tbb.cx, tbb.cy, handle.attr('cx'), handle.attr('cy') ) - 180);
                
                	var distance = calcDistance( tbb.cx, tbb.cy, handle.attr('cx'), handle.attr('cy') ) ;
                
                	mainEl.data("scale", distance / mainEl.data("scaleFactor") );
                
                	mainEl.ftUpdateTransform();
                	mainEl.ftDrawJoinLine( handle, handle.parent()[2]); //rotate,drag       
        	};

        	function calcDistance(x1,y1,x2,y2) {
                	return Math.sqrt( Math.pow( (x1 - x2), 2)  + Math.pow( (y1 - y2), 2)  );
        	}


		
	});


})();



