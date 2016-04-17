/*******************************************=*
 main.js

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


var pcm = null;

function PCMMaker( rate )
{
	this.mml = new MML( rate );
	this.pcm = new Bin();
	this.rate = rate;
	this.spf = this.rate / 60; // samples per frame
	this.done = false;
	this.text = "";
	this.status = "";
	this.wav_mode = false;
	this.debug = false;
	this.cancel = false;
}

PCMMaker.prototype =
{
	reset : function()
	{
		this.frames = -1;
		this.pos = 0;
		this.riff = null;
		this.done = false;
		this.status = "ready";
		this.uri = null;
		this.base64x = new base64x();

	},
	set_rate : function ( rate )
	{
		this.rate = rate;
		this.spf = this.rate / 60; // samples per frame

		this.mml.set_rate ( rate );
	},
	set_wav_mode : function ( flag )
	{
		this.wav_mode = flag;
	},
	set_text : function ( text )
	{
		this.text = text;
	},
	start_parse : function()
	{
		this.reset();

		this.mml.set_text( this.text );
		this.mml.set_debug ( this.debug );
		this.mml.parse();

		this.frames = this.mml.get_songframes();
	},
	update : function ()
	{
		if ( this.base64x.is_finish() )
		{
			this.uri += this.base64x.result();

			this.gen_audio_body();
			this.done = true;
			this.status = "Done.";
			return;
		}
		if ( this.uri )
		{
			this.base64x.encode ( 16384 );
			this.status = "Base64 :" + (this.base64x.pos>>10) + "/" + (this.base64x.length>>10);
			return;
		}

		if ( this.riff )
		{
			this.uri = "data:audio/wav;base64,";
			this.base64x.set_array ( this.riff.data );
			return;
		}

		if ( this.pos < this.frames )
		{
			this.update_pcm_sec();
			this.status = "PCM :" + this.pos + "/" + this.frames;
		}
		else
		{
			this.pack_wave();
			this.status = "Making audio..";
		}
	},
	step_driver : function ( step )
	{
		for ( var j = 0; j < step; j++ )
			this.mml.step_driver();
	},
	update_pcm_sec : function ()
	{
		for ( var j = 0; j < 60; j++ )
		{
			this.pos++;
			if (this.pos >= this.frames)
				break;

			this.mml.step_driver();
			for ( var i = 0; i < this.spf; i++ )
			{
				this.pcm.push_16le ( this.mml.render_driver() );
			}
		}
	},
	pack_wave : function ()
	{
		var data = new Bin();
		data.push_str ( "data" );
		data.push_32le( this.pcm.get_length() );
		data.push_bin ( this.pcm );

		var bytes_per_sample = 2;
		var channels = 1;
		var fmt_info = new Bin();
		fmt_info.push_16le ( 1 ); // リニアPCM
		fmt_info.push_16le ( channels ); // モノラル
		fmt_info.push_32le ( this.rate ); // サンプリングレート
		fmt_info.push_32le ( this.rate * bytes_per_sample * channels ); // データレート
		fmt_info.push_16le ( bytes_per_sample * channels ); // ブロック
		fmt_info.push_16le ( bytes_per_sample * 8 ); // ビット数

		var fmt = new Bin();
		fmt.push_str("fmt ");
		fmt.push_32le ( fmt_info.get_length() );
		fmt.push_bin( fmt_info );

		put_line("Making RIFF");


		var riff = new Bin();
		riff.push_str("RIFF");
		riff.push_32le ( 4 + fmt.get_length() + data.get_length() );
		riff.push_str("WAVE");
		riff.push_bin ( fmt );
		riff.push_bin ( data );

		this.riff = riff;
	},
	// 文字列の表示
	gen_uri : function ()
	{
		var mime = "audio/wav";
		var data = this.riff.data;

		var uri = "data:" + mime + ";base64,";
		uri += base64enc_array( data ) ;
		return uri;
	},

	// リンク要素の作成
	gen_link : function ( uri , str , title = "" )
	{
		return a_link(uri, str, title);
	},
	// オーディオ要素の作成
	gen_audio : function ( uri )
	{
		var audio = document.createElement("audio");
		audio.src = uri;
		audio.id = "audio_elem";
		audio.controls = true;
		return audio;
	},
	// 要素の作成
	gen_audio_body : function ()
	{
		if (!this.wav_mode)
		{
			this.audio_elem = this.gen_audio ( this.uri ) ;
		}
		else
		{
			this.audio_elem = this.gen_link ( this.uri, "DATA URI", "dataURIへのリンクです。WAVファイルとして保存することが出来ます。" ) ;
		}
	}
}

// オプション
function get_opt_from_html( pcm )
{
	if ( document.getElementById("text") )
		pcm.set_text ( document.getElementById("text").value );

	if ( document.getElementById("rate") )
		pcm.set_rate ( document.getElementById("rate").value );

	if ( document.getElementById("debug") )
		pcm.debug = document.getElementById("debug").checked;
}

// 再生
function play_url()
{
	var rate = 22050;
	text = url2text();

	if ( text == "" )
	{
		init_logs ( document.body );
		put_line("Error : MML is not found in url...");

		return;
	}

	link_to_editor();

	pcm = new PCMMaker( rate );

	pcm.set_text ( text );

	clear_lines();
	put_line("Parsing..");

	pcm.set_wav_mode( false );
	pcm.start_parse();

	if ( pcm.mml.header.title )
	{
		put_line("Title:" + pcm.mml.header.title );
		document.title = pcm.mml.header.title;
	}

	put_line("Frames:" + pcm.frames );
	put_line("Rendering...");

	update();
}



// 解析
function parse( flag )
{
	var rate = 22050;

	show_elem( 'audio_div' );
	inline_elem ( 'cancel' );


	init_logs ( document.body );

	pcm = new PCMMaker( rate );

	get_opt_from_html ( pcm );


	clear_lines();
	put_line("Parsing..");

	pcm.set_wav_mode( flag );
	pcm.start_parse();

	if ( pcm.mml.header.title )
		put_line("Title:" + pcm.mml.header.title );

	put_line("Frames:" + pcm.frames );
	put_line("Rendering...");

	var step = 0;
	if ( document.getElementById("skip") )
		step = document.getElementById("skip").value;

	if ( document.getElementById("frames") )
		frames = document.getElementById("frames").value;

	if (frames > 0)
		pcm.frames = frames;

	if (step > 0)
	{
		put_line("Skipping:" + step );

		pcm.step_driver( step );
		pcm.frames -= step;
	}

	update();
}

// 要素表示
function disp_elem( elem )
{
	var audio_span = document.getElementById("audio");

	var new_elem = document.createElement("span");
	new_elem.appendChild( elem );
	new_elem.appendChild(document.createElement("br"));

	new_elem.id = "audio";

	var adiv = document.getElementById("audio_div");

	if ( audio_span )
		adiv.removeChild( audio_span );

	adiv.appendChild( new_elem );
};

// 更新
function update()
{
	pcm.update();

	if ( pcm.done )
	{
		put_line( "PCM length:" + pcm.pcm.data.length );

		disp_elem ( pcm.audio_elem );

		hide_elem ( 'cancel' );

		var audio = document.getElementById("audio_elem");
		if ( audio )
			audio.play();
	}
	else
	{
		if ( ! pcm.cancel )
		{
			disp_elem ( document.createTextNode( pcm.status ) );
			setTimeout("update();",1);
		}
		else
		{
			disp_elem ( document.createTextNode( "Canceled" ) );
			hide_elem( 'cancel' );
		}
	}
}


// 中止する
function cancel_process ()
{
	if (pcm)
	{
		pcm.cancel = true;
	}
}


// リンク要素の作成

function a_link( url , str , title = "")
{
	var a = document.createElement("a");
	a.href = url;

	a.appendChild( document.createTextNode(str) );
	a.className = "btn";

	a.title = title;

	return a;
}

// twitterリンクの作成
function do_twitter( text )
{
	var base_url = window.location.href;
	var index = base_url.indexOf("?");

	if (index >= 0)
		base_url = base_url.slice(0 , index );

	var url =  base_url + "?" + encodeURIComponent( text );

	return a_link ( "http://twitter.com/?status="+ encodeURIComponent( url ) + "+" +
				   encodeURIComponent("#mckjs"),"Twitter");
}

// エディタURLの作成
function link_to_editor()
{
	var save_span = document.getElementById("save");
	var links = document.createElement("span");

	var text = url2text();

	links.appendChild ( a_link ( "?" + encodeURIComponent( text ) , "MML URL", "MML URLへのリンクです" ) );
	links.appendChild ( document.createTextNode(" ") );
	links.appendChild ( a_link ( "index.html?" + encodeURIComponent( text ) , "EDITOR", "エディタへ移動します" ) );

	if ( save_span )
	{
		var first = save_span.firstChild;

		if ( first )
			save_span.replaceChild( links , first );
		else
			save_span.appendChild( links );
	}
}


// データURLの作成
function save_text()
{
	var save_span = document.getElementById("save");
	var text = document.getElementById("text").value;

	var links = document.createElement("span");

	links.appendChild ( a_link ( "?" + encodeURIComponent( text ) , "MML URL", "MML URLへのリンクです" ) );
	links.appendChild ( document.createTextNode(" ") );
	links.appendChild ( a_link ( "player.html?" + encodeURIComponent( text ) , "PLAYER", "プレイヤへ移動します" ) );

	if (save_span)
	{
		var first = save_span.firstChild;
		if ( first )
			save_span.replaceChild( links , first );
		else
			save_span.appendChild( links );
	}
}

// URL
function url2text()
{
	var href = window.location.href;
	var index = href.indexOf("?");

	if (index < 0)
		return "";

	return decodeURIComponent( href.slice( index + 1 ) );
}

// リセット
function reset_text()
{
	var href = window.location.href;
	var index = href.indexOf("?");

	if (index < 0)
		return;

	window.location.href = href.slice( 0 , index );
}

function set_display_elem ( id, mode )
{
	var elem = document.getElementById(id);
	if (!elem)
		return;

	elem.style.display = mode;
}


// 要素を隠す
function hide_elem ( id )
{
	set_display_elem( id, "none" );
}

// 要素を表示
function show_elem ( id )
{
	set_display_elem( id, "block" );
}

// インライン要素として表示
function inline_elem ( id )
{
	set_display_elem( id, "inline" );
}



// 要素の表示を切り替える
function toggle_elem ( id )
{
	var elem = document.getElementById(id);
	if (!elem)
		return;

	if (elem.style.display == "block")
		elem.style.display = "none";
	else
		elem.style.display = "block";
}

// 読み出し
function loading()
{
	text = url2text();

	if (text != "")
		document.getElementById("text").value = text;
}
