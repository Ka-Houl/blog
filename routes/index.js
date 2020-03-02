const router = require('koa-router')();
const indexController = require('../controllers/index');

router.get('/', indexController.index);
router.get('/list/:keyword?', indexController.list);
router.get('/detail/:id', indexController.detail);
router.get('/404', indexController.my404);
module.exports = router;
