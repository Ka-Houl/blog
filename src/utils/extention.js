export default (target) => {
	target.prototype.tabChange = ($target, className) => {
		$target.parent().addClass(className)
		       .siblings().removeClass(className);
	}

	target.prototype.filterData = (type, data, str) => {
		return data.filter((item) => {
			switch (type) {
				case 'nav':
				  return str === 'all' ? true : item.field === str;
				case 'search':
          const phone_name = item.phone_name.toLowerCase(),
                 slogan = item.slogan.toLowerCase();

          return phone_name.includes(str) || slogan.includes(str);
			  default:
			    break;
			}
		});
	}
}