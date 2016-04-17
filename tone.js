/*******************************************=*
 tone.js

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



// 音源オブジェクト
function Tone( rate )
{
	this.count = 0;
	this.length = 254;
	this.step = 0;
	this.duty = 8;
	this.volume = 15;

	this.set_rate ( rate );

	this.rng = 2;
	this.short_mode = false;
	this.out_flag = true;

	this.set_mode ( this.MODE_SQR ) ;


	this.out = 0;

	this.out_v = new Array();
	for (var i = 0; i < 16; i++)
	{
		this.out_v.push ( this.MAX_OUT * i / 16 );
	}

	this.set_volume( this.volume );
}

Tone.prototype =
{
	MAX_OUT : 32767,
	MODE_SQR : 0,
	MODE_TRI : 1,
	MODE_NOI : 2,
	base : 1789772.7272,
	noise_tbl : [ 0x004 , 0x008 , 0x010, 0x020, 0x040, 0x060, 0x080 ,0x0a0 ,
				 0x0ca , 0x0fe , 0x17c, 0x1fc, 0x2fa, 0x3f8, 0x7f2 ,0xfe4 ],
	sqr_duty_tbl : [ 2 , 4 , 8 , 12 ],

	set_rate : function ( rate )
	{
			this.rate = rate;
			this.sample = this.base / this.rate;
	},
	set_volume : function ( vol )
	{
		this.out = this.out_v [ vol ];
	},
	set_out : function ( flag )
	{
		this.out_flag = flag;
	},
	set_length : function ( len )
	{
		if (this.mode == this.MODE_NOI)
		{
			this.length = this.noise_tbl[ len & 0x0f ] / 4; // ????

			if (len & 0x10)
				this.short_mode = true;
			else
				this.short_mode = false;
		}
		else
        {
			this.length = len & 0x7ff; // 2047
        }
	},
	set_duty : function ( duty )
	{
		if (this.mode == this.MODE_SQR)
			this.duty = this.sqr_duty_tbl[ duty & 0x03 ];
	},
	set_mode : function ( mode )
	{
		this.is_noise = false;
		this.mode = mode;
		switch ( mode )
		{
			case this.MODE_SQR:
				this.render = this.render_square;
				break;
			case this.MODE_TRI:
				this.render = this.render_triangle;
				break;
			case this.MODE_NOI:
				this.render = this.render_noise;
				this.is_noise = true;
				break;
		}
	},
	// ダミー
	render : function ()
	{
		return 0;
	},

	// 矩形波
	render_square : function ()
	{
		if (!this.out_flag)
			return 0;

		this.count -= this.sample;
		while ( this.count < 0 )
		{
			this.count += this.length;
			this.step ++;
			if (this.step > 15)
				this.step = 0;
		}
		if ( this.step < this.duty )
			return 0;
		else
			return this.out;
	},
	// 三角波
	render_triangle : function ()
	{
		if (!this.out_flag)
			return 0;

		this.count -= this.sample;
		while ( this.count < 0 )
		{
			this.count += this.length;
			this.step ++;
			if (this.step > 31)
				this.step = 0;
		}
		if ( this.step < 16 )
			return this.out_v [ 15 - this.step ] ;
		else
			return this.out_v [ this.step - 16 ] ;

	},
	// ノイズ波
	render_noise : function ()
	{
		if (!this.out_flag)
			return 0;

		this.count -= this.sample;
		while ( this.count < 0 )
		{
			this.count += this.length;

			this.rng = this.rng >> 1;

			if (!this.short_mode)
			{
				this.rng = (this.rng & 0xbfff);
				this.rng |= ( ( ( (this.rng>>1) ^ this.rng ) & 1 ) << 14 );
			}
			else
			{
				this.rng = (this.rng & 0xbfff);
				var tmp = (this.rng>>6) ^ this.rng;
				this.rng |= ( tmp  & 1 ) << 14;
			}
		}
		if (this.rng & 1)
			return this.out_v [ 0 ];
		else
			return this.out;
	}

};
