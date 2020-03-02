import navMenuItemTpl from '../templates/navMenuItem.tpl';

import tools from '../utils/tools';

@tools
export default class HeaderNav {
	constructor (phoneData) {
    this.name = 'HeaderNav';
    this.$nav = $('.J_nav');
    this.$navMenu = $('.J_navMenu');
    this.phoneData = phoneData;
    this.htmlCache = {};
	}

	init () {
		this.bindEvent();
	}

	bindEvent () {
    this.$nav.on('mouseenter', '.nav-item', $.proxy(this.navMenuMouseIn, this));
	}

	navMenuMouseIn (ev) {
		const tar = HeaderNav.getTarget(ev),
		      field = $(tar).attr('data-field');

		if (!this.htmlCache[field]) {
			this.htmlCache[field] = this.phoneCardList(this.phoneData.filter(item => item.field === field));
		}

		this.$navMenu.html(this.htmlCache[field]);
	}

  phoneCardList (data) {
  	let list = '';

  	data.forEach((item, index) => {
      if (index < 7) {
      	list += HeaderNav.tplReplace(navMenuItemTpl, {
          id: item.id,
          pic: $.parseJSON(item.pics)[0][0][0],
          phone_name: item.phone_name,
          default_price: item.default_price,
          isFirst: !index ? 'first' : ''
      	});
      }
  	});

  	return list;
  }

}