<?php
class JConfig {
	public $offline = '0';
	public $offline_message = 'Este sitio está cerrado por tareas de mantenimiento.<br />Por favor, inténtelo nuevamente más tarde.';
	public $display_offline_message = '1';
	public $offline_image = 'images/cerrado.jpg';
	public $sitename = 'cobranzas';
	public $editor = 'tinymce';
	public $captcha = '0';
	public $list_limit = '20';
	public $access = '1';
	public $debug = '0';
	public $debug_lang = '0';
	public $dbtype = 'mysqli';
	public $host = 'localhost';
	public $user = 'root';
	public $password = 'claudio';
	public $db = 'cobranzas';
	public $dbprefix = 'ceb_';
	public $live_site = '';
	public $secret = 'XcA85ggALY1SLxfY';
	public $gzip = '0';
	public $error_reporting = 'default';
	public $helpurl = 'https://help.joomla.org/proxy?keyref=Help{major}{minor}:{keyref}&lang={langcode}';
	public $ftp_host = '';
	public $ftp_port = '';
	public $ftp_user = '';
	public $ftp_root = '';
	public $ftp_enable = '0';
	public $offset = 'America/Argentina/Buenos_Aires';
	public $mailonline = '1';
	public $mailer = 'mail';
	public $mailfrom = 'gatticlaudio@yahoo.com.ar';
	public $fromname = 'cobranzas';
	public $sendmail = '/usr/sbin/sendmail';
	public $smtpauth = '0';
	public $smtpuser = '';
	public $smtphost = 'localhost';
	public $smtpsecure = 'none';
	public $smtpport = '25';
	public $caching = '0';
	public $cache_handler = 'file';
	public $cachetime = '15';
	public $cache_platformprefix = '0';
	public $MetaDesc = 'Modulo cobranza';
	public $MetaKeys = '';
	public $MetaTitle = '1';
	public $MetaAuthor = '1';
	public $MetaVersion = '0';
	public $robots = '';
	public $sef = '1';
	public $sef_rewrite = '0';
	public $sef_suffix = '0';
	public $unicodeslugs = '0';
	public $feed_limit = '10';
	public $feed_email = 'none';
	public $log_path = 'c:\\wamp64\\www\\cobranzas\\tmp';
	public $tmp_path = 'c:\\wamp64\\www\\cobranzas\\tmp';
	public $lifetime = '15';
	public $session_handler = 'database';
	public $shared_session = '0';
	public $memcache_persist = '1';
	public $memcache_compress = '0';
	public $memcache_server_host = 'localhost';
	public $memcache_server_port = '11211';
	public $memcached_persist = '1';
	public $memcached_compress = '0';
	public $memcached_server_host = 'localhost';
	public $memcached_server_port = '11211';
	public $redis_persist = '1';
	public $redis_server_host = 'localhost';
	public $redis_server_port = '6379';
	public $redis_server_db = '0';
	public $debug_lang_const = '1';
	public $proxy_enable = '0';
	public $proxy_host = '';
	public $proxy_port = '';
	public $proxy_user = '';
	public $proxy_pass = '';
	public $massmailoff = '0';
	public $replyto = '';
	public $replytoname = '';
	public $MetaRights = '';
	public $sitename_pagetitles = '0';
	public $force_ssl = '0';
	public $session_memcache_server_host = 'localhost';
	public $session_memcache_server_port = '11211';
	public $session_memcached_server_host = 'localhost';
	public $session_memcached_server_port = '11211';
	public $session_redis_persist = '1';
	public $session_redis_server_host = 'localhost';
	public $session_redis_server_port = '6379';
	public $session_redis_server_db = '0';
	public $frontediting = '2';
	public $cookie_domain = '';
	public $cookie_path = '';
	public $asset_id = '1';
	public $behind_loadbalancer = '0';
}