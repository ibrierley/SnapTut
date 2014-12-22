
Snap.plugin( function( Snap, Element, Paper, global ) {

	function stopEventDefaults( ev ) {
		if ( ev.stopPropagation ) { ev.stopPropagation();     };
                if ( ev.preventDefault )  { ev.preventDefault(event); };
                ev.cancelBubble = true;
                ev.returnValue = false;
	};
	
	function getMousePoint( ev, el, x, y ) {
		var evx = x || ev.clientX || ev.center.x;
		var evy = y || ev.clientY || ev.center.y;
		return el.getInverseScreenPoint( evx, evy );
	};

	Element.prototype.handleScroll = function( ev ){
  		if ( !ev ) ev = event;
		stopEventDefaults( ev );
  		var z = ( ev.detail < 0 || ev.wheelDelta > 0) ? 1.1 : 0.9;	// needs changing to not be incremental
		var pt = this.getMousePoint( ev );	
		this.node.viewBox ? this.viewBoxZoom( pt, z ) : this.elementZoom( pt, z ); // hmm what if its a symbol or something with viewBox do they have transform?
		return this.ftUpdateHandlesIfExist();
	};

	function getZoomMatrixWithOffset( pt, z ) {
		return Snap.matrix().translate( pt.x, pt.y ).scale( z ).translate( -pt.x, -pt.y );
	};

	Element.prototype.elementZoom = function( pt, z ) {
		return this.storeInitialTransform()
		           .transform( this.getInitialTransform().toTransformString() + getZoomMatrixWithOffset(pt, z).toTransformString() );
	};

	Element.prototype.zoomCenter = function( z ) {	
		if( !this.node.viewBox ) {
			var pt = this.getBoundingCenter();
			this.elementZoom( pt, z );
		} else {
			console.log( 'vb center in zoom not done yet' );
		};
	};

	Element.prototype.globalToLocal = function( globalPoint ) {
		var globalToLocal = this.node.getTransformToElement( this.paper.node ).inverse();
		globalToLocal.e = globalToLocal.f = 0;
		return globalPoint.matrixTransform( globalToLocal );
	};

	Element.prototype.getCursorPoint = function( x, y ) {
		var pt = this.paper.node.createSVGPoint();	
		pt.x = x; pt.y = y;
		return pt.matrixTransform( this.paper.node.getScreenCTM().inverse()); 
	};

	Element.prototype.viewBoxZoom = function( pt, z ) {	//may not be an svg paper, do we want to do this ?
		var vbInfo = this.getViewboxInfo();			//split func and make smaller ?
		var matrix = getZoomMatrixWithOffset( pt, z );
		newx = matrix.x( vbInfo.x, vbInfo.y );
		newy = matrix.y( vbInfo.x, vbInfo.y );
		newvb = newx + ' ' + newy  + ' '  + vbInfo.width * z + ' ' + vbInfo.height * z ;
		return this.paper.attr({ viewBox: newvb });	
	};

	Element.prototype.getViewBox = function() {		//not tested properly, maybe varies per browser
		return this.paper.attr('viewBox') || { x: this.paper.node.x.baseVal.value, y: this.paper.node.y.baseVal.value, 
				width: this.paper.node.width.baseVal.value, height: this.paper.node.height.baseVal.value };
        };

	Element.prototype.createPoint = function( x, y ) {	// should I use this.paper or farthestviewport ?
		var pt = this.paper.node.createSVGPoint();	// not used yet, may not work
		pt.x = x; pt.y = y;
		return pt;
	};

	Element.prototype.getInverseScreenPoint = function( x,  y) {
		return this.createPoint( x, y ).matrixTransform( this.node.getScreenCTM().inverse() );
	};

	Element.prototype.getMousePoint = function( ev, x, y ) {
                var evx = x || ev.clientX || ev.center.x;
                var evy = y || ev.clientY || ev.center.y;
                return this.getInverseScreenPoint( evx, evy );
        };


	Element.prototype.getEventPoint = function( ev ) {		// combine these two somehow, different events depending on where its from
		var pt = this.createPoint();
		pt.x = ev.srcEvent ? ev.srcEvent.clientX : ( ev.clientX || ev.center.x );
		pt.y = ev.srcEvent ? ev.srcEvent.clientY : ( ev.clientY || ev.center.y );
		return pt.matrixTransform( this.paper.node.getScreenCTM().inverse() );
	};
 
	Element.prototype.getBoundingCenter = function( farthestViewPort ) {	// not sure if which viewport makes any diff
		var pt = this.paper.node.createSVGPoint();
		var bb = this.getBBox();
		pt.x = bb.cx; pt.y = bb.cy;	
		return pt;	
	};

	Element.prototype.storeNewRotate = function( angle ) {
		return this.data( "newrotate", angle );
	};

	Element.prototype.createNewViewbox = function() {
		var newPan = this.getNewPan();
                var vbInfo = this.getOriginalViewbox();
                var vbw = vbInfo.width / this.getNewScale();
                var vbh = vbInfo.height / this.getNewScale(); 
                var vbx = vbInfo.x - ( vbw - vbInfo.width ) / 2 + +newPan.dx;
                var vby = vbInfo.y - ( vbh - vbInfo.height ) / 2 + +newPan.dy; 
		return { x: vbx, y: vby, width: vbw, height: vbh };
	};


	// http://stackoverflow.com/questions/8417089/svg-viewbox-zoom-in-center-raphael
	Element.prototype.updateTransform = function() {
		if( this.type == 'svg' ) {
			var vb = this.createNewViewbox();
			this.attr({ viewBox: vb.x + ' ' + vb.y + ' ' + vb.width + ' ' + vb.height } );
		} else {
			var newTransform = this.getInitialTransform().toTransformString() + 'r' + this.getNewRotation() + 's' + this.getNewScale() + this.getNewPanString();
			this.transform( newTransform ).resetNewTransforms();
		};
		return this.ftUpdateHandlesIfExist();
	};

	Element.prototype.getViewboxInfo = function() {
		var vbRect = this.getViewBox();
		var width  = vbRect.width  || this.paper.node.width.baseVal.value;
		var height = vbRect.height || this.paper.node.height.baseVal.value;
		var x = vbRect.x || 0; var y = vbRect.y || 0;
		return { cx: x + width / 2, cy: y + height / 2, x: x, y: y, width: width, height: height };
	};

	Element.prototype.resetNewTransforms = function() {
		var fields = ['newrotate', 'newscale', 'newtx', 'newty' ]; // need to add some more, itm ovb etc????
		for( var i = 0; i < fields.length; i++ ) {
			this.removeData( fields[i] );
		};
	};

	Element.prototype.addTransform = function( t ) {
                return this.transform( this.transform().localMatrix.toTransformString() + t );
        };

	Element.prototype.storeNewScale = function( scale ) {
		return this.data('newscale', scale );
        };

	Element.prototype.getNewScale = function() {
		return this.data("newscale") || '1';
	};
	
	Element.prototype.getCurrentRotation = function() { 
		return this.transform().localMatrix.split().rotate;
        };

	Element.prototype.getStartRotation = function() {
		return this.getInitialTransform().split().rotate || 0; //this.transform().localMatrix.split().rotate;
	};

	Element.prototype.getCurrentScale = function() {
		return this.transform().localMatrix.split().scalex;
	};

	Element.prototype.getNewRotation = function() {
		return this.data("newrotate") || 0;
	};

	Element.prototype.getCurrentTranslate = function() {
		var decomposed = this.transform().localMatrix.split();
		return { dx: decomposed.dx, dy: decomposed.dy }; 
	};

	Element.prototype.storeInitialTransform = function () {
		return	this.data("ovb", this.paper.getViewboxInfo()) // for viewbox ?
		    	    .data( "itm", this.transform().localMatrix );
	};

	Element.prototype.getInitialTransform = function() {
		return this.data('itm') || Snap.matrix();//this.transform().localMatrix;
	};

	Element.prototype.pinchMove = function( ev ) {
		stopEventDefaults( ev );
		return this.storeNewRotate( ev.rotation )
			   .storeNewScale(  ev.scale )
			   .updateTransform()
	};

	Element.prototype.resetStates = function( ev ) {
		this.resetNewTransforms();
		return this.storeInitialTransform();
	};

	Element.prototype.getOriginalViewbox = function() {
		return this.data('ovb');
	};

	Element.prototype.getNewPan = function() {
		return { dx: this.data('newtx') || 0, dy: this.data('newty' ) || 0 };
	};

	Element.prototype.getNewPanString = function( dx, dy ) {
		var newPan = this.getNewPan();
		return 't' + newPan.dx + ',' + newPan.dy;
	};

	Element.prototype.storeDragStart = function( x, y ) {
		this.data('ox', x); this.data('oy', y);
		return this;
	};

	Element.prototype.getDragStart = function() {
		return { x: this.data('ox'), y: this.data('oy') };
	};

	Element.prototype.storeNewPan = function( dx,dy ) {
		this.data('newtx', dx ); this.data('newty', dy );
		return this;
	};

	Element.prototype.onPanStart = function( ev ) {
		this.resetStates();
		this.storeInitialTransform();
		var tpt = this.getEventPoint( ev );
		return this.storeDragStart( tpt.x, tpt.y );
	};

	Element.prototype.panMove = function( ev ) {
		stopEventDefaults( ev );
		var tpt = this.getEventPoint( ev );
		var opt = this.getDragStart();
		var cursorPoint = this.getEventPoint( ev );
		var pt = this.createPoint();
		pt.x = cursorPoint.x - opt.x;
		pt.y = cursorPoint.y - opt.y;
		var localPoint = this.globalToLocal( pt );
		this.storeNewPan( localPoint.x, localPoint.y );
		return this.updateTransform();
        };

	Element.prototype.panInc = function( x, y ) {
		this.storeInitialTransform();
		this.storeNewPan( x, y );
		return this.updateTransform();
	};

	Element.prototype.panBy = function( x, y ) {
		this.storeNewPan( x, y );
		return this.updateTransform();
	};

	Element.prototype.rotateInc = function( angle ) {
		this.storeInitialTransform();
		this.storeNewRotate( angle );
		return this.updateTransform();
	};

	Element.prototype.rotateBy = function( angle ) {
		this.storeNewRotate( angle );
		return this.updateTransform();
	};

	Element.prototype.scaleInc = function( factor ) {
                this.storeInitialTransform();
                this.storeNewScale( factor );
                return this.updateTransform();
        };

	Element.prototype.scaleBy = function( factor ) {
                this.storeNewScale( factor );
                return this.updateTransform();
        };

	Element.prototype.animateFunc = function(from, to, func, timer, easing, callback ) {
	   	this.storeInitialTransform();
        	return Snap.animate(from, to, func.bind(this), timer, easing, callback );
	};

	Element.prototype.addMouseWheelHandler = function() {
		this.node.addEventListener('DOMMouseScroll', this.handleScroll.bind(this,null)); // for Firefox
		this.node.addEventListener('mousewheel',     this.handleScroll.bind(this,null)); // others
		return this;
	};

	Element.prototype.svgFocus = function() {
		var bb = this.getBBox();
		return this.paper.attr({ viewBox: bb.x + ' ' + bb.y + ' ' + bb.width + ' ' + bb.height } );	
	};

	Element.prototype.animateSvgFocus = function( duration, easing, callback ) {
		var vb = this.getViewboxInfo();
		var bb = this.getBBox(0);
		return this.animateFunc( [vb.x, vb.y, vb.width, vb.height], [bb.x, bb.y, bb.width, bb.height], function( v ) {
			this.paper.attr({ viewBox: v.join(" ") } );
		}, duration, easing, callback );
	};

	Element.prototype.getFtHandles = function() {
		return this.data('ftHandles');
	};

	Element.prototype.ftSetHandle = function( el ) {
		return this.data('ftHandles', el );
	};

	Element.prototype.ftGetElement = function() {
		return this.data('ftElement');
	};

	Element.prototype.ftSetElement = function( el ) {
		return this.data('ftElement', el );
	};

	Element.prototype.ftUpdateHandlesIfExist = function() {
		this.getFtHandles() && this.getFtHandles().ftUpdateHandlePosition();
		return this;
	};

       Element.prototype.ftCreateHandles = function() {
                var bb = this.getBBox();
                var rotator = this.paper.circle(bb.cx + bb.width, bb.cy, 8).attr({ class: 'handle' })
				  .drag( ftDragMove, ftDragStart );
		var center = this.paper.circle(bb.cx, bb.cy, 8).attr({ class: 'handle' });
                var joinLine = this.paper.line( bb.cx, bb.cy, bb.cx + bb.width, bb.cy ).attr({ fill: 'blue', stroke: 'blue', class: 'join', strokeDasharray: "5,5" } );
		var handles  = this.paper.g( rotator, joinLine )
		          	         .ftSetElement( this );
		this.data('hbb', this.highlightBBox());
		return this.ftSetHandle( handles );  
        };

	Element.prototype.getTransformedBB = function() {
		var bb = this.getBBox();
		var m = this.transform().diffMatrix;
		return { x: m.x( bb.cx, bb.cy ), y: m.y( bb.cx, bb.cy ) };
	};

	Element.prototype.ftUpdateHandlePosition = function() {
		var dx, dy; 
		var tbb = this.ftGetElement().getTransformedBB();
		this.ftGetJoins().forEach( function( el ) { 
			dx = el.attr('x1') - tbb.x; dy = el.attr('y1') - tbb.y;
			el.attr({ x1: tbb.x, y1: tbb.y, x2: el.attr('x2') - (el.attr('x1') - tbb.x), y2: el.attr('y2') - ( el.attr('y1') - tbb.y)  });
		});
		this.ftGetHandles().forEach( function( el ) {
			el.attr({ cx: el.attr('cx') - dx, cy: el.attr('cy') - dy });
		});
		this.ftGetElement().highlightBBox();
	};

	Element.prototype.storeScaleFactor = function( scaleFactor ) {
		return this.data('scaleFactor', scaleFactor );
	};

	Element.prototype.getScaleFactor = function( scaleFactor ) {
                return this.data( 'scaleFactor' );
        };

	Element.prototype.storeStartAngle = function( angle ) {
		return this.data('startangle', angle );
	};

	Element.prototype.getStartAngle = function() {
		return this.data( 'startangle' );
	};

	Element.prototype.storeLastAngle = function( angle ) {
                return this.data('lastangle', angle );
        };

        Element.prototype.getLastAngle = function() {
                return this.data( 'lastangle' );
        };
	
        function ftDragStart(x,y,ev ) {	//refactor smaller
		var ftElement = this.resetStates().parent().ftGetElement().resetStates();
		var tbb = this.parent().ftGetElement().getTransformedBB(); // hmm parent() feels a bit clunky
		this.storeScaleFactor( calcDistance( this.getBBox().cx, this.getBBox().cy, tbb.x, tbb.y ));
		var tpt = this.getEventPoint( ev );
		return this.storeDragStart( tpt.x, tpt.y )
		           .storeStartAngle( this.getStartAngle() + +this.getLastAngle() || 0);
        };
        
        function ftDragMove( dx, dy, x, y, ev ) {	//refactor smaller ?
                this.panMove( ev );
		var ftElement = this.parent().ftGetElement(); // hmmm parent stuff?? 
              	var bb = this.getBBox();
        	this.parent().ftGetJoins().forEach( function( el ) { el.ftUpdateJoin( bb.cx, bb.cy ) });
		var tbb = ftElement.getTransformedBB();
		var angle = Snap.angle( tbb.x, tbb.y, this.getBBox().cx, this.getBBox().cy)  - 180 - this.getStartAngle();
		this.storeLastAngle( angle );
		var distance = calcDistance( tbb.x, tbb.y, this.getBBox().cx, this.getBBox().cy );
		ftElement.storeNewRotate( angle )
			 .scaleBy( distance / this.getScaleFactor() );
        };

	function calcDistance(x1,y1,x2,y2) {
		return Math.sqrt( Math.pow( (x1 - x2), 2)  + Math.pow( (y1 - y2), 2)  );
	}

	Element.prototype.ftUpdateJoin = function( cx, cy ) {
		return this.attr({ x2 : cx, y2 : cy });
	};

	Element.prototype.ftGetJoins = function() {
		return  this.parent().selectAll('.join');
	};

	Element.prototype.ftGetHandles = function() {
		return this.parent().selectAll('.handle');	// will it always be parent ????
	};

	Element.prototype.highlightBBox = function() {
		var bb = this.getBBox();
		this.data('hbb') && this.data('hbb').remove();
		var tbb = this.getTransformedBB();
		var rect = this.paper.rect(tbb.x - bb.width/2, tbb.y - bb.height/2, bb.width, bb.height ).attr({ fill: 'none', stroke: 'black', strokeWidth: 4, opacity: 0.1, strokeDasharray:  '5,5' })
		this.data('hbb', rect);
		return rect;
	};


	// create svg animation markup proper (standalone)

	function setDefaults( attrs, defaults ) {
		for( var k in defaults ) { 
                	if( typeof attrs[k] === 'undefined' ) {
                        	attrs[ k ] = defaults[ k ];
                        };
                };
		return attrs;
	};

        Paper.prototype.markupAnimate = function( attr ) {
		return this.el('animate').attr( setDefaults( attr, { attributeType: "CSS", repeatCount: "indefinite" } ) );	
        };

	Paper.prototype.markupAnimateTransform = function( attr ) {
		return this.el('animateTransform').attr( setDefaults( attr, { attributeName: 'transform', attributeType: "XML", additive: "replace" } ) );
	};

	Paper.prototype.markupAnimateColor = function( attr ) {
                return this.el('animateColor').attr( setDefaults( attr, { attributeName: 'fill', attributeType: "XML", repeatCount: "indefinite" } ) );
        };

	Paper.prototype.markupAnimateMotion = function( attr ) {
		return this.el('animateMotion', setDefaults( attr, { repeatCount: "indefinite" } ) );
        };
		
	Paper.prototype.markupMpath = function( attr ) {
		return this.el('mpath', setDefaults( attr, {} ) );
	};

	Element.prototype.markupAnimateMotion = function( attr, mpath ) {
		var pathString = attr[ 'path' ];
		delete attr[ 'path' ];
		var el = this.paper.markupAnimateMotion( attr ) ;
		if( pathString ) {
			el.node.setAttribute( 'path', pathString );
		};
		if( mpath ) {
			el.append( mpath );
		};
		this.append( el );
                return el;
        }; 
		
	Element.prototype.markupAnimateColor = function( attr ) {
                return this.append( this.paper.markupAnimateColor( attr ) );
        };

	Element.prototype.markupAnimateTransform = function( attr ) {
		return this.append( this.paper.markupAnimateTransform( attr ) );
	};

	Element.prototype.markupAnimate = function( attr ) {
		return this.append( this.paper.markupAnimate( attr ) );
	};

});
