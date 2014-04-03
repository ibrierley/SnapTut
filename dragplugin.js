var s = Snap("#svgout"); 

Snap.plugin( function( Snap, Element, Paper, global ) {
        Element.prototype.altDrag = function() {
        this.drag( dragMove, dragStart, dragEnd );
        return this;
    }
        
    var dragStart = function ( x,y,ev ) {
            this.data('ot', this.transform().local );
    }
 
    var dragMove = function(dx, dy, ev, x, y) {
            var tdx, tdy;
            var snapInvMatrix = this.transform().diffMatrix.invert();
            snapInvMatrix.e = snapInvMatrix.f = 0; 
            tdx = snapInvMatrix.x( dx,dy ); tdy = snapInvMatrix.y( dx,dy );
            this.transform( this.data('ot') + "t" + [ tdx, tdy ]  );

    }

    var dragEnd = function() {
    }


});

s.attr({ viewBox: "0 0 100 100" });

var t1 = s.text( -100, 20, "red = altDrag, blue = normal drag" );

var r1 = s.rect(0,0,20,20).transform('t50,50').attr({ fill: "red" }).altDrag();
var g1 = s.g( r1 ).transform('r45');

var r2 = s.rect(20,20,20,20).transform('t50,50').attr({ fill: " blue" }).drag();
var g2 = s.g( r2 ).transform('r45');


