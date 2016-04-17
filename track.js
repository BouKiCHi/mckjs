/*******************************************=*
 track.js
 
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

Error = {
	unknown_command : "Unknown command",
	toofew_argument : "Too few augument(s)",
	   large_number : "Too Large number",
		 not_number : "Not A Number",
	  not_implement : "Not Implemented Yet",
		 loop_wrong : "Loop command is wrong"
};


// テキストオブジェクト
function Text ( text )
{
	this.text = text;
	this.pos = 0;
}

Text.prototype =
{
	set_pos : function ( newpos )
	{
		this.pos = newpos;
	},
	code : function ()
	{
		return this.text.charCodeAt( this.pos );
	},
	find_next_crlf : function()
	{
		for ( var i = this.pos; i < this.text.length; i++ )
		{
			var j = this.text.charCodeAt( i );
			if ( j == 0x0a || j == 0x0d )
			{
				return i;
			}
		}
		return i;
	},
	find_comment : function( str )
	{
		for ( var i = 0; i < str.length; i++ )
		{
			var j = str.charAt( i );
			if ( j == '/' || j == ';' )
			{
				return i;
			}
		}
		return -1;
	},
	is_end : function()
	{
		if (this.pos < this.text.length)
			return false;
		
		return true;
	},
	step_next : function()
	{
		if (this.pos < this.text.length)
			this.pos++;
	},
	skip_crlf : function()
	{
		var code = this.code();
		
		if (code == 0x0d)
		{
			this.step_next();
			
			if ( this.is_end () )
				return;
			
			code = this.code();
			if (code == 0x0a)
				this.step_next();
			
			return;
		}
		if (code == 0x0a)
		{
			this.step_next();
		}
		return;
	}, 
	
	get_line : function()
	{
		var next = this.find_next_crlf ();
		
		var ret = this.text.slice( this.pos , next );
		
		var idx = this.find_comment ( ret );
		
		if ( idx >= 0 )
		{
			ret = ret.slice ( 0 , idx );
		}
					  
		this.set_pos( next );
		this.skip_crlf ();
		
		return ret;
	}
};

// コマンドタイプ
CmdType = {
	NOTE   : 1,
	OCTAVE : 2,
	TEMPO  : 3,
	LEN    : 4,
	TONE   : 5,
	SLAR   : 6,
	VOL    : 7,
	REST   : 8,
	GRP_ST : 9,
	GRP_ED : 10,
	LOOP   : 11,
	LOOP_ST : 12,
	LOOP_ED : 13,
	LOOP_JUMP : 14,
	D_NOTE : 15,
	FINISH : 16,
	Q_RATE : 17,
	V_ENV  : 18,
	D_ENV  : 19,
	E_CMD  : 20,
	P_ENV  : 21,
	N_ENV  : 22,
	KEY    : 23,
	DETUNE : 24,
	M_CMD  : 25,
	SOFTLFO : 26,
	AT_CMD : 27,
	
	
	UNKNOWN : 99
};


// トラック解析オブジェクト
function Track()
{
	StrReader.prototype.set_class ( Track.prototype );
	
	for ( var i in CmdType )
		this[i] = CmdType[i];
	
	this.status = new Object;
	
	this.status.tempo = 120;
	
	// frame per beat	
	this.status.frame_beat = 60 / (this.status.tempo / 60);
	
	this.status.octave = 4;
	this.status.len = 4;
	this.status.q_rate = 8;
	this.status.tone = 0;
	this.status.vol = 15;
	
	this.status.error = 0;
	this.status.pos = 0;
	this.status.line_no = 0;	
	this.status.fin = false;
	
	this.status.slar = false;
	this.status.next_slar = false;
}

Track.prototype =
{
	note_tbl : [ 0 , 2 , 4 , 5 , 7 , 9 , 11 ],

	// データを設定する
	set_data : function ( str, line_no , track )
	{
		this.error = false;
		this.string = str;
		this.pos = 0;
		this.status.line_no = line_no;	
		this.track = track;
	},
	// 文字からコマンドを得る
	get_type : function ()
	{
		switch ( this.current() )
		{
			case 'c':
			case 'd':
			case 'e':
			case 'f':
			case 'g':
			case 'a':
			case 'b':
				return this.NOTE;
			case 'r':
				return this.REST;
			case 'n':
				return this.D_NOTE;
			case 'q':
				return this.Q_RATE;
			case 'E':
				return this.E_CMD;
			case 'o':
			case '<':
			case '>':
				return this.OCTAVE;
			case 't':
				return this.TEMPO;
			case 'l':
				return this.LEN;
			case '@':
				return this.AT_CMD;
			case '&':
				return this.SLAR;
			case 'v':
				return this.VOL;
			case '{':
				return this.GRP_ST;
			case '}':
				return this.GRP_ED;
			case '[':
				return this.LOOP_ST;
			case ']':
				return this.LOOP_ED;
			case '|':
				return this.LOOP_JUMP;			
			case 'L':
				return this.LOOP;
			case '!':
				return this.FINISH;
			case 'D':
				return this.DETUNE;
			case 'K':
				return this.KEY;
			case 'M':
				return this.M_CMD;
			default:
				return this.UNKNOWN;
		}
	},
	// コマンドを文字列に(debug用)
	command_toString : function ( cmd )
	{
		switch ( cmd.type )
		{
			case this.NOTE:
				return "Note "+ cmd.chr + ":" + cmd.note + "," + cmd.notelen + "," + cmd.frames;
			case this.REST:
				return "Rest :" + cmd.notelen + "," + cmd.frames;
			case this.OCTAVE:
				return "Octave :" + cmd.octave;
			case this.Q_RATE:
				return "Quantize :" + cmd.q_rate;
			case this.TEMPO:
				return "Tempo :" + cmd.tempo;
			case this.LEN:
				return "Len :" + cmd.len;
			case this.TONE:
				return "Tone :" + cmd.tone;
			case this.SLAR:
				return "Slar : " + cmd.slar;
			case this.VOL:
				return "Vol : " + cmd.vol;
			case this.GRP_ST:
				return "Group start";
			case this.GRP_ED:
				return "Group end:" + cmd.notelen;
			case this.LOOP:
				return "Loop";
			case this.LOOP_ST:
				return "Loop Start";
			case this.LOOP_ED:
				return "Loop End";
			case this.LOOP_JUMP:
				return "Loop Jump";
			case this.D_NOTE:
				return "Direct Note";
			case this.FINISH:
				return "Finish";
			case this.E_CMD:
				return "E Command";
			case this.D_ENV:
				return "Duty Envelope";
			case this.V_ENV:
				return "Volume Envelope";
			case this.N_ENV:
				return "Note Envelope";
			case this.P_ENV:
				return "Pitch Envelope";
			case this.DETUNE:
				return "Detune";

			default:
				return "Unknown :" + cmd.type  + ":" + cmd.chr;
		}		
	},
	// コマンド解析
	command_parse : function()
	{
		var cmd = this.cmd_new_object();

		cmd.frames = 0;
		cmd.type = this.get_type();
		cmd.pos = this.pos;
		cmd.chr = this.current();
		
		switch ( cmd.type )
		{
			case this.NOTE:
				this.note_parse( cmd );
				break;
			case this.D_NOTE:
				this.d_note_parse( cmd );
				break;				
			case this.REST:
				this.rest_parse ( cmd );
				break;
			case this.OCTAVE:
				this.octave_parse( cmd );
				break;
			case this.TEMPO:
				this.tempo_parse ( cmd );
				break;
			case this.LEN:
				this.len_parse ( cmd );
				break;
			case this.AT_CMD:
				this.at_cmd_parse ( cmd );
				break;
			case this.SLAR:
				this.slar_parse ( cmd );
				break;
			case this.VOL:
				this.vol_parse ( cmd );
				break;
			case this.GRP_ST:
				this.gst_parse ( cmd );	
				break;
			case this.GRP_ED:
				this.ged_parse ( cmd );	
				break;
			case this.LOOP_ST:
				this.lst_parse ( cmd );	
				break;
			case this.LOOP_ED:
				this.led_parse ( cmd );	
				break;
			case this.LOOP_JUMP:
				this.ljp_parse ( cmd );	
				break;
			case this.LOOP:
				this.loop_parse ( cmd );	
				break;
			case this.FINISH:
				this.fin_parse ( cmd );	
				break;
			case this.DETUNE:
			case this.KEY:
				this.value_parse ( cmd );
				break;
			case this.Q_RATE:
				this.q_rate_parse ( cmd );
				break;
			case this.E_CMD:
				this.e_cmd_parse ( cmd );
				break;
			case this.M_CMD:
				this.m_cmd_parse ( cmd );
				break;
			case this.UNKNOWN:
				this.unknown_parse ( cmd );
				break;
		}
		
		this.set_status_from_cmd ( cmd );
		
		this.skip_space();
		
		return cmd;
	},
	// エラー発生?
	has_error : function ()
	{
		return this.error;
	},
	
	// エラー発生
	error_handle : function ( cmd , error )
	{
		this.error = true;
		cmd.errmsg = error;
		cmd.error++;
	},
	
	// 未知のコマンド
	unknown_parse : function ( cmd )
	{
		this.error_handle( cmd , Error.unknown_command );
		this.step_pos();
	},
	
	// 数値
	number_arg : function ( cmd )
	{
		var value = -1;
		
		if (this.is_number())
		{
			value = this.number_parse();
			this.skip_number();
		}
		else
		{
			// 数値ではない
			this.error_handle ( cmd , Error.not_number );
			this.skip_not_space();
		}
		return value;
	},
	
	// 数値付きコマンド
	numarg_parse : function ( cmd )
	{
		this.step_pos();
		
		return this.number_arg( cmd );
	},
	loop_parse : function ( cmd )
	{
		this.step_pos();
	},
	fin_parse : function ( cmd )
	{
		cmd.fin = true;
		this.step_pos();
	},
	
	gst_parse : function ( cmd )
	{
		this.step_pos();
	},
	ged_parse : function ( cmd )
	{
		this.step_pos();
		this.notelen_parse( cmd );
	},
	
	lst_parse : function ( cmd )
	{
		this.step_pos();
	},
	led_parse : function ( cmd )
	{
		this.step_pos();
		this.notelen_parse( cmd );
	},
	ljp_parse : function ( cmd )
	{
		this.step_pos();
	},
	// Mコマンド
	m_cmd_parse : function ( cmd )
	{
		if (this.compare_string("MPOF") == 0)
		{
			this.step_pos_n(4);
			cmd.type = this.SOFTLFO;
			cmd.envno = 255;
		}
		else
		if (this.compare_string("MP") == 0)
		{
			this.step_pos_n(2);
			cmd.type = this.SOFTLFO;
			cmd.envno = this.number_arg( cmd );
		}
		else
		{
			// Unknown
			this.error_handle ( cmd , Error.unknown_command );
		}
	},
	// Eコマンド
	e_cmd_parse : function ( cmd )
	{
		if (this.compare_string("EPOF") == 0)
		{
			this.step_pos_n(4);
			cmd.type = this.P_ENV;
			cmd.envno = 255;
		}
		else
		if (this.compare_string("EP") == 0)
		{
				this.step_pos_n(2);
				cmd.type = this.P_ENV;
				cmd.envno = this.number_arg( cmd );
		}
		else
		if (this.compare_string("ENOF") == 0)
		{
			this.step_pos_n(4);
			cmd.type = this.N_ENV;
			cmd.envno = 255;
		}
		else
		if (this.compare_string("EN") == 0)
		{
			this.step_pos_n(2);
			cmd.type = this.N_ENV;
			cmd.envno = this.number_arg( cmd );
		}
		else
		{
			// Unknown
			this.error_handle ( cmd , Error.unknown_command );
		}
	},	
	
	
	// 値を得る
	value_parse : function ( cmd )
	{
		cmd.value = this.numarg_parse( cmd );
	},
	
	// q_command
	q_rate_parse : function ( cmd )
	{
		cmd.q_rate = this.numarg_parse( cmd );
	},
	
	// 音量
	vol_parse : function ( cmd )
	{
		cmd.vol = this.numarg_parse( cmd );
	},
	
	// スラー
	slar_parse : function ( cmd )
	{
		this.step_pos();
		
		cmd.next_slar = true;
	},
	// アットマーク関連 ( 音色含む )
	at_cmd_parse : function ( cmd )
	{
		this.step_pos();
		
		switch(this.current())
		{
			case '@':
				// duty env
				cmd.type = this.D_ENV;
				cmd.envno = this.numarg_parse( cmd );
			break;
			case 'v':
				// vol env
				cmd.type = this.V_ENV;
				cmd.envno = this.numarg_parse( cmd );
			break;
			default:
				// tone
				cmd.type = this.TONE;
				cmd.tone = this.number_arg( cmd );
			break;
		}
			
	},
	// 標準音長
	len_parse : function ( cmd )
	{
		cmd.len = this.numarg_parse( cmd );
	},
	// テンポ
	tempo_parse : function ( cmd )
	{
		cmd.tempo = this.numarg_parse( cmd );
		cmd.frame_beat = 60 / (cmd.tempo / 60);
	},
	
	// 音長取得
	notelen_parse : function ( cmd )
	{	
		cmd.notelen = cmd.len;
		
		if (this.is_number())
		{
			cmd.notelen = this.number_parse();
			this.skip_number();
		}
		
		// 付点計算
		var x_len = 192/cmd.notelen;
		var tmp = x_len;
		
		while (this.current() == '.')
		{
			tmp /= 2;
			x_len += tmp;
			this.step_pos();
		}
		
		
		this.skip_space();
		
		// タイ計算
		while (this.current() == '^')
		{
			this.step_pos();

			var tie_len = cmd.len; // lコマンドでの音長
			if (this.is_number())
			{
				tie_len = this.number_parse();
				this.skip_number();
			}
			
			x_len += ( 192 / tie_len);

			this.skip_space();
		}
		
		cmd.notelen = 192 / x_len;
		
		cmd.frames = Math.floor( (cmd.frame_beat * 4) / cmd.notelen );
	},
	//　休符
	rest_parse : function ( cmd )
	{
		this.step_pos();
		this.notelen_parse( cmd );
	},
	// 音符
	note_parse : function ( cmd )
	{
		var index = "cdefgab".indexOf( this.current() );
		var note = this.note_tbl [ index ] ;
		
		this.step_pos();
		
		var op = this.current();
		if (op == '-')
		{
			note--;
			this.step_pos();			
		}
		else
		if (op == '+')
		{
			note++;
			this.step_pos();
		}
		
		this.notelen_parse( cmd );
		
		cmd.note = note;
		cmd.slar = false;
		
		if (cmd.next_slar)
		{
			cmd.slar = true;
			cmd.next_slar = false;
		}
	},
	// 直接ノート解析
	d_note_parse : function ( cmd )
	{
		this.step_pos();
		
		if (this.is_number())
		{
			var note = this.number_parse();
			this.skip_number();
			this.skip_space();
		}
		else
		{
			// 数値ではない
			this.error_handle ( cmd , Error.not_number );
			return; // error!!
		}

		cmd.note = note;

		var op = this.current();
		if (op == ',')
		{
			this.step_pos();
		}
		
		this.notelen_parse( cmd );
		
		cmd.slar = false;
		
		if (cmd.next_slar)
		{
			cmd.slar = true;
			cmd.next_slar = false;
		}
	},
	// オクターブ
	octave_parse : function ( cmd )
	{
		var op = this.current();
		
		if (op == '<')
		{
			cmd.octave--;
			this.step_pos();			
		}
		else
		if (op == '>')
		{
			cmd.octave++;
			this.step_pos();
		}
		else
		if (op == 'o')
		{
			cmd.octave = this.numarg_parse( cmd );			
		}
	},
	// ステータスをコマンドに反映
	cmd_new_object : function()
	{
		var cmd = new Object();
		
		for ( var i in this.status )
		{
			cmd[i] = this.status[i];
		}
		return cmd;
	},
	// コマンドにステータスを反映
	set_status_from_cmd : function ( cmd )
	{
		for ( var i in this.status )
		{
			this.status[i] = cmd[i];
		}		
	},
	// ステータスの設定
	set_status : function ( status )
	{
		for ( var i in status )
		{
			this.status[i] = status[i];
		}
	},
	// ステータスの取得
	get_status : function ()
	{
		return this.status
	},
	// トラックは終了しているか
	is_finish: function()
	{
		return this.status.fin;
	},	
	// トラックヘッダをチェックする
	check_track_header : function()
	{
		this.skip_space();
		
		for (; this.has_next(); this.step_pos() )
		{
			if (this.is_space())
				break;
			
			var i = this.current();
			
			if (i == '@' || i == '#')
				return false;
			
			if (i == this.track)
			{
				this.skip_not_space();
				this.skip_space();
				return true;
			}
		}
		return false;
	},
	
	// デバッグ用
	print_type : function()
	{
		put_line( this.get_type() );
	},
	
};


