// 需要声明在  manifest.json 的 features 属性中依赖模块
import storage from "@system.storage";
import nativeFetch from "@system.fetch";
import device from "@system.device";
import geolocation from "@system.geolocation";
import network from "@system.network";
import account from "@service.account";
import md5 from 'md5';

// 不需要声明的全局模块
import app from "@system.app";
// 引入路由 组件 监听页面切换
import router from '@system.router';

// 配置文件
import APP_CONFIG from './statistics.config';

(function(global, factory){
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.APP_STATISTICS = factory());
})(this , function(){
	'use strict';

	function isObject(obj) {
		return obj !== null && typeof obj === "object";
	}

	function isArray(obj) {
		return Array.isArray(obj);
	}

	function isEmptyObject(obj) {
		for (let n in obj) {
			return false;
		}
		return true;
	}

	// 对象转为查询字符串
	function toQueryString(obj) {
		let str = "";
		for (let n in obj) {
			str += n + "=" + obj[n] + "&";
		}
		str = str.substring(0, str.length - 1);
		return str;
	}
	// 转字符串
	function toString( obj ){
		return JSON.stringify( obj );
	}

	// 计算字符串的字节长度
	function getByteLen(val) {
		let len = 0;
		for (let i = 0; i < val.length; i++) {
			if (val[i].match(/[^\x00-\xff]/gi) != null) {
				len += 2;
			} else {
				len += 1;
			}
		}
		return len;
	}

	/**
	 * @description 字符串格式转换：驼峰式 转为 下划线式
	 * @param {string} str 
	 */ 	
	function getKebabCase(str) {
		return str.replace(/[A-Z]/g, function (i) {
			return "_" + i.toLowerCase();
		});
	}

	/**
	 * @description 字符串格式转换：下划线 转 驼峰式
	 * @param {string} str 
	 */ 
	function getCamelCase(str) {
		return str.replace(/_([a-z])/g, function (all, i) {
			return i.toUpperCase();
		});
	}

	/** 
	 * @description : AES加密
	 * @param {data} : 需要加密的字符串
	 * @return : string 密文
	*/
	function encrypt( data, req) {
		let keyLen = 16;
		// initKey 长度必须是16或者16的倍数
		let initKey = req;
		let len = (req.length % keyLen) == 0 ? 0 : (keyLen - (req.length % keyLen));

		for (let i = 0; i < len; i++) {
			initKey += "$";
		}

		let key = CryptoJS.enc.Latin1.parse(initKey);
		let iv = CryptoJS.enc.Latin1.parse(initKey);

		return CryptoJS.AES.encrypt(data, key, {
			iv: iv,
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.ZeroPadding

		}).toString();
	}

	/** 
	 * @description : AES解密
	 * @param : message 密文
	 * @return : decrypted string 明文
	*/
	function decrypt(message, req) {
		let keyLen = 16;
		// initKey 长度必须是16或者16的倍数
		let initKey = req;
		let len = (req.length % keyLen) == 0 ? 0 : (keyLen - (req.length % keyLen));

		for (let i = 0; i < len; i++) {
			initKey += "$";
		}

		let key = CryptoJS.enc.Latin1.parse(initKey);
		let iv = CryptoJS.enc.Latin1.parse(initKey);

		let decrypted = "";
		decrypted = CryptoJS.AES.decrypt(message, key, {
			iv: iv,
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.ZeroPadding
		});
		return decrypted.toString(CryptoJS.enc.Utf8);
	}
	
	/**
	 * @description 生成 长度为 8 ，格式为 16 进制的随机字符串 
	 * @return random string
	 */
	function randomStr() {
		return (((1 + Math.random()) * 0x10000000) | 0).toString(16);
	}

	/** 
	 * @description 生成 cuid 
	 * @return cuid ( md5加密 )
	 * */
	function createCuid( imei ) {
		let IMEI = imei || randomStr();
		return md5(Date.now() + "-" + randomStr() + "-" + randomStr() + "-" + randomStr() + "-" + IMEI);
	} 

	/** 
	 * @description 生成 requestId 
	 * @return cuid ( md5加密 )
	 * */
	function createRequestId( cuid ) {
		let r_id = ( cuid || randomStr() )+ randomStr() + randomStr() + Date.now();
		return md5( r_id );
	}

	//  请求封装
	const FETCH = {
		get: function ( args ) {
			let { url , timeout } = args;
			let ajax = new Promise(( resolve ,reject )=>{
			 	nativeFetch.fetch({
					url: config.url + url,
					success:function(data){
						resolve(data);
					},
					fail:function(data, code){
						resolve(data);
					}
				});
			});
			let timeout_fn = new Promise(( resolve ,reject ) =>{
				setTimeout(() => {
					resolve({ code:204, massage:'请求超时'});
				}, 3000);
			});
			return Promise.race([ timeout_fn , ajax]);
		}
	};
	/**
	 * 发送日志 , 只用于发送数据
	 * @param {string} args  数据
	 * @param {string} actionType  请求类型
	 */
	function submitAction ( args ) {
		console.log('==============submitAction======================');
		console.log( toString(args) );
		console.log('===============submitAction=====================');
		// let type = actionType || "";
		// JSON转为查询字符串
		let queryStr = toQueryString(args); 
		// 提交日志
		return FETCH.get( { url:"/a.gif?" + queryStr } )
	}


	// 设置缓存 
	function setStorage( ...args ){
		return new Promise((resolve, reject) => {
			storage.set({
				key: args[0],
				value: args[1] || '',
				success: function (data) {
					resolve( !0 );
				},
				fail: function (data, code) {
					resolve( !1 );
				}
			})
		})
	}
	// 读取缓存 
	function getStorage( key ){
		return new Promise((resolve, reject) => {
			storage.get({
				key: key,
				success: function (data) {
					resolve( data );
				},
				fail: function (data, code) {
					resolve( !1 );
				}
			})
		})
	}
	// 删除缓存 
	function delStorage( key ){
		return new Promise((resolve, reject) => {
			storage.delete({
				key: key,
				success: function (data) {
					resolve( data );
				  },
				fail: function (data, code) {
					resolve( !1 );
				}
			})
		})
	}	
	// 获取信息接口
	const DATAS_API = {
		deviceIds(){
			return new Promise(( resolve, reject ) => {
				device.getId({
					type: ['device', 'mac' , 'user'],
					success: function ( data ) {
						// console.log('获取deviceIds成功');
						resolve( data );
					},
					fail: function ( data , code ) {
						// console.log('获取deviceIds失败');
						resolve({});
					}
				})
			})		
		},
		deviceInfos(){
			return new Promise(( resolve, reject ) => {
				device.getInfo({
					success: function( data ){
						resolve( data );
						console.log('获取 device getInfo 成功');
					},
					fail: function(){
						resolve( {} );
						console.log('获取 device getInfo 失败');
					}
				})
			})
		},
		netType(){
			return new Promise(( resolve, reject ) => {
				network.getType({
					success: function (data) {
						resolve( data );
						
						console.log('获取network getType 成功');
					},
					fail: function () {
						resolve( {} )
						console.log('获取network getType 失败');
					}
				});	
			})				
		}
	};

	//  storage key : 用户信息数据
	const STORAGE_DATA_KEY = "APP_STATISTICS_DATA",
	// cuid key
	CUID_KEY = "_SD_BD_CUID_",
	// requestId key
	// REQ_KEY = "_SD_BD_REQUEST_ID_",
	PAGE_START_KEY = "_SD_BD_PAGE_START_",

	APP_STATISTICS_LOGS = "_APP_STA_UNSEND_LOGS_";	

	// 

	// 初始化数据
	const BASE_DATA = {
		sdk_vision: '1.2.0.0',
		debug: 1,
	};
	// 日志状态
	const LOG_STATE = {
		has_init_storage: !1,
		has_cuid_storage: !1,
		has_request_id_storage: !1,
	};

	class Wanka_statistic {

		constructor(){
			this.state = {
				data: null,
				page: null,
				is_entry: 1,
				cuid:'',
				req: '',
			};
			this.init = this.init.bind( this );
			this.page_stat = this.page_stat.bind( this );
			this.page_end = this.page_end.bind( this );
			this.merge_datas = this.merge_datas.bind( this );
		}
		init ( app_data ){
			let datas = {};
			// 兼容华为
			let APP = app_data || {
				_def: {}
			};
			APP._def = APP._def || {
				manifest: {}
			};
			// 解构出  env 和 manifest 对象
			let {
				_def: {
					manifest
				}
			} = APP;
			let app_info = app.getInfo();

			// app 基础信息
			datas.package = manifest.package || app_info.packageName;
			datas.versionName = manifest.versionName || app_info.versionName;
			datas.minPlatformVersion = manifest.minPlatformVersion;
			datas.channel = account.getProvider();
			datas.name = manifest.name || app_info.name;

			// 获取设备数据
			Promise.all([ DATAS_API.deviceInfos() , DATAS_API.deviceIds(), DATAS_API.netType() ])

				.then(res => {
					
					let user_all_data =  Object.assign( datas , ...res ); 
					// 日志相关数据
					let public_data = {};
					// 获取cuid
					getStorage(CUID_KEY)						
						.then(res => {
							
							if( res ){
								public_data.cuid = res;
							}else{
								public_data.cuid = createCuid( user_all_data.client_id || '' );
							}			
							this.state.cuid = public_data.cuid;				
							public_data.req = this.state.req = createRequestId( public_data.cuid );
	
							// 保存数据
							let user_data = this.state.data = { ...format_datas.device( user_all_data , this.state.cuid ) , ...format_datas.public( public_data ) };					
							// 设置数据缓存
							setStorage( STORAGE_DATA_KEY , toString( user_data ) )
								.then( res => {
									if( res ){ 
										LOG_STATE.has_init_storage = !0;
									}
								});
							setStorage( CUID_KEY , public_data.cuid )
								.then( res => {
									if( res ){
										LOG_STATE.has_cuid_storage = !0;
									}
								});
							// setStorage( REQ_KEY , public_data.req )
							// 	.then( res => {
							// 		LOG_STATE.has_request_id_storage = !0;
							// 	});							
						})							
				})
		}
		page_stat( pageData ){
			console.log( 'this.state.data >>>> page start');
			let {name , path} = router.getState();			
			this.state.page = {
				sta_time: Date.now(),
				page_path: name || '', 
				page_path: path || '',
				is_entry: this.state.is_entry,
			};			
			this.state.is_entry = 0; 
			setStorage( PAGE_START_KEY , this.state.page )
				.then( res => {
					// LOG_STATE.has_init_storage = !0;
				});
		}
		page_end( pageData ){
			console.log( 'this.state.data >>>> page hide');
			if( !this.state.cuid && !this.state.data ) return

			let end_time = Date.now();
			if( this.state.page ){
				this.state.page.duration = end_time - this.state.page.sta_time;
				this.state.page.end_time = end_time;
				this.merge_datas();
			}
			else{
				getStorage( PAGE_START_KEY )
				.then( res => {
					let result = JSON.parse( res );
					if( result ){ 
						result.duration = end_time - result.sta_time;
						let datas = Object.assign( result , { end_time } );
						this.state.page = datas;
						this.merge_datas();					
					}
				});
			}
		}
		// 合并基础数据和上次页面数据
		merge_datas(){
			let log_data = {};
			if( this.state.data && this.state.page ){
				log_data = {
					...this.state.data,
					...this.state.page
				};
				console.log('req >>>>>>' , log_data.request_id );

				// 发送日志
				submitAction( log_data )
				.then(res => {
					if( res.code == 200 ){	
						console.log('提交日志成功' , toString(res) );
					}else{									
						console.log('提交日志失败');
					}				
				})
				.catch(err => {
					console.log('提交日志失败');
				});				
				
				//  提交日志失败时， 缓存日志 ？？？ 未确定
				getStorage(APP_STATISTICS_LOGS)
					.then( res =>{
						let log_list = null;
						if( res ){
							log_list = JSON.parse( res );
						}else{
							log_list = [];
						}
						log_list.push( log_data );
						// setStorage(APP_STATISTICS_LOGS , toString( log_list ) );
						
						// submitAction( log_data )
						// 	.then(res => {
						// 		if( res.code == 200 ){	
						// 			console.log('提交日志成功' , toString(res) );
						// 		}else{									
						// 			console.log('提交日志失败');
						// 		}				
						// 	})
						// 	.catch(err => {
						// 		console.log('提交日志失败');
						// 	});
					});				
			}
		}
	}

	// format_data 格式化数据
	const format_datas = {
		
		device( args , cuid ){
			return {
				package: args.package || '',
				// 来源平台
				channel: args.channel || '', 
				// 快应用名称
				name: args.name || '',
				// 快应用 版本
				svr: args.versionName || '', 
				// 设备唯一id
				client_id: encrypt(args.device || '' , cuid ),
				// mac
				info_ma: encrypt(args.mac || '' , cuid),
				// 用户唯一id
				os_id: encrypt(args.user || '' , cuid ), 
				// 品牌
				make: (args.brand || '').toLowerCase(), // => make
				// 生产厂商
				manufacturer: (args.manufacturer || '').toLowerCase(),
				// 型号
				model: (args.model || '').toLowerCase(),
				// 产品名称
				product: args.product || '',
				// 操作系统
				os_type: args.osType || '',
				// 系统版本
				ovr: args.osVersionName || '', 
				// 平台版本
				platform_version_name: args.platformVersionName || '',
				// 语言
				language: args.language || '',
				// 地区
				region: args.region || '',
				screen_width: args.screenWidth || '',
				screen_height: args.screenHeight || '',
				// 网络类型
				net_type: args.type || '',	
			};

		},
		page( args ){
			return {
				page_name: '',
				page_path: '',
				sta_time: '',
				end_time: '',
				duration: '',
				is_entry: !1,				
			}
		},
		public( args ){
			return {
				app_id : APP_CONFIG.app_key || '',
				cuid: args.cuid,			
				// 请求id
				request_id: args.req,
				en_code : 'cuid'
			}
		}
	};

	let $statistic = new Wanka_statistic;	

	// page 高级接入方式处理 
	function Page_Config(args){
		let show = args.onShow,
			hide = args.onHide;
		args.onShow = function(){
			API.page_show( this );
			show && show.call( this );
		}
		args.onHide = function(){
			API.page_hide( this );
			hide && hide.call( this );
		}
		return args;
	}

	// 接口暴露
	const API = {
		open_app( app_info ){
			try {
				$statistic.init( app_info );
				delStorage(APP_STATISTICS_LOGS);
			} catch (error) {

			}
		},
		// closed_app(){
		// 	try {
		// 		new Wanka_statistic('测试');
		// 	} catch (error) {

		// 	}
		// },
		page_show(page_info){
			try {
				// let statistic = new Wanka_statistic;
				console.log('============ 打开页面 ========================');
				
				$statistic.page_stat( page_info );
			} catch (error) {
				console.log('============ error ========================' );
			}
		},
		page_hide(page_info){
			try {
				// let statistic = new Wanka_statistic;
				console.log('============ 关闭页面 ========================');
				$statistic.page_end( page_info );
			} catch (error) {

			}
		},
		custom_track( id , args ){
			
		}
	}

	// 全局变量
	const hookTo = global.__proto__ || global;
	hookTo.APP_STATISTICS = {
		'app_sta_init': API.open_app,
		'page_show': API.page_show,
		'page_hide': API.page_hide
	};
	hookTo.Custom_page = Page_Config;
	return {
		'app_sta_init': API.open_app,
		'page_show': API.page_show,
		'page_hide': API.page_hide
		// 'app_destroy': API.closed_app
	}

});

// // 全局变量
// const hookTo = global.__proto__ || global;

// // 只暴露接口
// hookTo.APP_STATISTICS = {
// 	app_sta_init: APP_STATISTICS.createApp,
// 	app_destroy: APP_STATISTICS.destroyLog
// };

