/* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0
 * LastModified: Dec 25 1999
 * This library is free.  You can redistribute it and/or modify it.
 */

/*
 * Interfaces:
 * b64 = base64encode(data);
 * data = base64decode(b64);
 */


var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64DecodeChars = new Array(
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);


function base64x () 
{
	this.out = "";
	this.enctbl = new Array ();
	
	for ( var i = 0; i < base64EncodeChars.length; i++ )
	{
		this.enctbl[i] = base64EncodeChars.charAt(i);
	}
	
}

base64x.prototype =
{
	set_array : function ( array )
	{
		this.arr = array;
		this.length = array.length;
		this.pos = 0;
		this.out = "";
		this.c1 = this.c2 = this.c3 = 0;
		
	},
	
	encode : function ( block_len )
	{
		var count = 0;
		var tbl = this.enctbl;
		while ( this.pos < this.length && count < block_len )
		{
			this.c1 = this.arr[this.pos++] & 0xff;
			if (this.pos == this.length)
			{
				
				this.out += tbl[this.c1 >> 2];
				this.out += tbl[(this.c1 & 0x3) << 4];
				this.out += "==";
				break;
			}
			
			this.c2 = this.arr[this.pos++] & 0xff;
			if(this.pos == this.length)
			{
				this.out += tbl[this.c1 >> 2];
				this.out += tbl[((this.c1 & 0x3)<< 4) | ((this.c2 & 0xF0) >> 4)];
				this.out += tbl[(this.c2 & 0xF) << 2];
				this.out += "=";
				break;
			}
			this.c3 = this.arr[this.pos++] & 0xff;
			this.out += tbl[this.c1 >> 2];
			this.out += tbl[((this.c1 & 0x3)<< 4) | ((this.c2 & 0xF0) >> 4)];
			this.out += tbl[((this.c2 & 0xF) << 2) | ((this.c3 & 0xC0) >>6)];
			this.out += tbl[this.c3 & 0x3F];
			count++;
		}
	},
	
	encode_x : function ( block_len )
	{
		var count = 0;
		while ( this.pos < this.length && count < block_len )
		{
			this.c1 = this.arr[this.pos++] & 0xff;
			if (this.pos == this.length)
			{
				
				this.out += base64EncodeChars.charAt(this.c1 >> 2);
				this.out += base64EncodeChars.charAt((this.c1 & 0x3) << 4);
				this.out += "==";
				break;
			}
			
			this.c2 = this.arr[this.pos++] & 0xff;
			if(this.pos == this.length)
			{
				this.out += base64EncodeChars.charAt(this.c1 >> 2);
				this.out += base64EncodeChars.charAt(((this.c1 & 0x3)<< 4) | ((this.c2 & 0xF0) >> 4));
				this.out += base64EncodeChars.charAt((this.c2 & 0xF) << 2);
				this.out += "=";
				break;
			}
			this.c3 = this.arr[this.pos++] & 0xff;
			this.out += base64EncodeChars.charAt(this.c1 >> 2);
			this.out += base64EncodeChars.charAt(((this.c1 & 0x3)<< 4) | ((this.c2 & 0xF0) >> 4));
			this.out += base64EncodeChars.charAt(((this.c2 & 0xF) << 2) | ((this.c3 & 0xC0) >>6));
			this.out += base64EncodeChars.charAt(this.c3 & 0x3F);
			count++;
		}
	},
	is_finish : function ()
	{
		return ( this.pos >= this.length );
	},
	result : function ()
	{
		return this.out;
	}
};


function base64enc_array(arr) {
    var out, i, len;
    var c1, c2, c3;

    len = arr.length;
    i = 0;
    out = "";
    while(i < len) {
	c1 = arr[i++] & 0xff;
	if(i == len)
	{
	    out += base64EncodeChars.charAt(c1 >> 2);
	    out += base64EncodeChars.charAt((c1 & 0x3) << 4);
	    out += "==";
	    break;
	}
	c2 = arr[i++] & 0xff;
	if(i == len)
	{
	    out += base64EncodeChars.charAt(c1 >> 2);
	    out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
	    out += base64EncodeChars.charAt((c2 & 0xF) << 2);
	    out += "=";
	    break;
	}
	c3 = arr[i++] & 0xff;
	out += base64EncodeChars.charAt(c1 >> 2);
	out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
	out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >>6));
	out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
}


function base64encode(str) {
    var out, i, len;
    var c1, c2, c3;

    len = str.length;
    i = 0;
    out = "";
    while(i < len) {
	c1 = str.charCodeAt(i++) & 0xff;
	if(i == len)
	{
	    out += base64EncodeChars.charAt(c1 >> 2);
	    out += base64EncodeChars.charAt((c1 & 0x3) << 4);
	    out += "==";
	    break;
	}
	c2 = str.charCodeAt(i++);
	if(i == len)
	{
	    out += base64EncodeChars.charAt(c1 >> 2);
	    out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
	    out += base64EncodeChars.charAt((c2 & 0xF) << 2);
	    out += "=";
	    break;
	}
	c3 = str.charCodeAt(i++);
	out += base64EncodeChars.charAt(c1 >> 2);
	out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
	out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >>6));
	out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
}

function base64decode(str) {
    var c1, c2, c3, c4;
    var i, len, out;

    len = str.length;
    i = 0;
    out = "";
    while(i < len) {
	/* c1 */
	do {
	    c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
	} while(i < len && c1 == -1);
	if(c1 == -1)
	    break;

	/* c2 */
	do {
	    c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
	} while(i < len && c2 == -1);
	if(c2 == -1)
	    break;

	out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

	/* c3 */
	do {
	    c3 = str.charCodeAt(i++) & 0xff;
	    if(c3 == 61)
		return out;
	    c3 = base64DecodeChars[c3];
	} while(i < len && c3 == -1);
	if(c3 == -1)
	    break;

	out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

	/* c4 */
	do {
	    c4 = str.charCodeAt(i++) & 0xff;
	    if(c4 == 61)
		return out;
	    c4 = base64DecodeChars[c4];
	} while(i < len && c4 == -1);
	if(c4 == -1)
	    break;
	out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
    }
    return out;
}
