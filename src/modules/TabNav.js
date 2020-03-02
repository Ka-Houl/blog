import tools from '../utils/tools';
import extention from '../utils/extention';

import phoneCardTpl from '../templates/phoneCard.tpl';

@tools
@extention
export default class TabNav {
	constructor (phoneData) {
		this.name = 'TabNav';
		this.$tab = $('.J_tab');
		this.$board = $('.J_board');

		this.phoneData = phoneData;

		this.htmlCache = {};
	}

	init () {
		this.bindEvent();
	}

	bindEvent () {
		this.$tab.on('click', '.tab-item', $.proxy(this.onTabClick, this));
	}

	onTabClick (ev) {
		const tar = TabNav.getTarget(ev),
		      tagName = tar.tagName.toLowerCase();

		if (tagName === 'a') {
			const $tar = $(tar),
			      field = $tar.attr('data-field'),
			      data = this.filterData('nav', this.phoneData, field);

			this.tabChange($tar, 'current');
			this.renderList(data, field);
		}
	}

	renderList (data, field) {
		if (!this.htmlCache[field]) {
			let list = '';

			data.forEach((item, index) => {
	      list += TabNav.tplReplace(phoneCardTpl, {
	        id: item.id,
	        isFirst: index % 5 === 0 ? 'first' : '',
	        phone_name: item.phone_name,
	        pic: $.parseJSON(item.pics)[0][0][0],
	        slogan: item.slogan.substr(0, 10),
	        default_price: item.default_price
	      });
			});

			this.htmlCache[field] = list;
		}

		this.$board.html(this.htmlCache[field]);
	}
}








