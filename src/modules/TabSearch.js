import tools from '../utils/tools';
import extention from '../utils/extention';

import noDataTipTpl from '../templates/noDataTip.tpl';
import phoneCardTpl from '../templates/phoneCard.tpl';

@tools
@extention
export default class TabSearch {
	constructor (phoneData) {
		this.name = 'TabSearch';

		this.$searchInput = $('#J_search');
		this.$board = $('.J_board');
		this.$tabAll = $('J_tab').find('.all');

		this.phoneData = phoneData;
	}

	init () {
		this.bindEvent();
	}

	bindEvent () {
		this.$searchInput.on('input', TabSearch.throttle($.proxy(this.inputSearch, this), 500));
	}

	inputSearch (ev) {
		const tar = TabSearch.getTarget(ev),
		      $tar = $(tar),
		      val = TabSearch.trimSpace($tar.val()).toLowerCase(),
		      len = val.length;

		if (len <= 0) {
			this.tabChange(this.$tabAll);
      this.renderList(this.phoneData);
		} else {
			const data = this.filterData('search', this.phoneData, val);
			
			this.renderList(data);
		}
	}

	renderList (data) {

		let html = '';

		if (data.length <= 0) {
      html = TabSearch.tplReplace(noDataTipTpl, {
      	text: '没有搜索到相关数据'
      });
		} else {
			data.forEach((item, index) => {
	      html += TabSearch.tplReplace(phoneCardTpl, {
	        id: item.id,
	        isFirst: index % 5 === 0 ? 'first' : '',
	        phone_name: item.phone_name,
	        pic: $.parseJSON(item.pics)[0][0][0],
	        slogan: item.slogan.substr(0, 10),
	        default_price: item.default_price
	      });
			});
		}

		this.$board.html(html);
	}
}