import '../scss/common.scss';
import '../scss/iconfont.css';
import '../scss/carousel.scss';
import '../scss/header.scss';
import '../scss/home_title.scss';
import '../scss/list_board.scss';
import '../scss/footer.scss';

import HeaderNav from '../modules/HeaderNav';
import HeaderSearch from '../modules/HeaderSearch';
import Carousel from '../modules/Carousel';

;(async ($) => {

	const phoneData = $.parseJSON($('#J_phoneData').html()),
	      fieldData = $.parseJSON($('#J_fieldData').html()),
	      swiperData = $.parseJSON($('#J_swiperData').html());

  const init = () => {
    new HeaderNav(phoneData).init();
    new HeaderSearch().init();
    new Carousel({
      autoplay: true,
      duration: 3000
    }).init();
  }

  init();

})(jQuery);