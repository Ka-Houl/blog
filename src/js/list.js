import '../scss/common.scss';
import '../scss/iconfont.css';
import '../scss/header.scss';
import '../scss/list_board.scss';
import '../scss/footer.scss';
import '../scss/tab.scss';
import '../scss/no_data_tip.scss';

import HeaderNav from '../modules/HeaderNav';
import HeaderSearch from '../modules/HeaderSearch';
import TabNav from '../modules/TabNav';
import TabSearch from '../modules/TabSearch';

;(async ($) => {

	const phoneData = $.parseJSON($('#J_phoneData').html()),
	      fieldData = $.parseJSON($('#J_fieldData').html());

	const init = () => {
    new HeaderNav(phoneData).init();
    new HeaderSearch().init();
    new TabNav(phoneData).init();
    new TabSearch(phoneData).init();
	} 

	init();

})(jQuery)