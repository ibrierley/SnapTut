(function() {
        Snap.plugin( function( Snap, Element, Paper, global ) {

		Element.prototype.drawAtPath = function( path, timer, options) {

			var myObject = this, bbox = this.getBBox(1);
			var point, movePoint = {}, len = path.getTotalLength(), from = 0, to = len, drawpath = 0, easing = mina.linear, callback;
			var startingTransform = ''; 

			if( options ) {
				easing = options.easing || easing;
				if( options.reverse  ) { from = len; to = 0; };
				if( options.drawpath ) {
					drawpath = 1;
					path.attr({    
						fill: "none",
                                                strokeDasharray: len + " " + len,
                                                strokeDashoffset: this.len
	                                });

				};
				if( options.startingTransform ) {
					startingTransform = options.startingTransform;
				};
				callback = options.callback || function() {};
			};

			Snap.animate(from, to , function( val ) {
		        	point = path.getPointAtLength( val );
    				movePoint.x = point.x - bbox.cx; movePoint.y = point.y - bbox.cy;
    				myObject.transform( startingTransform + 't' + movePoint.x + ',' + movePoint.y + 'r' + point.alpha);

				if( drawpath ) {
					path.attr({ "stroke-dashoffset": len - val });
				};
  			}, timer, easing, callback ); 
		};
	});

})();

