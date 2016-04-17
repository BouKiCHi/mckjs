/*******************************************=*
 header.js
 
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

// ヘッダ関連
function Header ()
{
	this.volume  = new Array();
	this.note    = new Array();
	this.pitch   = new Array();
	this.duty    = new Array();
	this.softlfo = new Array();
	this.title   = null;
	
	StrReader.prototype.set_class ( Header.prototype );
}

Header.prototype = 
{

	backet_read : function ()
	{
		var backet = new Array();
		var end_flag = false;
		
		
		this.skip_space();
		if (this.current() != '=')
			return; // error!!
		
		this.step_pos();
		
		this.skip_space();
		
		if ( this.current() != '{' )
			return null;
		
		this.step_pos();
		
		backet.loop_point = -1;
		
		for (; this.has_next() && !end_flag; )
		{
			this.skip_space();
			
			if (this.is_number())
			{
				backet.push ( this.number_parse() );
				this.skip_number();
			}
			else
			{
				switch ( this.current() )
				{
					case '|':
						backet.loop_point = backet.length;
						break;
					case ',':
						break;
					case '}':
						end_flag = true;
						break;
					default:
						// error!!
						break;
				}
				this.step_pos();
			}
		}
		
		return backet;		
	},
	
	disp_backet : function ( obj )
	{
		var str = "n=" + obj.number + ":";
		for ( var i = 0; i < obj.length; i++)
		{
			str += obj[i] + ",";
		}
		str += "lp=" + obj.loop_point;
		
		put_line( str );		
	},
	
	env_backet : function ()
	{
		if (!this.is_number())
			return null; // error!!
		
		var num = this.number_parse();
		this.skip_number();
		
		var backet = this.backet_read();
		
		if ( backet )
		{
			backet.number = num;
			// this.disp_backet ( backet );
			return backet;
		}
		return null;
	},
	header : function ()
	{
		if (this.compare_string("#TITLE") == 0)
		{
			this.step_pos_n(6);
			this.skip_space();
			
			str = this.get_string();
			this.title = str;
		}
	},
	envelope : function ()
	{
		if (this.compare_string("@MP") == 0)
		{
			this.step_pos_n(3);
			var env = this.env_backet();
			if (env && env.length == 4)
				this.softlfo[env.number] = env;			
		}
		else
		if (this.compare_string("@EP") == 0)
		{
			this.step_pos_n(3);
			var env = this.env_backet();
			if (env)
				this.pitch[env.number] = env;			
		}
		else
		if (this.compare_string("@EN") == 0)
		{
			this.step_pos_n(3);
			var env = this.env_backet();
			if (env)
				this.note[env.number] = env;
		}
		else
		if (this.compare_string("@v") == 0)
		{
			this.step_pos_n(2);
			var env = this.env_backet();
			if (env)
				this.volume[env.number] = env;
		}
		else
		if (this.current() == '@')
		{
			this.step_pos();
		
			if (this.is_number())
			{
				var env = this.env_backet();
				if (env)
					this.duty[env.number] = env;
			}
		}
		
	},
	newline : function ( str , line_no )
	{
		this.string = str;	
		this.pos = 0;
		this.line = line_no;
		
		this.skip_space();
		
		if (!this.has_next())
			return;
		
		switch ( this.current() )
		{
			case '@':
				// put_line (this.line + ":Envelope ");
				this.envelope();
				break;
			case '#':
				// put_line (this.line + ":define");
				this.header();
				break;
		}
	}
}

