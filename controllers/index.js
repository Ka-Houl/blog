const pageConf = require("../config/config").page_conf,
  indexModel = require("../models/index"),
  extention = require("../lib/extention");

class IndexController {
  async index(ctx, next) {
    const data = await indexModel.getXiaomiDatas({
      swiper: true,
      phone: true,
      field: true
    });

    const swiperData = data.swiper_data,
      phoneData = data.phone_data,
      fieldData = data.field_data;

    await ctx.render("index", {
      pageConf: pageConf.index,
      swiperData,
      phoneData,
      fieldData
    });
  }

  async list(ctx, next) {
    const keyword = ctx.params.keyword; //获取路由动态id  page/:keywodr

    const data = await indexModel.getXiaomiDatas({
      swiper: false,
      phone: true,
      field: true
    });

    const phoneData = data.phone_data,
      searchData = !keyword
        ? phoneData
        : extention.filterData(phoneData, keyword),
      fieldData = data.field_data;

    await ctx.render("list", {
      pageConf: pageConf.list,
      phoneData,
      searchData,
      fieldData
    });
  }

  async detail(ctx, next) {
    const id = ctx.params.id;

    const data = await indexModel.getXiaomiDatas({
      swiper: false,
      phone: true,
      field: true
    });

    const phoneData = data.phone_data,
      fieldData = data.field_data,
      phoneDetail = phoneData.filter(item => item.id === id)[0];

    await ctx.render("detail", {
      pageConf: pageConf.detail,
      phoneData,
      fieldData,
      phoneDetail
    });
  }

  async my404(ctx, next) {
    const data = await indexModel.getXiaomiDatas({
      swiper: false,
      phone: true,
      field: true
    });

    const phoneData = data.phone_data,
      fieldData = data.field_data;

    await ctx.render("404", {
      title: "404",
      pageConf: pageConf.my404,
      phoneData,
      fieldData
    });
  }
}

module.exports = new IndexController();
