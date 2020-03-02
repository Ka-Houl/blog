export default class Carousel {
  constructor (options) {
  	this.name = 'Carousel';
  	
  	this.autoplay = Boolean(options.autoplay);
  	this.duration = Number(options.duration) || 3000;

  	this.$carousel = $('.J_carousel');
  	this.$carItems = this.$carousel.find('.car-item');
  	this.$carIndicators = this.$carousel.find('.indicator-item');
  	this.len = this.$carItems.length;

  	this.curIdx = 0;
  }

  init () {
  	this.autoplay && this.autoPlay();
    this.bindEvent();
  }

  autoPlay () {
    Carousel.timer = setInterval($.proxy(this.run.bind(this, 'next'), this), this.duration);
  }

  run (dir) {
  	switch (dir) {
  		case 'next':
  		  if (this.curIdx >= this.len - 1) {
		  		this.curIdx = 0;
		  	} else {
		  		this.curIdx ++;
		  	}
		  	break;
		  case 'prev':
		    if (this.curIdx === 0) {
		    	this.curIdx = this.len - 1;
		    } else {
		    	this.curIdx --;
		    }
		    break;
		  default:
		    break;
  	}

  	this.fadeAction(this.curIdx);
  }
 
  bindEvent () {
    this.$carousel.on('click', $.proxy(this.carouselClick, this));
    this.$carousel.on('mouseenter', $.proxy(this.mouseInOut, this));
    this.$carousel.on('mouseleave', $.proxy(this.mouseInOut, this));
  }

  carouselClick (e) {
    const tar = e.target,
          className = tar.className,
          $tar = $(tar);

    switch (className) {
    	case 'indicator-item':
    	  this.curIdx = $tar.index();
    	  this.fadeAction(this.curIdx);
    	  break;
    	case 'car-control iconfont icon-arrow-right':
    	case 'car-control iconfont icon-arrow-left':
    	  const dir = $tar.attr('data-dir');
    	  this.run(dir);
    	  break;
    	default:
    	  break;
    }
  }

  mouseInOut (e) {
  	const eType = e.type;

  	switch (eType) {
  		case 'mouseenter':
  		  clearInterval(Carousel.timer);
  		  break;
  		case 'mouseleave':
  		  this.autoplay && this.autoPlay();
  		  break;
  	}
  }

  fadeAction (index) {
    this.$carItems.eq(index).fadeIn()
                  .siblings().fadeOut();

    this.$carIndicators.eq(index).addClass('current')
                       .siblings().removeClass('current');
  }
}