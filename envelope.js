/*******************************************=*
 envelope.js
 
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

function Envelope( data )
{
	this.set_data ( data );
}

Envelope.prototype =
{
	set_data : function ( data )
	{
		this.data = data;
		this.loop = data.loop_point;
		this.pos = 0;
		this.end = data.length;
	},
	get_value : function ( )
	{
		return this.data [ this.pos ];
	},
	reset : function ()
	{
		this.pos = 0;
	},
	step : function ( )
	{
		this.pos++;
		if (this.pos >= this.end)
		{
			if (this.loop < 0)
				this.pos = this.end - 1;
			else
				this.pos = this.loop;
		}
	}
};

function SoftLFO ( data )
{
	this.set_data ( data );
	this.reset();
}

SoftLFO.prototype =
{
	set_data : function ( data )
	{
		this.data = data;
		
		this.delay = data[0];
		this.speed = data[1];
		this.depth = data[2];
		this.diff = this.depth / this.speed;
	},
	get_value : function ( )
	{
		return this.current;
	},
	reset : function ()
	{
		this.current = 0;
		this.count = 0;
		this.point = 0;		
	},
	next_point : function ()
	{
		this.point++;
		this.count = 0;
		if (this.point > 4)
			this.point = 1;
	},
	step : function ( )
	{
		this.count++;
		switch( this.point )
		{
			case 0:
				if (this.count >= this.delay)
					this.next_point();
			break;
			case 1:
			case 4:
				this.current = this.diff;
				if (this.count >= this.speed)
					this.next_point();
			break;
			case 2:
			case 3:
				this.current = 0 - this.diff;
				if (this.count >= this.speed)
					this.next_point();
			break;
		}
	}
};
