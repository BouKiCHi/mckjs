/*******************************************=*
 string.js
 
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

// 文字列操作用オブジェクト
function StrReader()
{
}

StrReader.prototype = 
{
	set_class : function ( child )
	{
		for (var name in StrReader.prototype )
		{
			if (typeof(child[name]) == "undefined")
			{
				child[name] = StrReader.prototype[name];
			}
		}
	},
	
	// 文字列関連
	current : function ()
	{
		return this.string[ this.pos ];
	},
	step_pos : function ()
	{
		this.pos++;
	},
	step_pos_n : function ( num )
	{
		this.pos += num;
	},
	has_next : function ()
	{
		if (this.pos < this.string.length)
			return true;
		else 
			return false;
	},	
	current_code : function ()
	{
		return this.string.charCodeAt(this.pos);
	},
	
	get_length : function ()
	{
		return this.string.length;
	},
	
	is_space : function ()
	{
		var i = this.current_code();
		if ( i <= 0x20 )
			return true;
		
		return false;
	},
	
	skip_not_space : function()
	{
		for (; this.has_next(); this.step_pos() )
			if (this.current_code() <= 0x20)
				break;
	},
	
	skip_space : function()
	{
		for (; this.has_next(); this.step_pos() )
			if (this.current_code() > 0x20)
				break;
	},
	
	is_number : function ()
	{
		var chr = this.current();
		if (chr == '-' || chr == '$' || chr == 'x')
			return true;
		
		var i = this.current_code();
		
		if ( i  >= 0x30 && i <= 0x39 )
			return true;
		
		return false;
	},
	skip_number : function()
	{
		for (; this.has_next(); this.step_pos() )
			if ( ! this.is_number() )
				break;
	},
	number_parse : function()
	{
		var value = 0;
		var neg = false;
		
		if (this.current() == '$')
		{
			this.step_pos();
			value = parseInt(this.get_string(),16);
		}
		else
		{
			value = parseInt(this.get_string());
		}
		return value;
	},
	compare_string : function ( str )
	{
		if ( this.pos + str.length > this.string.length )
			return -1;
		
		for (var i = 0; i < str.length; i++)
		{
			if (str[i] != this.string[i + this.pos])
				return -1;
		}
		return 0;
		
	},
	get_string : function()
	{
		return this.string.slice(this.pos);
	}
};

