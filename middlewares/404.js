module.exports = async (ctx, next) => {
  
	await next();

	if (ctx.status == '404') {
		ctx.response.redirect('/404');
	}
}