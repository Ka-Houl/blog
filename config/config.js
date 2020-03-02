const mode = 'production';

const base_conf = {
	api_url: 'http://study.jsplusplus.com/Xiaomi/',
	source_url: mode == 'development' ? 'http://localhost:3300/' : '/'
}

module.exports = {
	page_conf: {
    index: {
    	head: {
    		title: '小米商城 - 小米9 Pro、Redmi K30、小米MIX Alpha，小米电视官方网站',
    		keyword: '小米,RedmiNote8Pro,小米cc9,Redmi K30,美图手机,小米MIX Alpha,小米商城',
    		description: '小米商城直营小米公司旗下所有产品，包括小米手机系列小米CC9 美图手机定制版、小米9、小米MIX Alpha，Redmi 红米系列Redmi K30、Redmi Note 8，小米电视、笔记本、米家智能家居等，同时提供小米客户服务及售后支持'
    	},
    	stylesheet: [
        base_conf.source_url + 'css/index.css'
    	],
    	script: [
        base_conf.source_url + 'js/jquery.js',
        base_conf.source_url + 'js/index.js'
    	]
    },

    list: {
      head: {
        title: '小米商城 - 小米9 Pro、Redmi K30、小米MIX Alpha，小米电视官方网站',
        keyword: '小米,RedmiNote8Pro,小米cc9,Redmi K30,美图手机,小米MIX Alpha,小米商城',
        description: '小米商城直营小米公司旗下所有产品，包括小米手机系列小米CC9 美图手机定制版、小米9、小米MIX Alpha，Redmi 红米系列Redmi K30、Redmi Note 8，小米电视、笔记本、米家智能家居等，同时提供小米客户服务及售后支持'
      },
      stylesheet: [
        base_conf.source_url + 'css/list.css'
      ],
      script: [
        base_conf.source_url + 'js/jquery.js',
        base_conf.source_url + 'js/list.js'
      ]
    },

    detail: {
      head: {
        title: '小米商城 - 小米9 Pro、Redmi K30、小米MIX Alpha，小米电视官方网站',
        keyword: '小米,RedmiNote8Pro,小米cc9,Redmi K30,美图手机,小米MIX Alpha,小米商城',
        description: '小米商城直营小米公司旗下所有产品，包括小米手机系列小米CC9 美图手机定制版、小米9、小米MIX Alpha，Redmi 红米系列Redmi K30、Redmi Note 8，小米电视、笔记本、米家智能家居等，同时提供小米客户服务及售后支持'
      },
      stylesheet: [
        base_conf.source_url + 'css/detail.css'
      ],
      script: [
        base_conf.source_url + 'js/jquery.js',
        base_conf.source_url + 'js/detail.js'
      ]
    },

    my404: {
      head: {
        title: '小米商城 - 小米9 Pro、Redmi K30、小米MIX Alpha，小米电视官方网站',
        keyword: '小米,RedmiNote8Pro,小米cc9,Redmi K30,美图手机,小米MIX Alpha,小米商城',
        description: '小米商城直营小米公司旗下所有产品，包括小米手机系列小米CC9 美图手机定制版、小米9、小米MIX Alpha，Redmi 红米系列Redmi K30、Redmi Note 8，小米电视、笔记本、米家智能家居等，同时提供小米客户服务及售后支持'
      },
      stylesheet: [
        base_conf.source_url + 'css/404.css'
      ],
      script: [
        base_conf.source_url + 'js/jquery.js',
        base_conf.source_url + 'js/404.js'
      ]
    }
	},

	api: {
    getXiaomiDatas: base_conf.api_url + 'getXiaomiDatas'
	}
}