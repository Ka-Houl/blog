import tools from '../utils/tools';

@tools
export default class HeaderSearch {
	constructor () {
		this.name = 'HeaderSearch';
		this.$searchForm = $('#searchForm');
		this.$searchInput = $('#J_keyword');
		this.$searchBtn = $('.J_searchBtn');
	}

	init () {
		this.bindEvent();
	}

	bindEvent () {
		this.$searchBtn.on('click', $.proxy(this.searchAction, this));
	}

	searchAction () {
		const keyword = HeaderSearch.trimSpace(this.$searchInput.val()),
		      len = keyword.length;

		if (len > 0) {
			window.open(`./list/${keyword}`);
		}
	}
}