module.exports = {
	filterData (data, keyword) {
		return data.filter ((item) => {
      const phone_name = item.phone_name.toLowerCase(),
            slogan = item.slogan.toLowerCase();

      return phone_name.includes(keyword) || slogan.includes(keyword);
		});
	}
}