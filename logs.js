
var logs = null;

function init_logs ( parentElem )
{
	if ( ! parentElem && logs )
		return;
	
	
	logs = document.createElement("div");
	logs.style.border = "solid 1px black";
	parentElem.appendChild ( logs );

	put_line("---- Log ---- ");
}

function put_line ( str )
{
	if ( ! logs )
		return;
		
	logs.appendChild( document.createTextNode(str) );
	logs.appendChild( document.createElement("br") );
}

function clear_lines ()
{
	if ( logs )
	{
		document.body.removeChild ( logs );
		logs = null;		
	}
}


