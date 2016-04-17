/*******************************************=*
 mml.js

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


// 周波数テーブル
var mml_freq_tbl =
[
    1710 , 1614 , 1524 , 1438 , 1357 , 1281 , 1209 , 1141 ,
 　 1077 , 1017 , 959  , 906 ,  855  ,  807 , 762  , 719  ];

// MMLオブジェクト
function MML ( rate )
{
	this.debug = false;

	this.group = false;
	this.group_end = false;

	this.loop = false;
	this.loop_decoding = false;
	this.loop_count = 0;
	this.loop_pos = 0;
	this.loop_stack = new Array();
	this.loop_nest = new Array();

	this.cmd_array = null;
	this.loop_array = null;

	this.track_header = "ABCD";

	this.fade_frame = 60 * 3;

	this.track_cmd = new Array();
	this.track_frames = new Array();
	this.loop_frames = new Array();

	// ドライバ関連
	this.driver = new Array();
	this.rate = rate;

	this.reset_driver();
}

MML.prototype =
{
	// テキストデータを取り込む
	set_text : function ( text )
	{
		this.text_data = text;
	},
	// レートを設定する
	set_rate : function ( rate )
	{
		this.rate = rate;
    for(var i = 0; i < this.driver.length; i++)
    {
      this.driver[i].render.set_rate( rate );
    }
	},
	// デバッグ
	set_debug : function ( debug )
	{
		this.debug = debug;
	},
	// 解析する
	parse : function ()
	{
		var tracks = this.track_header;

		this.header_parse();

		for (var i = 0; i < tracks.length; i++ )
		{
			this.track_parse( tracks[i] );
			put_line (
				"Track" + tracks[i] + ":" +
				this.track_frames[ tracks[i] ]
			);
		}
		this.calc_songframes();
	},
	// ドライバの初期値をセット
	reset_driver : function ()
	{
		for ( var i = 0; i < 4; i++ )
		{
			var driver = new Object();
			driver.render = new Tone ( this.rate );
			driver.render.set_volume ( 15 );
			driver.render.set_out ( false );
			driver.counter = 0;
			driver.q_counter = 0;
			driver.pos = 0;
			driver.loop_pos = -1;
			driver.loop_cnt = 1;
			driver.base_octave = 2;
			driver.octave = 4;
			driver.note = 0;
			driver.freq = 0;
			driver.detune = 0;
			driver.key = 0;
			driver.pitch_e = null;
			driver.volume_e = null;
			driver.note_e = null;
			driver.duty_e = null;
			driver.softlfo = null;

			this.driver[i] = driver;
		}

		this.fader = false;
		this.fade_count = this.rate * 2;
		this.fade_lenght = this.rate * 2;

		// 設定
		this.driver[2].render.set_mode ( this.driver[2].render.MODE_TRI );
		this.driver[3].render.set_mode ( this.driver[3].render.MODE_NOI );
		this.driver[3].render.set_volume ( 0 );
	},
	// 曲長をフレーム数で取得
	get_songframes : function ()
	{
		return this.max_frame;
	},

	// フレーム数の計算
	calc_songframes : function ()
	{
		var max_frame = 0;
		var max_track = 0;

		for ( var i  = 0; i < this.track_header.length; i++ )
		{
			tr = this.track_header[i];

			var tmp = this.track_frames[ tr ];

			if (this.loop_frames[ tr ] >= 0)
				tmp += (this.track_frames[ tr ] - this.loop_frames[ tr ]) + this.fade_frame;

			if (max_frame < tmp)
			{
				max_track = i;
				max_frame = tmp;
			}
		}
		this.max_frame = max_frame;
		this.max_track = max_track;
	},
	// 1フレーム分進める
	step_driver : function ()
	{
		var tracks = this.track_header;
		// todo
		for ( var i = 0; i < tracks.length; i++ )
		{
			var track = this.track_cmd [ tracks[i] ];
			var driver = this.driver[i];

			// ノートエンベロープ
			if (driver.note_e)
			{
				this.add_to_note  ( driver , driver.key );
				this.add_to_note  ( driver , driver.note_e.get_value() );

				this.note_to_freq ( driver );
				this.add_to_freq  ( driver , driver.detune );

				driver.note_e.step();
			}
			// ピッチエンベロープ
			if (driver.pitch_e)
			{
				this.add_to_freq  ( driver , driver.pitch_e.get_value() );
				driver.pitch_e.step();
			}
			// ソフトウェアLFO
			if (driver.softlfo)
			{
				this.add_to_freq  ( driver , driver.softlfo.get_value() );
				driver.softlfo.step();
			}

			// 周波数を適用
			if (driver.note_e || driver.pitch_e || driver.softlfo)
			{
				this.set_render_freq ( driver );
			}

			// ボリュームエンベロープ
			if (driver.volume_e)
			{
				driver.render.set_volume ( driver.volume_e.get_value() );
				driver.volume_e.step();
			}

			// デューティーエンベロープ
			if (driver.duty_e)
			{
				driver.render.set_duty ( driver.duty_e.get_value() );
				driver.duty_e.step();
			}
			// カウンタがゼロになるまで何もしない
			if (driver.counter > 0)
			{
				if (driver.q_counter > 0)
				{
					driver.q_counter--;
					if (driver.q_counter <= 0)
						driver.render.set_out ( false );
				}
				driver.counter--;
			}
			// カウンタが増えるまでループ
			while(driver.counter <= 0)
			{
				if (driver.pos >= track.length)
				{
					if (driver.loop_pos >= 0)
					{
						driver.pos = driver.loop_pos;
						driver.loop_cnt--;
						// 一番長いトラックなおかつ規定の回数 = フェード開始
						if (i == this.max_track && driver.loop_cnt < 0)
							this.fader = true;
					}
					else
					{
						driver.render.set_out( false );
						driver.counter += 128;
					}
					break;
				}
				var cmd = track[ driver.pos++ ];

				// 各コマンドをデコードする
				switch ( cmd.type )
				{
					// 曲ループ
					case CmdType.LOOP:
						if (driver.loop_pos < 0)
							driver.loop_pos = driver.pos;
					break;
					// 音色
					case CmdType.TONE:
						driver.duty_e = null;
						driver.render.set_duty( cmd.tone );
					break;
					// ソフトLFO
					case CmdType.SOFTLFO:
						var env = this.header.softlfo[cmd.envno];
						if ( env )
							driver.softlfo = new SoftLFO( env );
						else
							driver.softlfo = null;
						break;
					// Pエンベ
					case CmdType.P_ENV:
						var env = this.header.pitch　[cmd.envno];
						if ( env )
							driver.pitch_e = new Envelope( env );
						else
							driver.pitch_e = null;
					break;
					// Nエンベ
					case CmdType.N_ENV:
						var env = this.header.note　[cmd.envno];
						if ( env )
							driver.note_e = new Envelope( env );
						else
							driver.note_e = null;
						break;

					// Vエンベ
					case CmdType.V_ENV:
						var env = this.header.volume [cmd.envno];
						if ( env )
							driver.volume_e = new Envelope( env );
						else
							driver.volume_e = null;
					break;
					// Dエンベ
					case CmdType.D_ENV:
						var env = this.header.duty [cmd.envno];
						if ( env )
							driver.duty_e = new Envelope( env );
						else
							driver.duty_e = null;

					break;
					// 音符
					case CmdType.D_NOTE:
					case CmdType.NOTE:
						if (driver.softlfo)
							driver.softlfo.reset();

						if (driver.volume_e)
							driver.volume_e.reset();

						if (driver.duty_e)
							driver.duty_e.reset();

						driver.render.set_out( true );

						if (cmd.q_rate < 8)
							driver.q_counter = (cmd.frames * cmd.q_rate) / 8;

						driver.octave = cmd.octave;
						driver.note = cmd.note;

						this.add_to_note  ( driver , driver.key );
						this.note_to_freq ( driver );
						this.add_to_freq  ( driver , driver.detune );
						this.set_render_freq ( driver );

						break;
					// デチューン
					case CmdType.DETUNE:
						driver.detune = cmd.value;
						if (driver.detune == 255)
							driver.detune = 0; // OK?!
					break;
					// キー
					case CmdType.KEY:
						driver.key = cmd.value;
						break;
					// 音量
					case CmdType.VOL:
						driver.volume_e = null;
						driver.render.set_volume ( cmd.vol );
						break;
					// 休符
					case CmdType.REST:
						driver.render.set_out( false );
						break;
				}
				driver.counter += cmd.frames;
			}
		}
	},
	// 周波数に数値を加算する
	add_to_freq : function ( driver , value )
	{
		driver.freq -= value;
	},
	// 音階に数値を加算する
	add_to_note : function ( driver , value )
	{
		driver.note += value;

		while(driver.note >= 12)
		{
			driver.note -= 12;
			driver.octave++;
		}
		while(driver.note < 0)
		{
			driver.note += 12;
			driver.octave--;
		}
	},
	// 音階を周波数に変換する
	note_to_freq : function ( driver )
	{
		if (driver.render.is_noise)
			driver.freq = driver.note;
		else
			driver.freq = this.calc_freq ( driver.octave - driver.base_octave , driver.note );
	},
	// 周波数を設定
	set_render_freq : function ( driver )
	{
		driver.render.set_length ( driver.freq );
	},

	// 周波数変換
	calc_freq : function ( diff_oct , note )
	{
		if (diff_oct < 0)
			return mml_freq_tbl[ note & 0x0f ] << (0 - diff_oct);
		else
			return mml_freq_tbl[ note & 0x0f ] >> diff_oct;
	},

	// 1サンプルを取り出す
	render_driver : function ()
	{
		var data = 0;
		for ( var i = 0; i < 4; i++ )
		{
			data += this.driver[i].render.render();
		}
		data = (data / 4);

		if ( this.fader )
		{
			data *= (this.fade_count / this.fade_lenght);

			if (this.fade_count > 0)
				this.fade_count--;
		}
		return data;
	},

	// ヘッダ(エンベロープ・ディテクティブ)解析
	header_parse : function ( )
	{
		put_line ( "Header parsing..." );

		var text = new Text( this.text_data );
		this.header = new Header();
		var line_no = 1;

		while( ! text.is_end() )
		{
			var str = text.get_line();

			this.header.newline ( str , line_no++ );
		}
	},
	// 連符コマンド確認
	group_command : function ( cmd )
	{
		if (cmd.type == CmdType.GRP_ST)
		{
			// グループ開始
			this.group = true;
			this.group_cnt = 0;
			this.cmd_array = new Array();
		}
		else
		if (cmd.type == CmdType.GRP_ED)
		{
			// グループ終了
			this.group_end = true;
			this.group_len = cmd.notelen;
		}
		else
		if (this.group)
		{
			this.cmd_array.push ( cmd );

			switch(cmd.type)
			{
				case CmdType.NOTE:
				case CmdType.REST:
					this.group_cnt++;
				break;
			}
		}
		return this.group;
	},
	// ループ配列の作成
	loop_maker : function ( st_pos , rep )
	{
		var arr = new Array();

		var j = rep;
		while(j > 0)
		{
			for ( var i = st_pos; i < this.loop_array.length; i++)
			{
				var cmd = this.loop_array[i];

				// ジャンプ離脱
				if ( j == 1 && cmd.type == CmdType.LOOP_JUMP )
					return arr;

				if (cmd.type != CmdType.LOOP_ST &&
					cmd.type != CmdType.LOOP_ED &&
					cmd.type != CmdType.LOOP_JUMP)
					arr.push ( cmd );

			}
			j--;
		}
		return arr;
	},
	// ループの取得
	loop_command : function ( cmd )
	{
		if (!this.loop_decoding && this.loop)
		{
			if ( cmd.type != CmdType.LOOP_ST && cmd.type != CmdType.LOOP_ED )
			{
				this.loop_array.push ( cmd );
				this.loop_pos++;
			}
		}

		if (cmd.type == CmdType.LOOP_ST)
		{
			// ループ開始
			this.loop = true;
			if (!this.loop_nest.length)
			{
				this.loop_pos = 0;
				this.loop_array = new Array();
			}
			this.loop_nest.push(this.loop_pos);
		}
		if (cmd.type == CmdType.LOOP_ED)
		{
			// ループ終了
			if (this.loop_nest.length <= 0)
			{
				cmd.error++;
				cmd.errmsg = Error.loop_wrong;
			}
			else
			{
				var loop_st_pos = this.loop_nest.pop();
				var loop_part =  this.loop_maker ( loop_st_pos , cmd.notelen );

				this.loop_array.splice ( loop_st_pos );
				this.loop_array = this.loop_array.concat( loop_part );

				if (!this.loop_nest.length)
				{
					this.loop_decoding = true;
					this.loop_pos = 0;
				}
			}
		}
		return this.loop;
	},
	// ループの展開
	// 非展開時にはnullを返す
	loop_decode : function ()
	{
		if ( !this.loop_decoding )
			return null;

		this.loop = false;

		var cmd = this.loop_array[ this.loop_pos++ ];

		if ( this.loop_pos >= this.loop_array.length )
			this.loop_decoding = false;

		return cmd;
	},
	// ループデコード中ならtrue
	check_loop : function ()
	{
		return this.loop_decoding;
	},
	// ノートであるか？
	check_note : function ( cmd )
	{
		switch(cmd.type)
		{
			case CmdType.NOTE:
			case CmdType.REST:
				return true;
				break;
		}
		return false;
	},
	// 連符配列の取得
	group_note : function ()
	{
		if ( ! this.group || !this.group_end )
			return null;


		this.group_frames = 0;
		var notelen = this.group_len * this.group_cnt;

		for( var i = 0; i < this.cmd_array.length; i++ )
		{
			var gcmd = this.cmd_array[i];

			if ( this.check_note ( gcmd ) )
			{
				gcmd.notelen = notelen;
				gcmd.frames = (gcmd.frame_beat * 4) / notelen;
				this.group_frames += gcmd.frames;
			}
		}

		// put_line ( "group:" + this.group_frames );

		this.group = false;
		this.group_end = false;

		return this.cmd_array;
	},
	// デバッグ
	debug_parse : function ( my_track , cmds )
	{
		if ( !this.debug )
			return;

		put_line("--- Track" + my_track + " debug ---");

		var track = new Track();
		var elapse_frames = 0;
		for ( var i = 0; i < cmds.length; i++ )
		{
			var str = i + ":";
			str += elapse_frames + ":";
			str += "Line " + cmds[i].line_no + ":";
			str += cmds[i].pos + ":";
			str += track.command_toString ( cmds[i] );

			put_line( str );
			elapse_frames += cmds[i].frames;
		}
	},
	// エラー確認
	error_parse : function ( cmds , err_lines )
	{
		var error = 0;
		var err_lineno = 0;
		for ( var i = 0; i < cmds.length; i++ )
		{
			var cmd = cmds[i];

			if (cmd.error > error)
			{
				error = cmd.error;
				if (cmd.line_no > err_lineno)
				{
					put_line("line "+cmd.line_no+":"+err_lines[cmd.line_no]);
					err_lineno = cmd.line_no;
				}

				put_line("Error:line " + cmd.line_no + ":" + cmd.pos + ":" + cmd.chr + ":" + cmd.errmsg);
			}
		}
	},

	// 各トラックの解析
	track_parse : function ( my_track )
	{
		put_line ( "Track" + my_track + " parsing..." );

		var text = new Text( this.text_data );

		var err_lines = new Array();
		var track_status = null;
		var line_no = 1;
		var frames = 0;
		var loop_frames = -1;

		var cmds = new Array();

		while( ! text.is_end() )
		{
			var str = text.get_line();
			var track = new Track();

			if (track_status)
				track.set_status( track_status );

			track.set_data( str , line_no , my_track );

			// このトラックか？
			if ( track.check_track_header() )
			{
				// put_line ( "[" + track.get_string()  + "]");
				while ( this.check_loop() || track.has_next() )
				{
					if (track.is_finish())
						break;

					var cmd = this.loop_decode();

					if (!cmd && track.has_next())
						cmd = track.command_parse();

					if ( !cmd || this.loop_command(cmd) )
						continue;

					// put_line ( track.command_toString ( cmd ) );

					if ( cmd.type == CmdType.LOOP && loop_frames < 0 )
						loop_frames = frames;

					if (this.group_command(cmd) )
					{
						var group = this.group_note();
						if (group)
						{
							cmds = cmds.concat(group);
							frames += this.group_frames;
						}
					}
					else
					{
						frames += cmd.frames;
						cmds.push ( cmd );
					}
				}
			}
			if (track.has_error())
			{
				err_lines[ line_no ] = str;
			}
			track_status = track.get_status();
			line_no++;

		}
		this.debug_parse ( my_track , cmds );
		this.error_parse ( cmds , err_lines );
		this.track_frames [ my_track ] = frames;
		this.track_cmd[ my_track ] = cmds;

		this.loop_frames [ my_track ] = loop_frames;
		return;
	}

};
