var myCode = $('code');
var buttonsCode;
var firstTime = 1;

$(".run").click( function( e ) { 
        buttonsCode = $( this ).parent()[0].firstChild.textContent ;
        try {
		if( firstTime ) {
	                $.globalEval( buttonsCode );		// creates s
			firstTime = 0;
		} else {
			$.globalEval( 's.clear(); ' + buttonsCode );
		}
                $("#htmlraw").text(  s.innerSVG() ); // s is required from s = Snap()
		var $clickarea = $("#testcode");
		var handlers;

		var br = document.createElement("br");
		var textNode = document.createTextNode( s.innerSVG() );
		//$("#htmlraw").append( textNode );
		var linebreak = document.createElement('br');
		var linebreak2 = document.createElement('br');
		var linebreak3 = document.createElement('br');
		$("#htmlraw").append( linebreak );
		$("#htmlraw").append( linebreak2 );
		textNode = document.createTextNode('Handlers (testing):');
		var linebreak4 = document.createElement('br');
		$("#htmlraw").append( textNode );
		$("#htmlraw").append( linebreak4 );
		var myElems = s.selectAll("*");
		for(var a = 0; a<myElems.length;a++) {
			handlers = null;
			handlers = myElems[a].events;
			if( handlers ) {
				textNode = document.createTextNode( JSON.stringify( handlers , null, ' ' ) );
				var func = handlers[0].f;
				var textFunc = document.createTextNode( JSON.stringify(  " ... " + func, null, ' ' ) );
				$("#htmlraw").append( linebreak3 );
				$("#htmlraw").append( myElems[a].type );
				$("#htmlraw").append( textNode );
				$("#htmlraw").append( textFunc );
			}

		}

        } catch(e){
                $("#htmlraw").text( 'Error: ' + e.type + ': ' + e  ); 
                console.log( e.type );
                console.log( e ); 
        }
} );


