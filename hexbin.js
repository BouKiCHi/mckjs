/*******************************************=*
 hexbin.js
 
 Copyright (c) 2011 BouKiCHi
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 *********************************************/


function Bin()
{
	this.data = new Array();
}

Bin.prototype = 
{
	push_8 : function( value )
	{
		this.data.push ( value & 0xff );
	},
	push_16le : function ( value )
	{
		if (value < 0)
			value = 0x10000 + value;
		
		this.data.push ( value  & 0xff );
		this.data.push ( (value >> 8) & 0xff );
	},
	push_32le : function ( value )
	{
		this.data.push ( value  & 0xff );
		this.data.push ( (value >> 8) & 0xff );
		this.data.push ( (value >> 16) & 0xff );
		this.data.push ( (value >> 24) & 0xff );
	},
	push_bin : function ( tailbin )
	{
		this.data = this.data.concat ( tailbin.get_data() );
	},
	push_str : function ( str )
	{
		for ( var i = 0; i < str.length; i++ )
			this.push_8 ( str.charCodeAt(i) );
	},	
	get_length : function ( )
	{
		return this.data.length;
	},
	get_data : function ( )
	{
		return this.data;
	}
};

var hex_tbl = "0123456789ABCDEF";

function hex8( value )
{
	return ""+hex_tbl[ (value >> 4) & 0xf] + hex_tbl[ value & 0xf ];
}

function hex16 ( value )
{
	return hex8( value >> 8 ) + hex8( value );
}

function hex32 ( value )
{
	return hex16( value >> 16 ) + hex16( value );
}


function hex_test()
{
	var str = "hex8:" + hex8(0xff);
	str += "  hex16:" + hex16(0x7890);
	str += "  hex32:" + hex32(0xdeadbeaf);
	str += "  hex32:" + hex32(0x12345678);
	
	put_line ( str );
	
}

function hex_dump( array , len )
{
	for ( var addr = 0; addr < len; addr += 0x10 )
	{
		var str = hex16( addr ) + ": ";
		for ( var i = 0; i < 0x10 && i + addr < len; i++ )
		{
			str += hex8 ( array[ addr + i ] ) + " ";
		}
		
		for ( var i = 0; i < 0x10 && i + addr < len; i++ )
		{	 
			var value = array [ addr + i ];
			if (value < 0x20 || value > 0x7e) 
				str += ".";
			else
				str += String.fromCharCode ( value );
		}
		put_line( str );
	}	
}
