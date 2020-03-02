import '../scss/common.scss';
import '../scss/iconfont.css';
import '../scss/header.scss';
import '../scss/detail_board.scss';
import '../scss/footer.scss';

import HeaderNav from '../modules/HeaderNav';
import HeaderSearch from '../modules/HeaderSearch';

;(($) => {
  
  const phoneData = $.parseJSON($('#J_phoneData').html()),
	      fieldData = $.parseJSON($('#J_fieldData').html());

	const init = () => {
    new HeaderNav(phoneData).init();
    new HeaderSearch().init();
	} 

	init();

})(jQuery);